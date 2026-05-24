package vn.bluemoon.backend.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import vn.bluemoon.backend.model.*;
import vn.bluemoon.backend.repository.*;
import vn.bluemoon.backend.util.FeeExpectedAmounts;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/rounds")
public class CollectionRoundController {

    private final CollectionRoundRepository roundRepository;
    private final RoundObligationRepository roundObligationRepository;
    private final FeeRepository feeRepository;
    private final HouseholdRepository householdRepository;
    private final PaymentRepository paymentRepository;
    private final ResidentRepository residentRepository;
    private final VehicleRepository vehicleRepository;

    public CollectionRoundController(
            CollectionRoundRepository roundRepository,
            RoundObligationRepository roundObligationRepository,
            FeeRepository feeRepository,
            HouseholdRepository householdRepository,
            PaymentRepository paymentRepository,
            ResidentRepository residentRepository,
            VehicleRepository vehicleRepository
    ) {
        this.roundRepository = roundRepository;
        this.roundObligationRepository = roundObligationRepository;
        this.feeRepository = feeRepository;
        this.householdRepository = householdRepository;
        this.paymentRepository = paymentRepository;
        this.residentRepository = residentRepository;
        this.vehicleRepository = vehicleRepository;
    }

    public record CreateRoundRequest(
            String name,
            String period,
            String deadline,
            String startDate,
            String endDate
    ) {}

    @GetMapping
    @Transactional
    public List<CollectionRound> listByFee(@RequestParam("feeId") Long feeId) {
        Fee fee = feeRepository.findById(feeId)
                .orElseThrow(() -> new IllegalArgumentException("Khoản thu không tồn tại"));

        String frequency = fee.getFrequency();
        boolean isRecurring = frequency != null && !frequency.isBlank() && !"one_time".equalsIgnoreCase(frequency);

        if (isRecurring && fee.getStartDate() != null && fee.getEndDate() != null) {
            autoGenerateRounds(fee);
        }

        List<CollectionRound> rounds = roundRepository.findByFeeIdOrderByNewest(feeId);
        if (rounds.isEmpty() && !isRecurring) {
            // Auto-create a default round for one_time fees that have none
            CollectionRound created = createDefaultRound(fee);
            return List.of(created);
        }
        return rounds;
    }

    @PostMapping
    public ResponseEntity<CollectionRound> create(@RequestParam("feeId") Long feeId, @RequestBody CreateRoundRequest body) {
        Fee fee = feeRepository.findById(feeId)
                .orElseThrow(() -> new IllegalArgumentException("Khoản thu không tồn tại"));

        LocalDate proposedStart = parseLocalDate(body.startDate);
        LocalDate proposedEnd = parseLocalDate(body.endDate);
        if (proposedStart == null || proposedEnd == null) {
            // Backward-compatible: try parse from period "yyyy-MM-dd~yyyy-MM-dd"
            if (proposedStart == null || proposedEnd == null) {
                LocalDate[] range = parseRangeFromPeriod(body.period, body.deadline);
                if (proposedStart == null) proposedStart = range[0];
                if (proposedEnd == null) proposedEnd = range[1];
            }
        }
        if (proposedStart == null || proposedEnd == null) {
            throw new IllegalArgumentException("Thiếu khoảng thời gian đợt thu (startDate/endDate).");
        }
        if (proposedEnd.isBefore(proposedStart)) {
            throw new IllegalArgumentException("Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.");
        }

        // Overlap validation: one fee cannot have two rounds whose time ranges intersect.
        // Treat ranges as inclusive: [start, end].
        LocalDate finalProposedStart = proposedStart;
        LocalDate finalProposedEnd = proposedEnd;
        List<CollectionRound> existing = roundRepository.findByFeeIdOrderByNewest(feeId);
        for (CollectionRound r : existing) {
            LocalDate[] existingRange = parseRangeFromPeriod(r.getPeriod(), r.getDeadline());
            LocalDate existingStart = existingRange[0];
            LocalDate existingEnd = existingRange[1];
            if (existingStart == null || existingEnd == null) continue;

            boolean overlaps = !finalProposedEnd.isBefore(existingStart) && !existingEnd.isBefore(finalProposedStart);
            if (overlaps) {
                String msg = String.format("Không thể tạo đợt thu trùng thời gian với đợt '%s' (%s~%s).", r.getName(), existingStart, existingEnd);
                throw new IllegalArgumentException(msg);
            }
        }

        CollectionRound round = new CollectionRound();
        round.setFeeId(feeId);
        round.setName(body.name() == null || body.name().isBlank() ? "Đợt thu" : body.name().trim());

        // Store time range in `period` as "yyyy-MM-dd~yyyy-MM-dd" and end in `deadline`
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        round.setPeriod(fmt.format(proposedStart) + "~" + fmt.format(proposedEnd));
        round.setDeadline(fmt.format(proposedEnd));
        CollectionRound saved = roundRepository.save(round);
        upsertRoundObligations(saved, fee);
        return ResponseEntity.ok(saved);
    }

    /**
     * Auto-generate collection rounds for recurring fees.
     * For a fee with frequency != one_time:
     * - The first round time range is [startDate, endDate] (inclusive).
     * - For each next iteration, shift both start and end by the frequency unit.
     * - 1 iteration = 1 round.
     */
    private void autoGenerateRounds(Fee fee) {
        LocalDate firstStart = fee.getStartDate();
        LocalDate firstEnd = fee.getEndDate();
        if (firstStart == null || firstEnd == null || firstEnd.isBefore(firstStart)) return;
        LocalDate today = LocalDate.now();
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");

        // Get existing periods to avoid duplicates
        List<CollectionRound> existing = roundRepository.findByFeeIdOrderByNewest(fee.getId());
        Set<String> existingPeriods = existing.stream()
                .map(CollectionRound::getPeriod)
                .filter(p -> p != null && !p.isBlank())
                .collect(Collectors.toSet());
        List<LocalDate[]> existingRanges = existing.stream()
                .map(er -> parseRangeFromPeriod(er.getPeriod(), er.getDeadline()))
                .collect(Collectors.toList());

        String frequency = fee.getFrequency();
        if (frequency == null || frequency.isBlank() || "one_time".equalsIgnoreCase(frequency)) return;

        int k = 0;

        // One cycle = one round. Always materialize k=0 (first template period), even if it is fully in the future.
        // For k>=1, only auto-generate while the period start is still on or before today (past + current periods).
        while (true) {
            LocalDate periodStart = addByFrequency(firstStart, frequency, k);
            if (periodStart == null) break;

            LocalDate periodEnd = addByFrequency(firstEnd, frequency, k);
            if (periodEnd == null) break;
            if (periodEnd.isBefore(periodStart)) {
                k++;
                continue;
            }

            if (k > 0 && periodStart.isAfter(today)) {
                break;
            }

            String periodKey = periodStart.format(fmt) + "~" + periodEnd.format(fmt);
            if (!existingPeriods.contains(periodKey)) {
                // Hard guarantee: skip overlaps with existing ranges (defensive against old data)
                boolean overlaps = false;
                for (LocalDate[] existingRange : existingRanges) {
                    LocalDate existingStart = existingRange[0];
                    LocalDate existingEnd = existingRange[1];
                    if (existingStart == null || existingEnd == null) continue;
                    boolean overlapCandidate = !periodEnd.isBefore(existingStart) && !existingEnd.isBefore(periodStart);
                    if (overlapCandidate) {
                        overlaps = true;
                        break;
                    }
                }
                if (!overlaps) {
                    CollectionRound round = new CollectionRound();
                    round.setFeeId(fee.getId());
                    round.setName(formatAutoRoundName(frequency, periodStart, periodEnd, k));
                    round.setPeriod(periodKey);
                    round.setDeadline(periodEnd.format(fmt));
                    CollectionRound saved = roundRepository.save(round);
                    upsertRoundObligations(saved, fee);
                    existingPeriods.add(periodKey);
                    existingRanges.add(new LocalDate[]{periodStart, periodEnd});
                }
            }

            k++;
        }
    }

    /**
     * Đặt tên đợt theo chu kỳ (1 bước lặp = 1 đợt thu).
     * Ví dụ chu kì tháng: kỳ mẫu 4/3–4/4 → "Đợt thu tháng 3/2026"; đợt sau dịch +1 tháng → "Đợt thu tháng 4/2026".
     */
    private String formatAutoRoundName(String frequency, LocalDate periodStart, LocalDate periodEnd, int k) {
        if (periodStart == null) {
            return "Đợt thu";
        }
        String f = frequency == null ? "" : frequency.toLowerCase();
        DateTimeFormatter dmy = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        return switch (f) {
            case "monthly" -> String.format(
                    "Đợt thu tháng %d/%d",
                    periodStart.getMonthValue(),
                    periodStart.getYear()
            );
            case "weekly" -> "Tuần " + (k + 1);
            case "yearly" -> "Đợt thu năm " + periodStart.getYear();
            case "daily" -> "Đợt ngày " + periodStart.format(dmy);
            default -> String.format(
                    "Đợt %d (%s – %s)",
                    k + 1,
                    periodStart.format(DateTimeFormatter.ofPattern("dd/MM")),
                    periodEnd != null ? periodEnd.format(dmy) : periodStart.format(dmy)
            );
        };
    }

    private LocalDate addByFrequency(LocalDate base, String frequency, int k) {
        if (base == null) return null;
        if (k <= 0) {
            if (k == 0) return base;
        }
        switch (frequency.toLowerCase()) {
            case "daily":
                return base.plusDays(k);
            case "weekly":
                return base.plusWeeks(k);
            case "monthly":
                return base.plusMonths(k);
            case "yearly":
                return base.plusYears(k);
            default:
                return null;
        }
    }

    public record RoundObligationStatusRow(
            Long householdId,
            String householdAddress,
            String headName,
            Integer members,
            Double expectedAmount,
            Double paidAmount,
            Double remainingAmount,
            boolean paid
    ) {}

    /** Online intents and other rows that are not completed must not reduce "remaining" for a round. */
    private static boolean countsTowardRoundPaid(Payment p) {
        String s = p.getPaymentStatus();
        return s == null || s.isBlank() || !"PENDING".equalsIgnoreCase(s.trim());
    }

    @GetMapping("/{roundId}/obligations")
    public List<RoundObligationStatusRow> obligations(@PathVariable Long roundId) {
        CollectionRound round = roundRepository.findById(roundId)
                .orElseThrow(() -> new IllegalArgumentException("Đợt thu không tồn tại"));
        Fee fee = feeRepository.findById(round.getFeeId())
                .orElseThrow(() -> new IllegalArgumentException("Khoản thu không tồn tại"));

        // Ensure obligations exist
        upsertRoundObligations(round, fee);

        List<Household> households = householdRepository.findAll();
        // Populate transient headName so UI can display it consistently
        for (Household h : households) {
            Resident head = residentRepository.findFirstByHousehold_IdAndRelationToHeadIgnoreCase(h.getId(), "Chủ hộ");
            if (head != null) {
                h.setHeadName(head.getFullName());
            }
        }
        // Newest round first (same order as GET /rounds?feeId=) — orphan payments (round_id null) count only for this round
        List<CollectionRound> roundsForFee = roundRepository.findByFeeIdOrderByNewest(round.getFeeId());
        Long newestRoundId = roundsForFee.isEmpty() ? roundId : roundsForFee.get(0).getId();

        List<Payment> feePayments = paymentRepository.findByFeeIdWithFee(round.getFeeId()).stream()
                .filter(CollectionRoundController::countsTowardRoundPaid)
                .filter(p -> {
                    Long pr = p.getRoundId();
                    if (pr != null) {
                        return pr.equals(roundId);
                    }
                    return newestRoundId != null && newestRoundId.equals(roundId);
                })
                .collect(Collectors.toList());

        Map<Long, Double> paidByHousehold = feePayments.stream()
                .filter(p -> p.getHouseholdId() != null)
                .collect(Collectors.groupingBy(Payment::getHouseholdId, Collectors.summingDouble(p -> p.getAmount() == null ? 0.0 : p.getAmount())));

        Map<Long, RoundObligation> obligationByHousehold = roundObligationRepository.findByRoundIdOrderByHouseholdIdAsc(roundId).stream()
                .collect(Collectors.toMap(RoundObligation::getHouseholdId, o -> o, (a, b) -> a));

        return households.stream().map(h -> {
            RoundObligation o = obligationByHousehold.get(h.getId());
            double expected = o != null && o.getExpectedAmount() != null ? o.getExpectedAmount() : 0.0;
            double paid = paidByHousehold.getOrDefault(h.getId(), 0.0);
            double remaining = Math.max(0.0, expected - paid);
            boolean isPaid = expected <= 0.0 ? paid > 0.0 : remaining <= 0.0;
            return new RoundObligationStatusRow(
                    h.getId(),
                    h.getAddress(),
                    h.getHeadName(),
                    h.getMembers(),
                    expected,
                    paid,
                    remaining,
                    isPaid
            );
        }).collect(Collectors.toList());
    }

    @DeleteMapping("/{roundId}")
    @Transactional
    public ResponseEntity<Void> delete(@PathVariable Long roundId) {
        if (!roundRepository.existsById(roundId)) {
            throw new IllegalArgumentException("Đợt thu không tồn tại");
        }
        roundObligationRepository.deleteByRoundId(roundId);
        roundRepository.deleteById(roundId);
        return ResponseEntity.noContent().build();
    }

    private CollectionRound createDefaultRound(Fee fee) {
        CollectionRound round = new CollectionRound();
        round.setFeeId(fee.getId());
        round.setName("Đợt 1");
        // For older data where only `deadline` exists: treat it as a 1-day range.
        LocalDate end = parseLocalDate(fee.getDeadline());
        if (end != null) {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            round.setPeriod(fmt.format(end) + "~" + fmt.format(end));
            round.setDeadline(fmt.format(end));
        } else {
            round.setPeriod(null);
            round.setDeadline(fee.getDeadline());
        }
        CollectionRound saved = roundRepository.save(round);
        upsertRoundObligations(saved, fee);
        return saved;
    }

    private static LocalDate parseLocalDate(String s) {
        if (s == null) return null;
        String trimmed = s.trim();
        if (trimmed.isEmpty()) return null;
        try {
            return LocalDate.parse(trimmed);
        } catch (Exception ignored) {
            return null;
        }
    }

    /**
     * Parse [start, end] from:
     * - period: "yyyy-MM-dd~yyyy-MM-dd"
     * - otherwise fallback to deadline as a 1-day range.
     */
    private static LocalDate[] parseRangeFromPeriod(String period, String deadline) {
        LocalDate start = null;
        LocalDate end = null;

        if (period != null && !period.isBlank() && period.contains("~")) {
            String[] parts = period.split("~");
            if (parts.length >= 2) {
                start = parseLocalDate(parts[0]);
                end = parseLocalDate(parts[1]);
            }
        }

        if (end == null) end = parseLocalDate(deadline);
        if (start == null) start = end; // 1-day fallback

        return new LocalDate[]{start, end};
    }

    private void upsertRoundObligations(CollectionRound round, Fee fee) {
        if (round.getId() == null) return;
        List<Household> households = householdRepository.findAll();
        Map<Long, List<Vehicle>> vehiclesByHousehold = vehicleRepository.findAll().stream()
                .filter(v -> v.getHousehold() != null && v.getHousehold().getId() != null)
                .collect(Collectors.groupingBy(v -> v.getHousehold().getId()));

        for (Household h : households) {
            long householdId = h.getId();
            List<Vehicle> vs = vehiclesByHousehold.getOrDefault(householdId, List.of());
            double expected = FeeExpectedAmounts.expectedForHousehold(fee, h, vs);

            RoundObligation o = roundObligationRepository
                    .findByRoundIdAndHouseholdId(round.getId(), householdId)
                    .orElseGet(() -> {
                        RoundObligation created = new RoundObligation();
                        created.setRoundId(round.getId());
                        created.setHouseholdId(householdId);
                        return created;
                    });
            o.setExpectedAmount(expected);
            roundObligationRepository.save(o);
        }
    }
}


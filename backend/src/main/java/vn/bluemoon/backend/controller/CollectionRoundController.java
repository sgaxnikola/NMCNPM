package vn.bluemoon.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.bluemoon.backend.model.*;
import vn.bluemoon.backend.repository.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/rounds")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
public class CollectionRoundController {

    private final CollectionRoundRepository roundRepository;
    private final RoundObligationRepository roundObligationRepository;
    private final FeeRepository feeRepository;
    private final HouseholdRepository householdRepository;
    private final PaymentRepository paymentRepository;

    public CollectionRoundController(
            CollectionRoundRepository roundRepository,
            RoundObligationRepository roundObligationRepository,
            FeeRepository feeRepository,
            HouseholdRepository householdRepository,
            PaymentRepository paymentRepository
    ) {
        this.roundRepository = roundRepository;
        this.roundObligationRepository = roundObligationRepository;
        this.feeRepository = feeRepository;
        this.householdRepository = householdRepository;
        this.paymentRepository = paymentRepository;
    }

    public record CreateRoundRequest(String name, String period, String deadline) {}

    @GetMapping
    public List<CollectionRound> listByFee(@RequestParam("feeId") Long feeId) {
        List<CollectionRound> rounds = roundRepository.findByFeeIdOrderByNewest(feeId);
        if (rounds.isEmpty()) {
            // Auto-create a default round for existing fees
            Fee fee = feeRepository.findById(feeId)
                    .orElseThrow(() -> new IllegalArgumentException("Khoản thu không tồn tại"));
            CollectionRound created = createDefaultRound(fee);
            return List.of(created);
        }
        return rounds;
    }

    @PostMapping
    public ResponseEntity<CollectionRound> create(@RequestParam("feeId") Long feeId, @RequestBody CreateRoundRequest body) {
        Fee fee = feeRepository.findById(feeId)
                .orElseThrow(() -> new IllegalArgumentException("Khoản thu không tồn tại"));
        CollectionRound round = new CollectionRound();
        round.setFeeId(feeId);
        round.setName(body.name() == null || body.name().isBlank() ? "Đợt thu" : body.name().trim());
        round.setPeriod(body.period());
        round.setDeadline(body.deadline() == null || body.deadline().isBlank() ? fee.getDeadline() : body.deadline().trim());
        CollectionRound saved = roundRepository.save(round);
        upsertRoundObligations(saved, fee);
        return ResponseEntity.ok(saved);
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

    @GetMapping("/{roundId}/obligations")
    public List<RoundObligationStatusRow> obligations(@PathVariable Long roundId) {
        CollectionRound round = roundRepository.findById(roundId)
                .orElseThrow(() -> new IllegalArgumentException("Đợt thu không tồn tại"));
        Fee fee = feeRepository.findById(round.getFeeId())
                .orElseThrow(() -> new IllegalArgumentException("Khoản thu không tồn tại"));

        // Ensure obligations exist
        upsertRoundObligations(round, fee);

        List<Household> households = householdRepository.findAll();
        List<Payment> feePayments = paymentRepository.findByFeeIdWithFee(round.getFeeId()).stream()
                .filter(p -> p.getRoundId() != null && p.getRoundId().equals(roundId))
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
        round.setPeriod(null);
        round.setDeadline(fee.getDeadline());
        CollectionRound saved = roundRepository.save(round);
        upsertRoundObligations(saved, fee);
        return saved;
    }

    private void upsertRoundObligations(CollectionRound round, Fee fee) {
        if (round.getId() == null) return;
        List<Household> households = householdRepository.findAll();
        double amountPerUnit = fee.getAmount() == null ? 0.0 : fee.getAmount();
        boolean perResident = "per_resident".equalsIgnoreCase(fee.getChargeType());

        for (Household h : households) {
            long householdId = h.getId();
            int members = h.getMembers() == null ? 0 : h.getMembers();
            double expected = amountPerUnit * (perResident ? Math.max(0, members) : 1);

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


package vn.bluemoon.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import vn.bluemoon.backend.model.*;
import vn.bluemoon.backend.repository.*;
import vn.bluemoon.backend.util.FeeExpectedAmounts;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/fees")
public class FeeController {

    private final FeeRepository feeRepository;
    private final HouseholdRepository householdRepository;
    private final ResidentRepository residentRepository;
    private final FeeObligationRepository feeObligationRepository;
    private final PaymentRepository paymentRepository;
    private final CollectionRoundRepository collectionRoundRepository;
    private final RoundObligationRepository roundObligationRepository;
    private final VehicleRepository vehicleRepository;

    public FeeController(
            FeeRepository feeRepository,
            HouseholdRepository householdRepository,
            ResidentRepository residentRepository,
            FeeObligationRepository feeObligationRepository,
            PaymentRepository paymentRepository,
            CollectionRoundRepository collectionRoundRepository,
            RoundObligationRepository roundObligationRepository,
            VehicleRepository vehicleRepository
    ) {
        this.feeRepository = feeRepository;
        this.householdRepository = householdRepository;
        this.residentRepository = residentRepository;
        this.feeObligationRepository = feeObligationRepository;
        this.paymentRepository = paymentRepository;
        this.collectionRoundRepository = collectionRoundRepository;
        this.roundObligationRepository = roundObligationRepository;
        this.vehicleRepository = vehicleRepository;
    }

    @GetMapping
    public List<Fee> getAll() {
        return feeRepository.findAll();
    }

    public record FeeRequest(
        String name, Double amount, Integer type, String chargeType, String deadline,
        String frequency, String startDate, String endDate,
        Double vehicleRateMotorcycle, Double vehicleRateCar, Double vehicleRateBicycle
    ) {}

    @PostMapping
    public ResponseEntity<Fee> create(@RequestBody FeeRequest body) {
        Fee fee = new Fee();
        fee.setName(body.name());
        fee.setAmount(body.amount());
        fee.setType(body.type() != null ? body.type() : 0);
        fee.setChargeType(body.chargeType());
        fee.setDeadline(body.deadline());

        // Frequency defaults: mandatory → monthly, voluntary → one_time
        String freq = body.frequency();
        if (freq == null || freq.isBlank()) {
            freq = (fee.getType() == 0) ? "monthly" : "one_time";
        }
        fee.setFrequency(freq);

        if (body.startDate() != null && !body.startDate().isBlank()) {
            fee.setStartDate(LocalDate.parse(body.startDate()));
        }
        if (body.endDate() != null && !body.endDate().isBlank()) {
            fee.setEndDate(LocalDate.parse(body.endDate()));
        }
        applyVehicleRates(fee, body);

        Fee saved = feeRepository.save(fee);
        upsertObligationsForFee(saved);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Fee> update(@PathVariable Long id, @RequestBody FeeRequest body) {
        Fee existing = feeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Khoản thu không tồn tại"));
        if (body.name() != null) existing.setName(body.name());
        if (body.amount() != null) existing.setAmount(body.amount());
        if (body.type() != null) existing.setType(body.type());
        if (body.chargeType() != null) existing.setChargeType(body.chargeType());
        if (body.deadline() != null) existing.setDeadline(body.deadline());
        if (body.frequency() != null) existing.setFrequency(body.frequency());
        if (body.startDate() != null && !body.startDate().isBlank()) {
            existing.setStartDate(LocalDate.parse(body.startDate()));
        }
        if (body.endDate() != null && !body.endDate().isBlank()) {
            existing.setEndDate(LocalDate.parse(body.endDate()));
        }
        applyVehicleRates(existing, body);
        Fee saved = feeRepository.save(existing);
        upsertObligationsForFee(saved);
        return ResponseEntity.ok(saved);
    }

    public record FeeObligationStatusRow(
            Long householdId,
            String householdAddress,
            String headName,
            Integer members,
            Double expectedAmount,
            Double paidAmount,
            Double remainingAmount,
            boolean paid
    ) {}

    @GetMapping("/{id}/obligations")
    public List<FeeObligationStatusRow> obligations(@PathVariable Long id) {
        Fee fee = feeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Khoản thu không tồn tại"));

        // Ensure obligations exist (supports older DB)
        upsertObligationsForFee(fee);

        List<Household> households = householdRepository.findAll();
        // Populate transient headName so UI can display it consistently
        for (Household h : households) {
            Resident head = residentRepository.findFirstByHousehold_IdAndRelationToHeadIgnoreCase(h.getId(), "Chủ hộ");
            if (head != null) {
                h.setHeadName(head.getFullName());
            }
        }
        List<Payment> feePayments = paymentRepository.findByFeeIdWithFee(id);

        Map<Long, Double> paidByHousehold = feePayments.stream()
                .filter(p -> p.getHouseholdId() != null)
                .collect(Collectors.groupingBy(Payment::getHouseholdId, Collectors.summingDouble(p -> p.getAmount() == null ? 0.0 : p.getAmount())));

        Map<Long, FeeObligation> obligationByHousehold = feeObligationRepository.findByFeeIdOrderByHouseholdIdAsc(id).stream()
                .collect(Collectors.toMap(FeeObligation::getHouseholdId, o -> o, (a, b) -> a));

        return households.stream().map(h -> {
            FeeObligation o = obligationByHousehold.get(h.getId());
            double expected = o != null && o.getExpectedAmount() != null ? o.getExpectedAmount() : 0.0;
            double paid = paidByHousehold.getOrDefault(h.getId(), 0.0);
            double remaining = Math.max(0.0, expected - paid);
            boolean isPaid = expected <= 0.0 ? paid > 0.0 : remaining <= 0.0;
            return new FeeObligationStatusRow(
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

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!feeRepository.existsById(id)) {
            throw new IllegalArgumentException("Khoản thu không tồn tại");
        }
        // Xóa payments liên quan trước
        paymentRepository.deleteByFeeId(id);
        // Xóa round obligations và collection rounds
        List<CollectionRound> rounds = collectionRoundRepository.findByFeeIdOrderByNewest(id);
        for (CollectionRound round : rounds) {
            roundObligationRepository.deleteByRoundId(round.getId());
        }
        collectionRoundRepository.deleteByFeeId(id);
        // Xóa fee obligations
        feeObligationRepository.deleteByFeeId(id);
        feeRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private static void applyVehicleRates(Fee fee, FeeRequest body) {
        String ct = fee.getChargeType();
        if (ct == null || !"per_vehicle".equalsIgnoreCase(ct)) {
            fee.setVehicleRateMotorcycle(null);
            fee.setVehicleRateCar(null);
            fee.setVehicleRateBicycle(null);
            return;
        }
        fee.setVehicleRateMotorcycle(body.vehicleRateMotorcycle());
        fee.setVehicleRateCar(body.vehicleRateCar());
        fee.setVehicleRateBicycle(body.vehicleRateBicycle());
    }

    private void upsertObligationsForFee(Fee fee) {
        if (fee.getId() == null) return;
        List<Household> households = householdRepository.findAll();
        Map<Long, List<Vehicle>> vehiclesByHousehold = vehicleRepository.findAll().stream()
                .filter(v -> v.getHousehold() != null && v.getHousehold().getId() != null)
                .collect(Collectors.groupingBy(v -> v.getHousehold().getId()));

        for (Household h : households) {
            long householdId = h.getId();
            List<Vehicle> vs = vehiclesByHousehold.getOrDefault(householdId, List.of());
            double expected = FeeExpectedAmounts.expectedForHousehold(fee, h, vs);

            FeeObligation o = feeObligationRepository
                    .findByFeeIdAndHouseholdId(fee.getId(), householdId)
                    .orElseGet(() -> {
                        FeeObligation created = new FeeObligation();
                        created.setFeeId(fee.getId());
                        created.setHouseholdId(householdId);
                        return created;
                    });
            o.setExpectedAmount(expected);
            feeObligationRepository.save(o);
        }
    }
}


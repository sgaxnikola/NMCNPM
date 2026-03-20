package vn.bluemoon.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.bluemoon.backend.model.Fee;
import vn.bluemoon.backend.model.FeeObligation;
import vn.bluemoon.backend.repository.FeeRepository;
import vn.bluemoon.backend.repository.FeeObligationRepository;
import vn.bluemoon.backend.repository.HouseholdRepository;
import vn.bluemoon.backend.repository.PaymentRepository;
import vn.bluemoon.backend.model.Household;
import vn.bluemoon.backend.model.Payment;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/fees")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
public class FeeController {

    private final FeeRepository feeRepository;
    private final HouseholdRepository householdRepository;
    private final FeeObligationRepository feeObligationRepository;
    private final PaymentRepository paymentRepository;

    public FeeController(
            FeeRepository feeRepository,
            HouseholdRepository householdRepository,
            FeeObligationRepository feeObligationRepository,
            PaymentRepository paymentRepository
    ) {
        this.feeRepository = feeRepository;
        this.householdRepository = householdRepository;
        this.feeObligationRepository = feeObligationRepository;
        this.paymentRepository = paymentRepository;
    }

    @GetMapping
    public List<Fee> getAll() {
        return feeRepository.findAll();
    }

    @PostMapping
    public ResponseEntity<Fee> create(@RequestBody Fee fee) {
        if (fee.getType() == null) {
            fee.setType(0);
        }
        Fee saved = feeRepository.save(fee);
        upsertObligationsForFee(saved);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Fee> update(@PathVariable Long id, @RequestBody Fee body) {
        Fee existing = feeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Khoản thu không tồn tại"));
        if (body.getName() != null) existing.setName(body.getName());
        if (body.getAmount() != null) existing.setAmount(body.getAmount());
        if (body.getType() != null) existing.setType(body.getType());
        if (body.getChargeType() != null) existing.setChargeType(body.getChargeType());
        if (body.getDeadline() != null) existing.setDeadline(body.getDeadline());
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
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!feeRepository.existsById(id)) {
            throw new IllegalArgumentException("Khoản thu không tồn tại");
        }
        feeObligationRepository.deleteByFeeId(id);
        feeRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private void upsertObligationsForFee(Fee fee) {
        if (fee.getId() == null) return;
        List<Household> households = householdRepository.findAll();
        double amountPerUnit = fee.getAmount() == null ? 0.0 : fee.getAmount();
        boolean perResident = "per_resident".equalsIgnoreCase(fee.getChargeType());

        for (Household h : households) {
            long householdId = h.getId();
            int members = h.getMembers() == null ? 0 : h.getMembers();
            double expected = amountPerUnit * (perResident ? Math.max(0, members) : 1);

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


package vn.bluemoon.backend.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.bluemoon.backend.model.*;
import vn.bluemoon.backend.repository.*;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/portal")
public class ResidentPortalController {

    private final AccountRepository accountRepository;
    private final HouseholdRepository householdRepository;
    private final ResidentRepository residentRepository;
    private final FeeRepository feeRepository;
    private final FeeObligationRepository feeObligationRepository;
    private final PaymentRepository paymentRepository;
    private final CollectionRoundRepository collectionRoundRepository;

    public ResidentPortalController(
            AccountRepository accountRepository,
            HouseholdRepository householdRepository,
            ResidentRepository residentRepository,
            FeeRepository feeRepository,
            FeeObligationRepository feeObligationRepository,
            PaymentRepository paymentRepository,
            CollectionRoundRepository collectionRoundRepository
    ) {
        this.accountRepository = accountRepository;
        this.householdRepository = householdRepository;
        this.residentRepository = residentRepository;
        this.feeRepository = feeRepository;
        this.feeObligationRepository = feeObligationRepository;
        this.paymentRepository = paymentRepository;
        this.collectionRoundRepository = collectionRoundRepository;
    }

    public record PortalAccount(
            Long id,
            String username,
            String fullName,
            String role,
            Long householdId
    ) {}

    public record HouseholdSummary(
            Long id,
            String address,
            Integer members,
            String headName
    ) {}

    public record FeeStatus(
            Long feeId,
            String feeName,
            Double expectedAmount,
            Double paidAmount,
            Double remainingAmount,
            boolean paid
    ) {}

    public record PortalSummary(
            PortalAccount account,
            Resident profile,
            HouseholdSummary household,
            List<Resident> members,
            List<FeeStatus> fees,
            List<Payment> payments
    ) {}

    private Account requireResidentAccount(String username) {
        if (username == null || username.isBlank()) {
            throw new IllegalArgumentException("Thiếu username");
        }
        Account acc = accountRepository.findByUsername(username.trim().toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException("Tài khoản không tồn tại"));
        String role = acc.getRole() == null ? "" : acc.getRole().trim();
        if (!"resident".equalsIgnoreCase(role)) {
            throw new IllegalArgumentException("Tài khoản không có quyền cư dân");
        }
        if (acc.getHouseholdId() == null || acc.getHouseholdId() <= 0) {
            throw new IllegalArgumentException("Tài khoản cư dân chưa được gán householdId");
        }
        return acc;
    }

    @GetMapping("/summary")
    public ResponseEntity<?> summary(@RequestParam("username") String username) {
        try {
            Account acc = requireResidentAccount(username);
            Long householdId = acc.getHouseholdId();

            Household h = householdRepository.findById(householdId)
                    .orElseThrow(() -> new IllegalArgumentException("Household không tồn tại"));
            Resident head = residentRepository.findFirstByHousehold_IdAndRelationToHeadIgnoreCase(householdId, "Chủ hộ");
            String headName = head != null ? head.getFullName() : null;
            HouseholdSummary household = new HouseholdSummary(h.getId(), h.getAddress(), h.getMembers(), headName);

            List<Resident> members = residentRepository.findByHousehold_Id(householdId);
            // Resident login uses username = CCCD (see bootstrap). Prefer matching resident by CCCD.
            Resident profile = residentRepository.findFirstByCccd(acc.getUsername());
            if (profile == null) {
                profile = head != null ? head : (members.isEmpty() ? null : members.get(0));
            }

            List<Payment> payments = paymentRepository.findByHouseholdIdWithFee(householdId);

            Map<Long, Double> paidByFee = payments.stream()
                    .filter(p -> p.getFeeId() != null)
                    .collect(Collectors.groupingBy(Payment::getFeeId, Collectors.summingDouble(p -> p.getAmount() == null ? 0.0 : p.getAmount())));

            // ensure obligations exist for all fees (supports older DB)
            List<Fee> fees = feeRepository.findAll();
            List<FeeStatus> feeStatuses = new ArrayList<>();
            for (Fee fee : fees) {
                Long feeId = fee.getId();
                if (feeId == null) continue;
                FeeObligation o = feeObligationRepository.findByFeeIdAndHouseholdId(feeId, householdId).orElse(null);
                double expected = o != null && o.getExpectedAmount() != null ? o.getExpectedAmount() : 0.0;
                double paid = paidByFee.getOrDefault(feeId, 0.0);
                double remaining = Math.max(0.0, expected - paid);
                boolean isPaid = expected <= 0.0 ? paid > 0.0 : remaining <= 0.0;
                feeStatuses.add(new FeeStatus(feeId, fee.getName(), expected, paid, remaining, isPaid));
            }

            PortalAccount pa = new PortalAccount(acc.getId(), acc.getUsername(), acc.getFullName(), acc.getRole(), householdId);
            PortalSummary summary = new PortalSummary(pa, profile, household, members, feeStatuses, payments);
            return ResponseEntity.ok(summary);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ex.getMessage());
        }
    }

    public record OnlinePayRequest(
            String username,
            Long feeId,
            Double amount
    ) {}

    public record OnlinePayResponse(
            Long paymentId,
            String status
    ) {}

    @PostMapping("/payments/online")
    public ResponseEntity<?> createOnlinePayment(@RequestBody OnlinePayRequest req) {
        try {
            Account acc = requireResidentAccount(req.username());
            if (req.feeId() == null) throw new IllegalArgumentException("Thiếu feeId");
            if (req.amount() == null || req.amount() <= 0) throw new IllegalArgumentException("Số tiền không hợp lệ");

            Fee fee = feeRepository.findById(req.feeId())
                    .orElseThrow(() -> new IllegalArgumentException("Khoản thu không tồn tại"));

            Payment p = new Payment();
            p.setFee(fee);
            List<CollectionRound> rounds = collectionRoundRepository.findByFeeIdOrderByNewest(fee.getId());
            if (!rounds.isEmpty()) {
                p.setRoundId(rounds.get(0).getId());
            }
            p.setHouseholdId(acc.getHouseholdId());
            p.setPayerName(acc.getFullName() != null ? acc.getFullName() : acc.getUsername());
            p.setAmount(req.amount());
            p.setPaymentDate(null); // pending until confirmed
            p.setPaymentMethod("ONLINE");
            p.setPaymentStatus("PENDING");
            p.setOnlineTxnId(UUID.randomUUID().toString().replace("-", ""));

            Payment saved = paymentRepository.save(p);
            return ResponseEntity.ok(new OnlinePayResponse(saved.getId(), "PENDING"));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ex.getMessage());
        }
    }

    public record ConfirmOnlinePaymentRequest(String username) {}

    @PostMapping("/payments/online/{paymentId}/confirm")
    public ResponseEntity<?> confirmOnlinePayment(@PathVariable Long paymentId, @RequestBody ConfirmOnlinePaymentRequest req) {
        try {
            Account acc = requireResidentAccount(req.username());
            Payment p = paymentRepository.findById(paymentId)
                    .orElseThrow(() -> new IllegalArgumentException("Giao dịch không tồn tại"));
            if (p.getHouseholdId() == null || !p.getHouseholdId().equals(acc.getHouseholdId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Không có quyền xác nhận giao dịch này");
            }
            p.setPaymentStatus("PAID");
            p.setPaymentDate(LocalDate.now());
            Payment saved = paymentRepository.save(p);
            return ResponseEntity.ok(saved);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ex.getMessage());
        }
    }
}


package vn.bluemoon.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.bluemoon.backend.model.Fee;
import vn.bluemoon.backend.model.Payment;
import vn.bluemoon.backend.repository.FeeRepository;
import vn.bluemoon.backend.repository.PaymentRepository;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/payments")
@CrossOrigin(origins = "*")
public class PaymentController {

    private final PaymentRepository paymentRepository;
    private final FeeRepository feeRepository;

    public PaymentController(PaymentRepository paymentRepository, FeeRepository feeRepository) {
        this.paymentRepository = paymentRepository;
        this.feeRepository = feeRepository;
    }

    @GetMapping
    public List<Payment> getAll() {
        return paymentRepository.findAllWithFee();
    }

    public record PaymentRequest(
            Long feeId,
            Long roundId,
            Long householdId,
            String payerName,
            Double amount,
            String paymentDate
    ) {}

    @PostMapping
    public ResponseEntity<Payment> create(@RequestBody PaymentRequest request) {
        Fee fee = feeRepository.findById(request.feeId())
                .orElseThrow(() -> new IllegalArgumentException("Fee not found"));

        Payment payment = new Payment();
        payment.setFee(fee);
        payment.setRoundId(request.roundId());
        payment.setHouseholdId(request.householdId());
        payment.setPayerName(request.payerName());
        payment.setAmount(request.amount());
        payment.setPaymentDate(LocalDate.parse(request.paymentDate()));

        Payment saved = paymentRepository.save(payment);
        return ResponseEntity.ok(saved);
    }
}


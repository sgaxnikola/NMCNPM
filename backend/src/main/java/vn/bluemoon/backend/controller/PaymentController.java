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
        if (request.feeId() == null) {
            throw new IllegalArgumentException("feeId là bắt buộc");
        }
        if (request.householdId() == null) {
            throw new IllegalArgumentException("householdId là bắt buộc");
        }
        if (request.amount() == null || request.amount() <= 0) {
            throw new IllegalArgumentException("Số tiền phải lớn hơn 0");
        }
        if (request.paymentDate() == null || request.paymentDate().isBlank()) {
            throw new IllegalArgumentException("Ngày thanh toán là bắt buộc");
        }

        Fee fee = feeRepository.findById(request.feeId())
                .orElseThrow(() -> new IllegalArgumentException("Fee not found"));

        Payment payment = new Payment();
        payment.setFee(fee);
        payment.setRoundId(request.roundId());
        payment.setHouseholdId(request.householdId());
        payment.setPayerName(request.payerName());
        payment.setAmount(request.amount());
        try {
            payment.setPaymentDate(LocalDate.parse(request.paymentDate()));
        } catch (Exception e) {
            throw new IllegalArgumentException("Định dạng ngày thanh toán không hợp lệ (yyyy-MM-dd)");
        }

        Payment saved = paymentRepository.save(payment);
        return ResponseEntity.ok(saved);
    }
}


package vn.bluemoon.backend.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.bluemoon.backend.model.Fee;
import vn.bluemoon.backend.repository.FeeRepository;

import java.util.List;

/**
 * Phí sinh hoạt hàng tháng (điện, nước, dịch vụ) — ánh xạ LivingFee / FeeType phí định kỳ.
 * Dữ liệu lưu trong bảng {@code khoan_thu} với {@code frequency = monthly}.
 */
@RestController
@RequestMapping("/api/living-fees")
public class LivingFeeController {

    private final FeeRepository feeRepository;

    public LivingFeeController(FeeRepository feeRepository) {
        this.feeRepository = feeRepository;
    }

    public record LivingFeeResponse(
            Long id,
            String name,
            Double amount,
            String category,
            String frequency
    ) {}

    public record LivingFeeRequest(
            String name,
            Double amount,
            String category
    ) {}

    @GetMapping
    public List<LivingFeeResponse> list() {
        return feeRepository.findByFrequencyIgnoreCase("monthly").stream()
                .map(this::toResponse)
                .toList();
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody LivingFeeRequest request) {
        if (request.name() == null || request.name().isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Tên phí sinh hoạt là bắt buộc");
        }
        if (request.amount() == null || request.amount() <= 0) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Số tiền phải lớn hơn 0");
        }
        Fee fee = new Fee();
        String category = request.category() == null ? "general" : request.category().trim().toLowerCase();
        String prefix = switch (category) {
            case "electric", "dien" -> "Tiền điện";
            case "water", "nuoc" -> "Tiền nước";
            default -> "Phí sinh hoạt";
        };
        fee.setName(prefix + " - " + request.name().trim());
        fee.setAmount(request.amount());
        fee.setType(0);
        fee.setChargeType("per_apartment");
        fee.setFrequency("monthly");
        Fee saved = feeRepository.save(fee);
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(saved));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody LivingFeeRequest request) {
        Fee fee = feeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy phí sinh hoạt"));
        if (!"monthly".equalsIgnoreCase(fee.getFrequency())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Khoản thu không phải phí sinh hoạt hàng tháng");
        }
        if (request.name() != null && !request.name().isBlank()) {
            fee.setName(request.name().trim());
        }
        if (request.amount() != null && request.amount() > 0) {
            fee.setAmount(request.amount());
        }
        return ResponseEntity.ok(toResponse(feeRepository.save(fee)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        Fee fee = feeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy phí sinh hoạt"));
        if (!"monthly".equalsIgnoreCase(fee.getFrequency())) {
            throw new IllegalArgumentException("Khoản thu không phải phí sinh hoạt hàng tháng");
        }
        feeRepository.delete(fee);
        return ResponseEntity.noContent().build();
    }

    private LivingFeeResponse toResponse(Fee fee) {
        String cat = "general";
        String name = fee.getName() == null ? "" : fee.getName().toLowerCase();
        if (name.contains("điện") || name.contains("dien")) cat = "electric";
        else if (name.contains("nước") || name.contains("nuoc")) cat = "water";
        return new LivingFeeResponse(
                fee.getId(),
                fee.getName(),
                fee.getAmount(),
                cat,
                fee.getFrequency()
        );
    }
}

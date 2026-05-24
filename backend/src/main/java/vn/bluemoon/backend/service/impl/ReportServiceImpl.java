package vn.bluemoon.backend.service.impl;

import org.springframework.stereotype.Service;
import vn.bluemoon.backend.dto.report.ReportSummaryDto;
import vn.bluemoon.backend.model.FeeObligation;
import vn.bluemoon.backend.model.Household;
import vn.bluemoon.backend.model.Payment;
import vn.bluemoon.backend.model.Resident;
import vn.bluemoon.backend.repository.FeeObligationRepository;
import vn.bluemoon.backend.repository.FeeRepository;
import vn.bluemoon.backend.repository.HouseholdRepository;
import vn.bluemoon.backend.repository.PaymentRepository;
import vn.bluemoon.backend.repository.ResidentRepository;
import vn.bluemoon.backend.service.ReportService;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
public class ReportServiceImpl implements ReportService {

    private final HouseholdRepository householdRepository;
    private final ResidentRepository residentRepository;
    private final PaymentRepository paymentRepository;
    private final FeeObligationRepository feeObligationRepository;
    private final FeeRepository feeRepository;

    public ReportServiceImpl(
            HouseholdRepository householdRepository,
            ResidentRepository residentRepository,
            PaymentRepository paymentRepository,
            FeeObligationRepository feeObligationRepository,
            FeeRepository feeRepository
    ) {
        this.householdRepository = householdRepository;
        this.residentRepository = residentRepository;
        this.paymentRepository = paymentRepository;
        this.feeObligationRepository = feeObligationRepository;
        this.feeRepository = feeRepository;
    }

    @Override
    public ReportSummaryDto getSummary() {
        long households = householdRepository.count();
        long residents = residentRepository.count();

        List<Payment> payments = paymentRepository.findAllWithFee();
        double collected = payments.stream()
                .filter(p -> !"PENDING".equalsIgnoreCase(Objects.toString(p.getPaymentStatus(), "")))
                .mapToDouble(p -> p.getAmount() == null ? 0.0 : p.getAmount())
                .sum();

        List<FeeObligation> obligations = feeObligationRepository.findAll();
        double expected = obligations.stream()
                .mapToDouble(o -> o.getExpectedAmount() == null ? 0.0 : o.getExpectedAmount())
                .sum();

        Map<String, Double> paidByFeeHousehold = new HashMap<>();
        for (Payment p : payments) {
            if ("PENDING".equalsIgnoreCase(Objects.toString(p.getPaymentStatus(), ""))) continue;
            if (p.getFee() == null || p.getHouseholdId() == null) continue;
            String key = p.getFee().getId() + ":" + p.getHouseholdId();
            paidByFeeHousehold.merge(key, p.getAmount() == null ? 0.0 : p.getAmount(), Double::sum);
        }

        List<ReportSummaryDto.UnpaidHouseholdDto> unpaid = new ArrayList<>();
        for (FeeObligation ob : obligations) {
            double due = ob.getExpectedAmount() == null ? 0.0 : ob.getExpectedAmount();
            String key = ob.getFeeId() + ":" + ob.getHouseholdId();
            double paid = paidByFeeHousehold.getOrDefault(key, 0.0);
            if (due - paid <= 0.5) continue;

            Household hh = householdRepository.findById(ob.getHouseholdId()).orElse(null);
            String headName = resolveHeadName(ob.getHouseholdId());
            String feeName = feeRepository.findById(ob.getFeeId()).map(f -> f.getName()).orElse("Khoản thu");

            unpaid.add(new ReportSummaryDto.UnpaidHouseholdDto(
                    ob.getHouseholdId(),
                    hh != null ? hh.getAddress() : "",
                    headName,
                    ob.getFeeId(),
                    feeName,
                    due,
                    paid,
                    Math.max(0, due - paid)
            ));
        }

        double uncollected = Math.max(0, expected - collected);
        return new ReportSummaryDto(households, residents, collected, uncollected, unpaid);
    }

    private String resolveHeadName(Long householdId) {
        if (householdId == null) return "";
        Resident head = residentRepository.findFirstByHousehold_IdAndRelationToHeadIgnoreCase(householdId, "Chủ hộ");
        if (head == null) {
            head = residentRepository.findFirstByHousehold_IdAndRelationToHeadIgnoreCase(householdId, "chu ho");
        }
        return head != null && head.getFullName() != null ? head.getFullName() : "";
    }
}

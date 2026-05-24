package vn.bluemoon.backend.dto.report;

import java.util.List;

public record ReportSummaryDto(
        long totalHouseholds,
        long totalResidents,
        double totalCollected,
        double totalUncollected,
        List<UnpaidHouseholdDto> unpaidHouseholds
) {
    public record UnpaidHouseholdDto(
            Long householdId,
            String address,
            String headName,
            Long feeId,
            String feeName,
            double expectedAmount,
            double paidAmount,
            double remainingAmount
    ) {}
}

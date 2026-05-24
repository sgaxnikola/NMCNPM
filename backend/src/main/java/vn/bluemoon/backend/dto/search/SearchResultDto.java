package vn.bluemoon.backend.dto.search;

import java.util.List;

public record SearchResultDto(
        String query,
        List<HouseholdHit> households,
        List<ResidentHit> residents,
        List<FeeHit> fees,
        List<VehicleHit> vehicles
) {
    public record HouseholdHit(Long id, String address, Integer members, String headName) {}

    public record ResidentHit(Long id, Long householdId, String fullName, String cccd, String phone) {}

    public record FeeHit(Long id, String name, Double amount, String frequency, String chargeType) {}

    public record VehicleHit(Long id, Long householdId, String apartment, String type, String plate) {}
}

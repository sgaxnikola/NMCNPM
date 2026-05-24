package vn.bluemoon.backend.util;

import vn.bluemoon.backend.model.Fee;
import vn.bluemoon.backend.model.Household;
import vn.bluemoon.backend.model.Vehicle;

import java.util.List;

public final class FeeExpectedAmounts {

    private FeeExpectedAmounts() {
    }

    public static double expectedForHousehold(Fee fee, Household h, List<Vehicle> vehiclesForHousehold) {
        String ct = fee.getChargeType();
        if (ct != null && "per_vehicle".equalsIgnoreCase(ct)) {
            double rm = fee.getVehicleRateMotorcycle() == null ? 0.0 : fee.getVehicleRateMotorcycle();
            double rc = fee.getVehicleRateCar() == null ? 0.0 : fee.getVehicleRateCar();
            double rb = fee.getVehicleRateBicycle() == null ? 0.0 : fee.getVehicleRateBicycle();
            double sum = 0.0;
            for (Vehicle v : vehiclesForHousehold) {
                String t = v.getType();
                if (t == null) {
                    sum += rm;
                    continue;
                }
                switch (t.toLowerCase()) {
                    case "car" -> sum += rc;
                    case "bicycle" -> sum += rb;
                    default -> sum += rm;
                }
            }
            return sum;
        }
        double amountPerUnit = fee.getAmount() == null ? 0.0 : fee.getAmount();
        boolean perResident = "per_resident".equalsIgnoreCase(ct);
        int members = h.getMembers() == null ? 0 : h.getMembers();
        return amountPerUnit * (perResident ? Math.max(0, members) : 1);
    }
}

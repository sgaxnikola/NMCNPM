package vn.bluemoon.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.bluemoon.backend.model.Vehicle;

import java.util.List;

public interface VehicleRepository extends JpaRepository<Vehicle, Long> {

    List<Vehicle> findByHousehold_Id(Long householdId);

    void deleteByHousehold_Id(Long householdId);
}


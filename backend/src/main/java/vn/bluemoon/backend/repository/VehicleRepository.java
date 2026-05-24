package vn.bluemoon.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;
import vn.bluemoon.backend.model.Vehicle;

import java.util.List;

public interface VehicleRepository extends JpaRepository<Vehicle, Long> {

    List<Vehicle> findByHousehold_Id(Long householdId);

    List<Vehicle> findByPlateContainingIgnoreCase(String plate);

    List<Vehicle> findByHousehold_AddressContainingIgnoreCase(String address);

    @Modifying
    @Transactional
    void deleteByHousehold_Id(Long householdId);
}


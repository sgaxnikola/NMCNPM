package vn.bluemoon.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.bluemoon.backend.model.Household;

public interface HouseholdRepository extends JpaRepository<Household, Long> {
    boolean existsByAddressIgnoreCase(String address);
}


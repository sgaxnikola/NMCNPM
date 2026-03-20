package vn.bluemoon.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.bluemoon.backend.model.Resident;

import java.util.List;

public interface ResidentRepository extends JpaRepository<Resident, Long> {
    List<Resident> findByHousehold_Id(Long householdId);

    Resident findFirstByHousehold_IdAndRelationToHeadIgnoreCase(Long householdId, String relationToHead);

    long countByHousehold_Id(Long householdId);

    void deleteByHousehold_Id(Long householdId);
}


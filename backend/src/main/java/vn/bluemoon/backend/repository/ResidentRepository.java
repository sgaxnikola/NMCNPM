package vn.bluemoon.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;
import vn.bluemoon.backend.model.Resident;

import java.util.List;

public interface ResidentRepository extends JpaRepository<Resident, Long> {
    List<Resident> findByHousehold_Id(Long householdId);

    Resident findFirstByHousehold_IdAndRelationToHeadIgnoreCase(Long householdId, String relationToHead);

    Resident findFirstByCccd(String cccd);

    long countByHousehold_Id(Long householdId);

    List<Resident> findByFullNameContainingIgnoreCaseOrCccdContainingIgnoreCaseOrPhoneContainingIgnoreCase(
            String fullName, String cccd, String phone);

    @Modifying
    @Transactional
    void deleteByHousehold_Id(Long householdId);
}


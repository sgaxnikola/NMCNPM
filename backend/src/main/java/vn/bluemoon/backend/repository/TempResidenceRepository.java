package vn.bluemoon.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.bluemoon.backend.model.TempResidence;

import java.util.List;

public interface TempResidenceRepository extends JpaRepository<TempResidence, Long> {
    List<TempResidence> findByHousehold_IdOrderByFromDateDesc(Long householdId);

    void deleteByHousehold_Id(Long householdId);
}


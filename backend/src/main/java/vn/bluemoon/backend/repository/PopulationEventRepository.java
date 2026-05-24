package vn.bluemoon.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;
import vn.bluemoon.backend.model.PopulationEvent;

import java.util.List;

public interface PopulationEventRepository extends JpaRepository<PopulationEvent, Long> {
    List<PopulationEvent> findByHousehold_IdOrderByDateDesc(Long householdId);

    @Modifying
    @Transactional
    void deleteByHousehold_Id(Long householdId);
}


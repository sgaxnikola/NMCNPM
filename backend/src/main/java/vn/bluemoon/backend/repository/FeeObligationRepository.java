package vn.bluemoon.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;
import vn.bluemoon.backend.model.FeeObligation;

import java.util.List;
import java.util.Optional;

public interface FeeObligationRepository extends JpaRepository<FeeObligation, Long> {
    List<FeeObligation> findByFeeIdOrderByHouseholdIdAsc(Long feeId);

    Optional<FeeObligation> findByFeeIdAndHouseholdId(Long feeId, Long householdId);

    @Modifying
    @Transactional
    void deleteByFeeId(Long feeId);
}


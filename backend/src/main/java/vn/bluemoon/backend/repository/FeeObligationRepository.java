package vn.bluemoon.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import vn.bluemoon.backend.model.FeeObligation;

import java.util.List;
import java.util.Optional;

public interface FeeObligationRepository extends JpaRepository<FeeObligation, Long> {
    List<FeeObligation> findByFeeIdOrderByHouseholdIdAsc(Long feeId);

    Optional<FeeObligation> findByFeeIdAndHouseholdId(Long feeId, Long householdId);

    void deleteByFeeId(Long feeId);

    @Query("SELECT o FROM FeeObligation o WHERE o.feeId = :feeId AND o.expectedAmount > 0")
    List<FeeObligation> findPositiveByFeeId(Long feeId);
}


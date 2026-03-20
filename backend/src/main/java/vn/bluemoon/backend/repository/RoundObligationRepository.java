package vn.bluemoon.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.bluemoon.backend.model.RoundObligation;

import java.util.List;
import java.util.Optional;

public interface RoundObligationRepository extends JpaRepository<RoundObligation, Long> {
    List<RoundObligation> findByRoundIdOrderByHouseholdIdAsc(Long roundId);
    Optional<RoundObligation> findByRoundIdAndHouseholdId(Long roundId, Long householdId);
    void deleteByRoundId(Long roundId);
}


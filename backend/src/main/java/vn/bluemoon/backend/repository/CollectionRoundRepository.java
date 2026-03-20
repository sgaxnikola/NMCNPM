package vn.bluemoon.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vn.bluemoon.backend.model.CollectionRound;

import java.util.List;
import java.util.Optional;

public interface CollectionRoundRepository extends JpaRepository<CollectionRound, Long> {
    @Query("SELECT r FROM CollectionRound r WHERE r.feeId = :feeId ORDER BY r.createdAt DESC, r.id DESC")
    List<CollectionRound> findByFeeIdOrderByNewest(@Param("feeId") Long feeId);

    Optional<CollectionRound> findFirstByFeeIdOrderByCreatedAtDesc(Long feeId);
}


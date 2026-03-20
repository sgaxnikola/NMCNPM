package vn.bluemoon.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vn.bluemoon.backend.model.Payment;

import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    @Query("SELECT p FROM Payment p LEFT JOIN FETCH p.fee ORDER BY p.paymentDate DESC, p.id DESC")
    List<Payment> findAllWithFee();

    @Query("SELECT p FROM Payment p JOIN FETCH p.fee f WHERE f.id = :feeId ORDER BY p.paymentDate DESC, p.id DESC")
    List<Payment> findByFeeIdWithFee(@Param("feeId") Long feeId);
}


package vn.bluemoon.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "nop_tien")
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idnop_tien")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_khoan_thu")
    @JsonIgnore
    private Fee fee;

    @Column(name = "ma_ho")
    private Long householdId;

    @Column(name = "nguoi_nop", length = 100)
    private String payerName;

    @Column(name = "so_tien")
    private Double amount;

    @Column(name = "ngay_thu")
    private java.time.LocalDate paymentDate;

    @Column(name = "round_id")
    private Long roundId;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Fee getFee() {
        return fee;
    }

    public void setFee(Fee fee) {
        this.fee = fee;
    }

    public Long getHouseholdId() {
        return householdId;
    }

    public void setHouseholdId(Long householdId) {
        this.householdId = householdId;
    }

    public String getPayerName() {
        return payerName;
    }

    public void setPayerName(String payerName) {
        this.payerName = payerName;
    }

    public Double getAmount() {
        return amount;
    }

    public void setAmount(Double amount) {
        this.amount = amount;
    }

    public java.time.LocalDate getPaymentDate() {
        return paymentDate;
    }

    public void setPaymentDate(java.time.LocalDate paymentDate) {
        this.paymentDate = paymentDate;
    }

    public Long getRoundId() {
        return roundId;
    }

    public void setRoundId(Long roundId) {
        this.roundId = roundId;
    }

    public Long getFeeId() {
        return fee != null ? fee.getId() : null;
    }

    public String getFeeName() {
        return fee != null ? fee.getName() : null;
    }
}


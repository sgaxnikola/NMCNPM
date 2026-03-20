package vn.bluemoon.backend.model;

import jakarta.persistence.*;

@Entity
@Table(
        name = "fee_obligation",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_fee_obligation_fee_household", columnNames = {"ma_khoan_thu", "ma_ho"})
        }
)
public class FeeObligation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ma_khoan_thu", nullable = false)
    private Long feeId;

    @Column(name = "ma_ho", nullable = false)
    private Long householdId;

    @Column(name = "so_tien_phai_nop", nullable = false)
    private Double expectedAmount;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getFeeId() {
        return feeId;
    }

    public void setFeeId(Long feeId) {
        this.feeId = feeId;
    }

    public Long getHouseholdId() {
        return householdId;
    }

    public void setHouseholdId(Long householdId) {
        this.householdId = householdId;
    }

    public Double getExpectedAmount() {
        return expectedAmount;
    }

    public void setExpectedAmount(Double expectedAmount) {
        this.expectedAmount = expectedAmount;
    }
}


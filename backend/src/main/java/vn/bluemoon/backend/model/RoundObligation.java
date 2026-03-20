package vn.bluemoon.backend.model;

import jakarta.persistence.*;

@Entity
@Table(
        name = "round_obligation",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_round_obligation_round_household", columnNames = {"round_id", "ma_ho"})
        }
)
public class RoundObligation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "round_id", nullable = false)
    private Long roundId;

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

    public Long getRoundId() {
        return roundId;
    }

    public void setRoundId(Long roundId) {
        this.roundId = roundId;
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


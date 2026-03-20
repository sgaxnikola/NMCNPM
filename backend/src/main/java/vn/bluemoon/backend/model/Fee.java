package vn.bluemoon.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "khoan_thu")
public class Fee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ma_khoan_thu")
    private Long id;

    @Column(name = "ten_khoan_thu", length = 100, nullable = false)
    private String name;

    @Column(name = "so_tien")
    private Double amount;

    @Column(name = "loai_khoan_thu")
    private Integer type; // 0: bắt buộc, 1: tự nguyện

    /** Cách tính: per_apartment (theo căn), per_resident (theo nhân khẩu - nhân với số người trong căn) */
    @Column(name = "charge_type", length = 20)
    private String chargeType;

    @Column(name = "han_nop", length = 20)
    private String deadline;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Double getAmount() {
        return amount;
    }

    public void setAmount(Double amount) {
        this.amount = amount;
    }

    public Integer getType() {
        return type;
    }

    public void setType(Integer type) {
        this.type = type;
    }

    public String getChargeType() {
        return chargeType;
    }

    public void setChargeType(String chargeType) {
        this.chargeType = chargeType;
    }

    public String getDeadline() {
        return deadline;
    }

    public void setDeadline(String deadline) {
        this.deadline = deadline;
    }
}


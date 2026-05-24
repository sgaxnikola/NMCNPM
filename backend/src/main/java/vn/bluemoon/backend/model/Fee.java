package vn.bluemoon.backend.model;

import jakarta.persistence.*;

import java.time.LocalDate;

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

    /** Cách tính: per_apartment, per_resident, per_vehicle (theo từng xe — dùng mức theo loại) */
    @Column(name = "charge_type", length = 20)
    private String chargeType;

    /** Mức thu / 1 xe máy (khi charge_type = per_vehicle) */
    @Column(name = "vehicle_rate_motorcycle")
    private Double vehicleRateMotorcycle;

    @Column(name = "vehicle_rate_car")
    private Double vehicleRateCar;

    @Column(name = "vehicle_rate_bicycle")
    private Double vehicleRateBicycle;

    @Column(name = "han_nop", length = 20)
    private String deadline;

    /** Tần suất: monthly, quarterly, yearly, one_time */
    @Column(name = "frequency", length = 20)
    private String frequency;

    /** Ngày bắt đầu đợt thu đầu tiên */
    @Column(name = "start_date")
    private LocalDate startDate;

    /** Ngày kết thúc đợt thu đầu tiên (= ngày bắt đầu đợt 2) */
    @Column(name = "end_date")
    private LocalDate endDate;

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

    public String getFrequency() {
        return frequency;
    }

    public void setFrequency(String frequency) {
        this.frequency = frequency;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public Double getVehicleRateMotorcycle() {
        return vehicleRateMotorcycle;
    }

    public void setVehicleRateMotorcycle(Double vehicleRateMotorcycle) {
        this.vehicleRateMotorcycle = vehicleRateMotorcycle;
    }

    public Double getVehicleRateCar() {
        return vehicleRateCar;
    }

    public void setVehicleRateCar(Double vehicleRateCar) {
        this.vehicleRateCar = vehicleRateCar;
    }

    public Double getVehicleRateBicycle() {
        return vehicleRateBicycle;
    }

    public void setVehicleRateBicycle(Double vehicleRateBicycle) {
        this.vehicleRateBicycle = vehicleRateBicycle;
    }
}


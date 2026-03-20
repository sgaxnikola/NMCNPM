package vn.bluemoon.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

import java.time.LocalDate;

@Entity
@Table(name = "nhan_khau")
public class Resident {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_ho")
    @JsonIgnore
    private Household household;

    @Column(name = "ho_ten", length = 100, nullable = false)
    private String fullName;

    @Column(name = "ngay_sinh")
    private LocalDate dob;

    @Column(name = "gioi_tinh", length = 10)
    private String gender;

    @Column(name = "cccd", length = 20)
    private String cccd;

    @Column(name = "quan_he_voi_chu_ho", length = 30)
    private String relationToHead;

    @Column(name = "so_dien_thoai", length = 20)
    private String phone;

    @Column(name = "email", length = 100)
    private String email;

    @Column(name = "phuong_tien_bien_so", length = 255)
    private String vehicleInfo;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Household getHousehold() {
        return household;
    }

    public void setHousehold(Household household) {
        this.household = household;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public LocalDate getDob() {
        return dob;
    }

    public void setDob(LocalDate dob) {
        this.dob = dob;
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public String getCccd() {
        return cccd;
    }

    public void setCccd(String cccd) {
        this.cccd = cccd;
    }

    public String getRelationToHead() {
        return relationToHead;
    }

    public void setRelationToHead(String relationToHead) {
        this.relationToHead = relationToHead;
    }

    public String getPhone() {
      return phone;
    }

    public void setPhone(String phone) {
      this.phone = phone;
    }

    public String getEmail() {
      return email;
    }

    public void setEmail(String email) {
      this.email = email;
    }

    public String getVehicleInfo() {
      return vehicleInfo;
    }

    public void setVehicleInfo(String vehicleInfo) {
      this.vehicleInfo = vehicleInfo;
    }

    public Long getHouseholdId() {
        return household != null ? household.getId() : null;
    }
}


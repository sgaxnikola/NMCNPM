package vn.bluemoon.backend.model;

import jakarta.persistence.*;
import jakarta.persistence.Transient;

@Entity
@Table(name = "ho_khau")
public class Household {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ma_ho")
    private Long id;

    @Column(name = "so_thanh_vien")
    private Integer members;

    @Column(name = "dia_chi", length = 200)
    private String address;

    @Transient
    private String headName;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Integer getMembers() {
        return members;
    }

    public void setMembers(Integer members) {
        this.members = members;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getHeadName() {
      return headName;
    }

    public void setHeadName(String headName) {
      this.headName = headName;
    }
}


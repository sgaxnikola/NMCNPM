package vn.bluemoon.backend.model;

import jakarta.persistence.*;

import java.time.LocalDate;

@Entity
@Table(name = "tam_tru_tam_vang")
public class TempResidence {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_ho")
    private Household household;

    @Column(name = "loai", length = 20, nullable = false)
    private String type; // temporary_in / temporary_out

    @Column(name = "ho_ten", length = 100)
    private String name;

    @Column(name = "tu_ngay", nullable = false)
    private LocalDate fromDate;

    @Column(name = "den_ngay")
    private LocalDate toDate;

    @Column(name = "ghi_chu", length = 255)
    private String note;

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

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public LocalDate getFromDate() {
        return fromDate;
    }

    public void setFromDate(LocalDate fromDate) {
        this.fromDate = fromDate;
    }

    public LocalDate getToDate() {
        return toDate;
    }

    public void setToDate(LocalDate toDate) {
        this.toDate = toDate;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }
}


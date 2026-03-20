package vn.bluemoon.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import vn.bluemoon.backend.model.Household;
import vn.bluemoon.backend.model.PopulationEvent;
import vn.bluemoon.backend.model.Resident;
import vn.bluemoon.backend.repository.HouseholdRepository;
import vn.bluemoon.backend.repository.PopulationEventRepository;
import vn.bluemoon.backend.repository.ResidentRepository;
import vn.bluemoon.backend.repository.TempResidenceRepository;
import vn.bluemoon.backend.repository.VehicleRepository;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/households")
@CrossOrigin(origins = "*")
public class HouseholdController {

    private final HouseholdRepository householdRepository;
    private final ResidentRepository residentRepository;
    private final PopulationEventRepository populationEventRepository;
    private final TempResidenceRepository tempResidenceRepository;
    private final VehicleRepository vehicleRepository;

    public HouseholdController(HouseholdRepository householdRepository,
                               ResidentRepository residentRepository,
                               PopulationEventRepository populationEventRepository,
                               TempResidenceRepository tempResidenceRepository,
                               VehicleRepository vehicleRepository) {
        this.householdRepository = householdRepository;
        this.residentRepository = residentRepository;
        this.populationEventRepository = populationEventRepository;
        this.tempResidenceRepository = tempResidenceRepository;
        this.vehicleRepository = vehicleRepository;
    }

    @GetMapping
    public List<Household> getAll() {
        List<Household> list = householdRepository.findAll();
        for (Household h : list) {
            Resident head = residentRepository.findFirstByHousehold_IdAndRelationToHeadIgnoreCase(h.getId(), "Chủ hộ");
            if (head != null) {
                h.setHeadName(head.getFullName());
            }
        }
        return list;
    }

    @PostMapping
    public ResponseEntity<Household> create(@RequestBody Household household) {
        if (household.getAddress() != null && !household.getAddress().isBlank()) {
            if (householdRepository.existsByAddressIgnoreCase(household.getAddress().trim())) {
                throw new IllegalArgumentException("Căn hộ này đã có hộ khẩu/chủ hộ, không thể tạo thêm");
            }
        }
        Household saved = householdRepository.save(household);

        PopulationEvent ev = new PopulationEvent();
        ev.setHousehold(saved);
        ev.setType("in");
        ev.setName(null);
        ev.setApartment(saved.getAddress());
        ev.setDate(LocalDateTime.now());
        ev.setReason("Thêm hộ khẩu");
        populationEventRepository.save(ev);

        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Household> update(@PathVariable Long id, @RequestBody Household body) {
        Household existing = householdRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Household not found"));
        existing.setAddress(body.getAddress());
        existing.setMembers(body.getMembers());
        Household saved = householdRepository.save(existing);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        Household hh = householdRepository.findById(id)
                .orElse(null);
        // Xóa bản ghi tạm trú/tạm vắng và biến động gắn với hộ
        tempResidenceRepository.deleteByHousehold_Id(id);
        populationEventRepository.deleteByHousehold_Id(id);
        // Xóa phương tiện thuộc hộ
        vehicleRepository.deleteByHousehold_Id(id);
        // Xóa toàn bộ nhân khẩu thuộc hộ trước để tránh lỗi ràng buộc khóa ngoại
        residentRepository.deleteByHousehold_Id(id);
        householdRepository.deleteById(id);

        if (hh != null) {
            PopulationEvent ev = new PopulationEvent();
            ev.setHousehold(hh);
            ev.setType("out");
            ev.setName(hh.getHeadName());
            ev.setApartment(hh.getAddress());
            ev.setDate(LocalDateTime.now());
            ev.setReason("Xóa hộ khẩu");
            populationEventRepository.save(ev);
        }
        return ResponseEntity.noContent().build();
    }
}


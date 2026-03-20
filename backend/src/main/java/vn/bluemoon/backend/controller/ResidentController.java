package vn.bluemoon.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.bluemoon.backend.model.Household;
import vn.bluemoon.backend.model.PopulationEvent;
import vn.bluemoon.backend.model.Resident;
import vn.bluemoon.backend.repository.HouseholdRepository;
import vn.bluemoon.backend.repository.PopulationEventRepository;
import vn.bluemoon.backend.repository.ResidentRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/residents")
@CrossOrigin(origins = "*")
public class ResidentController {

    private final ResidentRepository residentRepository;
    private final HouseholdRepository householdRepository;
    private final PopulationEventRepository populationEventRepository;

    public ResidentController(ResidentRepository residentRepository,
                              HouseholdRepository householdRepository,
                              PopulationEventRepository populationEventRepository) {
        this.residentRepository = residentRepository;
        this.householdRepository = householdRepository;
        this.populationEventRepository = populationEventRepository;
    }

    @GetMapping
    public List<Resident> getAll(@RequestParam(name = "householdId", required = false) Long householdId) {
        if (householdId != null) {
            return residentRepository.findByHousehold_Id(householdId);
        }
        return residentRepository.findAll();
    }

    public record ResidentRequest(
            Long householdId,
            String fullName,
            String dob,
            String gender,
            String cccd,
            String relationToHead,
            String phone,
            String email,
            String vehicleInfo
    ) {}

    @PostMapping
    public ResponseEntity<Resident> create(@RequestBody ResidentRequest request) {
        Resident resident = new Resident();
        Household hh = null;
        if (request.householdId() != null) {
            hh = householdRepository.findById(request.householdId())
                    .orElseThrow(() -> new IllegalArgumentException("Household not found"));
            resident.setHousehold(hh);
        }
        resident.setFullName(request.fullName());
        resident.setGender(request.gender());
        resident.setCccd(request.cccd());
        resident.setRelationToHead(request.relationToHead());
        resident.setPhone(request.phone());
        resident.setEmail(request.email());
        resident.setVehicleInfo(request.vehicleInfo());
        if (request.dob() != null && !request.dob().isBlank()) {
            resident.setDob(LocalDate.parse(request.dob()));
        }
        Resident saved = residentRepository.save(resident);
        if (hh != null) {
            long count = residentRepository.countByHousehold_Id(hh.getId());
            hh.setMembers((int) count);
            householdRepository.save(hh);

            PopulationEvent ev = new PopulationEvent();
            ev.setHousehold(hh);
            ev.setType("in");
            ev.setName(saved.getFullName());
            ev.setApartment(hh.getAddress());
            ev.setDate(LocalDateTime.now());
            ev.setReason("Thêm nhân khẩu");
            populationEventRepository.save(ev);
        }
        return ResponseEntity.ok(saved);
    }

    public record ResidentUpdateRequest(
            String fullName,
            String cccd,
            String phone,
            String email,
            String vehicleInfo
    ) {}

    @PutMapping("/{id}")
    public ResponseEntity<Resident> update(@PathVariable Long id, @RequestBody ResidentUpdateRequest request) {
        Resident existing = residentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Resident not found"));

        if (request.fullName() != null) {
            String name = request.fullName().trim();
            if (name.isBlank()) {
                throw new IllegalArgumentException("Họ tên không được để trống");
            }
            existing.setFullName(name);
        }
        if (request.cccd() != null) existing.setCccd(request.cccd().trim());
        if (request.phone() != null) existing.setPhone(request.phone().trim());
        if (request.email() != null) existing.setEmail(request.email().trim());
        if (request.vehicleInfo() != null) existing.setVehicleInfo(request.vehicleInfo().trim());

        Resident saved = residentRepository.save(existing);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        Resident existing = residentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Resident not found"));
        Household hh = existing.getHousehold();
        residentRepository.deleteById(id);
        if (hh != null && hh.getId() != null) {
            long count = residentRepository.countByHousehold_Id(hh.getId());
            hh.setMembers((int) count);
            householdRepository.save(hh);

            PopulationEvent ev = new PopulationEvent();
            ev.setHousehold(hh);
            ev.setType("out");
            ev.setName(existing.getFullName());
            ev.setApartment(hh.getAddress());
            ev.setDate(LocalDateTime.now());
            ev.setReason("Xóa nhân khẩu");
            populationEventRepository.save(ev);
        }
        return ResponseEntity.noContent().build();
    }
}


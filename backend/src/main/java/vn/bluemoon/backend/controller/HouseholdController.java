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
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/households")
public class HouseholdController {

    private final HouseholdRepository householdRepository;
    private final ResidentRepository residentRepository;
    private final PopulationEventRepository populationEventRepository;
    private final TempResidenceRepository tempResidenceRepository;
    private final VehicleRepository vehicleRepository;
    private static final Pattern ADDRESS_FLOOR_PATTERN = Pattern.compile("^[A-Za-z]\\s*-?\\s*(\\d{2})\\d{2}\\s*$");

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
        // Prevent creating household for commercial floors (shophouse / tầng đế)
        if (household.getAddress() != null && !household.getAddress().isBlank()) {
            String addr = household.getAddress().trim();
            Integer floor = parseFloor(addr);
            if (floor != null && floor >= 1 && floor <= 4) {
                throw new IllegalArgumentException("Căn shophouse/tầng đế không tạo hộ khẩu/nhân khẩu");
            }
        }
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
                .orElseThrow(() -> new IllegalArgumentException("Household not found"));

        // Ghi biến động TRƯỚC khi xóa, để tránh lỗi FK constraint
        PopulationEvent ev = new PopulationEvent();
        ev.setType("out");
        ev.setName(hh.getHeadName());
        ev.setApartment(hh.getAddress());
        ev.setDate(LocalDateTime.now());
        ev.setReason("Xóa hộ khẩu");
        // Không set household FK vì sắp xóa
        populationEventRepository.save(ev);

        // Xóa bản ghi tạm trú/tạm vắng và biến động cũ gắn với hộ
        tempResidenceRepository.deleteByHousehold_Id(id);
        populationEventRepository.deleteByHousehold_Id(id);
        // Xóa phương tiện thuộc hộ
        vehicleRepository.deleteByHousehold_Id(id);
        // Xóa toàn bộ nhân khẩu thuộc hộ trước để tránh lỗi ràng buộc khóa ngoại
        residentRepository.deleteByHousehold_Id(id);
        householdRepository.deleteById(id);

        return ResponseEntity.noContent().build();
    }

    private Integer parseFloor(String address) {
        if (address == null) return null;
        Matcher m = ADDRESS_FLOOR_PATTERN.matcher(address.trim());
        if (!m.matches()) return null;
        try {
            return Integer.parseInt(m.group(1));
        } catch (Exception ignored) {
            return null;
        }
    }
}


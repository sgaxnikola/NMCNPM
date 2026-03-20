package vn.bluemoon.backend.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.bluemoon.backend.model.Household;
import vn.bluemoon.backend.model.Vehicle;
import vn.bluemoon.backend.repository.HouseholdRepository;
import vn.bluemoon.backend.repository.VehicleRepository;

import java.util.List;

@RestController
@RequestMapping("/api/vehicles")
@CrossOrigin(origins = "*")
public class VehicleController {

    private final VehicleRepository vehicleRepository;
    private final HouseholdRepository householdRepository;

    public VehicleController(VehicleRepository vehicleRepository, HouseholdRepository householdRepository) {
        this.vehicleRepository = vehicleRepository;
        this.householdRepository = householdRepository;
    }

    public record VehicleResponse(
            Long id,
            Long householdId,
            String type,
            String plate,
            String note
    ) {}

    public record VehicleRequest(
            Long householdId,
            String type,
            String plate,
            String note
    ) {}

    @GetMapping
    public List<VehicleResponse> getAll(@RequestParam(name = "householdId", required = false) Long householdId) {
        List<Vehicle> list = (householdId != null)
                ? vehicleRepository.findByHousehold_Id(householdId)
                : vehicleRepository.findAll();
        return list.stream()
                .map(v -> new VehicleResponse(
                        v.getId(),
                        v.getHousehold() != null ? v.getHousehold().getId() : null,
                        v.getType(),
                        v.getPlate(),
                        v.getNote()
                ))
                .toList();
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody VehicleRequest request) {
        if (request.householdId() == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("householdId là bắt buộc");
        }
        if (request.type() == null || request.type().isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Loại phương tiện là bắt buộc");
        }
        String type = request.type().trim().toLowerCase();
        if (!type.equals("motorcycle") && !type.equals("car") && !type.equals("bicycle")) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Loại phương tiện không hợp lệ");
        }

        String plate = request.plate() == null ? null : request.plate().trim();
        if ((type.equals("motorcycle") || type.equals("car")) && (plate == null || plate.isBlank())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Xe máy/ô tô bắt buộc phải có biển số");
        }
        if (type.equals("bicycle")) {
            plate = null;
        }

        Household hh = householdRepository.findById(request.householdId())
                .orElseThrow(() -> new IllegalArgumentException("Household not found"));

        Vehicle v = new Vehicle();
        v.setHousehold(hh);
        v.setType(type);
        v.setPlate(plate);
        v.setNote(request.note());

        Vehicle saved = vehicleRepository.save(v);
        return ResponseEntity.status(HttpStatus.CREATED).body(new VehicleResponse(
                saved.getId(),
                hh.getId(),
                saved.getType(),
                saved.getPlate(),
                saved.getNote()
        ));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!vehicleRepository.existsById(id)) {
            throw new IllegalArgumentException("Vehicle not found");
        }
        vehicleRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}


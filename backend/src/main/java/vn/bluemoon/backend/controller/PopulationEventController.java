package vn.bluemoon.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.bluemoon.backend.model.Household;
import vn.bluemoon.backend.model.PopulationEvent;
import vn.bluemoon.backend.repository.HouseholdRepository;
import vn.bluemoon.backend.repository.PopulationEventRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/population-events")
@CrossOrigin(origins = "*")
public class PopulationEventController {

    private final PopulationEventRepository repository;
    private final HouseholdRepository householdRepository;

    public PopulationEventController(PopulationEventRepository repository, HouseholdRepository householdRepository) {
        this.repository = repository;
        this.householdRepository = householdRepository;
    }

    public record PopulationEventRequest(
            Long householdId,
            String type,
            String name,
            String apartment,
            String date,
            String reason
    ) {}

    @GetMapping
    public List<PopulationEvent> getAll(@RequestParam(name = "householdId", required = false) Long householdId) {
        if (householdId != null) {
            return repository.findByHousehold_IdOrderByDateDesc(householdId);
        }
        return repository.findAll();
    }

    @PostMapping
    public ResponseEntity<PopulationEvent> create(@RequestBody PopulationEventRequest request) {
        PopulationEvent ev = new PopulationEvent();
        if (request.householdId() != null) {
            Household hh = householdRepository.findById(request.householdId())
                    .orElseThrow(() -> new IllegalArgumentException("Household not found"));
            ev.setHousehold(hh);
        }
        ev.setType(request.type());
        ev.setName(request.name());
        ev.setApartment(request.apartment());
        if (request.date() != null && !request.date().isBlank()) {
            // hỗ trợ cả yyyy-MM-dd và yyyy-MM-ddTHH:mm
            if (request.date().length() <= 10) {
                ev.setDate(LocalDate.parse(request.date()).atStartOfDay());
            } else {
                ev.setDate(LocalDateTime.parse(request.date()));
            }
        } else {
            ev.setDate(LocalDateTime.now());
        }
        ev.setReason(request.reason());
        PopulationEvent saved = repository.save(ev);
        return ResponseEntity.ok(saved);
    }
}


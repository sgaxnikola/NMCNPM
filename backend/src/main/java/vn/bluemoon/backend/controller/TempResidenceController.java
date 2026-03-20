package vn.bluemoon.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.bluemoon.backend.model.Household;
import vn.bluemoon.backend.model.TempResidence;
import vn.bluemoon.backend.repository.HouseholdRepository;
import vn.bluemoon.backend.repository.TempResidenceRepository;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/temp-residence")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
public class TempResidenceController {

    private final TempResidenceRepository repository;
    private final HouseholdRepository householdRepository;

    public TempResidenceController(TempResidenceRepository repository, HouseholdRepository householdRepository) {
        this.repository = repository;
        this.householdRepository = householdRepository;
    }

    public record TempResidenceRequest(
            Long householdId,
            String type,
            String name,
            String fromDate,
            String toDate,
            String note
    ) {}

    @GetMapping
    public List<TempResidence> getAll(@RequestParam(name = "householdId", required = false) Long householdId) {
        if (householdId != null) {
            return repository.findByHousehold_IdOrderByFromDateDesc(householdId);
        }
        return repository.findAll();
    }

    @PostMapping
    public ResponseEntity<TempResidence> create(@RequestBody TempResidenceRequest request) {
        TempResidence rec = new TempResidence();
        if (request.householdId() != null) {
            Household hh = householdRepository.findById(request.householdId())
                    .orElseThrow(() -> new IllegalArgumentException("Household not found"));
            rec.setHousehold(hh);
        }
        rec.setType(request.type());
        rec.setName(request.name());
        if (request.fromDate() != null && !request.fromDate().isBlank()) {
            rec.setFromDate(LocalDate.parse(request.fromDate()));
        } else {
            rec.setFromDate(LocalDate.now());
        }
        if (request.toDate() != null && !request.toDate().isBlank()) {
            rec.setToDate(LocalDate.parse(request.toDate()));
        }
        rec.setNote(request.note());
        TempResidence saved = repository.save(rec);
        return ResponseEntity.ok(saved);
    }
}


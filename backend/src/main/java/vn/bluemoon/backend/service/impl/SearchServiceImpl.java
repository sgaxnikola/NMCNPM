package vn.bluemoon.backend.service.impl;

import org.springframework.stereotype.Service;
import vn.bluemoon.backend.dto.search.SearchResultDto;
import vn.bluemoon.backend.model.Fee;
import vn.bluemoon.backend.model.Household;
import vn.bluemoon.backend.model.Resident;
import vn.bluemoon.backend.model.Vehicle;
import vn.bluemoon.backend.repository.FeeRepository;
import vn.bluemoon.backend.repository.HouseholdRepository;
import vn.bluemoon.backend.repository.ResidentRepository;
import vn.bluemoon.backend.repository.VehicleRepository;
import vn.bluemoon.backend.service.SearchService;

import java.util.ArrayList;
import java.util.List;

@Service
public class SearchServiceImpl implements SearchService {

    private final HouseholdRepository householdRepository;
    private final ResidentRepository residentRepository;
    private final FeeRepository feeRepository;
    private final VehicleRepository vehicleRepository;

    public SearchServiceImpl(
            HouseholdRepository householdRepository,
            ResidentRepository residentRepository,
            FeeRepository feeRepository,
            VehicleRepository vehicleRepository
    ) {
        this.householdRepository = householdRepository;
        this.residentRepository = residentRepository;
        this.feeRepository = feeRepository;
        this.vehicleRepository = vehicleRepository;
    }

    @Override
    public SearchResultDto search(String query) {
        String q = query == null ? "" : query.trim();
        if (q.isEmpty()) {
            return new SearchResultDto("", List.of(), List.of(), List.of(), List.of());
        }

        List<SearchResultDto.HouseholdHit> households = householdRepository
                .findByAddressContainingIgnoreCase(q)
                .stream()
                .map(this::toHouseholdHit)
                .toList();

        List<SearchResultDto.ResidentHit> residents = residentRepository
                .findByFullNameContainingIgnoreCaseOrCccdContainingIgnoreCaseOrPhoneContainingIgnoreCase(q, q, q)
                .stream()
                .map(r -> new SearchResultDto.ResidentHit(
                        r.getId(),
                        r.getHousehold() != null ? r.getHousehold().getId() : null,
                        r.getFullName(),
                        r.getCccd(),
                        r.getPhone()
                ))
                .toList();

        List<SearchResultDto.FeeHit> fees = feeRepository.findByNameContainingIgnoreCase(q).stream()
                .map(this::toFeeHit)
                .toList();

        List<SearchResultDto.VehicleHit> vehicles = new ArrayList<>();
        vehicleRepository.findByPlateContainingIgnoreCase(q).forEach(v -> vehicles.add(toVehicleHit(v)));
        vehicleRepository.findByHousehold_AddressContainingIgnoreCase(q).forEach(v -> {
            if (vehicles.stream().noneMatch(x -> x.id().equals(v.getId()))) {
                vehicles.add(toVehicleHit(v));
            }
        });

        return new SearchResultDto(q, households, residents, fees, vehicles);
    }

    private SearchResultDto.HouseholdHit toHouseholdHit(Household h) {
        Resident head = residentRepository
                .findFirstByHousehold_IdAndRelationToHeadIgnoreCase(h.getId(), "Chủ hộ");
        if (head == null) {
            head = residentRepository.findFirstByHousehold_IdAndRelationToHeadIgnoreCase(h.getId(), "chu ho");
        }
        return new SearchResultDto.HouseholdHit(
                h.getId(),
                h.getAddress(),
                h.getMembers(),
                head != null ? head.getFullName() : null
        );
    }

    private SearchResultDto.FeeHit toFeeHit(Fee f) {
        return new SearchResultDto.FeeHit(
                f.getId(),
                f.getName(),
                f.getAmount(),
                f.getFrequency(),
                f.getChargeType()
        );
    }

    private SearchResultDto.VehicleHit toVehicleHit(Vehicle v) {
        String apt = v.getHousehold() != null ? v.getHousehold().getAddress() : null;
        return new SearchResultDto.VehicleHit(
                v.getId(),
                v.getHousehold() != null ? v.getHousehold().getId() : null,
                apt,
                v.getType(),
                v.getPlate()
        );
    }
}

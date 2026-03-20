package vn.bluemoon.backend.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.bluemoon.backend.model.Household;
import vn.bluemoon.backend.model.PopulationEvent;
import vn.bluemoon.backend.model.Resident;
import vn.bluemoon.backend.model.TempResidence;
import vn.bluemoon.backend.model.Vehicle;
import vn.bluemoon.backend.repository.HouseholdRepository;
import vn.bluemoon.backend.repository.PopulationEventRepository;
import vn.bluemoon.backend.repository.ResidentRepository;
import vn.bluemoon.backend.repository.TempResidenceRepository;
import vn.bluemoon.backend.repository.VehicleRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

@Service
public class ResidentSeedService {

    private final HouseholdRepository householdRepository;
    private final ResidentRepository residentRepository;
    private final VehicleRepository vehicleRepository;
    private final TempResidenceRepository tempResidenceRepository;
    private final PopulationEventRepository populationEventRepository;

    public ResidentSeedService(HouseholdRepository householdRepository,
                              ResidentRepository residentRepository,
                              VehicleRepository vehicleRepository,
                              TempResidenceRepository tempResidenceRepository,
                              PopulationEventRepository populationEventRepository) {
        this.householdRepository = householdRepository;
        this.residentRepository = residentRepository;
        this.vehicleRepository = vehicleRepository;
        this.tempResidenceRepository = tempResidenceRepository;
        this.populationEventRepository = populationEventRepository;
    }

    public record SeedSummary(
            long households,
            long residents,
            long vehicles,
            long tempRecords,
            long events
    ) {}

    @Transactional
    public SeedSummary seedIfEmpty() {
        if (householdRepository.count() > 0 || residentRepository.count() > 0) {
            return new SeedSummary(0, 0, 0, 0, 0);
        }
        return seedAllApartmentsInternal();
    }

    private SeedSummary seedAllApartmentsInternal() {
        String[] lastNames = {"Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Vũ", "Võ", "Đặng", "Bùi", "Đỗ"};
        String[] middleNames = {"Văn", "Thị", "Ngọc", "Hồng", "Quang", "Minh", "Thuỳ", "Gia", "Khánh", "Anh"};
        String[] firstNames = {"Anh", "Bình", "Châu", "Dũng", "Hà", "Hải", "Hằng", "Hiếu", "Huy", "Hương",
                "Khánh", "Lan", "Linh", "Long", "Mai", "Nam", "Nga", "Ngân", "Phong", "Phương", "Quân", "Sơn", "Trang"};
        String[] relations = {"Vợ", "Chồng", "Con", "Ông", "Bà", "Anh", "Chị"};

        Random random = new Random(20260313L);

        long householdCount = 0;
        long residentCount = 0;
        long vehicleCount = 0;
        long tempCount = 0;
        long eventCount = 0;

        // Apartment codes matching FE: block A, floors 1..30, rooms 01..10
        String block = "A";
        for (int floor = 1; floor <= 30; floor++) {
            String floorStr = String.format("%02d", floor);
            for (int room = 1; room <= 10; room++) {
                String roomStr = String.format("%02d", room);
                String code = block + "-" + floorStr + roomStr;

                int memberCount = 2 + random.nextInt(4); // 2..5

                Household household = new Household();
                household.setAddress(code);
                household.setMembers(memberCount);
                household = householdRepository.save(household);
                householdCount++;

                PopulationEvent evHouse = new PopulationEvent();
                evHouse.setHousehold(household);
                evHouse.setType("in");
                evHouse.setName(null);
                evHouse.setApartment(code);
                evHouse.setDate(LocalDateTime.now().minusDays(random.nextInt(365)));
                evHouse.setReason("Seed hộ khẩu");
                populationEventRepository.save(evHouse);
                eventCount++;

                // Head
                Resident head = new Resident();
                head.setHousehold(household);
                head.setFullName(randomName(random, lastNames, middleNames, firstNames));
                head.setRelationToHead("Chủ hộ");
                head.setGender(random.nextBoolean() ? "Nam" : "Nữ");
                head.setDob(LocalDate.of(1970 + random.nextInt(25), 1 + random.nextInt(12), 1 + random.nextInt(28)));
                head.setPhone(randomPhone(random));
                head.setEmail(randomEmail(head.getFullName(), random));
                residentRepository.save(head);
                residentCount++;

                PopulationEvent evHead = new PopulationEvent();
                evHead.setHousehold(household);
                evHead.setType("in");
                evHead.setName(head.getFullName());
                evHead.setApartment(code);
                evHead.setDate(LocalDateTime.now().minusDays(random.nextInt(365)));
                evHead.setReason("Seed nhân khẩu (chủ hộ)");
                populationEventRepository.save(evHead);
                eventCount++;

                for (int i = 1; i < memberCount; i++) {
                    Resident member = new Resident();
                    member.setHousehold(household);
                    member.setFullName(randomName(random, lastNames, middleNames, firstNames));
                    member.setRelationToHead(relations[random.nextInt(relations.length)]);
                    member.setGender(random.nextBoolean() ? "Nam" : "Nữ");
                    member.setDob(LocalDate.of(1975 + random.nextInt(35), 1 + random.nextInt(12), 1 + random.nextInt(28)));
                    member.setPhone(randomPhone(random));
                    member.setEmail(randomEmail(member.getFullName(), random));
                    residentRepository.save(member);
                    residentCount++;

                    PopulationEvent evMem = new PopulationEvent();
                    evMem.setHousehold(household);
                    evMem.setType("in");
                    evMem.setName(member.getFullName());
                    evMem.setApartment(code);
                    evMem.setDate(LocalDateTime.now().minusDays(random.nextInt(365)));
                    evMem.setReason("Seed nhân khẩu");
                    populationEventRepository.save(evMem);
                    eventCount++;
                }

                // Vehicles: ensure at least 1
                int vehiclePerHouse = 1 + random.nextInt(3); // 1..3
                for (int i = 0; i < vehiclePerHouse; i++) {
                    Vehicle v = new Vehicle();
                    v.setHousehold(household);
                    String type = pickVehicleType(random, i);
                    v.setType(type);
                    if (type.equals("bicycle")) {
                        v.setPlate(null);
                    } else {
                        v.setPlate(randomPlate(random, type.equals("car")));
                    }
                    v.setNote(type.equals("bicycle") ? "Xe đạp" : (type.equals("car") ? "Ô tô" : "Xe máy"));
                    vehicleRepository.save(v);
                    vehicleCount++;
                }

                // Temp residence: ~20% households have a record
                if (random.nextInt(10) < 2) {
                    TempResidence tr = new TempResidence();
                    tr.setHousehold(household);
                    tr.setType(random.nextBoolean() ? "temporary_in" : "temporary_out");
                    tr.setName(head.getFullName());
                    LocalDate from = LocalDate.now().minusDays(5 + random.nextInt(120));
                    tr.setFromDate(from);
                    if (random.nextBoolean()) {
                        tr.setToDate(from.plusDays(3 + random.nextInt(60)));
                    }
                    tr.setNote("Seed tạm trú/tạm vắng");
                    tempResidenceRepository.save(tr);
                    tempCount++;
                }
            }
        }

        return new SeedSummary(householdCount, residentCount, vehicleCount, tempCount, eventCount);
    }

    private String randomName(Random random, String[] lastNames, String[] middleNames, String[] firstNames) {
        return lastNames[random.nextInt(lastNames.length)] + " " +
                middleNames[random.nextInt(middleNames.length)] + " " +
                firstNames[random.nextInt(firstNames.length)];
    }

    private String randomPhone(Random random) {
        StringBuilder sb = new StringBuilder("09");
        for (int i = 0; i < 8; i++) {
            sb.append(random.nextInt(10));
        }
        return sb.toString();
    }

    private String randomEmail(String fullName, Random random) {
        String base = fullName.toLowerCase()
                .replace("đ", "d")
                .replaceAll("[^a-z\\s]", "")
                .trim()
                .replaceAll("\\s+", ".");
        return base + "." + (100 + random.nextInt(900)) + "@bluemoon.vn";
    }

    private String pickVehicleType(Random random, int index) {
        if (index == 0) return random.nextInt(10) < 2 ? "car" : "motorcycle";
        int r = random.nextInt(10);
        if (r < 6) return "motorcycle";
        if (r < 8) return "bicycle";
        return "car";
    }

    private String randomPlate(Random random, boolean car) {
        // Simple deterministic VN-like plate format examples:
        // motorcycle: 29A-123.45
        // car: 30H-678.90
        int province = 20 + random.nextInt(20); // 20..39
        char series = (char) ('A' + random.nextInt(10));
        if (car) {
            series = (char) ('H' + random.nextInt(6)); // H..M
        }
        int part1 = 100 + random.nextInt(900);
        int part2 = 10 + random.nextInt(90);
        return province + "" + series + "-" + part1 + "." + part2;
    }
}


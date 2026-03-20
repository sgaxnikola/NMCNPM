# Cấu trúc code BlueMoon

Tài liệu tổng quan cấu trúc dự án quản lý thu phí chung cư BlueMoon (React + Vite frontend, Spring Boot backend, MySQL).

---

## 1. Cây thư mục chính

```
Bluemoon/
├── src/                    # Frontend (React + Vite)
│   ├── app/
│   │   ├── App.tsx         # Entry, routing, state fees/payments, dialog toggles
│   │   ├── types.ts       # FeeItem, Payment, Household, Resident, UserRole...
│   │   ├── api.ts         # Gọi REST API: fees, households, residents, payments
│   │   └── components/
│   │       ├── LoginScreen.tsx
│   │       ├── Sidebar.tsx
│   │       ├── DashboardScreen.tsx
│   │       ├── FeeScreen.tsx
│   │       ├── CreateFeeDialog.tsx
│   │       ├── CollectPaymentDialog.tsx
│   │       ├── ResidentScreen.tsx   # Hộ khẩu + nhân khẩu (chủ hộ, SĐT, email, xe)
│   │       ├── ApartmentScreen.tsx  # Sơ đồ căn hộ (mock)
│   │       ├── StatisticsScreen.tsx # Thống kê (một phần mock)
│   │       ├── SettingsScreen.tsx
│   │       └── ui/                 # shadcn/ui components
│   └── ...
├── backend/                # Spring Boot
│   └── src/main/
│       ├── java/vn/bluemoon/backend/
│       │   ├── BluemoonBackendApplication.java
│       │   ├── model/      # Household, Resident, Fee, Payment
│       │   ├── repository/ # JPA repositories
│       │   ├── controller/ # REST: /api/households, /api/residents, /api/fees, /api/payments
│       │   └── exception/  # GlobalExceptionHandler (400 + message)
│       └── resources/
│           ├── application.properties  # DB URL, user/pass
│           └── ...
├── docs/
│   ├── CodeStructure.md    # File này
│   └── BlueMoon-Report.md
└── ...
```

---

## 2. Frontend

- **App.tsx**: Đăng nhập, chọn trang (dashboard, fees, residents, apartment, statistics, settings), state `fees`/`payments`, mở/đóng dialog tạo khoản thu và thu tiền. Tải `fees` từ API khi mount; thêm khoản thu / thu tiền vừa cập nhật state vừa gọi API.
- **types.ts**: Định nghĩa `FeeItem`, `Payment`, `Household` (headName, members, address), `Resident` (phone, email, vehicleInfo), `UserRole`.
- **api.ts**: Base URL `http://localhost:8080/api`. Các hàm: `fetchFees`, `fetchHouseholds`, `createHousehold`, `updateHousehold`, `deleteHousehold`, `fetchResidents`, `createResident`, `createFee`, `createPayment`, v.v. Khi lỗi (vd. 400 trùng căn), đọc body `message` và throw `Error(message)` để toast hiển thị.
- **Màn hình chính**:
  - **ResidentScreen**: Danh sách hộ, thêm/sửa/xóa hộ; thêm hộ kèm chủ hộ (họ tên, ngày sinh, giới tính, CCCD, SĐT, email, phương tiện). Danh sách nhân khẩu theo hộ, thêm nhân khẩu (có SĐT, email, phương tiện). Dữ liệu từ API (households, residents).
  - **FeeScreen / CreateFeeDialog / CollectPaymentDialog**: Khoản thu và thu tiền; dữ liệu kết nối API (fees, payments) và state trong App.
  - **ApartmentScreen**: Sơ đồ tầng/căn (mock `generateFloorApartments`), chưa lưu DB.
  - **StatisticsScreen**: Thống kê; một phần dùng dữ liệu thật, một phần mock.
  - **DashboardScreen, LoginScreen, SettingsScreen**: UI và logic tương ứng.

---

## 3. Backend

- **Model**: `Household` (id, address, members, transient headName), `Resident` (id, fullName, dob, gender, idCard, relationToHead, household_id, phone, email, vehicleInfo), `Fee`, `Payment`. `Resident` có `@JsonIgnore` trên `household` để tránh serialize vòng khi GET residents.
- **Repository**: `HouseholdRepository` (existsByAddressIgnoreCase), `ResidentRepository` (findFirstByHousehold_IdAndRelationToHeadIgnoreCase, countByHousehold_Id, deleteByHousehold_Id), `FeeRepository`, `PaymentRepository`.
- **Controller**:
  - **HouseholdController**: GET all (gán headName từ resident “Chủ hộ”), POST (kiểm tra trùng address → throw IllegalArgumentException), PUT, DELETE (xoá hết resident theo household rồi mới xoá household).
  - **ResidentController**: GET (theo householdId hoặc tất cả), POST (body có phone, email, vehicleInfo; sau khi tạo resident thì cập nhật Household.members).
  - **FeeController**, **PaymentController**: CRUD fees và payments.
- **Exception**: `GlobalExceptionHandler` bắt `IllegalArgumentException` → trả HTTP 400 và body `{ "message": "..." }` (vd. "Căn hộ này đã có hộ khẩu/chủ hộ...").

---

## 4. Dữ liệu: DB thật vs Mock

| Nguồn | Nội dung |
|-------|----------|
| **MySQL (DB thật)** | Bảng `household`, `resident`, `fee`, `payment`. Cấu hình trong `application.properties` (user `bluemoon_app`, pass trong file). |
| **Mock / State FE** | `initialFees` trong App.tsx (dùng khi backend không trả dữ liệu). ApartmentScreen: sơ đồ căn hộ sinh từ `generateFloorApartments`, chưa có bảng apartment. Một phần StatisticsScreen có thể dùng số liệu mẫu. |

---

## 5. Luồng chính

- **Đăng nhập** → chọn role → vào Dashboard.
- **Cư dân**: Xem hộ/nhân khẩu từ API → Thêm hộ (địa chỉ + chủ hộ) → Backend kiểm tra trùng địa chỉ → 400 + message → Toast hiển thị. Thêm nhân khẩu → Backend tăng `Household.members`. Xóa hộ → Backend xóa residents rồi xóa household.
- **Khoản thu / Thu tiền**: Tạo khoản thu hoặc ghi thu tiền → Cập nhật state trong App và gọi API → Dữ liệu lưu DB (fees, payments).

---

Khi cần “nhìn lại tổng quát” hoặc onboard người mới, có thể dùng file này kết hợp với `BlueMoon-Report.md` và workflow (nếu có) trong repo.

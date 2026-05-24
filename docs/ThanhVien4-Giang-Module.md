# Thành viên 4 — Bạn Giang: Khoản phí + Phương tiện + Tìm kiếm + Thống kê

Tài liệu bàn giao module theo đặc tả **IT3180 — Nhóm 4** ([README nhóm](https://github.com/khanh201104/Bai_tap_lon_IT3180_nhom_4)).

> **Lưu ý kiến trúc:** Đặc tả nhóm mô tả Spring MVC + Thymeleaf (`templates/fee/`, `FeeTypeController`, …).  
> Bản triển khai trong repo này dùng **Spring Boot REST API** (`backend/`) + **React SPA** (`src/app/`).  
> Chức năng nghiệp vụ **tương đương**; bảng ánh xạ file ở cuối tài liệu.

---

## 1. Mô tả nghiệp vụ

### 1.1 Quản lý khoản phí

- **Loại phí / khoản thu** (`khoan_thu`): thêm, xem, sửa, xóa qua màn **Khoản thu** (`FeeScreen`, `CreateFeeWizardDialog`).
- **Phí chung cư / dịch vụ / gửi xe:** phân biệt bằng `charge_type`:
  - `per_apartment` — phí chung cư theo căn hộ
  - `per_resident` — phí dịch vụ theo nhân khẩu
  - `per_vehicle` — phí gửi xe (mức theo xe máy / ô tô / xe đạp)
- **Nghĩa vụ thu** (`fee_obligation`, `round_obligation`): tự sinh khi tạo khoản thu / đợt thu.

### 1.2 Quản lý đóng phí

- Xem nghĩa vụ theo hộ / đợt thu (`GET /api/fees/{id}/obligations`, `GET /api/rounds/{id}/obligations`).
- Ghi nhận thanh toán (`POST /api/payments`) — cập nhật số tiền, ngày thu, trạng thái đã nộp.
- Tổng tiền đã thu / chưa thu: `GET /api/reports/summary`.

### 1.3 Phí sinh hoạt hàng tháng

- API riêng: `GET/POST/PUT/DELETE /api/living-fees` (ánh xạ `LivingFee` → bản ghi `khoan_thu` với `frequency = monthly`).
- Hỗ trợ nhãn **điện / nước / sinh hoạt** qua trường `category` khi tạo.

### 1.4 Quản lý phương tiện

- CRUD qua `VehicleController` + tab **Phương tiện** trong **Cư dân** (`ResidentScreen`).
- Tìm theo biển số / căn hộ: `GET /api/vehicles?plate=…` hoặc `?apartment=…`.
- Tính phí gửi xe: khoản thu `charge_type = per_vehicle` + `FeeExpectedAmounts` (backend).

### 1.5 Tìm kiếm & thống kê

- **Tìm kiếm:** màn **Tìm kiếm** (`SearchScreen`) + `GET /api/search?q=…`.
- **Thống kê:** màn **Thống kê** (`StatisticsScreen`) + `GET /api/reports/summary` (tổng hộ, nhân khẩu, tiền thu/chưa thu, hộ chưa đóng).

---

## 2. Mô tả database (ánh xạ đặc tả → BlueMoon)

| Đặc tả (README nhóm) | Bảng / entity thực tế |
|---------------------|------------------------|
| `FeeType` | `khoan_thu` → `Fee` |
| `FeePayment` | `nop_tien` → `Payment` + `fee_obligation` / `round_obligation` |
| `LivingFee` | `khoan_thu` (`frequency = monthly`) — API `/api/living-fees` |
| `Vehicle` | `phuong_tien` → `Vehicle` |

Chi tiết schema: `backend/sql/schema.sql`.

---

## 3. Hướng dẫn sử dụng (giao diện)

| Chức năng | Menu | Vai trò |
|-----------|------|---------|
| Khoản thu / đóng phí | **Khoản thu** | Kế toán |
| Phương tiện | **Cư dân** → tab Phương tiện | Kế toán, Tổ trưởng/phó |
| Tìm kiếm | **Tìm kiếm** | Kế toán |
| Thống kê | **Thống kê** | Kế toán, Tổ trưởng/phó |
| Cổng cư dân (thanh toán online) | **Cổng cư dân** | Cư dân |

**Chạy hệ thống:** xem `README.md` (Docker hoặc `npm run dev` + `mvn spring-boot:run`).

---

## 4. Ánh xạ file đặc tả ↔ triển khai

| Đặc tả README nhóm | Triển khai BlueMoon |
|--------------------|---------------------|
| `FeeTypeController` | `FeeController` — `/api/fees` |
| `FeePaymentController` | `PaymentController` — `/api/payments` |
| `LivingFeeController` | `LivingFeeController` — `/api/living-fees` |
| `VehicleController` | `VehicleController` — `/api/vehicles` |
| `ReportController` | `ReportController` — `/api/reports` |
| `SearchController` | `SearchController` — `/api/search` |
| `FeeType` / entity | `model/Fee.java` |
| `FeePayment` | `model/Payment.java` |
| `LivingFee` | `Fee` (monthly) |
| `Vehicle` | `model/Vehicle.java` |
| `FeeTypeService` + `impl` | Logic trong `FeeController` + `FeeExpectedAmounts` |
| `FeePaymentService` + `impl` | `PaymentController` + `CollectionRoundController` |
| `LivingFeeService` + `impl` | `LivingFeeController` |
| `VehicleService` + `impl` | `VehicleController` |
| `ReportService` + `impl` | `ReportService` / `ReportServiceImpl` |
| `SearchService` + `impl` | `SearchService` / `SearchServiceImpl` |
| `templates/fee/` | `FeeScreen.tsx`, `CreateFeeWizardDialog.tsx` |
| `templates/vehicle/` | `ResidentScreen.tsx` (tab vehicles) |
| `templates/report/` | `StatisticsScreen.tsx` |
| `templates/search/` | `SearchScreen.tsx` |

---

## 5. Bảng kiểm thử (module phí / thống kê)

| STT | Mã TC | Mô tả | Bước thực hiện | Kết quả mong đợi | Pass |
|-----|-------|-------|----------------|------------------|------|
| 1 | TC-F01 | Thêm khoản phí | Đăng nhập Kế toán → Khoản thu → Tạo khoản thu | Khoản xuất hiện trong danh sách | |
| 2 | TC-F02 | Sửa khoản phí | Chọn khoản → Sửa tên/số tiền → Lưu | Dữ liệu cập nhật | |
| 3 | TC-F03 | Xóa khoản phí | Chọn khoản → Xóa → Xác nhận | Khoản biến mất khỏi list | |
| 4 | TC-F04 | Phí gửi xe | Tạo khoản `per_vehicle`, nhập mức xe máy/ô tô/đạp | Nghĩa vụ tính theo số xe hộ | |
| 5 | TC-P01 | Thu phí hộ | Khoản thu → Thu tiền → chọn hộ, số tiền, ngày | Giao dịch lưu, trạng thái đã thu | |
| 6 | TC-P02 | Hộ chưa đóng | Thống kê → xem bảng “Hộ chưa đóng phí” | Liệt kê hộ còn nợ | |
| 7 | TC-V01 | Thêm xe | Cư dân → chọn hộ → Phương tiện → Thêm | Xe hiển thị trong list | |
| 8 | TC-V02 | Xóa xe | Chọn xe → Xóa | Xe bị xóa | |
| 9 | TC-V03 | Tìm biển số | Tìm kiếm → nhập biển số | Trả về phương tiện khớp | |
| 10 | TC-S01 | Tìm hộ | Tìm kiếm → nhập mã căn hộ | Trả về hộ khẩu | |
| 11 | TC-R01 | Thống kê tổng | Mở Thống kê | Hiển thị tổng hộ, nhân khẩu, tiền thu/chưa thu | |
| 12 | TC-R02 | Xuất Excel | Thống kê → Xuất Excel | Tải file `.xlsx` | |

*(Điền cột Pass khi kiểm thử: ✓ / ✗)*

---

## 6. Kết quả bàn giao (checklist)

- [x] CRUD khoản phí (REST + UI)
- [x] Cập nhật trạng thái đóng phí (ghi `nop_tien`)
- [x] CRUD phương tiện (thêm API PUT cập nhật)
- [x] Trang tìm kiếm (`SearchScreen` + `/api/search`)
- [x] Trang thống kê (`StatisticsScreen` + `/api/reports/summary`)
- [x] Tài liệu module (file này)

**Chụp màn hình:** chụp các màn Khoản thu, Thu tiền, Cư dân (Phương tiện), Tìm kiếm, Thống kê và đính kèm vào báo cáo Word/PDF nhóm.

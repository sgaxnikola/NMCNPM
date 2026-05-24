# BlueMoon — Quản lý chung cư (IT3180 Nhóm 4)

Phần mềm web quản lý chung cư **BlueMoon**: **React + Vite** (frontend) + **Spring Boot REST** (backend) + **MySQL**.

Repo bài tập nhóm: [khanh201104/Bai_tap_lon_IT3180_nhom_4](https://github.com/khanh201104/Bai_tap_lon_IT3180_nhom_4)

---

## Thành viên 4 — Bạn Giang (Khoản phí · Phương tiện · Tìm kiếm · Thống kê)

| Module | API chính | Giao diện |
|--------|-----------|-----------|
| Khoản phí / đóng phí | `/api/fees`, `/api/payments`, `/api/rounds` | `FeeScreen`, `CollectPaymentDialog` |
| Phí sinh hoạt | `/api/living-fees` | (API; có thể mở rộng UI) |
| Phương tiện | `/api/vehicles` | `ResidentScreen` → tab Phương tiện |
| Tìm kiếm | `/api/search?q=` | `SearchScreen` |
| Thống kê | `/api/reports/summary` | `StatisticsScreen` |

Tài liệu đầy đủ (nghiệp vụ, DB, hướng dẫn, kiểm thử): **[docs/ThanhVien4-Giang-Module.md](docs/ThanhVien4-Giang-Module.md)**

---

## Documentation

- **[Kiến trúc source & diagram (Mermaid)](docs/SourceArchitecture.md)**
- [Báo cáo dự án](docs/BlueMoon-Report.md) · [Cấu trúc code](docs/CodeStructure.md)

---

## Running the code

Run `npm i` to install the dependencies.

Run `npm run dev` to start the development server.

## Backend (Spring Boot + MySQL)

1. Copy file `backend/.env.example` sang `backend/.env` và chỉnh các giá trị:
   - `SPRING_DATASOURCE_PASSWORD`
   - `MYSQL_PASSWORD`
   - `MYSQL_ROOT_PASSWORD`
2. Khởi động MySQL bằng Docker Compose:
   - `cd backend`
   - `docker compose up -d`
3. Chạy backend:
   - `cd backend`
   - `mvn spring-boot:run`

## Deploy (Docker - Nginx + React + Spring Boot)

1. Tạo file `.env` ở thư mục gốc từ `.env.example` và điền các giá trị:
   - `MYSQL_ROOT_PASSWORD`
   - `MYSQL_PASSWORD`
   - `SPRING_DATASOURCE_PASSWORD`
2. Build và chạy toàn bộ stack:
   - `docker compose up -d --build`
3. Mở:
   - `http://localhost/`

Ghi chú:

- React gọi API bằng cùng domain qua path `/api` (ngăn lỗi CORS khi deploy).
- Nginx sẽ proxy `/api/*` sang container backend.

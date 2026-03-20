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
   - `docker compose -f docker-compose.deploy.yml up -d --build`
3. Mở:
   - `http://localhost/`

Ghi chú:
- React gọi API bằng cùng domain qua path `/api` (ngăn lỗi CORS khi deploy).
- Nginx sẽ proxy `/api/*` sang container backend.
  
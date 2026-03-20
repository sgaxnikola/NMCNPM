## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

## Backend (Spring Boot + MySQL)
1. Cập nhật biến môi trường trong file `.env` ở thư mục gốc (hoặc copy từ `.env.example`):
   - `SPRING_DATASOURCE_PASSWORD`
   - `MYSQL_PASSWORD`
   - `MYSQL_ROOT_PASSWORD`
2. Khởi động MySQL bằng Docker Compose:
   - `cd backend`
   - `docker compose up -d`
3. Chạy backend:
   - `cd backend`
   - `mvn spring-boot:run`
  
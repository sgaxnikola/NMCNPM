CREATE DATABASE IF NOT EXISTS bluemoon
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- Người dùng + mật khẩu được tạo bởi MySQL container thông qua biến môi trường:
-- MYSQL_USER, MYSQL_PASSWORD (xem backend/docker-compose.yml)
-- Script này chỉ đảm bảo database tồn tại.


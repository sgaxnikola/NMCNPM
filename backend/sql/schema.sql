CREATE DATABASE IF NOT EXISTS bluemoon CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE bluemoon;

CREATE TABLE IF NOT EXISTS ho_khau (
  ma_ho INT AUTO_INCREMENT PRIMARY KEY,
  so_thanh_vien INT,
  dia_chi VARCHAR(200)
);

CREATE TABLE IF NOT EXISTS nhan_khau (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ma_ho INT NULL,
  ho_ten VARCHAR(100) NOT NULL,
  ngay_sinh DATE NULL,
  gioi_tinh VARCHAR(10) NULL,
  cccd VARCHAR(20) NULL,
  quan_he_voi_chu_ho VARCHAR(30) NULL,
  so_dien_thoai VARCHAR(20) NULL,
  email VARCHAR(100) NULL,
  phuong_tien_bien_so VARCHAR(255) NULL,
  CONSTRAINT fk_nhankhau_hokhau FOREIGN KEY (ma_ho) REFERENCES ho_khau(ma_ho)
);

CREATE TABLE IF NOT EXISTS tai_khoan (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NULL,
  role VARCHAR(50) NULL,
  ma_ho INT NULL,
  CONSTRAINT fk_taikhoan_hokhau FOREIGN KEY (ma_ho) REFERENCES ho_khau(ma_ho)
);

CREATE TABLE IF NOT EXISTS khoan_thu (
  ma_khoan_thu INT AUTO_INCREMENT PRIMARY KEY,
  ten_khoan_thu VARCHAR(100) NOT NULL,
  so_tien DOUBLE,
  loai_khoan_thu INT,
  charge_type VARCHAR(20) NULL,
  han_nop VARCHAR(20) NULL,
  frequency VARCHAR(20) DEFAULT 'one_time',
  start_date DATE NULL,
  end_date DATE NULL,
  vehicle_rate_motorcycle DOUBLE NULL,
  vehicle_rate_car DOUBLE NULL,
  vehicle_rate_bicycle DOUBLE NULL
);

CREATE TABLE IF NOT EXISTS dot_thu_phi (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ma_khoan_thu INT NOT NULL,
  ten_dot VARCHAR(120) NOT NULL,
  ky_thu VARCHAR(64) NULL,
  han_nop VARCHAR(20) NULL,
  created_at DATETIME NULL,
  CONSTRAINT fk_dotthu_khoanthu FOREIGN KEY (ma_khoan_thu) REFERENCES khoan_thu(ma_khoan_thu)
);

CREATE TABLE IF NOT EXISTS nop_tien (
  idnop_tien INT AUTO_INCREMENT PRIMARY KEY,
  ma_khoan_thu INT,
  ma_ho INT,
  nguoi_nop VARCHAR(100),
  so_tien DOUBLE,
  ngay_thu DATE,
  round_id INT NULL,
  payment_method VARCHAR(20) NULL,
  payment_status VARCHAR(20) NULL,
  online_txn_id VARCHAR(64) NULL,
  CONSTRAINT fk_noptien_khoanthu FOREIGN KEY (ma_khoan_thu) REFERENCES khoan_thu(ma_khoan_thu),
  CONSTRAINT fk_noptien_hokhau FOREIGN KEY (ma_ho) REFERENCES ho_khau(ma_ho),
  CONSTRAINT fk_noptien_dotthu FOREIGN KEY (round_id) REFERENCES dot_thu_phi(id)
);

CREATE TABLE IF NOT EXISTS fee_obligation (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ma_khoan_thu INT NOT NULL,
  ma_ho INT NOT NULL,
  so_tien_phai_nop DOUBLE NOT NULL,
  CONSTRAINT uk_fee_obligation_fee_household UNIQUE (ma_khoan_thu, ma_ho),
  CONSTRAINT fk_feeobligation_khoanthu FOREIGN KEY (ma_khoan_thu) REFERENCES khoan_thu(ma_khoan_thu),
  CONSTRAINT fk_feeobligation_hokhau FOREIGN KEY (ma_ho) REFERENCES ho_khau(ma_ho)
);

CREATE TABLE IF NOT EXISTS round_obligation (
  id INT AUTO_INCREMENT PRIMARY KEY,
  round_id INT NOT NULL,
  ma_ho INT NOT NULL,
  so_tien_phai_nop DOUBLE NOT NULL,
  CONSTRAINT uk_round_obligation_round_household UNIQUE (round_id, ma_ho),
  CONSTRAINT fk_roundobligation_round FOREIGN KEY (round_id) REFERENCES dot_thu_phi(id),
  CONSTRAINT fk_roundobligation_hokhau FOREIGN KEY (ma_ho) REFERENCES ho_khau(ma_ho)
);

CREATE TABLE IF NOT EXISTS bien_dong_dan_cu (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ma_ho INT NULL,
  loai_su_kien VARCHAR(20) NOT NULL,
  ho_ten VARCHAR(100),
  can_ho VARCHAR(50),
  ngay DATETIME NOT NULL,
  ly_do VARCHAR(255),
  CONSTRAINT fk_biendong_hokhau FOREIGN KEY (ma_ho) REFERENCES ho_khau(ma_ho)
);

CREATE TABLE IF NOT EXISTS tam_tru_tam_vang (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ma_ho INT NULL,
  loai VARCHAR(20) NOT NULL,
  ho_ten VARCHAR(100),
  tu_ngay DATE NOT NULL,
  den_ngay DATE NULL,
  ghi_chu VARCHAR(255),
  CONSTRAINT fk_tamtru_hokhau FOREIGN KEY (ma_ho) REFERENCES ho_khau(ma_ho)
);

CREATE TABLE IF NOT EXISTS phuong_tien (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ma_ho INT NOT NULL,
  loai VARCHAR(20) NOT NULL,
  bien_so VARCHAR(20) NULL,
  mo_ta VARCHAR(255) NULL,
  CONSTRAINT fk_phuongtien_hokhau FOREIGN KEY (ma_ho) REFERENCES ho_khau(ma_ho)
);

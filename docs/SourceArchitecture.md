# Diagram Kiến Trúc Toàn Bộ Source BlueMoon

Tài liệu mô tả kiến trúc source code BlueMoon: Infrastructure, Backend (Spring Boot), Frontend (React/Vite), Database (MySQL), và luồng dữ liệu giữa các tầng.

---

## 1. Tổng quan hệ thống (Infrastructure)

```mermaid
graph TB
  subgraph docker [Docker Compose]
    MySQL["MySQL 8.4<br/>bluemoon-mysql-prod<br/>Port: 3306"]
    API["Spring Boot API<br/>bluemoon-api<br/>Port: 8080"]
    Web["Nginx + Vite SPA<br/>bluemoon-web<br/>Port: 80"]
  end
  Browser["Browser"] -->|"HTTP :80"| Web
  Web -->|"Proxy /api -> :8080"| API
  API -->|"JDBC"| MySQL
```

---

## 2. Database Schema (MySQL `bluemoon`)

```mermaid
erDiagram
  ho_khau ||--o{ nhan_khau : "ma_ho"
  ho_khau ||--o{ phuong_tien : "ma_ho"
  ho_khau ||--o{ nop_tien : "ma_ho"
  ho_khau ||--o{ tam_tru_tam_vang : "ma_ho"
  ho_khau ||--o{ bien_dong_dan_cu : "ma_ho"
  ho_khau ||--o{ fee_obligation : "ma_ho"
  ho_khau ||--o{ round_obligation : "ma_ho"
  ho_khau ||--o{ tai_khoan : "ma_ho"

  khoan_thu ||--o{ nop_tien : "ma_khoan_thu"
  khoan_thu ||--o{ dot_thu_phi : "ma_khoan_thu"
  khoan_thu ||--o{ fee_obligation : "ma_khoan_thu"

  dot_thu_phi ||--o{ nop_tien : "round_id"
  dot_thu_phi ||--o{ round_obligation : "round_id"

  ho_khau {
    INT ma_ho PK
    INT so_thanh_vien
    VARCHAR dia_chi
  }
  nhan_khau {
    INT id PK
    INT ma_ho FK
    VARCHAR ho_ten
    DATE ngay_sinh
    VARCHAR cccd
    VARCHAR quan_he_voi_chu_ho
  }
  tai_khoan {
    INT id PK
    VARCHAR username
    VARCHAR password_hash
    VARCHAR role
    INT ma_ho FK
  }
  khoan_thu {
    INT ma_khoan_thu PK
    VARCHAR ten_khoan_thu
    DOUBLE so_tien
    INT loai_khoan_thu
    VARCHAR charge_type
    VARCHAR frequency
    DOUBLE vehicle_rate_motorcycle
    DOUBLE vehicle_rate_car
    DOUBLE vehicle_rate_bicycle
  }
  dot_thu_phi {
    INT id PK
    INT ma_khoan_thu FK
    VARCHAR ten_dot
    VARCHAR ky_thu
  }
  nop_tien {
    INT idnop_tien PK
    INT ma_khoan_thu FK
    INT ma_ho FK
    INT round_id FK
    DOUBLE so_tien
    DATE ngay_thu
    VARCHAR payment_status
  }
  fee_obligation {
    INT id PK
    INT ma_khoan_thu FK
    INT ma_ho FK
    DOUBLE so_tien_phai_nop
  }
  round_obligation {
    INT id PK
    INT round_id FK
    INT ma_ho FK
    DOUBLE so_tien_phai_nop
  }
  phuong_tien {
    INT id PK
    INT ma_ho FK
    VARCHAR loai
    VARCHAR bien_so
  }
  tam_tru_tam_vang {
    INT id PK
    INT ma_ho FK
    VARCHAR loai
    VARCHAR ho_ten
    DATE tu_ngay
  }
  bien_dong_dan_cu {
    INT id PK
    INT ma_ho FK
    VARCHAR loai_su_kien
    VARCHAR ho_ten
    DATETIME ngay
  }
```

---

## 3. Backend (Spring Boot)

### 3a. Kiến trúc tầng

```mermaid
graph LR
  subgraph controllers [Controllers - /api/*]
    AuthCtrl["AuthController<br/>/api/auth"]
    HouseholdCtrl["HouseholdController<br/>/api/households"]
    ResidentCtrl["ResidentController<br/>/api/residents"]
    FeeCtrl["FeeController<br/>/api/fees"]
    RoundCtrl["CollectionRoundController<br/>/api/rounds"]
    PaymentCtrl["PaymentController<br/>/api/payments"]
    VehicleCtrl["VehicleController<br/>/api/vehicles"]
    PopEventCtrl["PopulationEventController<br/>/api/population-events"]
    TempResCtrl["TempResidenceController<br/>/api/temp-residence"]
    PortalCtrl["ResidentPortalController<br/>/api/portal"]
  end

  subgraph models [JPA Entities]
    Account["Account<br/>tai_khoan"]
    Household["Household<br/>ho_khau"]
    Resident["Resident<br/>nhan_khau"]
    Fee["Fee<br/>khoan_thu"]
    CollRound["CollectionRound<br/>dot_thu_phi"]
    Payment["Payment<br/>nop_tien"]
    FeeObl["FeeObligation<br/>fee_obligation"]
    RoundObl["RoundObligation<br/>round_obligation"]
    Vehicle["Vehicle<br/>phuong_tien"]
    PopEvent["PopulationEvent<br/>bien_dong_dan_cu"]
    TempRes["TempResidence<br/>tam_tru_tam_vang"]
  end

  subgraph repos [JPA Repositories]
    AccountRepo
    HouseholdRepo
    ResidentRepo
    FeeRepo
    CollRoundRepo
    PaymentRepo
    FeeOblRepo
    RoundOblRepo
    VehicleRepo
    PopEventRepo
    TempResRepo
  end

  subgraph utils [Utilities]
    FeeExpAmts["FeeExpectedAmounts"]
    SeedSvc["ResidentSeedService"]
  end

  controllers --> repos
  repos --> models
  FeeCtrl --> FeeExpAmts
  RoundCtrl --> FeeExpAmts
  SeedSvc --> repos
```

### 3b. Controller → Endpoint chi tiết

```mermaid
graph LR
  subgraph auth ["/api/auth"]
    A1["POST /register"]
    A2["POST /login"]
    A3["GET /account"]
    A4["POST /change-password"]
  end

  subgraph hh ["/api/households"]
    H1["GET /"]
    H2["POST /"]
    H3["PUT /{id}"]
    H4["DELETE /{id}"]
  end

  subgraph res ["/api/residents"]
    R1["GET /"]
    R2["POST /"]
    R3["PUT /{id}"]
    R4["DELETE /{id}"]
  end

  subgraph fee ["/api/fees"]
    F1["GET /"]
    F2["POST /"]
    F3["PUT /{id}"]
    F4["DELETE /{id}"]
    F5["GET /{id}/obligations"]
  end

  subgraph rnd ["/api/rounds"]
    RD1["GET /?feeId="]
    RD2["POST /?feeId="]
    RD3["GET /{roundId}/obligations"]
    RD4["DELETE /{roundId}"]
  end

  subgraph pay ["/api/payments"]
    P1["GET /"]
    P2["POST /"]
  end

  subgraph portal ["/api/portal"]
    PO1["GET /summary"]
    PO2["POST /payments/online"]
    PO3["POST /payments/online/{id}/confirm"]
  end

  subgraph other [Other APIs]
    V1["GET /api/vehicles"]
    V2["POST /api/vehicles"]
    V3["DELETE /api/vehicles/{id}"]
    PE1["GET /api/population-events"]
    PE2["POST /api/population-events"]
    TR1["GET /api/temp-residence"]
    TR2["POST /api/temp-residence"]
  end
```

---

## 4. Frontend (React + Vite + TypeScript)

### 4a. Component Tree

```mermaid
graph TB
  MainTsx["main.tsx"] --> App["App.tsx<br/>State: auth, fees, payments"]
  App --> LoginScreen
  App --> Sidebar
  App --> DashboardScreen
  App --> FeeScreen
  App --> ResidentScreen["ResidentScreen<br/>+ Xuat Excel"]
  App --> ApartmentScreen
  App --> StatisticsScreen
  App --> SettingsScreen
  App --> ResidentPortalScreen

  App --> CreateFeeWizardDialog
  App --> CreateFeeDialog
  App --> CollectPaymentDialog

  subgraph shared [shared/]
    DatePickerInput
    ImageWithFallback
  end

  subgraph uiLib ["ui/ (shadcn)"]
    Calendar
    Popover
    Button
    Card
    Dialog
    etc["...30+ components"]
  end

  ResidentScreen --> DatePickerInput
  CreateFeeWizardDialog --> DatePickerInput
  FeeScreen --> DatePickerInput
  CollectPaymentDialog --> DatePickerInput
  DatePickerInput --> Calendar
  DatePickerInput --> Popover
```

### 4b. Data Flow: Screen → API → Backend

```mermaid
graph LR
  subgraph screens [Frontend Screens]
    Login["LoginScreen"]
    Dashboard["DashboardScreen"]
    FeeScr["FeeScreen"]
    ResScr["ResidentScreen"]
    AptScr["ApartmentScreen"]
    StatScr["StatisticsScreen"]
    SetScr["SettingsScreen"]
    Portal["ResidentPortalScreen"]
  end

  subgraph apiLayer ["api.ts"]
    loginAccount
    registerAccount
    fetchFees
    fetchPayments
    createFee
    updateFee
    deleteFee
    createPayment
    fetchHouseholds
    createHousehold
    fetchResidents
    createResident
    fetchRoundsByFee
    fetchRoundObligations
    fetchFeeObligations
    createRound
    fetchVehicles
    createVehicle
    fetchPopEvents["fetchPopulationEvents"]
    fetchTempRes["fetchTempResidence"]
    createTempRes["createTempResidence"]
    changePassword
    portalSummary["fetchResidentPortalSummary"]
    onlinePay["createOnlinePayment"]
    confirmPay["confirmOnlinePayment"]
    exportExcel["downloadHouseholdRegistryExcel"]
  end

  Login --> loginAccount
  Login --> registerAccount
  Dashboard --> fetchHouseholds
  Dashboard --> fetchResidents
  Dashboard --> fetchPopEvents
  FeeScr --> fetchFees
  FeeScr --> fetchRoundsByFee
  FeeScr --> fetchRoundObligations
  FeeScr --> fetchFeeObligations
  FeeScr --> updateFee
  FeeScr --> deleteFee
  FeeScr --> createRound
  ResScr --> fetchHouseholds
  ResScr --> fetchResidents
  ResScr --> createResident
  ResScr --> fetchVehicles
  ResScr --> createVehicle
  ResScr --> fetchPopEvents
  ResScr --> fetchTempRes
  ResScr --> createTempRes
  ResScr --> exportExcel
  AptScr --> fetchHouseholds
  AptScr --> fetchResidents
  AptScr --> createHousehold
  StatScr --> fetchHouseholds
  SetScr --> changePassword
  Portal --> portalSummary
  Portal --> onlinePay
  Portal --> confirmPay
```

*Ghi chú thực tế mã nguồn:* `downloadHouseholdRegistryExcel` được định nghĩa trong `app/utils/exportHouseholdExcel.ts` và `ResidentScreen` gọi trực tiếp; không nằm trong `api.ts` (diagram trên giữ cùng nhóm với luồng màn hình theo plan).

### 4c. Luồng thanh toán (Fee Collection Flow)

```mermaid
sequenceDiagram
  participant Admin as Admin UI
  participant API as Backend API
  participant DB as MySQL

  Admin->>API: POST /api/fees (tao khoan thu)
  API->>DB: INSERT khoan_thu
  API->>DB: INSERT fee_obligation (cho tung ho)
  API-->>Admin: Fee created

  Admin->>API: GET /api/rounds?feeId=X
  API->>DB: Auto-generate dot_thu_phi
  API->>DB: INSERT round_obligation
  API-->>Admin: Rounds list

  Admin->>API: GET /api/rounds/{id}/obligations
  API->>DB: JOIN round_obligation + nop_tien
  API-->>Admin: paid/unpaid per household

  Admin->>API: POST /api/payments (thu tien)
  API->>DB: INSERT nop_tien (round_id, ma_ho, so_tien)
  API-->>Admin: Payment recorded

  Note over Admin,DB: Portal (cu dan)
  Admin->>API: POST /api/portal/payments/online
  API->>DB: INSERT nop_tien (PENDING)
  Admin->>API: POST /api/portal/payments/online/{id}/confirm
  API->>DB: UPDATE payment_status = PAID
```

---

## 5. File listing

### Backend Java (`backend/src/main/java/vn/bluemoon/backend/`)

- **config/**: `CorsConfig.java`, `DemoResidentDataLoader.java`
- **controller/**: `AuthController`, `HouseholdController`, `ResidentController`, `FeeController`, `CollectionRoundController`, `PaymentController`, `VehicleController`, `PopulationEventController`, `TempResidenceController`, `ResidentPortalController`
- **model/**: `Account`, `Household`, `Resident`, `Fee`, `CollectionRound`, `Payment`, `FeeObligation`, `RoundObligation`, `Vehicle`, `PopulationEvent`, `TempResidence`
- **repository/**: một repo cho mỗi entity (11 class)
- **service/**: `ResidentSeedService` (seed data)
- **util/**: `FeeExpectedAmounts` (tính nghĩa vụ theo loại xe)
- **exception/**: `GlobalExceptionHandler`

### Frontend (`src/`)

- **`main.tsx`**: entry point
- **`app/App.tsx`**: root component, auth state, fee/payment state, routing
- **`app/api.ts`**: các hàm gọi REST, cache trong bộ nhớ
- **`app/types.ts`**: `FeeItem`, `Payment`, `Household`, `Resident`, `UserRole`, …
- **`app/utils/exportHouseholdExcel.ts`**: xuất Excel (exceljs)
- **`app/components/`**: các màn hình + dialog (Login, Dashboard, Fee, Resident, v.v.)
- **`app/components/shared/`**: `DatePickerInput`, `ImageWithFallback`
- **`app/components/ui/`**: ~35 primitive shadcn/ui (Calendar, Popover, Button, Card, …)
- **`styles/`**: `theme.css`, `fonts.css`, `tailwind.css`, `index.css`

### Config / Infra

- `docker-compose.yml`: MySQL + API + Web (3 services)
- `vite.config.ts`: Vite + React plugin
- `backend/pom.xml`: Spring Boot + MySQL + JPA
- `backend/sql/schema.sql`: các bảng chính
- `.env` / `.env.example`: mật khẩu, URL API

Design a complete UI/UX system for a Vietnamese desktop application called "BlueMoon - Phan mem Quan ly Thu phi Chung cu" (BlueMoon Apartment Fee Management System). This is a desktop app (not web or mobile) used by apartment building management staff to manage fees, residents, and households. Create all of the following screens in one cohesive design system.

GLOBAL DESIGN SYSTEM:
- Font: Raleway (headings and body)
- Color palette: Primary #6F6AF8, Secondary #7874F9, Light background #F2F2FD, Border/subtle #CFCFEF, Success green #4CAF50, Error red #F44336, Text dark #1A1A2E
- Border radius: 8px for cards, 6px for inputs and buttons
- Icons: Outlined style, consistent stroke weight
- All labels and text are in Vietnamese
- Navigation uses a left sidebar layout (250px wide, primary color #6F6AF8 background with white text and icons)

SIDEBAR (shared across all main screens except Login):
- Top: App logo "BlueMoon" with a small apartment building icon
- Below logo: User avatar circle with user name and role
- Navigation items (vertical, with icons): "Trang chu" (Home), "Can ho" (Apartments), "Cu dan" (Residents), "Khoan thu" (Fees), "Thong ke" (Statistics), "Cai dat" (Settings)
- Bottom: "Dang xuat" (Logout) button
- Active menu item has a white/light highlight background

SCREEN 1 - LOGIN (1120x645px, no sidebar):
- Split layout: Left half has a decorative apartment building illustration with blue/purple gradient overlay. Right half has the login form on white/light background.
- Right side elements from top to bottom:
  - App logo and "BlueMoon" title
  - "Dang nhap" heading
  - Dropdown: "Vai tro" (Role) with options "Ke toan" (Accountant), "To truong" (Team Lead), "To pho" (Deputy Lead)
  - Input field: "Email" with placeholder
  - Input field: "Mat khau" (Password) with eye toggle icon
  - Primary button: "Dang nhap" (Login), full width
  - Link: "Quen mat khau?" (Forgot password?)
  - Link: "Dang ky tai khoan" (Register)

SCREEN 2 - DASHBOARD / TRANG CHU (1440x1024px, with sidebar):
- Sidebar: "Trang chu" is active/highlighted
- Top header bar: Page title "Trang chu" on left, search bar in center, notification bell and user avatar on right
- Filter tabs below header: "Hom nay" (Today), "Tuan nay" (This week), "Thang nay" (This month)
- Content area:
  - Row of 4 summary stat cards: "Tong can ho" (Total apartments) with building icon, "Tong cu dan" (Total residents) with people icon, "Khoan thu" (Fee items) with money icon, "Ti le thu" (Collection rate %) with chart icon. Each card shows a large number, label, and small "Xem chi tiet" link.
  - Below cards left: Bar chart titled "Lich su thu phi" (Fee collection history) showing monthly data with purple bars
  - Below cards right: List/card titled "Bien dong dan cu" (Population changes) showing recent entries
  - Bottom section: Two info cards side by side - "Khoan thu gan day" (Recent fees) with a small table, and "Thao tac nhanh" (Quick actions) with 3 buttons: "Tao khoan thu" (Create fee), "Thu phi" (Collect payment), "Xuat bao cao" (Export report)

SCREEN 3 - TAO KHOAN THU / CREATE FEE (1120x645px popup/dialog style, centered on screen):
- Title bar: "Tao khoan thu moi" (Create new fee item)
- Form elements with clear labels and good vertical spacing:
  - Radio group: "Loai khoan thu" (Fee type): "Bat buoc" (Mandatory) / "Dong gop" (Voluntary contribution)
  - Text input: "Ten khoan thu" (Fee name), placeholder "VD: Phi dich vu, Phi ve sinh..."
  - Number input: "So tien" (Amount) with "VND" suffix label and note "dong/m2/thang" for mandatory type
  - Date picker: "Thoi han" (Deadline)
  - Textarea: "Ghi chu" (Notes), 3 rows
- Bottom action row: "Huy" (Cancel) secondary outlined button on left, "Tao khoan thu" (Create) primary filled button on right

SCREEN 4 - THU PHI / COLLECT PAYMENT (1120x645px popup/dialog style):
- Title bar: "Thu phi" (Collect Payment)
- Three card sections stacked vertically:
  Section 1 - "Thong tin khoan thu" (Fee info):
    - Dropdown: "Chon khoan thu" (Select fee) listing available fees
    - Auto-display: fee name, type badge (Bat buoc/Dong gop), unit price
  Section 2 - "Thong tin ho gia dinh" (Household info):
    - Search dropdown: "Chon ho gia dinh" (Select household) with autocomplete
    - Auto-display: "Ma ho" (Household ID), "Chu ho" (Head of household), "Dia chi" (Address), "So nhan khau" (Members), "So tien can nop" (Amount due) highlighted in bold
  Section 3 - "Thong tin nop tien" (Payment info):
    - Text input: "Nguoi nop" (Payer name)
    - Number input: "So tien nop" (Amount paid) with VND
    - Date picker: "Ngay nop" (Payment date), default today
- Bottom: "Huy" (Cancel) and "Xac nhan thu phi" (Confirm payment) buttons

SCREEN 5 - THONG KE / STATISTICS (1440x1024px, with sidebar):
- Sidebar: "Thong ke" is active
- Top header: Page title "Thong ke cac khoan thu" (Fee Statistics)
- Filter bar: Dropdown "Chon khoan thu" (Select fee), date range picker "Tu ngay - Den ngay", "Loc" (Filter) button
- Summary row: 3 metric cards in a row - "Tong so ho" (Total households), "Tong tien da thu" (Total collected) in VND, "Ti le hoan thanh" (Completion rate %)
- Main data table with columns: "STT" (No.), "Ho gia dinh" (Household), "Chu ho" (Head), "Dia chi" (Address), "So tien can nop" (Amount due), "So tien da nop" (Amount paid), "Trang thai" (Status) using colored pill badges - green "Da nop" (Paid) / red "Chua nop" (Unpaid), "Ngay nop" (Date)
- Table has alternating row colors for readability
- Pagination controls below table: page numbers, rows per page selector
- Action buttons below: "Xuat Excel" (Export Excel) with download icon, "In bao cao" (Print report) with printer icon

SCREEN 6 - QUAN LY CU DAN / RESIDENT MANAGEMENT (1440x1024px, with sidebar):
- Sidebar: "Cu dan" is active
- Top header: Title "Quan ly ho khau" (Household Management), search bar, "+ Them ho khau" (Add household) primary button
- Main data table with columns: "Ma ho" (ID), "Chu ho" (Head of household), "Dia chi / Can ho" (Address/Apartment), "So nhan khau" (Members count), "Hanh dong" (Actions) with edit pencil and delete trash icons
- When a row is selected/expanded, show a detail panel below or to the right:
  - Household info card: apartment number, address, registration date
  - Tabs: "Nhan khau" (Members - active), "Tam tru/Tam vang" (Temp. residence), "Lich su thay doi" (Change history)
  - Members sub-table: "Ho ten" (Name), "Ngay sinh" (Birth date), "Gioi tinh" (Gender), "CCCD" (ID number), "Quan he voi chu ho" (Relationship to head)
  - Action buttons: "+ Them nhan khau" (Add member), "Cap nhat" (Update)

SCREEN 7 - CAI DAT / SETTINGS (1440x1024px, with sidebar):
- Sidebar: "Cai dat" is active
- Content: Simple settings page with sections:
  - "Thong tin ca nhan" (Personal info): name, email, role (read-only display with edit button)
  - "Doi mat khau" (Change password): current password, new password, confirm password inputs, "Luu thay doi" (Save) button
  - "Thong tin chung cu" (Apartment info): building name "BlueMoon", address, total floors "30", total apartments

NAVIGATION FLOW (prototype connections):
- Login -> Dashboard (on successful login)
- Dashboard "Tao khoan thu" button -> Create Fee screen
- Dashboard "Thu phi" button -> Collect Payment screen
- Sidebar "Khoan thu" -> back to Dashboard or a fee list
- Sidebar "Thong ke" -> Statistics screen
- Sidebar "Cu dan" -> Resident Management screen
- Sidebar "Cai dat" -> Settings screen
- Sidebar "Dang xuat" -> back to Login

Generate all 7 screens with consistent styling, proper Vietnamese labels, and interactive prototype flow connections between them.
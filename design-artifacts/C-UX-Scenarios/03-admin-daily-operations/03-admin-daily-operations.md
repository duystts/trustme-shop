# 03: Quản trị viên Xử Lý Đơn & Báo Cáo Hằng Ngày

**Project:** trustme-shop
**Created:** 2026-03-17
**Method:** Whiteport Design Studio (WDS)
design_intent: [C]
design_status: not-started

---

## Transaction (Q1)

**What this scenario covers:**
Kiểm tra tổng quan doanh thu trong ngày, cập nhật trạng thái các đơn hàng mới, và thêm một sản phẩm mới vào danh mục bán.

---

## Business Goal (Q2)

**Goal:** Complete Management Flow
**Objective:** Cung cấp công cụ quản lý nhẹ nhàng, xử lý đơn hàng và hàng hóa siêu tốc cho chủ shop/staff.

---

## User & Situation (Q3)

**Persona:** Quản trị viên (Priority 2)
**Situation:** Bắt đầu ca làm việc buổi sáng trên máy tính ở cửa hàng, cần dọn dẹp các đơn chờ từ tối qua và đăng bộ sưu tập mới.

---

## Driving Forces (Q4)

**Hope:** Thấy ngay số liệu doanh thu hôm qua và xử lý hàng loạt đơn chỉ với vài click.

**Worry:** Hệ thống load chậm, giao diện rối rắm phải bấm nhiều lần mới xong một tác vụ đơn thuần.

---

## Device & Starting Point (Q5 + Q6)

**Device:** Desktop
**Entry:** Bật laptop tại cửa hàng, mở bookmark đường dẫn Admin Panel có sẵn.

---

## Best Outcome (Q7)

**User Success:**
Hoàn thành công việc kiểm kê và cập nhật đơn hàng trong vòng 5 phút đầu ngày mà không gặp bất kỳ lỗi hệ thống nào.

**Business Success:**
Đảm bảo dữ liệu vận hành luôn realtime, đơn hàng được đẩy đi đúng tiến độ, tăng năng suất đội ngũ nhân viên.

---

## Shortest Path (Q8)

1. **Admin Dashboard (Overview)** — Đăng nhập và nhìn thấy ngay biểu đồ doanh thu hằng ngày cùng con số "12 Đơn chờ xử lý".
2. **Order Processing** — Vào danh sách đơn, chọn tất cả "Đơn chờ", bấm "Xác nhận & Chuẩn bị hàng" trong 1 click.
3. **Product Management (CRUD)** — Chuyển sang tab Sản phẩm, bấm "Thêm mới", điền thông tin và hình ảnh bộ sưu tập mới, lưu thành công.
4. **User Management** — (Tùy chọn) Kiểm tra xem có khách hàng nào yêu cầu hỗ trợ tài khoản không. ✓

---

## Trigger Map Connections

**Persona:** Quản trị viên (Priority 2)

**Driving Forces Addressed:**
- ✅ **Want:** Tốc độ thao tác nhanh, số liệu trực quan ngay lập tức.
- ❌ **Fear:** Giao diện chậm chạp, phải thao tác lặp lại nhiều lần vô ích.

**Business Goal:** Goal 1 (Management Flow)

---

## Scenario Steps

| Step | Folder | Purpose | Exit Action |
|------|--------|---------|-------------|
| 03.1 | `03.1-admin-dashboard/` | Xem tổng quan báo cáo và cảnh báo | Clicks "View Pending Orders" |
| 03.2 | `03.2-order-processing/` | Xử lý đơn hàng loạt | Navigates to "Products" tab |
| 03.3 | `03.3-product-crud/` | Đăng sản phẩm mới | Clicks "Save Product" |
| 03.4 | `03.4-user-management/` | Kiểm tra tài khoản khách | Completes task ✓ |

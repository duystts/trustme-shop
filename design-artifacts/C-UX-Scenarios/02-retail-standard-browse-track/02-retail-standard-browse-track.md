# 02: Khách hàng mua lẻ Mua Sắm và Theo Dõi Đơn Khách

**Project:** trustme-shop
**Created:** 2026-03-17
**Method:** Whiteport Design Studio (WDS)
design_intent: [C]
design_status: not-started

---

## Transaction (Q1)

**What this scenario covers:**
Theo dõi tình trạng giao hàng của đơn đã đặt và chủ động tìm kiếm các sản phẩm lẻ cụ thể theo mục đích cá nhân.

---

## Business Goal (Q2)

**Goal:** Complete Shopping Flow
**Objective:** Đảm bảo luồng mua sắm mượt mà, duy trì sự trung thành của khách hàng và giảm tải câu hỏi hỗ trợ.

---

## User & Situation (Q3)

**Persona:** Khách hàng mua lẻ (Priority 2)
**Situation:** Đang rảnh rỗi ở nhà, muốn kiểm tra xem chiếc váy đặt hôm qua đã giao tới đâu, tiện tay tìm thêm một chiếc áo thun trắng cơ bản.

---

## Driving Forces (Q4)

**Hope:** Nhanh chóng biết được vị trí của đơn hàng và dễ dàng lọc ra chiếc áo đúng ý.

**Worry:** Không biết hàng bao giờ tới, hoặc tìm kiếm trên web khó khăn, phải lướt qua quá nhiều món không liên quan.

---

## Device & Starting Point (Q5 + Q6)

**Device:** Mobile
**Entry:** Mở lại link website đã lưu trên trình duyệt điện thoại để kiểm tra đơn hàng.

---

## Best Outcome (Q7)

**User Success:**
Yên tâm vì thấy đơn hàng đang được giao; tìm được chiếc áo thun trắng nhanh chóng qua bộ lọc.

**Business Success:**
Giảm chi phí hỗ trợ khách hàng (Call/Tin nhắn hỏi tình trạng đơn) và kích thích được một lượt mua nhồi (add-on purchase).

---

## Shortest Path (Q8)

1. **Login / Register Page (Auth)** — Đăng nhập vào hệ thống để xem tài khoản.
2. **Order Tracking / History Page** — Nhìn thấy ngay trạng thái "Đang giao" của đơn hàng gần nhất.
3. **Product Listing Page (PLP)** — Bấm vào ô tìm kiếm gõ "áo thun trắng", dùng bộ lọc Size M, chọn sản phẩm ưng ý. ✓

---

## Trigger Map Connections

**Persona:** Khách hàng mua lẻ (Priority 2 trong bối cảnh mua thuần túy)

**Driving Forces Addressed:**
- ✅ **Want:** Yên tâm về tình trạng đơn hàng và dễ tìm món đồ cơ bản.
- ❌ **Fear:** Sợ mù mờ thông tin giao hàng, sợ bộ lọc sản phẩm kém.

**Business Goal:** Goal 1 (Shopping Flow & Customer Loyalty)

---

## Scenario Steps

| Step | Folder | Purpose | Exit Action |
|------|--------|---------|-------------|
| 02.1 | `02.1-auth/` | Đăng nhập tài khoản | Clicks "Login" |
| 02.2 | `02.2-order-history/` | Kiểm tra đơn hàng đang giao | Clicks "Search Bar / Shop Now" |
| 02.3 | `02.3-plp-search/` | Tìm và chọn sản phẩm lẻ | Clicks on a Product Card ✓ |

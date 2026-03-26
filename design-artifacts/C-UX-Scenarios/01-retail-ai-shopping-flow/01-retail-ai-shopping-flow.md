# 01: Khách hàng mua lẻ Tìm Gợi Ý Outfit Cùng AI

**Project:** trustme-shop
**Created:** 2026-03-17
**Method:** Whiteport Design Studio (WDS)
design_intent: [C]
design_status: not-started

---

## Transaction (Q1)

**What this scenario covers:**
Tìm kiếm và mua trọn bộ trang phục (outfit) theo một yêu cầu thời tiết/sự kiện cụ thể thông qua AI Chat thay vì tự lướt tìm.

---

## Business Goal (Q2)

**Goal:** Innovative Shopping Experience & Complete Shopping Flow
**Objective:** Tích hợp thành công AI Chat Widget và tăng chuyển đổi mua sắm thông qua gợi ý cá nhân hóa.

---

## User & Situation (Q3)

**Persona:** Khách hàng mua lẻ (Priority 1)
**Situation:** Đang chuẩn bị đi làm vào một ngày mưa mẻ, cần đồ thanh lịch nhưng lười nghĩ phối đồ.

---

## Driving Forces (Q4)

**Hope:** Nhận được đề xuất trọn bộ "áo + quần/váy" hợp thời tiết trong vòng 1 phút.

**Worry:** Mua rời rạc về không phối được với nhau, tốn cả tiếng đồng hồ lướt web vô ích.

---

## Device & Starting Point (Q5 + Q6)

**Device:** Mobile
**Entry:** Mở website trên điện thoại khi đang ngồi uống cafe, nhấp ngay vào biểu tượng AI Chat nổi bật góc màn hình.

---

## Best Outcome (Q7)

**User Success:**
Bấm "Thêm cả bộ vào giỏ" chỉ bằng 1 nút bấm từ gợi ý của AI mà không cần vào xem lẻ từng món.

**Business Success:**
Bán được 2-3 sản phẩm cùng lúc (Cross-sell/Up-sell) cực kỳ thành công thay vì chỉ 1, chứng minh giá trị của AI Widget.

---

## Shortest Path (Q8)

1. **Home** — Mở web, thấy và bấm vào AI Chat Widget để bắt đầu trò chuyện.
2. **AI Chat Widget** — Nhập "Gợi ý đồ đi làm ngày mưa", AI hiển thị thẻ Outfit, bấm "Thêm vào giỏ hàng".
3. **Cart / Checkout Flow** — Kiểm tra giỏ hàng chứa đủ bộ, xác nhận địa chỉ và bấm thanh toán thành công. ✓

---

## Trigger Map Connections

**Persona:** Khách hàng mua lẻ (Priority 1)

**Driving Forces Addressed:**
- ✅ **Want:** Gợi ý trọn bộ trang phục theo thời tiết/ngữ cảnh.
- ❌ **Fear:** Sợ mua về không biết phối / Mệt mỏi vì tìm kiếm (Search fatigue).

**Business Goal:** Goal 1 & 2 (Shopping Flow & AI Integration)

---

## Scenario Steps

| Step | Folder | Purpose | Exit Action |
|------|--------|---------|-------------|
| 01.1 | `01.1-home/` | Mở web và tiếp cận tính năng AI | Click AI Chat Widget |
| 01.2 | `01.2-ai-chat-widget/` | Giao tiếp với AI để lấy outfit | Clicks "Add Outfit to Cart" |
| 01.3 | `01.3-checkout/` | Thanh toán bộ trang phục | Clicks "Checkout/Pay" ✓ |

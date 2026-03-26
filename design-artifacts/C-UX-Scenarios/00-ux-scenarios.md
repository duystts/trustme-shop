# UX Scenarios: trustme-shop

> Scenario outlines connecting Trigger Map personas to concrete user journeys

**Created:** 2026-03-17
**Author:** phama with Freya
**Method:** Whiteport Design Studio (WDS)

---

## Scenario Summary

| ID | Scenario | Persona | Pages | Priority | Status |
|----|----------|---------|-------|----------|--------|
| 01 | Khách hàng mua lẻ Tìm Gợi Ý Outfit Cùng AI | Khách mua lẻ | 4 | ⭐ P1 | ✅ Outlined |
| 02 | Mua sắm và Theo dõi Đơn khách | Khách mua lẻ | 3 | ⭐ P2 | ✅ Outlined |
| 03 | Xử lý đơn & Báo cáo hằng ngày | Quản trị viên | 4 | ⭐ P2 | ✅ Outlined |

---

## Scenarios

### [01: Khách hàng mua lẻ Tìm Gợi Ý Outfit Cùng AI](01-retail-ai-shopping-flow/01-retail-ai-shopping-flow.md)
**Persona:** Khách hàng mua lẻ (Priority 1) — Cần tìm đồ hợp thời tiết nhưng sợ phối đồ lỗi và tốn thời gian.
**Pages:** Home, AI Chat Widget, PDP, Checkout Flow
**User Value:** Lấy được set đồ hoàn chỉnh hợp thời tiết ngay lập tức, giải tỏa nỗi sợ phối đồ lỗi.
**Business Value:** Chuyển đổi (Conversion) một lúc nhiều sản phẩm (cross-sell an outfit), tăng doanh thu.

---

### [02: Khách hàng mua lẻ Mua Sắm và Theo Dõi Đơn Khách](02-retail-standard-browse-track/02-retail-standard-browse-track.md)
**Persona:** Khách hàng mua lẻ (Priority 2 trong bối cảnh mua thuần túy) — Muốn biết đồ mình đặt bao giờ về, hoặc đi tìm 1 món lắt nhắt nhỏ lẻ.
**Pages:** Auth, Order History, PLP
**User Value:** Yên tâm về tình trạng đơn hàng, chủ động tìm kiếm các món đồ lẻ dễ dàng.
**Business Value:** Duy trì sự trung thành, giảm tải câu hỏi support (hỗ trợ khách hàng).

---

### [03: Quản trị viên Xử Lý Đơn & Báo Cáo Hằng Ngày](03-admin-daily-operations/03-admin-daily-operations.md)
**Persona:** Quản trị viên (Priority 2) — Cần xem báo cáo và kiểm kho, ghét thao tác chậm chạp lặp đi lặp lại.
**Pages:** Admin Dashboard, Order Processing, Product Management, User Management
**User Value:** Nắm bắt tình hình kinh doanh ngay lập tức, xử lý hàng/đơn siêu tốc.
**Business Value:** Đóng gói trải nghiệm quản lý mượt mà (Management Flow), đảm bảo dữ liệu luôn được cập nhật.

---

## Page Coverage Matrix

| Page | Scenario | Purpose in Flow |
|------|----------|----------------|
| Home / Discovery | 01 | Mở web và tiếp cận tính năng AI |
| AI Chat Widget | 01 | Giao tiếp với AI để lấy outfit |
| PDP | 01 | (Implicit in Outfit flow/optional) Xem chi tiết thiết kế |
| Cart / Checkout | 01 | Thanh toán bộ trang phục |
| Auth (Login/Register) | 02 | Đăng nhập tài khoản kiểm tra đơn |
| Order Tracking / History | 02 | Kiểm tra đơn hàng đang giao |
| Product Listing Page (PLP) | 02 | Tìm và chọn sản phẩm lẻ cơ bản |
| Admin Dashboard | 03 | Xem tổng quan báo cáo và cảnh báo |
| Order Processing | 03 | Xử lý đơn hàng đợi xác nhận |
| Product Management | 03 | Đăng sản phẩm/bộ sưu tập mới |
| User Management | 03 | Kiểm tra tài khoản khách hàng |

**Coverage:** 11/11 pages assigned to scenarios

---

## Next Phase

These scenario outlines feed into **Phase 4: UX Design** where each page gets:
- Detailed page specifications
- Wireframe sketches
- Component definitions
- Interaction details

---

_Generated with Whiteport Design Studio framework_

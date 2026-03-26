import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { getCartItems, createOrder, validateDiscount } from "../services/orderApi";
import { getToken } from "../services/authApi";

type UserProfile = {
  id: number;
  fullName: string;
  email: string;
  phone?: string;
  address?: string;
};

export const CheckoutPage: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [discountCode, setDiscountCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountError, setDiscountError] = useState("");
  const [discountApplied, setDiscountApplied] = useState(false);
  const [checkingDiscount, setCheckingDiscount] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    getCartItems().then((data) => setItems(data || []));
    axios.get<UserProfile>("/api/users/me")
      .then((res) => {
        setProfile(res.data);
        if (res.data.phone) setPhone(res.data.phone);
        if (res.data.address) setAddress(res.data.address);
      })
      .catch(() => {})
      .finally(() => setProfileLoading(false));
  }, []);

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const total = Math.max(0, subtotal - discountAmount);

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) return;
    setCheckingDiscount(true);
    setDiscountError("");
    try {
      const res = await validateDiscount(discountCode.trim(), subtotal);
      setDiscountAmount(res.discountAmount);
      setDiscountApplied(true);
    } catch (err: any) {
      setDiscountAmount(0);
      setDiscountApplied(false);
      setDiscountError(err.response?.data?.message || err.response?.data || "Mã giảm giá không hợp lệ");
    }
    setCheckingDiscount(false);
  };

  const handleRemoveDiscount = () => {
    setDiscountCode("");
    setDiscountAmount(0);
    setDiscountApplied(false);
    setDiscountError("");
  };

  const handleFillFromProfile = () => {
    if (profile?.phone) setPhone(profile.phone);
    if (profile?.address) setAddress(profile.address);
  };

  const isLoggedIn = !!getToken();
  const hasProfileData = !!(profile?.phone || profile?.address);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    setLoading(true);
    try {
      await createOrder({ address, discountCode: discountApplied ? discountCode : undefined, items: [] });
      setSuccess(true);
    } catch {
      alert("Đặt hàng thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="page-container" style={{ textAlign: "center", paddingTop: "var(--space-2xl)" }}>
        <h2>🎉 Đặt hàng thành công!</h2>
        <p style={{ color: "var(--text-muted)", marginBottom: "var(--space-xl)" }}>
          Cảm ơn bạn đã mua sắm tại trustme-shop. Đơn hàng của bạn đang được xử lý.
        </p>
        <button className="primary-button" onClick={() => navigate("/orders")}>
          Xem Đơn Hàng Của Bạn
        </button>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Thanh toán</h1>
        <p>Kiểm tra giỏ hàng và nhập thông tin nhận hàng</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "var(--space-xl)", marginTop: "var(--space-lg)" }}>
        {/* Cart items */}
        <div>
          <h2 style={{ fontSize: "var(--font-lg)", marginBottom: "var(--space-sm)" }}>Sản phẩm trong giỏ</h2>
          {items.length === 0 ? (
            <p style={{ color: "var(--text-muted)" }}>Giỏ hàng trống.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
              {items.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    gap: "var(--space-sm)",
                    background: "var(--bg-elevated)",
                    padding: "var(--space-sm)",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <div className="image-placeholder" style={{ width: 64, height: 64, flexShrink: 0 }}>
                    {item.product.name.charAt(0)}
                  </div>
                  <div>
                    <h4 style={{ margin: "0 0 4px", fontSize: "var(--font-sm)" }}>{item.product.name}</h4>
                    <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "var(--font-xs)" }}>SL: {item.quantity}</p>
                    <p style={{ margin: "4px 0 0", color: "var(--accent)", fontWeight: 600, fontSize: "var(--font-sm)" }}>
                      {(item.product.price * item.quantity).toLocaleString("vi-VN")} ₫
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Checkout Form */}
        <div>
          <form
            onSubmit={handleCheckout}
            style={{
              background: "var(--bg-elevated)",
              padding: "var(--space-md)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border-subtle)",
              boxShadow: "var(--shadow-card)",
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-md)",
            }}
          >
            <h2 style={{ margin: 0, fontSize: "var(--font-lg)" }}>Thông tin nhận hàng</h2>

            {/* Quick-fill banner — always show when logged in */}
            {isLoggedIn && (
              <div
                style={{
                  background: "#eff6ff",
                  border: "1px solid #bfdbfe",
                  borderRadius: "var(--radius-sm)",
                  padding: "var(--space-xs) var(--space-sm)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "var(--space-sm)",
                  fontSize: "var(--font-xs)",
                }}
              >
                {profileLoading ? (
                  <span style={{ color: "#64748b" }}>Đang tải thông tin tài khoản…</span>
                ) : hasProfileData ? (
                  <>
                    <span style={{ color: "#1e40af" }}>
                      Dùng thông tin của <strong>{profile!.fullName}</strong>?
                    </span>
                    <button
                      type="button"
                      onClick={handleFillFromProfile}
                      style={{
                        background: "var(--accent)",
                        color: "#fff",
                        border: "none",
                        borderRadius: "var(--radius-sm)",
                        padding: "3px 10px",
                        fontSize: "var(--font-xs)",
                        fontWeight: 600,
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Điền nhanh
                    </button>
                  </>
                ) : (
                  <span style={{ color: "#64748b" }}>
                    Chưa có SĐT / địa chỉ trong tài khoản —{" "}
                    <a href="/profile" style={{ color: "var(--accent)" }}>cập nhật hồ sơ</a>
                  </span>
                )}
              </div>
            )}

            <div style={{ borderBottom: "1px solid var(--border-subtle)", paddingBottom: "var(--space-sm)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--space-xs)" }}>
                <span style={{ color: "var(--text-muted)", fontSize: "var(--font-sm)" }}>Tạm tính</span>
                <span>{subtotal.toLocaleString("vi-VN")} ₫</span>
              </div>

              {/* Discount code input */}
              <div style={{ marginTop: "var(--space-sm)" }}>
                <label style={{ fontSize: "var(--font-xs)", color: "var(--text-muted)", marginBottom: 4, display: "block" }}>Mã giảm giá</label>
                {discountApplied ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "var(--radius-sm)", padding: "var(--space-xs) var(--space-sm)" }}>
                    <span style={{ fontSize: "var(--font-sm)", color: "#15803d", fontWeight: 600 }}>
                      ✅ {discountCode} (-{discountAmount.toLocaleString("vi-VN")} ₫)
                    </span>
                    <button type="button" onClick={handleRemoveDiscount} style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: "var(--font-xs)", fontWeight: 600 }}>Bỏ</button>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: "var(--space-xs)" }}>
                    <input
                      type="text"
                      value={discountCode}
                      onChange={(e) => { setDiscountCode(e.target.value.toUpperCase()); setDiscountError(""); }}
                      placeholder="Nhập mã giảm giá"
                      style={{ flex: 1, padding: "6px 10px", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", fontSize: "var(--font-sm)" }}
                    />
                    <button type="button" onClick={handleApplyDiscount} disabled={checkingDiscount || !discountCode.trim()} style={{ background: "var(--accent)", color: "#fff", border: "none", borderRadius: "var(--radius-sm)", padding: "6px 14px", fontSize: "var(--font-sm)", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", opacity: checkingDiscount || !discountCode.trim() ? 0.6 : 1 }}>
                      {checkingDiscount ? "..." : "Áp dụng"}
                    </button>
                  </div>
                )}
                {discountError && <p style={{ color: "#dc2626", fontSize: "var(--font-xs)", margin: "4px 0 0" }}>{discountError}</p>}
              </div>

              {discountApplied && (
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "var(--space-sm)" }}>
                  <span style={{ color: "#15803d", fontSize: "var(--font-sm)", fontWeight: 600 }}>Giảm giá</span>
                  <span style={{ color: "#15803d", fontWeight: 600 }}>-{discountAmount.toLocaleString("vi-VN")} ₫</span>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "var(--space-sm)", paddingTop: "var(--space-sm)", borderTop: "1px solid var(--border-subtle)" }}>
                <strong style={{ fontSize: "var(--font-md)" }}>Tổng cộng</strong>
                <strong style={{ fontSize: "var(--font-md)", color: "var(--accent)" }}>{total.toLocaleString("vi-VN")} ₫</strong>
              </div>
            </div>

            <div className="admin-field">
              <label>Số điện thoại *</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                placeholder="Ví dụ: 0912 345 678"
              />
            </div>

            <div className="admin-field">
              <label>Địa chỉ giao hàng *</label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố"
              />
            </div>

            <button
              type="submit"
              className="primary-button"
              disabled={items.length === 0 || loading}
            >
              {loading ? "Đang xử lý…" : `Đặt hàng · ${total.toLocaleString("vi-VN")} ₫`}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

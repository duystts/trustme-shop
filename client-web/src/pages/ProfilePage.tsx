import React, { useState, useEffect } from "react";
import { isLoggedIn } from "../services/authApi";
import { useNavigate } from "react-router-dom";
import axios from "axios";

type UserProfile = {
  id: number;
  fullName: string;
  email: string;
  phone?: string;
  address?: string;
};

type MsgState = { text: string; type: "success" | "error" } | null;

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();

  // Profile info
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [infoLoading, setInfoLoading] = useState(false);
  const [infoMsg, setInfoMsg] = useState<MsgState>(null);

  // Password
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState<MsgState>(null);

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate("/auth/login");
      return;
    }
    axios.get<UserProfile>("/api/users/me")
      .then((res) => {
        setProfile(res.data);
        setPhone(res.data.phone ?? "");
        setAddress(res.data.address ?? "");
      })
      .catch(() => {
        // fallback to localStorage
        setProfile({
          id: 0,
          fullName: localStorage.getItem("trustme_name") ?? "",
          email: localStorage.getItem("trustme_email") ?? "",
        });
      });
  }, [navigate]);

  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setInfoLoading(true);
    setInfoMsg(null);
    try {
      const res = await axios.put<UserProfile>("/api/users/me", { phone: phone || null, address: address || null });
      setProfile(res.data);
      setInfoMsg({ text: "Cập nhật thông tin thành công!", type: "success" });
    } catch (err: any) {
      const msg = err.response?.data?.message ?? err.response?.data ?? "Cập nhật thất bại.";
      setInfoMsg({ text: typeof msg === "string" ? msg : "Cập nhật thất bại.", type: "error" });
    } finally {
      setInfoLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPwMsg({ text: "Mật khẩu mới không khớp!", type: "error" });
      return;
    }
    setPwLoading(true);
    setPwMsg(null);
    try {
      await axios.put("/api/users/change-password", { oldPassword, newPassword, confirmPassword });
      setPwMsg({ text: "Đổi mật khẩu thành công!", type: "success" });
      setOldPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch (err: any) {
      const msg = err.response?.data?.message ?? err.response?.data ?? "Đổi mật khẩu thất bại.";
      setPwMsg({ text: typeof msg === "string" ? msg : "Đổi mật khẩu thất bại.", type: "error" });
    } finally {
      setPwLoading(false);
    }
  };

  const fieldStyle: React.CSSProperties = {
    padding: "var(--space-sm)",
    borderRadius: "var(--radius-sm)",
    border: "1.5px solid var(--border-subtle)",
    fontSize: "var(--font-sm)",
    fontFamily: "inherit",
    background: "var(--bg)",
    color: "var(--text)",
    width: "100%",
    boxSizing: "border-box",
  };

  const disabledStyle: React.CSSProperties = {
    ...fieldStyle,
    background: "#f3f4f6",
    color: "var(--text-muted)",
    cursor: "not-allowed",
  };

  return (
    <div className="page-container" style={{ maxWidth: 640 }}>
      <div className="page-header" style={{ marginBottom: "var(--space-xl)" }}>
        <h1>Hồ sơ của tôi</h1>
        <p>Quản lý thông tin cá nhân và bảo mật tài khoản</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-lg)" }}>

        {/* ── Section 1: Thông tin tài khoản (read-only) ── */}
        <div style={{ background: "var(--bg-elevated)", padding: "var(--space-xl)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-card)" }}>
          <h3 style={{ margin: "0 0 var(--space-md)", fontSize: "var(--font-lg)" }}>Thông tin tài khoản</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-md)" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2xs)" }}>
              <label style={{ fontSize: "var(--font-sm)", fontWeight: 500 }}>Họ và tên</label>
              <input type="text" value={profile?.fullName ?? ""} disabled style={disabledStyle} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2xs)" }}>
              <label style={{ fontSize: "var(--font-sm)", fontWeight: 500 }}>Email</label>
              <input type="email" value={profile?.email ?? ""} disabled style={disabledStyle} />
            </div>
          </div>
        </div>

        {/* ── Section 2: SĐT & Địa chỉ (editable) ── */}
        <form
          onSubmit={handleSaveInfo}
          style={{ background: "var(--bg-elevated)", padding: "var(--space-xl)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-card)", display: "flex", flexDirection: "column", gap: "var(--space-md)" }}
        >
          <h3 style={{ margin: "0 0 var(--space-xs)", fontSize: "var(--font-lg)" }}>Thông tin giao hàng</h3>
          <p style={{ margin: "0 0 var(--space-sm)", fontSize: "var(--font-sm)", color: "var(--text-muted)" }}>
            Được tự động điền khi thanh toán
          </p>

          {infoMsg && (
            <div style={{
              padding: "var(--space-sm) var(--space-md)",
              borderRadius: "var(--radius-sm)",
              background: infoMsg.type === "success" ? "#d1fae5" : "#fee2e2",
              color: infoMsg.type === "success" ? "#065f46" : "#b91c1c",
              fontWeight: 500,
              fontSize: "var(--font-sm)",
            }}>
              {infoMsg.text}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2xs)" }}>
            <label style={{ fontSize: "var(--font-sm)", fontWeight: 500 }}>Số điện thoại</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Ví dụ: 0912 345 678"
              style={fieldStyle}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2xs)" }}>
            <label style={{ fontSize: "var(--font-sm)", fontWeight: 500 }}>Địa chỉ giao hàng</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố"
              rows={3}
              style={{ ...fieldStyle, resize: "vertical" }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              type="submit"
              className="primary-button"
              disabled={infoLoading}
              style={{ padding: "var(--space-sm) var(--space-xl)" }}
            >
              {infoLoading ? "Đang lưu…" : "Lưu thông tin"}
            </button>
          </div>
        </form>

        {/* ── Section 3: Đổi mật khẩu ── */}
        <form
          onSubmit={handleChangePassword}
          style={{ background: "var(--bg-elevated)", padding: "var(--space-xl)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-card)", display: "flex", flexDirection: "column", gap: "var(--space-md)" }}
        >
          <h3 style={{ margin: "0 0 var(--space-xs)", fontSize: "var(--font-lg)" }}>Đổi mật khẩu</h3>

          {pwMsg && (
            <div style={{
              padding: "var(--space-sm) var(--space-md)",
              borderRadius: "var(--radius-sm)",
              background: pwMsg.type === "success" ? "#d1fae5" : "#fee2e2",
              color: pwMsg.type === "success" ? "#065f46" : "#b91c1c",
              fontWeight: 500,
              fontSize: "var(--font-sm)",
            }}>
              {pwMsg.text}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2xs)" }}>
            <label style={{ fontSize: "var(--font-sm)", fontWeight: 500 }}>Mật khẩu hiện tại</label>
            <input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} placeholder="•••••••••" style={fieldStyle} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2xs)" }}>
            <label style={{ fontSize: "var(--font-sm)", fontWeight: 500 }}>Mật khẩu mới</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="•••••••••" style={fieldStyle} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2xs)" }}>
            <label style={{ fontSize: "var(--font-sm)", fontWeight: 500 }}>Xác nhận mật khẩu mới</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="•••••••••" style={fieldStyle} />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              type="submit"
              className="primary-button"
              style={{ padding: "var(--space-sm) var(--space-xl)" }}
              disabled={pwLoading || !oldPassword || !newPassword || !confirmPassword}
            >
              {pwLoading ? "Đang lưu…" : "Đổi mật khẩu"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

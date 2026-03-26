import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login, register, saveAuthData } from "../services/authApi";

type Tab = "login" | "register";

export const AuthPage: React.FC = () => {
  const [tab, setTab] = useState<Tab>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const reset = () => { setError(""); setSuccess(""); };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    reset();
    setLoading(true);
    try {
      const res = await login({ email, password });
      saveAuthData(res);
      navigate("/");
    } catch {
      setError("Sai email hoặc mật khẩu. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    reset();
    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }
    setLoading(true);
    try {
      const res = await register({ fullName, email, password, confirmPassword, phone });
      saveAuthData(res);
      navigate("/");
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.response?.data?.validationErrors
        ? Object.values(err.response.data.validationErrors as Record<string, string>).join(", ")
        : "Email đã được sử dụng hoặc có lỗi xảy ra.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-logo">trustme-shop</Link>

        <div className="auth-tabs" role="tablist">
          <button role="tab" aria-selected={tab === "login"}
            className={`auth-tab${tab === "login" ? " active" : ""}`}
            onClick={() => { setTab("login"); reset(); }}>
            Đăng nhập
          </button>
          <button role="tab" aria-selected={tab === "register"}
            className={`auth-tab${tab === "register" ? " active" : ""}`}
            onClick={() => { setTab("register"); reset(); }}>
            Đăng ký
          </button>
        </div>

        {error   && <div className="auth-alert error">{error}</div>}
        {success && <div className="auth-alert success">{success}</div>}

        {tab === "login" && (
          <form className="auth-form" onSubmit={handleLogin} noValidate>
            <div className="form-group">
              <label htmlFor="login-email">Email</label>
              <input id="login-email" type="email" placeholder="you@example.com"
                value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
            </div>
            <div className="form-group">
              <label htmlFor="login-password">Mật khẩu</label>
              <input id="login-password" type="password" placeholder="•••••••••"
                value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <button id="obj-login-submit" type="submit" className="auth-submit primary-button" disabled={loading}>
              {loading ? "Đang đăng nhập…" : "Đăng nhập"}
            </button>
          </form>
        )}

        {tab === "register" && (
          <form className="auth-form" onSubmit={handleRegister} noValidate>
            <div className="form-group">
              <label htmlFor="reg-name">Họ tên</label>
              <input id="reg-name" type="text" placeholder="Nguyễn Văn A"
                value={fullName} onChange={(e) => setFullName(e.target.value)} required autoFocus />
            </div>
            <div className="form-group">
              <label htmlFor="reg-email">Email</label>
              <input id="reg-email" type="email" placeholder="you@example.com"
                value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label htmlFor="reg-phone">Số điện thoại</label>
              <input id="reg-phone" type="tel" placeholder="0912345678"
                value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </div>
            <div className="form-group">
              <label htmlFor="reg-password">Mật khẩu</label>
              <input id="reg-password" type="password" placeholder="Ít nhất 6 ký tự, có chữ và số"
                value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <div className="form-group">
              <label htmlFor="reg-confirm">Xác nhận mật khẩu</label>
              <input id="reg-confirm" type="password" placeholder="Nhập lại mật khẩu"
                value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            </div>
            <button id="obj-register-submit" type="submit" className="auth-submit primary-button" disabled={loading}>
              {loading ? "Đang đăng ký…" : "Tạo tài khoản"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

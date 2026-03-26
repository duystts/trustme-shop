import axios from "axios";

export type LoginRequest = {
  email: string;
  password: string;
};

export type AuthResponse = {
  token: string;
  userId: number;
  email: string;
  fullName: string;
  role: string;
};

export type RegisterRequest = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  address?: string;
};

export async function login(data: LoginRequest): Promise<AuthResponse> {
  const res = await axios.post("/api/auth/login", data);
  return res.data;
}

export async function register(data: RegisterRequest): Promise<AuthResponse> {
  const res = await axios.post("/api/auth/register", data);
  return res.data;
}

export async function forgotPassword(email: string): Promise<void> {
  await axios.post("/api/auth/forgot-password", { email });
}

export async function verifyPin(email: string, pin: string, newPassword: string): Promise<void> {
  await axios.post("/api/auth/verify-pin", { email, pin, newPassword });
}

// Token helpers
export const TOKEN_KEY = "trustme_token";
export const AUTH_EVENT = "trustme_auth_change";

export function saveAuthData(data: AuthResponse) {
  localStorage.setItem(TOKEN_KEY, data.token);
  localStorage.setItem("trustme_user_id", String(data.userId));
  localStorage.setItem("trustme_role", data.role);
  localStorage.setItem("trustme_email", data.email);
  localStorage.setItem("trustme_name", data.fullName);
  axios.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem("trustme_role");
  localStorage.removeItem("trustme_user_id");
  localStorage.removeItem("trustme_name");
  localStorage.removeItem("trustme_email");
  delete axios.defaults.headers.common["Authorization"];
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

export function isAdmin(): boolean {
  const role = localStorage.getItem("trustme_role");
  return role === "ADMIN" || role === "MANAGER";
}

export function initAuth() {
  const token = getToken();
  if (token) {
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  }
}

import axios from "axios";
import { Order } from "./adminApi";

export type CreateOrderRequest = {
  address: string;
  discountCode?: string;
  items: { productId: number; quantity: number; size?: string }[];
};

function getUserId(): number | null {
  const idStr = localStorage.getItem("trustme_user_id");
  return idStr ? parseInt(idStr, 10) : null;
}

// Remote Cart APIs
export async function getCartItems() {
  const userId = getUserId();
  if (!userId) return [];
  try {
    const res = await axios.get(`/api/cart/user/${userId}`);
    return res.data;
  } catch (err) {
    return [];
  }
}

export async function addToCart(item: any) {
  const userId = getUserId();
  if (!userId) {
    alert("Vui lòng đăng nhập trước khi thêm vào giỏ hàng!");
    return;
  }
  // The backend API: POST /api/cart/user/{userId}/add?productId=...&quantity=...
  try {
    await axios.post(`/api/cart/user/${userId}/add`, null, {
      params: {
        productId: item.product.id,
        quantity: item.quantity
      }
    });
  } catch (err) {
    console.error("Failed to add to cart", err);
  }
}

export async function clearCart() {
  const userId = getUserId();
  if (!userId) return;
  try {
    await axios.delete(`/api/cart/user/${userId}/clear`);
  } catch (err) {}
}

// Remote Order APIs
export async function createOrder(data: CreateOrderRequest) {
  const userId = getUserId();
  if (!userId) throw new Error("Not logged in");

  const params: Record<string, string> = { shippingAddress: data.address };
  if (data.discountCode) params.discountCode = data.discountCode;

  const res = await axios.post(`/api/orders/user/${userId}`, null, { params });
  return res.data;
}

// ── Payment gateway ────────────────────────────────────────────────────────

export type PaymentMethod = "COD" | "VNPAY" | "MOMO";

export type PaymentInitResponse = {
  orderId: number;
  paymentMethod: PaymentMethod;
  paymentUrl: string | null;
  status: "PENDING" | "CONFIRMED";
};

export type PaymentStatus = {
  id: number;
  paymentMethod: string;
  paymentStatus: string;
  paymentDate: string | null;
  transactionId: string | null;
};

export async function initPayment(orderId: number, paymentMethod: PaymentMethod): Promise<PaymentInitResponse> {
  const res = await axios.post("/api/payments/initiate", { orderId, paymentMethod });
  return res.data;
}

export async function getPaymentStatus(orderId: number): Promise<PaymentStatus> {
  const res = await axios.get(`/api/payments/status/${orderId}`);
  return res.data;
}

// Validate discount code against order total
export async function validateDiscount(code: string, orderTotal: number): Promise<{ code: string; discountAmount: number }> {
  const res = await axios.post("/api/discounts/validate", null, {
    params: { code, orderTotal },
  });
  return res.data;
}

// Get public notifications
export type PublicNotification = {
  id: number;
  title: string;
  message: string;
  type: "INFO" | "PROMO" | "DISCOUNT";
  createdAt: string;
};

export async function getNotifications(): Promise<PublicNotification[]> {
  const res = await axios.get("/api/notifications");
  return res.data;
}

export async function getMyOrders(): Promise<Order[]> {
  const userId = getUserId();
  if (!userId) return [];
  try {
    const res = await axios.get(`/api/orders/user/${userId}`);
    return res.data;
  } catch (err) {
    return [];
  }
}

// Keeping empty stub for compatibility if called locally
export function saveMockOrder(amount: number) {}

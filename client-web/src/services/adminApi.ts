import axios from "axios";
import type { Product, Category } from "./productApi";

// ---- Order types (matching backend Order entity) ----
export type OrderUser = {
  id: number;
  fullName: string;
  email: string;
};

export type OrderStatus = "PENDING" | "SHIPPING" | "DELIVERED" | "CANCELLED";

export type Order = {
  id: number;
  user: OrderUser;
  totalMoney: number;
  status: OrderStatus;
  shippingAddress: string;
  orderDate: string;
};

export type DashboardStats = {
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  pendingOrders: number;
};

// ---- Orders ----
export async function getOrders(): Promise<Order[]> {
  const res = await axios.get("/api/orders");
  return res.data;
}

export async function updateOrderStatus(id: number, status: OrderStatus): Promise<void> {
  await axios.put(`/api/orders/${id}/status`, null, { params: { status } });
}

// ---- Products (admin CRUD) ----
export type ProductInput = {
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  categoryIds?: number[];
};

export async function createProduct(data: ProductInput): Promise<Product> {
  const res = await axios.post("/api/products", data);
  return res.data;
}

export async function createProductWithImages(data: ProductInput, images: File[]): Promise<Product> {
  const form = new FormData();
  form.append("product", new Blob([JSON.stringify(data)], { type: "application/json" }));
  images.forEach((file) => form.append("images", file));
  const res = await axios.post("/api/products/with-images", form);
  return res.data;
}

export async function updateProduct(id: number, data: ProductInput): Promise<Product> {
  const res = await axios.put(`/api/products/${id}`, data);
  return res.data;
}

export async function deleteProduct(id: number): Promise<void> {
  await axios.delete(`/api/products/${id}`);
}

// ---- Categories (admin CRUD) ----
export type { Category };

export async function getAdminCategories(): Promise<Category[]> {
  const res = await axios.get("/api/categories");
  return res.data;
}

export async function createCategory(data: { name: string; description?: string }): Promise<Category> {
  const res = await axios.post("/api/categories", data);
  return res.data;
}

export async function updateCategory(id: number, data: { name: string; description?: string }): Promise<Category> {
  const res = await axios.put(`/api/categories/${id}`, data);
  return res.data;
}

export async function deleteCategory(id: number): Promise<void> {
  await axios.delete(`/api/categories/${id}`);
}

// ---- User management (ADMIN only) ----
export type AdminUser = {
  id: number;
  fullName: string;
  email: string;
  phone?: string;
  address?: string;
  role: "ADMIN" | "MANAGER" | "CUSTOMER";
};

export async function getAdminUsers(): Promise<AdminUser[]> {
  const res = await axios.get("/api/users");
  return res.data;
}

export async function changeUserRole(id: number, role: "MANAGER" | "CUSTOMER"): Promise<AdminUser> {
  const res = await axios.put(`/api/users/${id}/role`, null, { params: { role } });
  return res.data;
}

// ---- Product CSV import ----
export type ImportError = { row: number; message: string };
export type ImportResult = { success: number; failed: number; errors: ImportError[] };

export async function importProductsCsv(file: File): Promise<ImportResult> {
  const form = new FormData();
  form.append("file", file);
  const res = await axios.post("/api/products/import/csv", form);
  return res.data;
}

export async function importProductsExcel(file: File): Promise<ImportResult> {
  const form = new FormData();
  form.append("file", file);
  const res = await axios.post("/api/products/import/excel", form);
  return res.data;
}

export function getImportTemplateUrl(): string {
  return "/api/products/import/template";
}

export function getImportExcelTemplateUrl(): string {
  return "/api/products/import/template/excel";
}

// ---- Product images ----
export type ProductImage = {
  id: number;
  imageUrl: string;
  publicId?: string;
};

export async function getProductImages(productId: number): Promise<ProductImage[]> {
  const res = await axios.get(`/api/product-images/product/${productId}`);
  return res.data;
}

export async function uploadProductImage(productId: number, file: File): Promise<ProductImage> {
  const form = new FormData();
  form.append("file", file);
  const res = await axios.post(`/api/product-images/product/${productId}`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function deleteProductImage(imageId: number): Promise<void> {
  await axios.delete(`/api/product-images/${imageId}`);
}

// ---- Notifications (admin CRUD) ----
export type Notification = {
  id: number;
  title: string;
  message: string;
  type: "INFO" | "PROMO" | "DISCOUNT";
  active: boolean;
  expiresAt?: string;
  createdAt: string;
};

export async function getAdminNotifications(): Promise<Notification[]> {
  const res = await axios.get("/api/notifications/all");
  return res.data;
}

export async function createNotification(data: Partial<Notification>): Promise<Notification> {
  const res = await axios.post("/api/notifications", data);
  return res.data;
}

export async function updateNotification(id: number, data: Partial<Notification>): Promise<Notification> {
  const res = await axios.put(`/api/notifications/${id}`, data);
  return res.data;
}

export async function deleteNotification(id: number): Promise<void> {
  await axios.delete(`/api/notifications/${id}`);
}

// ---- Discounts (admin CRUD) ----
export type DiscountItem = {
  id: number;
  code: string;
  description?: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  minOrderValue: number;
  maxDiscount?: number;
  startDate?: string;
  endDate?: string;
  usageLimit?: number;
  usedCount: number;
  active: boolean;
  createdAt: string;
};

export async function getAdminDiscounts(): Promise<DiscountItem[]> {
  const res = await axios.get("/api/discounts");
  return res.data;
}

export async function createDiscount(data: Partial<DiscountItem>): Promise<DiscountItem> {
  const res = await axios.post("/api/discounts", data);
  return res.data;
}

export async function updateDiscount(id: number, data: Partial<DiscountItem>): Promise<DiscountItem> {
  const res = await axios.put(`/api/discounts/${id}`, data);
  return res.data;
}

export async function deleteDiscount(id: number): Promise<void> {
  await axios.delete(`/api/discounts/${id}`);
}

// ---- Dashboard stats (computed from existing endpoints) ----
export async function getDashboardStats(): Promise<DashboardStats> {
  const [ordersRes, productsRes] = await Promise.all([
    axios.get<Order[]>("/api/orders"),
    axios.get("/api/products", { params: { page: 0, size: 1 } }),
  ]);

  const orders: Order[] = ordersRes.data;
  const totalProducts: number = productsRes.data.totalElements ?? 0;

  return {
    totalOrders: orders.length,
    totalRevenue: orders.reduce((sum, o) => sum + (o.totalMoney ?? 0), 0),
    totalProducts,
    pendingOrders: orders.filter((o) => o.status === "PENDING").length,
  };
}

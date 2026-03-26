import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  getDashboardStats,
  getOrders,
  updateOrderStatus,
  createProduct,
  createProductWithImages,
  updateProduct,
  importProductsCsv,
  importProductsExcel,
  getImportTemplateUrl,
  getImportExcelTemplateUrl,
  ImportResult,
  deleteProduct,
  getAdminCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getAdminUsers,
  changeUserRole,
  getProductImages,
  uploadProductImage,
  deleteProductImage,
  getAdminNotifications,
  createNotification,
  updateNotification,
  deleteNotification,
  getAdminDiscounts,
  createDiscount,
  updateDiscount,
  deleteDiscount,
  DashboardStats,
  Order,
  OrderStatus,
  ProductInput,
  ProductImage,
  Category,
  AdminUser,
  Notification,
  DiscountItem,
} from "../services/adminApi";
import { getPagedProducts, ProductPage, Product } from "../services/productApi";
import { clearToken, isLoggedIn, isAdmin } from "../services/authApi";

type AdminTab = "dashboard" | "orders" | "products" | "categories" | "users" | "notifications" | "discounts";

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Chờ xử lý",
  SHIPPING: "Đang giao",
  DELIVERED: "Đã giao",
  CANCELLED: "Đã hủy",
};

const STATUS_NEXT: Partial<Record<OrderStatus, OrderStatus>> = {
  PENDING: "SHIPPING",
  SHIPPING: "DELIVERED",
};

export const AdminPage: React.FC = () => {
  const [tab, setTab] = useState<AdminTab>("dashboard");
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate("/auth/login");
    } else if (!isAdmin()) {
      navigate("/");
    }
  }, [navigate]);

  const handleLogout = () => {
    clearToken();
    navigate("/");
  };

  return (
    <div className="admin-root">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span className="admin-brand-icon">🛍️</span>
          <span>Admin Panel</span>
        </div>
        <nav className="admin-nav">
          {([
            { key: "dashboard",  label: "📊 Dashboard" },
            { key: "orders",     label: "📦 Đơn hàng" },
            { key: "products",   label: "👗 Sản phẩm" },
            { key: "categories", label: "🏷️ Danh mục" },
            { key: "users",          label: "👥 Người dùng" },
            { key: "notifications", label: "🔔 Thông báo" },
            { key: "discounts",     label: "🏷️ Mã giảm giá" },
          ] as { key: AdminTab; label: string }[]).map(({ key, label }) => (
            <button
              key={key}
              className={`admin-nav-item${tab === key ? " active" : ""}`}
              onClick={() => setTab(key)}
            >
              {label}
            </button>
          ))}
        </nav>
        <button className="admin-logout ghost-button" onClick={handleLogout}>
          Đăng xuất
        </button>
      </aside>

      <main className="admin-main">
        {tab === "dashboard"  && <DashboardTab />}
        {tab === "orders"     && <OrdersTab />}
        {tab === "products"   && <ProductsTab />}
        {tab === "categories" && <CategoriesTab />}
        {tab === "users"          && <UsersTab />}
        {tab === "notifications" && <NotificationsTab />}
        {tab === "discounts"     && <DiscountsTab />}
      </main>
    </div>
  );
};

/* ───────────────────────────────────────────────
   Dashboard Tab
─────────────────────────────────────────────── */
const DashboardTab: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch(() => setStats({ totalOrders: 0, totalRevenue: 0, totalProducts: 0, pendingOrders: 0 }))
      .finally(() => setLoading(false));
  }, []);

  const cards = stats
    ? [
        { label: "Tổng đơn hàng",  value: stats.totalOrders.toLocaleString(),                  icon: "📦" },
        { label: "Doanh thu",        value: `${stats.totalRevenue.toLocaleString("vi-VN")} ₫`,  icon: "💰" },
        { label: "Sản phẩm",         value: stats.totalProducts.toLocaleString(),                icon: "👗" },
        { label: "Chờ xác nhận",    value: stats.pendingOrders.toLocaleString(),                 icon: "⏳" },
      ]
    : [];

  return (
    <div>
      <h1 className="admin-page-title">Dashboard</h1>
      {loading ? (
        <div className="admin-stat-grid">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="admin-stat-card skeleton-card">
              <div className="skeleton-line" style={{ height: 20, width: "60%" }} />
              <div className="skeleton-line" style={{ height: 36, width: "40%", marginTop: 8 }} />
            </div>
          ))}
        </div>
      ) : (
        <div className="admin-stat-grid">
          {cards.map((c) => (
            <div key={c.label} className="admin-stat-card">
              <span className="admin-stat-icon">{c.icon}</span>
              <span className="admin-stat-label">{c.label}</span>
              <span className="admin-stat-value">{c.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ───────────────────────────────────────────────
   Orders Tab
─────────────────────────────────────────────── */
const OrdersTab: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState<number | null>(null);
  const [filter, setFilter] = useState<OrderStatus | "ALL">("ALL");

  const load = useCallback(() => {
    setLoading(true);
    getOrders()
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleNext = (order: Order) => {
    const next = STATUS_NEXT[order.status];
    if (!next) return;
    setUpdating(order.id);
    updateOrderStatus(order.id, next).then(load).finally(() => setUpdating(null));
  };

  const handleCancel = (order: Order) => {
    if (!confirm(`Hủy đơn #${order.id}?`)) return;
    setUpdating(order.id);
    updateOrderStatus(order.id, "CANCELLED").then(load).finally(() => setUpdating(null));
  };

  const visible = filter === "ALL" ? orders : orders.filter((o) => o.status === filter);

  return (
    <div>
      <div className="admin-toolbar">
        <h1 className="admin-page-title">Quản lý Đơn hàng</h1>
        <select
          className="admin-filter-select"
          value={filter}
          onChange={(e) => setFilter(e.target.value as OrderStatus | "ALL")}
        >
          <option value="ALL">Tất cả</option>
          {(Object.keys(STATUS_LABELS) as OrderStatus[]).map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="skeleton-line" style={{ height: 200, borderRadius: "var(--radius-md)" }} />
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Khách hàng</th>
                <th>Tổng tiền</th>
                <th>Ngày đặt</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((o) => (
                <tr key={o.id}>
                  <td>#{o.id}</td>
                  <td>
                    <div>{o.user?.fullName ?? "—"}</div>
                    <div style={{ fontSize: "var(--font-xs)", color: "var(--text-muted)" }}>{o.user?.email}</div>
                  </td>
                  <td>{(o.totalMoney ?? 0).toLocaleString("vi-VN")} ₫</td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    {o.orderDate ? new Date(o.orderDate).toLocaleDateString("vi-VN") : "—"}
                  </td>
                  <td>
                    <span className={`order-badge status-${o.status.toLowerCase()}`}>
                      {STATUS_LABELS[o.status] ?? o.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "var(--space-xs)" }}>
                      {STATUS_NEXT[o.status] && (
                        <button
                          className="primary-button"
                          style={{ fontSize: "var(--font-xs)", padding: "0.25rem 0.6rem" }}
                          disabled={updating === o.id}
                          onClick={() => handleNext(o)}
                        >
                          {updating === o.id ? "…" : `→ ${STATUS_LABELS[STATUS_NEXT[o.status]!]}`}
                        </button>
                      )}
                      {o.status === "PENDING" && (
                        <button
                          className="danger-button"
                          disabled={updating === o.id}
                          onClick={() => handleCancel(o)}
                        >
                          Hủy
                        </button>
                      )}
                      {o.status !== "PENDING" && !STATUS_NEXT[o.status] && (
                        <span style={{ color: "var(--text-muted)", fontSize: "var(--font-xs)" }}>—</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ color: "var(--text-muted)", textAlign: "center" }}>
                    Không có đơn hàng nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

/* ───────────────────────────────────────────────
   Products Tab
─────────────────────────────────────────────── */
type ProductFormState = {
  name: string;
  description: string;
  price: string;
  stockQuantity: string;
  categoryIds: number[];
  selectedFiles: File[];
};

const emptyProductForm = (): ProductFormState => ({
  name: "", description: "", price: "", stockQuantity: "0", categoryIds: [], selectedFiles: [],
});

const ProductsTab: React.FC = () => {
  const [data, setData] = useState<ProductPage | null>(null);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [savedProductId, setSavedProductId] = useState<number | null>(null);
  const [form, setForm] = useState<ProductFormState>(emptyProductForm());
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  // Image state
  const [images, setImages] = useState<ProductImage[]>([]);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [deletingImg, setDeletingImg] = useState<number | null>(null);

  // Import CSV state
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const loadProducts = useCallback(() => {
    setLoading(true);
    getPagedProducts({ page, size: 10, sort: "createdAt,desc" })
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { loadProducts(); }, [loadProducts]);
  useEffect(() => { getAdminCategories().then(setCategories).catch(() => {}); }, []);

  const loadImages = (productId: number) => {
    getProductImages(productId).then(setImages).catch(() => setImages([]));
  };

  const openAdd = () => {
    setEditing(null);
    setSavedProductId(null);
    setImages([]);
    setForm(emptyProductForm());
    setShowModal(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setSavedProductId(p.id);
    setForm({
      name: p.name,
      description: p.description ?? "",
      price: String(p.price),
      stockQuantity: String(p.stockQuantity ?? 0),
      categoryIds: p.categories?.map((c) => c.id) ?? [],
      selectedFiles: [],
    });
    loadImages(p.id);
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditing(null); setSavedProductId(null); setImages([]); };

  const toggleCategory = (id: number) => {
    setForm((f) => ({
      ...f,
      categoryIds: f.categoryIds.includes(id)
        ? f.categoryIds.filter((c) => c !== id)
        : [...f.categoryIds, id],
    }));
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.price) return;
    setSaving(true);
    const payload: ProductInput = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: parseFloat(form.price),
      stockQuantity: parseInt(form.stockQuantity) || 0,
      categoryIds: form.categoryIds,
    };
    try {
      if (editing) {
        await updateProduct(editing.id, payload);
        // upload any newly selected images for edit
        if (form.selectedFiles.length > 0) {
          await Promise.all(form.selectedFiles.map((f) => uploadProductImage(editing.id, f)));
          loadImages(editing.id);
        }
        closeModal();
        loadProducts();
      } else {
        let created;
        if (form.selectedFiles.length > 0) {
          created = await createProductWithImages(payload, form.selectedFiles);
        } else {
          created = await createProduct(payload);
        }
        setSavedProductId(created.id);
        loadImages(created.id);
        loadProducts();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !savedProductId) return;
    e.target.value = "";
    setUploadingImg(true);
    try {
      await uploadProductImage(savedProductId, file);
      loadImages(savedProductId);
    } finally {
      setUploadingImg(false);
    }
  };

  const handleDeleteImage = async (imgId: number) => {
    setDeletingImg(imgId);
    try {
      await deleteProductImage(imgId);
      setImages((prev) => prev.filter((i) => i.id !== imgId));
    } finally {
      setDeletingImg(null);
    }
  };

  const handleImportCsv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setImporting(true);
    try {
      const result = await importProductsCsv(file);
      setImportResult(result);
      if (result.success > 0) loadProducts();
    } finally {
      setImporting(false);
    }
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setImporting(true);
    try {
      const result = await importProductsExcel(file);
      setImportResult(result);
      if (result.success > 0) loadProducts();
    } finally {
      setImporting(false);
    }
  };

  const handleDelete = async (p: Product) => {
    if (!confirm(`Xóa sản phẩm "${p.name}"?`)) return;
    setDeleting(p.id);
    try {
      await deleteProduct(p.id);
      loadProducts();
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div>
      <div className="admin-toolbar">
        <h1 className="admin-page-title" style={{ margin: 0 }}>Quản lý Sản phẩm</h1>
        <div style={{ display: "flex", gap: "var(--space-sm)", alignItems: "center" }}>
          {/* CSV */}
          <a
            href={getImportTemplateUrl()}
            className="ghost-button"
            style={{ fontSize: "var(--font-xs)", padding: "0.4rem 0.8rem", textDecoration: "none" }}
          >
            ↓ Template CSV
          </a>
          <label style={{ cursor: importing ? "not-allowed" : "pointer", opacity: importing ? 0.6 : 1 }}>
            <span className="ghost-button" style={{ fontSize: "var(--font-xs)", padding: "0.4rem 0.8rem", display: "inline-block" }}>
              {importing ? "Đang import…" : "📥 CSV"}
            </span>
            <input type="file" accept=".csv,text/csv" style={{ display: "none" }} disabled={importing} onChange={handleImportCsv} />
          </label>
          {/* Excel */}
          <a
            href={getImportExcelTemplateUrl()}
            className="ghost-button"
            style={{ fontSize: "var(--font-xs)", padding: "0.4rem 0.8rem", textDecoration: "none" }}
          >
            ↓ Template Excel
          </a>
          <label style={{ cursor: importing ? "not-allowed" : "pointer", opacity: importing ? 0.6 : 1 }}>
            <span className="ghost-button" style={{ fontSize: "var(--font-xs)", padding: "0.4rem 0.8rem", display: "inline-block", color: "var(--color-success, #16a34a)" }}>
              {importing ? "Đang import…" : "📊 Excel"}
            </span>
            <input type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" style={{ display: "none" }} disabled={importing} onChange={handleImportExcel} />
          </label>
          <button className="primary-button" onClick={openAdd}>+ Thêm sản phẩm</button>
        </div>
      </div>

      {loading ? (
        <div className="skeleton-line" style={{ height: 200, borderRadius: "var(--radius-md)" }} />
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Tên sản phẩm</th>
                <th>Giá</th>
                <th>Tồn kho</th>
                <th>Danh mục</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {data?.content.map((p) => (
                <tr key={p.id}>
                  <td>#{p.id}</td>
                  <td>{p.name}</td>
                  <td>{p.price.toLocaleString("vi-VN")} ₫</td>
                  <td>{p.stockQuantity ?? "—"}</td>
                  <td style={{ fontSize: "var(--font-xs)", color: "var(--text-muted)" }}>
                    {p.categories?.map((c) => c.name).join(", ") || "—"}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "var(--space-xs)" }}>
                      <button
                        className="ghost-button"
                        style={{ fontSize: "var(--font-xs)", padding: "0.2rem 0.6rem" }}
                        onClick={() => openEdit(p)}
                      >
                        Sửa
                      </button>
                      <button
                        className="danger-button"
                        disabled={deleting === p.id}
                        onClick={() => handleDelete(p)}
                      >
                        {deleting === p.id ? "…" : "Xóa"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {data?.content.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ color: "var(--text-muted)", textAlign: "center" }}>
                    Chưa có sản phẩm nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {data && data.totalPages > 1 && (
        <div className="pagination" style={{ marginTop: "var(--space-md)" }}>
          <button disabled={page === 0} onClick={() => setPage((p) => p - 1)}>← Trước</button>
          <span style={{ color: "var(--text-muted)" }}>{page + 1} / {data.totalPages}</span>
          <button disabled={page >= data.totalPages - 1} onClick={() => setPage((p) => p + 1)}>Tiếp →</button>
        </div>
      )}

      {importResult && (
        <div className="admin-modal-overlay" onClick={() => setImportResult(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <h2 className="admin-modal-title">Kết quả Import CSV</h2>
            <div style={{ display: "flex", gap: "var(--space-lg)", marginBottom: "var(--space-md)" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--color-success, #16a34a)" }}>
                  {importResult.success}
                </div>
                <div style={{ fontSize: "var(--font-xs)", color: "var(--text-muted)" }}>Thành công</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "2rem", fontWeight: 700, color: importResult.failed > 0 ? "var(--color-danger, #dc2626)" : "var(--text-muted)" }}>
                  {importResult.failed}
                </div>
                <div style={{ fontSize: "var(--font-xs)", color: "var(--text-muted)" }}>Thất bại</div>
              </div>
            </div>
            {importResult.errors.length > 0 && (
              <div style={{ maxHeight: 240, overflowY: "auto", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
                <table className="admin-table" style={{ marginBottom: 0 }}>
                  <thead><tr><th>Dòng</th><th>Lỗi</th></tr></thead>
                  <tbody>
                    {importResult.errors.map((err, i) => (
                      <tr key={i}>
                        <td style={{ whiteSpace: "nowrap" }}>#{err.row}</td>
                        <td style={{ color: "var(--color-danger, #dc2626)", fontSize: "var(--font-xs)" }}>{err.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="admin-modal-footer">
              <button className="primary-button" onClick={() => setImportResult(null)}>Đóng</button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="admin-modal-overlay" onClick={closeModal}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="admin-modal-title">{editing ? "Sửa sản phẩm" : "Thêm sản phẩm"}</h2>

            <div className="admin-field">
              <label>Tên sản phẩm *</label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Nhập tên sản phẩm"
              />
            </div>

            <div className="admin-field">
              <label>Mô tả</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Nhập mô tả sản phẩm"
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-md)" }}>
              <div className="admin-field">
                <label>Giá (₫) *</label>
                <input
                  type="number"
                  min="0"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  placeholder="0"
                />
              </div>
              <div className="admin-field">
                <label>Tồn kho</label>
                <input
                  type="number"
                  min="0"
                  value={form.stockQuantity}
                  onChange={(e) => setForm((f) => ({ ...f, stockQuantity: e.target.value }))}
                  placeholder="0"
                />
              </div>
            </div>

            {categories.length > 0 && (
              <div className="admin-field">
                <label>Danh mục</label>
                <div className="admin-category-checks">
                  {categories.map((c) => (
                    <label key={c.id} className="admin-category-check">
                      <input
                        type="checkbox"
                        checked={form.categoryIds.includes(c.id)}
                        onChange={() => toggleCategory(c.id)}
                      />
                      {c.name}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* New image picker — always visible in form */}
            <div className="admin-field">
              <label>Ảnh sản phẩm {editing ? "(thêm ảnh mới)" : "(tùy chọn)"}</label>
              <label
                style={{
                  display: "inline-flex", alignItems: "center", gap: "var(--space-xs)",
                  cursor: "pointer", padding: "0.3rem 0.8rem",
                  border: "1px dashed var(--border)", borderRadius: "var(--radius-sm)",
                  fontSize: "var(--font-xs)", color: "var(--text-muted)",
                }}
              >
                + Chọn ảnh (nhiều file)
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const files = Array.from(e.target.files ?? []);
                    setForm((f) => ({ ...f, selectedFiles: [...f.selectedFiles, ...files] }));
                    e.target.value = "";
                  }}
                />
              </label>
              {form.selectedFiles.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-sm)", marginTop: "var(--space-sm)" }}>
                  {form.selectedFiles.map((file, idx) => (
                    <div key={idx} style={{ position: "relative", width: 72, height: 72 }}>
                      <img
                        src={URL.createObjectURL(file)}
                        alt=""
                        style={{ width: 72, height: 72, objectFit: "cover", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}
                      />
                      <button
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, selectedFiles: f.selectedFiles.filter((_, i) => i !== idx) }))}
                        style={{
                          position: "absolute", top: 2, right: 2,
                          background: "rgba(220,38,38,0.85)", color: "#fff",
                          border: "none", borderRadius: "50%", width: 18, height: 18,
                          cursor: "pointer", fontSize: 11, lineHeight: "18px", padding: 0,
                        }}
                      >×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Existing images — shown when editing or after new product created */}
            {savedProductId && (
              <div className="admin-field">
                <label>Ảnh sản phẩm</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-sm)", marginBottom: "var(--space-sm)" }}>
                  {images.map((img) => (
                    <div key={img.id} style={{ position: "relative", width: 80, height: 80 }}>
                      <img
                        src={img.imageUrl}
                        alt=""
                        style={{ width: 80, height: 80, objectFit: "cover", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}
                      />
                      <button
                        onClick={() => handleDeleteImage(img.id)}
                        disabled={deletingImg === img.id}
                        style={{
                          position: "absolute", top: 2, right: 2,
                          background: "rgba(220,38,38,0.85)", color: "#fff",
                          border: "none", borderRadius: "50%", width: 20, height: 20,
                          cursor: "pointer", fontSize: 11, lineHeight: "20px", padding: 0,
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {images.length === 0 && (
                    <span style={{ fontSize: "var(--font-xs)", color: "var(--text-muted)" }}>Chưa có ảnh</span>
                  )}
                </div>
                <label
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "var(--space-xs)",
                    cursor: uploadingImg ? "not-allowed" : "pointer",
                    padding: "0.3rem 0.8rem",
                    border: "1px dashed var(--border)",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "var(--font-xs)",
                    color: "var(--text-muted)",
                    opacity: uploadingImg ? 0.6 : 1,
                  }}
                >
                  {uploadingImg ? "Đang tải…" : "+ Thêm ảnh"}
                  <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageUpload} disabled={uploadingImg} />
                </label>
              </div>
            )}

            <div className="admin-modal-footer">
              <button className="ghost-button" onClick={closeModal} disabled={saving}>
                {savedProductId && !editing ? "Đóng" : "Hủy"}
              </button>
              {(!savedProductId || editing) && (
                <button className="primary-button" onClick={handleSave} disabled={saving || !form.name || !form.price}>
                  {saving ? "Đang lưu…" : editing ? "Cập nhật" : "Tạo sản phẩm"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ───────────────────────────────────────────────
   Categories Tab
─────────────────────────────────────────────── */
type CatForm = { name: string; description: string };
const emptyCatForm = (): CatForm => ({ name: "", description: "" });

const CategoriesTab: React.FC = () => {
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<CatForm>(emptyCatForm());
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    getAdminCategories().then(setCats).catch(() => setCats([])).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setEditing(null); setForm(emptyCatForm()); setShowModal(true); };

  const openEdit = (c: Category) => {
    setEditing(c);
    setForm({ name: c.name, description: c.description ?? "" });
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditing(null); };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await updateCategory(editing.id, { name: form.name.trim(), description: form.description.trim() || undefined });
      } else {
        await createCategory({ name: form.name.trim(), description: form.description.trim() || undefined });
      }
      closeModal();
      load();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (c: Category) => {
    if (!confirm(`Xóa danh mục "${c.name}"?`)) return;
    setDeleting(c.id);
    try {
      await deleteCategory(c.id);
      load();
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div>
      <div className="admin-toolbar">
        <h1 className="admin-page-title" style={{ margin: 0 }}>Quản lý Danh mục</h1>
        <button className="primary-button" onClick={openAdd}>+ Thêm danh mục</button>
      </div>


      {loading ? (
        <div className="skeleton-line" style={{ height: 160, borderRadius: "var(--radius-md)" }} />
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Tên danh mục</th>
                <th>Mô tả</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {cats.map((c) => (
                <tr key={c.id}>
                  <td>#{c.id}</td>
                  <td style={{ fontWeight: 600 }}>{c.name}</td>
                  <td style={{ color: "var(--text-muted)", fontSize: "var(--font-xs)" }}>
                    {c.description || "—"}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "var(--space-xs)" }}>
                      <button
                        className="ghost-button"
                        style={{ fontSize: "var(--font-xs)", padding: "0.2rem 0.6rem" }}
                        onClick={() => openEdit(c)}
                      >
                        Sửa
                      </button>
                      <button
                        className="danger-button"
                        disabled={deleting === c.id}
                        onClick={() => handleDelete(c)}
                      >
                        {deleting === c.id ? "…" : "Xóa"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {cats.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ color: "var(--text-muted)", textAlign: "center" }}>
                    Chưa có danh mục nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="admin-modal-overlay" onClick={closeModal}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="admin-modal-title">{editing ? "Sửa danh mục" : "Thêm danh mục"}</h2>

            <div className="admin-field">
              <label>Tên danh mục *</label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Nhập tên danh mục"
              />
            </div>

            <div className="admin-field">
              <label>Mô tả</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Mô tả danh mục (tùy chọn)"
              />
            </div>

            <div className="admin-modal-footer">
              <button className="ghost-button" onClick={closeModal} disabled={saving}>Hủy</button>
              <button className="primary-button" onClick={handleSave} disabled={saving || !form.name.trim()}>
                {saving ? "Đang lưu…" : editing ? "Cập nhật" : "Thêm mới"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ───────────────────────────────────────────────
   Users Tab
─────────────────────────────────────────────── */
const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  MANAGER: "Quản lý",
  CUSTOMER: "Khách hàng",
};

const UsersTab: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<number | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    getAdminUsers().then(setUsers).catch(() => setUsers([])).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRoleChange = async (u: AdminUser, newRole: "MANAGER" | "CUSTOMER") => {
    const label = ROLE_LABELS[newRole];
    if (!confirm(`Đổi vai trò "${u.fullName}" thành ${label}?`)) return;
    setBusy(u.id);
    try {
      await changeUserRole(u.id, newRole);
      load();
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <h1 className="admin-page-title">Quản lý Người dùng</h1>

      {loading ? (
        <div className="skeleton-line" style={{ height: 200, borderRadius: "var(--radius-md)" }} />
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Họ tên</th>
                <th>Email</th>
                <th>Số điện thoại</th>
                <th>Vai trò</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>#{u.id}</td>
                  <td style={{ fontWeight: 600 }}>{u.fullName}</td>
                  <td style={{ fontSize: "var(--font-xs)", color: "var(--text-muted)" }}>{u.email}</td>
                  <td style={{ fontSize: "var(--font-xs)" }}>{u.phone || "—"}</td>
                  <td>
                    <span
                      style={{
                        padding: "0.15rem 0.5rem",
                        borderRadius: "var(--radius-sm)",
                        fontSize: "var(--font-xs)",
                        fontWeight: 600,
                        background:
                          u.role === "ADMIN" ? "var(--color-primary)" :
                          u.role === "MANAGER" ? "#6366f1" : "var(--surface-2)",
                        color: u.role === "CUSTOMER" ? "var(--text-muted)" : "#fff",
                      }}
                    >
                      {ROLE_LABELS[u.role] ?? u.role}
                    </span>
                  </td>
                  <td>
                    {u.role === "ADMIN" ? (
                      <span style={{ fontSize: "var(--font-xs)", color: "var(--text-muted)" }}>Được bảo vệ</span>
                    ) : (
                      <div style={{ display: "flex", gap: "var(--space-xs)", flexWrap: "wrap" }}>
                        {u.role === "CUSTOMER" && (
                          <button
                            className="ghost-button"
                            style={{ fontSize: "var(--font-xs)", padding: "0.2rem 0.5rem" }}
                            disabled={busy === u.id}
                            onClick={() => handleRoleChange(u, "MANAGER")}
                          >
                            Cấp Manager
                          </button>
                        )}
                        {u.role === "MANAGER" && (
                          <button
                            className="ghost-button"
                            style={{ fontSize: "var(--font-xs)", padding: "0.2rem 0.5rem" }}
                            disabled={busy === u.id}
                            onClick={() => handleRoleChange(u, "CUSTOMER")}
                          >
                            Hạ xuống KH
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ color: "var(--text-muted)", textAlign: "center" }}>
                    Không có người dùng nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

/* ───────────────────────────────────────────────
   Notifications Tab
─────────────────────────────────────────────── */
const NotificationsTab: React.FC = () => {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<Notification | null>(null);
  const [form, setForm] = useState({ title: "", message: "", type: "INFO" as "INFO" | "PROMO" | "DISCOUNT", active: true, expiresAt: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    getAdminNotifications().then(setItems).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const resetForm = () => {
    setForm({ title: "", message: "", type: "INFO", active: true, expiresAt: "" });
    setEditItem(null);
    setShowForm(false);
  };

  const openEdit = (n: Notification) => {
    setEditItem(n);
    setForm({ title: n.title, message: n.message, type: n.type, active: n.active, expiresAt: n.expiresAt?.slice(0, 16) ?? "" });
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: Partial<Notification> = {
        title: form.title,
        message: form.message,
        type: form.type,
        active: form.active,
        expiresAt: form.expiresAt || undefined,
      };
      if (editItem) {
        await updateNotification(editItem.id, payload);
      } else {
        await createNotification(payload);
      }
      resetForm();
      load();
    } catch { alert("Lỗi khi lưu thông báo"); }
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Xóa thông báo này?")) return;
    await deleteNotification(id).catch(() => {});
    load();
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-lg)" }}>
        <h2 style={{ margin: 0 }}>Quản lý thông báo</h2>
        <button className="primary-button" onClick={() => { resetForm(); setShowForm(true); }}>+ Thêm thông báo</button>
      </div>

      {showForm && (
        <div className="admin-card" style={{ marginBottom: "var(--space-lg)", padding: "var(--space-lg)" }}>
          <h3>{editItem ? "Sửa thông báo" : "Thêm thông báo mới"}</h3>
          <div style={{ display: "grid", gap: "var(--space-md)" }}>
            <div>
              <label className="admin-label">Tiêu đề</label>
              <input className="admin-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <label className="admin-label">Nội dung</label>
              <textarea className="admin-input" rows={3} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--space-md)" }}>
              <div>
                <label className="admin-label">Loại</label>
                <select className="admin-input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as any })}>
                  <option value="INFO">Thông tin</option>
                  <option value="PROMO">Khuyến mãi</option>
                  <option value="DISCOUNT">Giảm giá</option>
                </select>
              </div>
              <div>
                <label className="admin-label">Trạng thái</label>
                <select className="admin-input" value={form.active ? "true" : "false"} onChange={(e) => setForm({ ...form, active: e.target.value === "true" })}>
                  <option value="true">Hoạt động</option>
                  <option value="false">Tắt</option>
                </select>
              </div>
              <div>
                <label className="admin-label">Hết hạn</label>
                <input className="admin-input" type="datetime-local" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
              </div>
            </div>
            <div style={{ display: "flex", gap: "var(--space-sm)" }}>
              <button className="primary-button" onClick={handleSave} disabled={saving || !form.title || !form.message}>
                {saving ? "Đang lưu..." : editItem ? "Cập nhật" : "Tạo mới"}
              </button>
              <button className="ghost-button" onClick={resetForm}>Hủy</button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <p>Đang tải...</p>
      ) : (
        <div className="admin-card" style={{ overflowX: "auto" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tiêu đề</th>
                <th>Loại</th>
                <th>Trạng thái</th>
                <th>Hết hạn</th>
                <th>Ngày tạo</th>
                <th style={{ textAlign: "right" }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {items.map((n) => (
                <tr key={n.id}>
                  <td>{n.id}</td>
                  <td>{n.title}</td>
                  <td>
                    <span className={`badge badge-${n.type === "PROMO" ? "warning" : n.type === "DISCOUNT" ? "success" : "info"}`}>
                      {n.type === "PROMO" ? "Khuyến mãi" : n.type === "DISCOUNT" ? "Giảm giá" : "Thông tin"}
                    </span>
                  </td>
                  <td>{n.active ? "✅ Bật" : "❌ Tắt"}</td>
                  <td>{n.expiresAt ? new Date(n.expiresAt).toLocaleString("vi") : "—"}</td>
                  <td>{new Date(n.createdAt).toLocaleString("vi")}</td>
                  <td style={{ textAlign: "right" }}>
                    <button className="ghost-button" style={{ fontSize: "var(--font-xs)", marginRight: 4 }} onClick={() => openEdit(n)}>Sửa</button>
                    <button className="ghost-button text-danger" style={{ fontSize: "var(--font-xs)" }} onClick={() => handleDelete(n.id)}>Xóa</button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={7} style={{ color: "var(--text-muted)", textAlign: "center" }}>Chưa có thông báo nào</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

/* ───────────────────────────────────────────────
   Discounts Tab
─────────────────────────────────────────────── */
const DiscountsTab: React.FC = () => {
  const [items, setItems] = useState<DiscountItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<DiscountItem | null>(null);
  const [form, setForm] = useState({
    code: "", description: "", discountType: "PERCENTAGE" as "PERCENTAGE" | "FIXED",
    discountValue: 0, minOrderValue: 0, maxDiscount: 0, startDate: "", endDate: "",
    usageLimit: 0, active: true,
  });
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    getAdminDiscounts().then(setItems).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const resetForm = () => {
    setForm({ code: "", description: "", discountType: "PERCENTAGE", discountValue: 0, minOrderValue: 0, maxDiscount: 0, startDate: "", endDate: "", usageLimit: 0, active: true });
    setEditItem(null);
    setShowForm(false);
  };

  const openEdit = (d: DiscountItem) => {
    setEditItem(d);
    setForm({
      code: d.code, description: d.description ?? "", discountType: d.discountType,
      discountValue: d.discountValue, minOrderValue: d.minOrderValue, maxDiscount: d.maxDiscount ?? 0,
      startDate: d.startDate?.slice(0, 16) ?? "", endDate: d.endDate?.slice(0, 16) ?? "",
      usageLimit: d.usageLimit ?? 0, active: d.active,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: Partial<DiscountItem> = {
        code: form.code, description: form.description || undefined, discountType: form.discountType,
        discountValue: form.discountValue, minOrderValue: form.minOrderValue,
        maxDiscount: form.maxDiscount || undefined,
        startDate: form.startDate || undefined, endDate: form.endDate || undefined,
        usageLimit: form.usageLimit || undefined, active: form.active,
      };
      if (editItem) {
        await updateDiscount(editItem.id, payload);
      } else {
        await createDiscount(payload);
      }
      resetForm();
      load();
    } catch { alert("Lỗi khi lưu mã giảm giá"); }
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Xóa mã giảm giá này?")) return;
    await deleteDiscount(id).catch(() => {});
    load();
  };

  const fmt = (v: number) => v.toLocaleString("vi-VN") + "₫";

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-lg)" }}>
        <h2 style={{ margin: 0 }}>Quản lý mã giảm giá</h2>
        <button className="primary-button" onClick={() => { resetForm(); setShowForm(true); }}>+ Thêm mã</button>
      </div>

      {showForm && (
        <div className="admin-card" style={{ marginBottom: "var(--space-lg)", padding: "var(--space-lg)" }}>
          <h3>{editItem ? "Sửa mã giảm giá" : "Thêm mã giảm giá mới"}</h3>
          <div style={{ display: "grid", gap: "var(--space-md)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-md)" }}>
              <div>
                <label className="admin-label">Mã code</label>
                <input className="admin-input" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="VD: SALE20" />
              </div>
              <div>
                <label className="admin-label">Mô tả</label>
                <input className="admin-input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--space-md)" }}>
              <div>
                <label className="admin-label">Loại giảm</label>
                <select className="admin-input" value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value as any })}>
                  <option value="PERCENTAGE">Phần trăm (%)</option>
                  <option value="FIXED">Số tiền cố định (₫)</option>
                </select>
              </div>
              <div>
                <label className="admin-label">Giá trị giảm</label>
                <input className="admin-input" type="number" min={0} value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: +e.target.value })} />
              </div>
              <div>
                <label className="admin-label">Giảm tối đa (₫)</label>
                <input className="admin-input" type="number" min={0} value={form.maxDiscount} onChange={(e) => setForm({ ...form, maxDiscount: +e.target.value })} placeholder="0 = không giới hạn" />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--space-md)" }}>
              <div>
                <label className="admin-label">Đơn tối thiểu (₫)</label>
                <input className="admin-input" type="number" min={0} value={form.minOrderValue} onChange={(e) => setForm({ ...form, minOrderValue: +e.target.value })} />
              </div>
              <div>
                <label className="admin-label">Giới hạn sử dụng</label>
                <input className="admin-input" type="number" min={0} value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: +e.target.value })} placeholder="0 = không giới hạn" />
              </div>
              <div>
                <label className="admin-label">Trạng thái</label>
                <select className="admin-input" value={form.active ? "true" : "false"} onChange={(e) => setForm({ ...form, active: e.target.value === "true" })}>
                  <option value="true">Hoạt động</option>
                  <option value="false">Tắt</option>
                </select>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-md)" }}>
              <div>
                <label className="admin-label">Bắt đầu</label>
                <input className="admin-input" type="datetime-local" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div>
                <label className="admin-label">Kết thúc</label>
                <input className="admin-input" type="datetime-local" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              </div>
            </div>
            <div style={{ display: "flex", gap: "var(--space-sm)" }}>
              <button className="primary-button" onClick={handleSave} disabled={saving || !form.code || !form.discountValue}>
                {saving ? "Đang lưu..." : editItem ? "Cập nhật" : "Tạo mới"}
              </button>
              <button className="ghost-button" onClick={resetForm}>Hủy</button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <p>Đang tải...</p>
      ) : (
        <div className="admin-card" style={{ overflowX: "auto" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Mã</th>
                <th>Loại</th>
                <th>Giá trị</th>
                <th>Đơn tối thiểu</th>
                <th>Đã dùng</th>
                <th>Trạng thái</th>
                <th>Hạn</th>
                <th style={{ textAlign: "right" }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {items.map((d) => (
                <tr key={d.id}>
                  <td><code style={{ fontWeight: 700 }}>{d.code}</code></td>
                  <td>{d.discountType === "PERCENTAGE" ? "%" : "₫"}</td>
                  <td>{d.discountType === "PERCENTAGE" ? `${d.discountValue}%` : fmt(d.discountValue)}</td>
                  <td>{fmt(d.minOrderValue)}</td>
                  <td>{d.usedCount}{d.usageLimit ? `/${d.usageLimit}` : ""}</td>
                  <td>{d.active ? "✅ Bật" : "❌ Tắt"}</td>
                  <td>{d.endDate ? new Date(d.endDate).toLocaleDateString("vi") : "—"}</td>
                  <td style={{ textAlign: "right" }}>
                    <button className="ghost-button" style={{ fontSize: "var(--font-xs)", marginRight: 4 }} onClick={() => openEdit(d)}>Sửa</button>
                    <button className="ghost-button text-danger" style={{ fontSize: "var(--font-xs)" }} onClick={() => handleDelete(d.id)}>Xóa</button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={8} style={{ color: "var(--text-muted)", textAlign: "center" }}>Chưa có mã giảm giá nào</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

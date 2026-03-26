import React, { useEffect, useState } from "react";
import { getMyOrders } from "../services/orderApi";
import { Order } from "../services/adminApi";
import { isLoggedIn } from "../services/authApi";
import { useNavigate } from "react-router-dom";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Chờ xử lý",
  SHIPPING: "Đang giao",
  DELIVERED: "Đã giao",
  CANCELLED: "Đã hủy",
};

export const OrderHistoryPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate("/auth/login");
      return;
    }
    setLoading(true);
    getMyOrders()
      .then(setOrders)
      .finally(() => setLoading(false));
  }, [navigate]);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Lịch sử đơn hàng</h1>
        <p>Theo dõi quá trình giao hàng của các sản phẩm bạn đã đặt</p>
      </div>

      <div style={{ marginTop: "var(--space-lg)" }}>
        {loading ? (
          <div className="skeleton-line" style={{ height: 120, borderRadius: "var(--radius-md)" }} />
        ) : orders.length === 0 ? (
          <div style={{ padding: "var(--space-xl)", textAlign: "center", background: "var(--bg-elevated)", borderRadius: "var(--radius-md)", border: "1px dashed var(--border-subtle)" }}>
            <p style={{ color: "var(--text-muted)" }}>Bạn chưa có đơn hàng nào.</p>
            <button className="primary-button" style={{ marginTop: "var(--space-sm)" }} onClick={() => navigate("/")}>
              Tiếp tục mua sắm
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
            {orders.map((o) => (
              <div key={o.id} style={{ background: "var(--bg-elevated)", padding: "var(--space-md)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h3 style={{ margin: "0 0 6px", fontSize: "var(--font-md)" }}>Đơn hàng #{o.id}</h3>
                  <p style={{ margin: 0, fontSize: "var(--font-sm)", color: "var(--text-muted)" }}>
                    Đặt lúc: {o.orderDate ? new Date(o.orderDate).toLocaleString("vi-VN") : "—"}
                  </p>
                  <p style={{ margin: "8px 0 0", fontWeight: 700, color: "var(--text)" }}>
                    Tổng: {(o.totalMoney ?? 0).toLocaleString("vi-VN")} ₫
                  </p>
                </div>
                <div>
                  <span className={`order-badge status-${o.status.toLowerCase()}`}>
                    {STATUS_LABELS[o.status] || o.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

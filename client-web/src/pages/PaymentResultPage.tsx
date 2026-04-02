import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getPaymentStatus, PaymentStatus } from "../services/orderApi";

export const PaymentResultPage: React.FC = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<PaymentStatus | null>(null);
  const [loading, setLoading] = useState(true);

  // Determine result from URL params (set by VNPay/MoMo redirect or COD flow)
  const orderId = params.get("orderId") || params.get("vnp_TxnRef")?.split("_")[0];
  // VNPay: vnp_ResponseCode=00 means success
  const vnpCode = params.get("vnp_ResponseCode");
  // MoMo: resultCode=0 means success
  const momoCode = params.get("resultCode");
  // COD direct
  const directStatus = params.get("status");
  const method = params.get("method") || params.get("payType") || (vnpCode !== null ? "VNPAY" : momoCode !== null ? "MOMO" : "COD");

  const isSuccess =
    directStatus === "success" ||
    vnpCode === "00" ||
    momoCode === "0";

  useEffect(() => {
    if (!orderId) { setLoading(false); return; }
    getPaymentStatus(Number(orderId))
      .then(setStatus)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) {
    return (
      <div className="page-container" style={{ textAlign: "center", paddingTop: "var(--space-2xl)" }}>
        <div style={{ width: 40, height: 40, border: "3px solid var(--border-subtle)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto var(--space-md)" }} />
        <p style={{ color: "var(--text-muted)" }}>Đang xác nhận thanh toán…</p>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ display: "flex", justifyContent: "center", paddingTop: "var(--space-2xl)" }}>
      <div
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-card)",
          padding: "var(--space-2xl) var(--space-xl)",
          textAlign: "center",
          maxWidth: 440,
          width: "100%",
        }}
      >
        {isSuccess ? (
          <>
            {/* Success icon */}
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto var(--space-md)" }}>
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                <polyline points="8,18 15,25 28,11" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2 style={{ margin: "0 0 var(--space-sm)", color: "#16a34a" }}>Thanh toán thành công!</h2>
            <p style={{ color: "var(--text-muted)", marginBottom: "var(--space-md)" }}>
              Cảm ơn bạn đã mua sắm tại trustme-shop. Đơn hàng của bạn đang được xử lý.
            </p>
            {status && (
              <div
                style={{
                  background: "var(--bg)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-md)",
                  padding: "var(--space-sm) var(--space-md)",
                  marginBottom: "var(--space-lg)",
                  textAlign: "left",
                  fontSize: "var(--font-sm)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ color: "var(--text-muted)" }}>Mã đơn hàng</span>
                  <strong>#{status.id}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ color: "var(--text-muted)" }}>Phương thức</span>
                  <strong>{status.paymentMethod}</strong>
                </div>
                {status.transactionId && (
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-muted)" }}>Mã giao dịch</span>
                    <strong style={{ fontFamily: "monospace", fontSize: "var(--font-xs)" }}>{status.transactionId}</strong>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            {/* Failure icon */}
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto var(--space-md)" }}>
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                <line x1="11" y1="11" x2="25" y2="25" stroke="#dc2626" strokeWidth="3" strokeLinecap="round"/>
                <line x1="25" y1="11" x2="11" y2="25" stroke="#dc2626" strokeWidth="3" strokeLinecap="round"/>
              </svg>
            </div>
            <h2 style={{ margin: "0 0 var(--space-sm)", color: "#dc2626" }}>Thanh toán thất bại</h2>
            <p style={{ color: "var(--text-muted)", marginBottom: "var(--space-lg)" }}>
              Giao dịch chưa hoàn tất. Bạn có thể thử lại hoặc chọn phương thức khác.
            </p>
          </>
        )}

        <div style={{ display: "flex", gap: "var(--space-sm)", justifyContent: "center" }}>
          {isSuccess ? (
            <>
              <button className="primary-button" onClick={() => navigate("/orders")}>
                Xem đơn hàng
              </button>
              <button
                style={{ padding: "10px 20px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)", background: "var(--bg-elevated)", color: "var(--text)", cursor: "pointer", fontSize: "var(--font-sm)", fontWeight: 600 }}
                onClick={() => navigate("/")}
              >
                Tiếp tục mua sắm
              </button>
            </>
          ) : (
            <>
              <button className="primary-button" onClick={() => navigate("/checkout")}>
                Thử lại
              </button>
              <button
                style={{ padding: "10px 20px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)", background: "var(--bg-elevated)", color: "var(--text)", cursor: "pointer", fontSize: "var(--font-sm)", fontWeight: 600 }}
                onClick={() => navigate("/")}
              >
                Về trang chủ
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

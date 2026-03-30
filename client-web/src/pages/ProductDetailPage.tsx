import React, { useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  getProductById,
  getRelatedProducts,
  Product,
  ProductOption,
  ProductOptionValue,
  ProductVariant,
} from "../services/productApi";
import { addToCart, createOrder } from "../services/orderApi";
import { isLoggedIn, isAdmin } from "../services/authApi";
import { ProductCard } from "../shared/ProductCard";
import {
  getProductReviews,
  getMyReview,
  canReviewProduct,
  createReview,
  updateReview,
  deleteReview,
  Review,
} from "../services/reviewApi";

const StarDisplay: React.FC<{ rating: number }> = ({ rating }) => (
  <span className="star-display">
    {[1, 2, 3, 4, 5].map((s) => (
      <span key={s} className={s <= Math.round(rating) ? "star-filled" : "star-empty"}>★</span>
    ))}
  </span>
);

const SkeletonDetail: React.FC = () => (
  <div className="product-detail">
    <div className="skeleton-image" style={{ minHeight: 320, borderRadius: "var(--radius-lg)" }} />
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
      <div className="skeleton-line" style={{ height: 28, width: "70%" }} />
      <div className="skeleton-line" style={{ height: 22, width: "35%" }} />
      <div className="skeleton-line" style={{ height: 14, marginTop: "var(--space-md)" }} />
      <div className="skeleton-line" style={{ height: 14, width: "90%" }} />
      <div className="skeleton-line short" style={{ height: 14 }} />
    </div>
  </div>
);

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);
  const [needLogin, setNeedLogin] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const navigate = useNavigate();

  // Selected options (optionId -> value)
  const [selectedOptions, setSelectedOptions] = useState<Record<number, string>>({});

  // Reviews
  const [reviews, setReviews] = useState<Review[]>([]);
  const [myReview, setMyReview] = useState<Review | null>(null);
  const [canReview, setCanReview] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [editingReview, setEditingReview] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState("");

  const loadReviews = useCallback(async (productId: number) => {
    const [all, mine, can] = await Promise.all([
      getProductReviews(productId),
      isLoggedIn() ? getMyReview(productId) : Promise.resolve(null),
      isLoggedIn() ? canReviewProduct(productId) : Promise.resolve(false),
    ]);
    setReviews(all);
    setMyReview(mine);
    setCanReview(can);
    if (mine) {
      setReviewForm({ rating: mine.rating, comment: mine.comment ?? "" });
    } else {
      setReviewForm({ rating: 5, comment: "" });
    }
  }, []);

  useEffect(() => {
    if (!id) return;
    const productId = Number(id);
    setLoading(true);
    setProduct(null);
    setAddedToCart(false);

    Promise.all([
      getProductById(productId),
      getRelatedProducts(productId, 4),
    ])
      .then(([p, r]) => {
        setProduct(p);
        setRelated(r);
        setActiveImg(0);
        loadReviews(productId);
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [id, loadReviews]);

  const handleAddToCart = async () => {
    if (!isLoggedIn()) {
      setNeedLogin(true);
      return;
    }
    setNeedLogin(false);
    if (!product) return;
    await addToCart({ product: { id: product.id }, quantity: 1 });
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2500);
  };

  const handleBuyNow = async () => {
    if (!isLoggedIn()) {
      setNeedLogin(true);
      return;
    }
    setNeedLogin(false);
    if (!product) return;
    setBuyingNow(true);
    try {
      await addToCart({ product: { id: product.id }, quantity: 1 });
      navigate("/checkout");
    } catch {
      alert("Không thể thêm vào giỏ. Vui lòng thử lại.");
    } finally {
      setBuyingNow(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!product) return;
    setReviewError("");
    setSubmittingReview(true);
    try {
      if (editingReview && myReview) {
        await updateReview(myReview.id, reviewForm.rating, reviewForm.comment);
      } else {
        await createReview(product.id, reviewForm.rating, reviewForm.comment);
      }
      setEditingReview(false);
      await loadReviews(product.id);
    } catch (e: any) {
      setReviewError(e?.response?.data?.message ?? e?.response?.data ?? "Có lỗi xảy ra");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!myReview || !product) return;
    if (!confirm("Xóa đánh giá của bạn?")) return;
    await deleteReview(myReview.id);
    await loadReviews(product.id);
    setEditingReview(false);
  };

  const handleAdminDeleteReview = async (reviewId: number, authorName: string) => {
    if (!product) return;
    if (!confirm(`Xóa đánh giá của "${authorName}"?`)) return;
    await deleteReview(reviewId);
    await loadReviews(product.id);
  };

  const avgRating = reviews.length > 0
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  if (loading) {
    return (
      <div className="page-container">
        <SkeletonDetail />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="page-container pdp-not-found">
        <span style={{ fontSize: "3rem" }}>🔍</span>
        <h2>Không tìm thấy sản phẩm</h2>
        <p>Sản phẩm này có thể đã bị xóa hoặc đường dẫn không đúng.</p>
        <button className="primary-button" onClick={() => navigate("/")}>
          Quay về trang chủ
        </button>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Breadcrumb */}
      <nav className="pdp-breadcrumb">
        <Link to="/">Trang chủ</Link>
        <span className="pdp-breadcrumb-sep">›</span>
        <span>{product.name}</span>
      </nav>

      {/* Main detail section */}
      <div className="product-detail">
        {/* Image gallery */}
        <div className="product-detail-image">
          {/* Main image */}
          <div style={{ width: "100%", aspectRatio: "1", overflow: "hidden", borderRadius: "var(--radius-lg)", background: "var(--surface-2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {product.images && product.images.length > 0 ? (
              <img
                src={product.images[activeImg]?.imageUrl}
                alt={product.name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <div className="image-placeholder" style={{ width: 100, height: 100, fontSize: "2.5rem" }}>
                {product.name.charAt(0)}
              </div>
            )}
          </div>
          {/* Thumbnails */}
          {product.images && product.images.length > 1 && (
            <div style={{ display: "flex", gap: "var(--space-xs)", marginTop: "var(--space-sm)", flexWrap: "wrap" }}>
              {product.images.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImg(idx)}
                  style={{
                    padding: 0, border: idx === activeImg ? "2px solid var(--color-primary)" : "2px solid transparent",
                    borderRadius: "var(--radius-sm)", cursor: "pointer", background: "none", overflow: "hidden",
                    width: 60, height: 60, flexShrink: 0,
                  }}
                >
                  <img src={img.imageUrl} alt="" style={{ width: 60, height: 60, objectFit: "cover", display: "block" }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="product-detail-info">
          <h1>{product.name}</h1>
          <p className="product-price">
            {product.price.toLocaleString("vi-VN")} ₫
          </p>
          {product.stockQuantity !== undefined && (
            <p className="pdp-stock">
              {product.stockQuantity > 0 ? (
                <span className="pdp-stock-ok">✓ Còn hàng ({product.stockQuantity} sản phẩm)</span>
              ) : (
                <span className="pdp-stock-out">✗ Hết hàng</span>
              )}
            </p>
          )}
          {product.description && (
            <p className="product-description">{product.description}</p>
          )}

          {/* Product Options (size, color, etc.) */}
          {product.options && product.options.length > 0 && (() => {
            // Find matched variant from selected options
            const allSelected = product.options!.every((o: ProductOption) => selectedOptions[o.id]);
            const matchedVariant: ProductVariant | undefined = allSelected && product.variants
              ? product.variants.find((v: ProductVariant) => {
                  try {
                    const combo = JSON.parse(v.combination) as Record<string, string>;
                    return product.options!.every((o: ProductOption) => combo[o.name] === selectedOptions[o.id]);
                  } catch { return false; }
                })
              : undefined;

            return (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
                {product.options!.map((opt: ProductOption) => (
                  <div key={opt.id}>
                    <p style={{ margin: "0 0 6px", fontWeight: 600, fontSize: "var(--font-sm)" }}>{opt.name}:</p>
                    <div style={{ display: "flex", gap: "var(--space-xs)", flexWrap: "wrap" }}>
                      {opt.values.map((v: ProductOptionValue) => {
                        const isSelected = selectedOptions[opt.id] === v.value;
                        return (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => setSelectedOptions((prev) => ({ ...prev, [opt.id]: v.value }))}
                            style={{
                              padding: "5px 14px",
                              border: isSelected ? "2px solid var(--accent)" : "1px solid var(--border-subtle)",
                              borderRadius: "var(--radius-sm)",
                              background: isSelected ? "var(--accent)" : "transparent",
                              color: isSelected ? "#fff" : "inherit",
                              cursor: "pointer",
                              fontSize: "var(--font-sm)",
                              fontWeight: isSelected ? 600 : 400,
                              transition: "all 0.15s",
                            }}
                          >
                            {v.value}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Show variant stock when all options selected */}
                {allSelected && (
                  <p style={{ margin: 0, fontSize: "var(--font-sm)" }}>
                    {matchedVariant
                      ? matchedVariant.stockQuantity > 0
                        ? <span style={{ color: "#16a34a" }}>✓ Còn {matchedVariant.stockQuantity} sản phẩm</span>
                        : <span style={{ color: "#dc2626" }}>✗ Hết hàng</span>
                      : <span style={{ color: "var(--text-muted)" }}>Không có biến thể này</span>
                    }
                  </p>
                )}
              </div>
            );
          })()}

          {/* CTA */}
          {(() => {
            const hasOptions = product.options && product.options.length > 0;
            const allSelected = hasOptions && product.options!.every((o: ProductOption) => selectedOptions[o.id]);
            const matchedVariant: ProductVariant | undefined = allSelected && product.variants
              ? product.variants.find((v: ProductVariant) => {
                  try {
                    const combo = JSON.parse(v.combination) as Record<string, string>;
                    return product.options!.every((o: ProductOption) => combo[o.name] === selectedOptions[o.id]);
                  } catch { return false; }
                })
              : undefined;
            const outOfStock = hasOptions
              ? !allSelected || !matchedVariant || matchedVariant.stockQuantity === 0
              : product.stockQuantity === 0;

            return (
              <>
                <div className="pdp-actions">
                  <button
                    id="obj-pdp-add-cart"
                    className="primary-button pdp-action-btn"
                    onClick={handleAddToCart}
                    disabled={outOfStock}
                  >
                    {addedToCart ? (
                      <span style={{ display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Đã thêm vào giỏ!
                      </span>
                    ) : (
                      <span style={{ display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                          <path d="M4 10h16l-1.2 11H5.2z" />
                        </svg>
                        Thêm vào giỏ hàng
                      </span>
                    )}
                  </button>
                  <button
                    className="ghost-button pdp-action-btn"
                    onClick={handleBuyNow}
                    disabled={outOfStock || buyingNow}
                  >
                    {buyingNow ? (
                      <span style={{ display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 1s linear infinite" }}>
                          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                        </svg>
                        Đang xử lý…
                      </span>
                    ) : (
                      <span style={{ display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M13 2 4.5 13.5H10L9 22l10.5-12H14z" />
                        </svg>
                        Mua ngay
                      </span>
                    )}
                  </button>
                </div>

                {needLogin && (
                  <div style={{
                    marginTop: "var(--space-sm)",
                    padding: "14px 16px",
                    background: "linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)",
                    border: "1.5px solid #93c5fd",
                    borderRadius: "var(--radius-md)",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    animation: "fadeIn 0.2s ease",
                  }}>
                    <span style={{ color: "var(--accent)", flexShrink: 0 }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="5" y="11" width="14" height="10" rx="2.5" />
                        <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                        <circle cx="12" cy="16.5" r="1.2" fill="currentColor" stroke="none" />
                      </svg>
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: "var(--font-sm)", color: "var(--text-primary)", marginBottom: 2 }}>
                        Bạn chưa đăng nhập
                      </div>
                      <div style={{ fontSize: "var(--font-xs)", color: "var(--text-muted)" }}>
                        Đăng nhập để thêm vào giỏ hoặc mua ngay nhé!
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                      <button
                        className="primary-button"
                        style={{ fontSize: "var(--font-xs)", padding: "6px 14px" }}
                        onClick={() => navigate("/auth/login")}
                      >
                        Đăng nhập
                      </button>
                      <button
                        className="ghost-button"
                        style={{ fontSize: "var(--font-xs)", padding: "6px 14px" }}
                        onClick={() => navigate("/auth/register")}
                      >
                        Đăng ký
                      </button>
                    </div>
                    <button
                      onClick={() => setNeedLogin(false)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: 16, lineHeight: 1, padding: 2 }}
                      aria-label="Đóng"
                    >×</button>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      </div>

      {/* Reviews */}
      <section className="review-section">
        <div className="review-section-header">
          <h2>Đánh giá sản phẩm</h2>
          {reviews.length > 0 && (
            <div className="review-avg">
              <StarDisplay rating={avgRating} />
              <span className="review-avg-num">{avgRating.toFixed(1)}</span>
              <span className="review-count">({reviews.length} đánh giá)</span>
            </div>
          )}
        </div>

        {/* Form: write or edit review */}
        {isLoggedIn() && (canReview || (myReview && editingReview)) && (
          <div className="review-form-card">
            <h3>{myReview && editingReview ? "Sửa đánh giá của bạn" : "Viết đánh giá"}</h3>
            <div className="review-star-picker">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`star-btn ${s <= reviewForm.rating ? "active" : ""}`}
                  onClick={() => setReviewForm((f) => ({ ...f, rating: s }))}
                >★</button>
              ))}
              <span className="review-rating-label">{reviewForm.rating}/5</span>
            </div>
            <textarea
              className="review-comment-input"
              placeholder="Nhận xét về sản phẩm (tùy chọn)..."
              value={reviewForm.comment}
              onChange={(e) => setReviewForm((f) => ({ ...f, comment: e.target.value }))}
              rows={3}
            />
            {reviewError && <p className="review-error">{reviewError}</p>}
            <div className="review-form-actions">
              {editingReview && (
                <button className="ghost-button" onClick={() => setEditingReview(false)}>Hủy</button>
              )}
              <button
                className="primary-button"
                onClick={handleSubmitReview}
                disabled={submittingReview}
              >
                {submittingReview ? "Đang gửi…" : editingReview ? "Cập nhật" : "Gửi đánh giá"}
              </button>
            </div>
          </div>
        )}

        {/* My review (read mode) */}
        {myReview && !editingReview && (
          <div className="review-card review-card-mine">
            <div className="review-card-header">
              <span className="review-author">{myReview.user.fullName} <span className="review-mine-badge">Bạn</span></span>
              <StarDisplay rating={myReview.rating} />
              <span className="review-date">{new Date(myReview.createdAt).toLocaleDateString("vi-VN")}</span>
              <div style={{ marginLeft: "auto", display: "flex", gap: "var(--space-xs)" }}>
                <button className="ghost-button" style={{ fontSize: "var(--font-xs)", padding: "0.15rem 0.5rem" }}
                  onClick={() => { setEditingReview(true); setReviewForm({ rating: myReview.rating, comment: myReview.comment ?? "" }); }}>
                  Sửa
                </button>
                <button className="danger-button" style={{ fontSize: "var(--font-xs)", padding: "0.15rem 0.5rem" }}
                  onClick={handleDeleteReview}>
                  Xóa
                </button>
              </div>
            </div>
            {myReview.comment && <p className="review-comment">{myReview.comment}</p>}
          </div>
        )}

        {/* Not eligible message */}
        {isLoggedIn() && !canReview && !myReview && (
          <p className="review-notice">Bạn cần mua và nhận hàng thành công sản phẩm này để có thể đánh giá.</p>
        )}
        {!isLoggedIn() && (
          <p className="review-notice">
            <button className="link-button" onClick={() => navigate("/auth/login")}>Đăng nhập</button>
            {" "}để đánh giá sản phẩm.
          </p>
        )}

        {/* All reviews */}
        {reviews.filter((r) => r.id !== myReview?.id).length === 0 && !myReview && (
          <p className="review-empty">Chưa có đánh giá nào. Hãy là người đầu tiên!</p>
        )}
        {reviews
          .filter((r) => r.id !== myReview?.id)
          .map((r) => (
            <div key={r.id} className="review-card">
              <div className="review-card-header">
                <span className="review-author">{r.user.fullName}</span>
                <StarDisplay rating={r.rating} />
                <span className="review-date">{new Date(r.createdAt).toLocaleDateString("vi-VN")}</span>
                {isAdmin() && (
                  <button
                    className="danger-button"
                    style={{ marginLeft: "auto", fontSize: "var(--font-xs)", padding: "0.15rem 0.5rem" }}
                    onClick={() => handleAdminDeleteReview(r.id, r.user.fullName)}
                  >
                    Xóa
                  </button>
                )}
              </div>
              {r.comment && <p className="review-comment">{r.comment}</p>}
            </div>
          ))}
      </section>

      {/* Related products */}
      {related.length > 0 && (
        <section className="related-section">
          <h2>Sản phẩm tương tự</h2>
          <div className="product-grid">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

import React, { useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  getProductById,
  getRelatedProducts,
  Product,
} from "../services/productApi";
import { addToCart } from "../services/orderApi";
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
  const [needLogin, setNeedLogin] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const navigate = useNavigate();

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
      navigate("/auth/login");
      return;
    }
    if (!product) return;
    await addToCart({ product: { id: product.id }, quantity: 1 });
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2500);
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

          {/* CTA */}
          <div className="pdp-actions">
            <button
              id="obj-pdp-add-cart"
              className="primary-button pdp-action-btn"
              onClick={handleAddToCart}
              disabled={product.stockQuantity === 0}
            >
              {addedToCart ? "✓ Đã thêm vào giỏ!" : "🛒 Thêm vào giỏ hàng"}
            </button>
            <button
              className="ghost-button pdp-action-btn"
              title="Yêu thích"
            >
              ♡
            </button>
          </div>
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

import React, { useState } from "react";
import type { Product } from "../services/productApi";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onAddToCart: (product: Product, size: string) => void;
};

// Mock sizes since Product type doesn't have it natively in this demo
const MOCK_SIZES = [
  { name: "S", inStock: true },
  { name: "M", inStock: true },
  { name: "L", inStock: false },
  { name: "XL", inStock: true },
];

export const PdpQuickviewModal: React.FC<Props> = ({
  isOpen,
  onClose,
  product,
  onAddToCart,
}) => {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [errorShake, setErrorShake] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [showToast, setShowToast] = useState(false);

  if (!isOpen || !product) return null;

  const handleAddToCart = () => {
    if (!selectedSize) {
      setErrorShake(true);
      setTimeout(() => setErrorShake(false), 500);
      return;
    }

    setIsAdding(true);
    // Simulate API call
    setTimeout(() => {
      setIsAdding(false);
      setShowToast(true);
      onAddToCart(product, selectedSize);

      // Hide toast and close modal after success
      setTimeout(() => {
        setShowToast(false);
        onClose();
        setSelectedSize(null);
      }, 2000);
    }, 800);
  };

  return (
    <>
      {showToast && (
        <div className="pdp-toast">✅ Đã thêm Set đồ vào giỏ!</div>
      )}

      <div className="ai-modal-backdrop" onClick={onClose}>
        <div
          className="ai-modal pdp-quickview"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header & Image */}
          <div className="pdp-quickview-header">
            <button className="pdp-quickview-close" onClick={onClose}>
              ✕
            </button>
            <div
              className="image-placeholder"
              style={{ width: 120, height: 120, fontSize: "3rem" }}
            >
              {product.name.charAt(0)}
            </div>
          </div>

          {/* Body */}
          <div className="pdp-quickview-body">
            <div>
              <h1 className="pdp-quickview-title">{product.name}</h1>
              <p className="pdp-quickview-price">
                {product.price.toLocaleString("vi-VN")} ₫
              </p>
              {product.description && (
                <p style={{ marginTop: 8, color: "var(--text-muted)", fontSize: "var(--font-sm)" }}>
                  {product.description}
                </p>
              )}
            </div>

            {/* Size Selector */}
            <div className={`pdp-variant-section ${errorShake ? "pdp-size-error" : ""}`}>
              <h4>Chọn Size</h4>
              <div className="pdp-size-selector">
                {MOCK_SIZES.map((size) => (
                  <button
                    key={size.name}
                    className={`pdp-size-pill ${
                      selectedSize === size.name ? "selected" : ""
                    }`}
                    disabled={!size.inStock}
                    onClick={() => {
                      setSelectedSize(size.name);
                      setErrorShake(false);
                    }}
                  >
                    {size.name}
                  </button>
                ))}
              </div>
              {errorShake && (
                <div className="pdp-size-error-msg">Vui lòng chọn Size</div>
              )}
            </div>
          </div>

          {/* Footer CTA */}
          <div className="pdp-quickview-footer">
            <button
              className="primary-button"
              onClick={handleAddToCart}
              disabled={isAdding}
            >
              {isAdding ? <div className="spinner" /> : "Thêm vào giỏ hàng"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

import React from "react";
import { Link } from "react-router-dom";
import type { Product } from "../services/productApi";

type Props = {
  product: Product;
};

export const ProductCard: React.FC<Props> = ({ product }) => {
  return (
    <Link to={`/products/${product.id}`} className="product-card">
      <div className="product-image">
        {product.images?.[0]?.imageUrl ? (
          <img
            src={product.images[0].imageUrl}
            alt={product.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div className="image-placeholder">{product.name.charAt(0)}</div>
        )}
      </div>
      <div className="product-info">
        <h3>{product.name}</h3>
        <p className="product-price">
          {product.price.toLocaleString(undefined, {
            maximumFractionDigits: 0,
          })}{" "}
          ₫
        </p>
      </div>
    </Link>
  );
};


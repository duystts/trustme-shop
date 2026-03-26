import React, { useEffect, useState } from "react";
import {
  getPagedProducts,
  searchProducts,
  getProductsByCategory,
  getCategories,
  Category,
  Product,
  ProductPage,
} from "../services/productApi";
import { ProductCard } from "../shared/ProductCard";

const SkeletonGrid: React.FC<{ count?: number }> = ({ count = 8 }) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="skeleton-card">
        <div className="skeleton-image" />
        <div className="product-info">
          <div className="skeleton-line" style={{ marginTop: "0.5rem" }} />
          <div className="skeleton-line short" style={{ marginTop: "0.35rem" }} />
        </div>
      </div>
    ))}
  </>
);

export const HomePage: React.FC = () => {
  const [pageData, setPageData] = useState<ProductPage | null>(null);
  const [filteredProducts, setFilteredProducts] = useState<Product[] | null>(null);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | "">("");
  const isFiltered = filteredProducts !== null;

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    if (isFiltered) return;
    setLoading(true);
    getPagedProducts({ page, size: 12, sort: "id,desc" })
      .then(setPageData)
      .finally(() => setLoading(false));
  }, [page, isFiltered]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim() && selectedCategory === "") {
      setFilteredProducts(null);
      setPage(0);
      return;
    }
    setLoading(true);
    try {
      let results: Product[];
      if (search.trim()) {
        results = await searchProducts(search.trim());
        if (selectedCategory !== "") {
          results = results.filter((p) =>
            p.categories?.some((c) => c.id === selectedCategory)
          );
        }
      } else {
        results = await getProductsByCategory(selectedCategory as number);
      }
      setFilteredProducts(results);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setSearch("");
    setSelectedCategory("");
    setFilteredProducts(null);
    setPage(0);
  };

  const displayProducts = isFiltered ? filteredProducts! : (pageData?.content ?? []);

  return (
    <div className="page-container">
      {/* Search & Filter bar */}
      <form
        onSubmit={handleSearch}
        style={{ display: "flex", gap: "var(--space-sm)", flexWrap: "wrap", marginBottom: "var(--space-md)", alignItems: "center" }}
      >
        <input
          type="text"
          placeholder="Tìm kiếm sản phẩm..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 180, padding: "var(--space-xs) var(--space-sm)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)", fontSize: "var(--font-sm)" }}
        />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value === "" ? "" : Number(e.target.value))}
          style={{ padding: "var(--space-xs) var(--space-sm)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)", fontSize: "var(--font-sm)", background: "var(--bg-elevated)" }}
        >
          <option value="">Tất cả danh mục</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <button type="submit" className="primary-button" style={{ padding: "var(--space-xs) var(--space-md)" }}>
          Tìm
        </button>
        {isFiltered && (
          <button type="button" className="ghost-button" onClick={handleClear} style={{ padding: "var(--space-xs) var(--space-sm)" }}>
            Xóa lọc
          </button>
        )}
      </form>

      <div className="page-header">
        <h2 id="obj-main-section-title">
          {isFiltered ? `Kết quả tìm kiếm (${displayProducts.length})` : "Mới tuần này"}
        </h2>
      </div>

      <div className="product-grid" id="obj-main-product-grid">
        {loading ? (
          <SkeletonGrid count={8} />
        ) : (
          displayProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))
        )}
        {!loading && displayProducts.length === 0 && (
          <p style={{ color: "var(--text-muted)", gridColumn: "1/-1" }}>
            {isFiltered ? "Không tìm thấy sản phẩm." : "Chưa có sản phẩm nào."}
          </p>
        )}
      </div>

      {!isFiltered && pageData && pageData.totalPages > 1 && (
        <div className="pagination">
          <button onClick={() => setPage((p) => p - 1)} disabled={page === 0}>← Trước</button>
          <span style={{ color: "var(--text-muted)" }}>{page + 1} / {pageData.totalPages}</span>
          <button onClick={() => setPage((p) => p + 1)} disabled={page >= pageData.totalPages - 1}>Tiếp →</button>
        </div>
      )}
    </div>
  );
};

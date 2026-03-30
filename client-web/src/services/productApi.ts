import axios from "axios";

export type Category = {
  id: number;
  name: string;
  description?: string;
};

export type ProductOptionValue = {
  id: number;
  value: string;
};

export type ProductOption = {
  id: number;
  name: string;
  values: ProductOptionValue[];
};

export type ProductVariant = {
  id: number;
  combination: string; // JSON string: {"Size":"S","Màu sắc":"Đỏ"}
  stockQuantity: number;
};

export type Product = {
  id: number;
  name: string;
  description?: string;
  price: number;
  stockQuantity?: number;
  categories?: Category[];
  images?: { id: number; imageUrl: string }[];
  options?: ProductOption[];
  variants?: ProductVariant[];
};

export type ProductPage = {
  content: Product[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};

type PageParams = {
  page: number;
  size: number;
  sort: string;
};

export async function getPagedProducts(params: PageParams): Promise<ProductPage> {
  const res = await axios.get("/api/products", { params });
  return res.data;
}

export async function getProductById(id: number): Promise<Product> {
  const res = await axios.get(`/api/products/${id}`);
  return res.data;
}

export async function getRelatedProducts(id: number, limit = 4): Promise<Product[]> {
  const res = await axios.get(`/api/products/${id}/related`, { params: { limit } });
  return res.data;
}

export async function searchProducts(name: string): Promise<Product[]> {
  const res = await axios.get("/api/products/search", { params: { name } });
  return res.data;
}

export async function getProductsByCategory(categoryId: number): Promise<Product[]> {
  const res = await axios.get(`/api/products/category/${categoryId}`);
  return res.data;
}

export async function getProductsByPriceRange(minPrice: number, maxPrice: number): Promise<Product[]> {
  const res = await axios.get("/api/products/price-range", { params: { minPrice, maxPrice } });
  return res.data;
}

export async function getCategories(): Promise<Category[]> {
  const res = await axios.get("/api/categories");
  return res.data;
}

// ---- Product Options ----
export async function getProductOptions(productId: number): Promise<ProductOption[]> {
  const res = await axios.get(`/api/products/${productId}/options`);
  return res.data;
}

export async function createProductOption(productId: number, data: { name: string; values: string[] }): Promise<ProductOption> {
  const res = await axios.post(`/api/products/${productId}/options`, data);
  return res.data;
}

export async function updateProductOption(productId: number, optionId: number, data: { name: string; values: string[] }): Promise<ProductOption> {
  const res = await axios.put(`/api/products/${productId}/options/${optionId}`, data);
  return res.data;
}

// ---- Product Variants ----
export async function getProductVariants(productId: number): Promise<ProductVariant[]> {
  const res = await axios.get(`/api/products/${productId}/variants`);
  return res.data;
}

export async function generateProductVariants(productId: number): Promise<ProductVariant[]> {
  const res = await axios.post(`/api/products/${productId}/variants/generate`);
  return res.data;
}

export async function updateProductVariant(productId: number, variantId: number, stockQuantity: number): Promise<ProductVariant> {
  const res = await axios.put(`/api/products/${productId}/variants/${variantId}`, { stockQuantity });
  return res.data;
}

export async function deleteProductOption(productId: number, optionId: number): Promise<void> {
  await axios.delete(`/api/products/${productId}/options/${optionId}`);
}

import axios from "axios";

export type Category = {
  id: number;
  name: string;
  description?: string;
};

export type Product = {
  id: number;
  name: string;
  description?: string;
  price: number;
  stockQuantity?: number;
  categories?: Category[];
  images?: { id: number; imageUrl: string }[];
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

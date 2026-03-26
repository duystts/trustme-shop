import axios from "axios";

export type ReviewUser = {
  id: number;
  fullName: string;
  email: string;
};

export type Review = {
  id: number;
  rating: number;
  comment?: string;
  user: ReviewUser;
  createdAt: string;
  updatedAt: string;
};

export async function getProductReviews(productId: number): Promise<Review[]> {
  const res = await axios.get(`/api/products/${productId}/reviews`);
  return res.data;
}

export async function getMyReview(productId: number): Promise<Review | null> {
  try {
    const res = await axios.get(`/api/products/${productId}/reviews/me`);
    return res.data ?? null;
  } catch {
    return null;
  }
}

export async function canReviewProduct(productId: number): Promise<boolean> {
  try {
    const res = await axios.get(`/api/products/${productId}/reviews/can-review`);
    return res.data?.canReview ?? false;
  } catch {
    return false;
  }
}

export async function createReview(productId: number, rating: number, comment: string): Promise<Review> {
  const res = await axios.post(`/api/products/${productId}/reviews`, { rating, comment });
  return res.data;
}

export async function updateReview(reviewId: number, rating: number, comment: string): Promise<Review> {
  const res = await axios.put(`/api/reviews/${reviewId}`, { rating, comment });
  return res.data;
}

export async function deleteReview(reviewId: number): Promise<void> {
  await axios.delete(`/api/reviews/${reviewId}`);
}

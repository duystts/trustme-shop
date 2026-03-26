package com.trustme.trustme_shop.service;

import com.trustme.trustme_shop.dto.ReviewRequest;
import com.trustme.trustme_shop.entity.Product;
import com.trustme.trustme_shop.entity.Review;
import com.trustme.trustme_shop.entity.User;
import com.trustme.trustme_shop.exception.BadRequestException;
import com.trustme.trustme_shop.exception.ResourceNotFoundException;
import com.trustme.trustme_shop.repository.ReviewRepository;
import com.trustme.trustme_shop.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final UserRepository userRepository;
    private final ProductService productService;

    public List<Review> getProductReviews(Long productId) {
        // Ensure product exists
        productService.getProductById(productId);
        return reviewRepository.findByProductIdOrderByCreatedAtDesc(productId);
    }

    @Transactional
    public Review createReview(String email, Long productId, ReviewRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Product product = productService.getProductById(productId);

        if (!reviewRepository.hasDeliveredOrderForProduct(user.getId(), productId)) {
            throw new BadRequestException("Bạn chỉ có thể đánh giá sản phẩm đã đặt và giao thành công");
        }

        if (reviewRepository.existsByUserIdAndProductId(user.getId(), productId)) {
            throw new BadRequestException("Bạn đã đánh giá sản phẩm này rồi");
        }

        Review review = Review.builder()
                .user(user)
                .product(product)
                .rating(request.getRating())
                .comment(request.getComment())
                .build();

        return reviewRepository.save(review);
    }

    @Transactional
    public Review updateReview(String email, Long reviewId, ReviewRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found"));

        if (!review.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("Bạn không có quyền sửa đánh giá này");
        }

        review.setRating(request.getRating());
        review.setComment(request.getComment());
        return reviewRepository.save(review);
    }

    @Transactional
    public void deleteReview(String email, Long reviewId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found"));

        boolean isOwner = review.getUser().getId().equals(user.getId());
        boolean isAdmin = user.getRole().equals("ADMIN") || user.getRole().equals("MANAGER");

        if (!isOwner && !isAdmin) {
            throw new AccessDeniedException("Bạn không có quyền xóa đánh giá này");
        }

        reviewRepository.delete(review);
    }

    /** Check if current user can review this product (for frontend gating) */
    public boolean canReview(String email, Long productId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return reviewRepository.hasDeliveredOrderForProduct(user.getId(), productId)
                && !reviewRepository.existsByUserIdAndProductId(user.getId(), productId);
    }

    /** Get current user's review for a product (null if not reviewed) */
    public Review getMyReview(String email, Long productId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return reviewRepository.findByUserIdAndProductId(user.getId(), productId).orElse(null);
    }
}

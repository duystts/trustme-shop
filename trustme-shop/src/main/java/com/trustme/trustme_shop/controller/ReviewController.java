package com.trustme.trustme_shop.controller;

import com.trustme.trustme_shop.dto.ReviewRequest;
import com.trustme.trustme_shop.entity.Review;
import com.trustme.trustme_shop.service.ReviewService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@Tag(name = "Review", description = "Product review APIs")
public class ReviewController {

    private final ReviewService reviewService;

    @GetMapping("/api/products/{productId}/reviews")
    @Operation(summary = "Get product reviews")
    public ResponseEntity<List<Review>> getProductReviews(@PathVariable Long productId) {
        return ResponseEntity.ok(reviewService.getProductReviews(productId));
    }

    @PostMapping("/api/products/{productId}/reviews")
    @Operation(summary = "Create a review (must have DELIVERED order for this product)")
    public ResponseEntity<Review> createReview(
            @PathVariable Long productId,
            @Valid @RequestBody ReviewRequest request,
            Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(reviewService.createReview(authentication.getName(), productId, request));
    }

    @GetMapping("/api/products/{productId}/reviews/me")
    @Operation(summary = "Get current user's review for a product")
    public ResponseEntity<?> getMyReview(
            @PathVariable Long productId,
            Authentication authentication) {
        if (authentication == null) return ResponseEntity.ok(null);
        Review review = reviewService.getMyReview(authentication.getName(), productId);
        return ResponseEntity.ok(review);
    }

    @GetMapping("/api/products/{productId}/reviews/can-review")
    @Operation(summary = "Check if current user can review this product")
    public ResponseEntity<Map<String, Boolean>> canReview(
            @PathVariable Long productId,
            Authentication authentication) {
        if (authentication == null) return ResponseEntity.ok(Map.of("canReview", false));
        boolean result = reviewService.canReview(authentication.getName(), productId);
        return ResponseEntity.ok(Map.of("canReview", result));
    }

    @PutMapping("/api/reviews/{reviewId}")
    @Operation(summary = "Update own review")
    public ResponseEntity<Review> updateReview(
            @PathVariable Long reviewId,
            @Valid @RequestBody ReviewRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(reviewService.updateReview(authentication.getName(), reviewId, request));
    }

    @DeleteMapping("/api/reviews/{reviewId}")
    @Operation(summary = "Delete own review (or admin)")
    public ResponseEntity<Void> deleteReview(
            @PathVariable Long reviewId,
            Authentication authentication) {
        reviewService.deleteReview(authentication.getName(), reviewId);
        return ResponseEntity.noContent().build();
    }
}

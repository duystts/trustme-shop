package com.trustme.trustme_shop.repository;

import com.trustme.trustme_shop.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    List<Review> findByProductIdOrderByCreatedAtDesc(Long productId);

    Optional<Review> findByUserIdAndProductId(Long userId, Long productId);

    boolean existsByUserIdAndProductId(Long userId, Long productId);

    /** Check if user has a DELIVERED order containing this product */
    @Query("""
        SELECT COUNT(oi) > 0
        FROM OrderItem oi
        WHERE oi.order.user.id = :userId
          AND oi.product.id = :productId
          AND oi.order.status = 'DELIVERED'
        """)
    boolean hasDeliveredOrderForProduct(Long userId, Long productId);
}

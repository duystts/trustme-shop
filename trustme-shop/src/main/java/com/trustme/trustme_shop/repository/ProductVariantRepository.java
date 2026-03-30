package com.trustme.trustme_shop.repository;

import com.trustme.trustme_shop.entity.ProductVariant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProductVariantRepository extends JpaRepository<ProductVariant, Long> {
    List<ProductVariant> findByProductId(Long productId);
    Optional<ProductVariant> findByIdAndProductId(Long id, Long productId);
    void deleteAllByProductId(Long productId);
}

package com.trustme.trustme_shop.repository;

import com.trustme.trustme_shop.entity.ProductOption;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProductOptionRepository extends JpaRepository<ProductOption, Long> {
    List<ProductOption> findByProductId(Long productId);
    Optional<ProductOption> findByIdAndProductId(Long id, Long productId);
}

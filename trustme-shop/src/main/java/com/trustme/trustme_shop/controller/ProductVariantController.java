package com.trustme.trustme_shop.controller;

import com.trustme.trustme_shop.dto.ProductVariantRequest;
import com.trustme.trustme_shop.entity.ProductVariant;
import com.trustme.trustme_shop.service.ProductVariantService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products/{productId}/variants")
@RequiredArgsConstructor
public class ProductVariantController {

    private final ProductVariantService variantService;

    @GetMapping
    public ResponseEntity<List<ProductVariant>> getVariants(@PathVariable Long productId) {
        return ResponseEntity.ok(variantService.getVariants(productId));
    }

    @PostMapping("/generate")
    public ResponseEntity<List<ProductVariant>> generate(@PathVariable Long productId) {
        return ResponseEntity.ok(variantService.generateVariants(productId));
    }

    @PutMapping("/{variantId}")
    public ResponseEntity<ProductVariant> update(
            @PathVariable Long productId,
            @PathVariable Long variantId,
            @Valid @RequestBody ProductVariantRequest req) {
        return ResponseEntity.ok(variantService.updateVariant(productId, variantId, req));
    }

    @DeleteMapping("/{variantId}")
    public ResponseEntity<Void> delete(
            @PathVariable Long productId,
            @PathVariable Long variantId) {
        variantService.deleteVariant(productId, variantId);
        return ResponseEntity.noContent().build();
    }
}

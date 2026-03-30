package com.trustme.trustme_shop.controller;

import com.trustme.trustme_shop.dto.ProductOptionRequest;
import com.trustme.trustme_shop.entity.ProductOption;
import com.trustme.trustme_shop.service.ProductOptionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products/{productId}/options")
@RequiredArgsConstructor
public class ProductOptionController {

    private final ProductOptionService optionService;

    @GetMapping
    public ResponseEntity<List<ProductOption>> getOptions(@PathVariable Long productId) {
        return ResponseEntity.ok(optionService.getOptions(productId));
    }

    @PostMapping
    public ResponseEntity<ProductOption> createOption(
            @PathVariable Long productId,
            @Valid @RequestBody ProductOptionRequest req) {
        return ResponseEntity.ok(optionService.createOption(productId, req));
    }

    @PutMapping("/{optionId}")
    public ResponseEntity<ProductOption> updateOption(
            @PathVariable Long productId,
            @PathVariable Long optionId,
            @Valid @RequestBody ProductOptionRequest req) {
        return ResponseEntity.ok(optionService.updateOption(productId, optionId, req));
    }

    @DeleteMapping("/{optionId}")
    public ResponseEntity<Void> deleteOption(
            @PathVariable Long productId,
            @PathVariable Long optionId) {
        optionService.deleteOption(productId, optionId);
        return ResponseEntity.noContent().build();
    }
}

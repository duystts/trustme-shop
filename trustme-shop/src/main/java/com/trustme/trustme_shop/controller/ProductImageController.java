package com.trustme.trustme_shop.controller;

import com.trustme.trustme_shop.entity.ProductImage;
import com.trustme.trustme_shop.service.ProductImageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/product-images")
@RequiredArgsConstructor
@Tag(name = "Product Image", description = "Product image management APIs with Cloudinary integration")
public class ProductImageController {

    private final ProductImageService productImageService;

    @GetMapping("/product/{productId}")
    @Operation(summary = "Get product images", description = "Retrieve all images for a specific product")
    public ResponseEntity<List<ProductImage>> getProductImages(@PathVariable Long productId) {
        return ResponseEntity.ok(productImageService.getImagesByProductId(productId));
    }

    @PostMapping("/product/{productId}")
    @Operation(summary = "Upload product image", description = "Upload an image for a product to Cloudinary")
    public ResponseEntity<ProductImage> uploadProductImage(
            @PathVariable Long productId,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(productImageService.uploadProductImage(productId, file));
    }

    @DeleteMapping("/{imageId}")
    @Operation(summary = "Delete product image", description = "Delete a specific product image from database and Cloudinary")
    public ResponseEntity<Void> deleteProductImage(@PathVariable Long imageId) {
        productImageService.deleteProductImage(imageId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/product/{productId}/all")
    @Operation(summary = "Delete all product images", description = "Delete all images for a specific product")
    public ResponseEntity<Void> deleteAllProductImages(@PathVariable Long productId) {
        productImageService.deleteAllProductImages(productId);
        return ResponseEntity.noContent().build();
    }
}

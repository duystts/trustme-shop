package com.trustme.trustme_shop.service;

import com.trustme.trustme_shop.entity.Product;
import com.trustme.trustme_shop.entity.ProductImage;
import com.trustme.trustme_shop.repository.ProductImageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ProductImageService {

    private final ProductImageRepository productImageRepository;
    private final CloudinaryService cloudinaryService;
    private final ProductService productService;

    public List<ProductImage> getImagesByProductId(Long productId) {
        return productImageRepository.findByProductId(productId);
    }

    @Transactional
    public ProductImage uploadProductImage(Long productId, MultipartFile file) {
        Product product = productService.getProductById(productId);

        Map<String, Object> uploadResult = cloudinaryService.uploadImage(file);
        String imageUrl = (String) uploadResult.get("secure_url");
        String publicId = (String) uploadResult.get("public_id");

        ProductImage productImage = ProductImage.builder()
                .product(product)
                .imageUrl(imageUrl)
                .cloudinaryPublicId(publicId)
                .build();

        return productImageRepository.save(productImage);
    }

    @Transactional
    public void deleteProductImage(Long imageId) {
        ProductImage productImage = productImageRepository.findById(imageId)
                .orElseThrow(() -> new RuntimeException("Product image not found with id: " + imageId));

        cloudinaryService.deleteImage(productImage.getCloudinaryPublicId());
        productImageRepository.delete(productImage);
    }

    @Transactional
    public void deleteAllProductImages(Long productId) {
        List<ProductImage> images = getImagesByProductId(productId);
        images.forEach(image -> {
            cloudinaryService.deleteImage(image.getCloudinaryPublicId());
            productImageRepository.delete(image);
        });
    }
}

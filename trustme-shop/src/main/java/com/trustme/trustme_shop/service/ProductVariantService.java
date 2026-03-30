package com.trustme.trustme_shop.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.trustme.trustme_shop.dto.ProductVariantRequest;
import com.trustme.trustme_shop.entity.Product;
import com.trustme.trustme_shop.entity.ProductOption;
import com.trustme.trustme_shop.entity.ProductVariant;
import com.trustme.trustme_shop.repository.ProductOptionRepository;
import com.trustme.trustme_shop.repository.ProductRepository;
import com.trustme.trustme_shop.repository.ProductVariantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;

@Service
@RequiredArgsConstructor
public class ProductVariantService {

    private final ProductVariantRepository variantRepository;
    private final ProductRepository productRepository;
    private final ProductOptionRepository optionRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public List<ProductVariant> getVariants(Long productId) {
        getProductOrThrow(productId);
        return variantRepository.findByProductId(productId);
    }

    public ProductVariant updateVariant(Long productId, Long variantId, ProductVariantRequest req) {
        ProductVariant variant = variantRepository.findByIdAndProductId(variantId, productId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Variant not found"));
        variant.setStockQuantity(req.getStockQuantity());
        if (req.getCombination() != null) {
            variant.setCombination(toJson(req.getCombination()));
        }
        return variantRepository.save(variant);
    }

    public void deleteVariant(Long productId, Long variantId) {
        ProductVariant variant = variantRepository.findByIdAndProductId(variantId, productId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Variant not found"));
        variantRepository.delete(variant);
    }

    @Transactional
    public List<ProductVariant> generateVariants(Long productId) {
        Product product = getProductOrThrow(productId);
        List<ProductOption> options = optionRepository.findByProductId(productId);

        if (options.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Sản phẩm chưa có lựa chọn nào");
        }

        // Build all combinations
        List<Map<String, String>> combinations = new ArrayList<>();
        combinations.add(new LinkedHashMap<>());

        for (ProductOption option : options) {
            List<Map<String, String>> newCombinations = new ArrayList<>();
            for (var existing : combinations) {
                for (var val : option.getValues()) {
                    Map<String, String> combo = new LinkedHashMap<>(existing);
                    combo.put(option.getName(), val.getValue());
                    newCombinations.add(combo);
                }
            }
            combinations = newCombinations;
        }

        // Get existing variants to preserve stock quantities
        List<ProductVariant> existing = variantRepository.findByProductId(productId);
        Map<String, Integer> existingStock = new HashMap<>();
        for (ProductVariant v : existing) {
            existingStock.put(v.getCombination(), v.getStockQuantity());
        }

        variantRepository.deleteAllByProductId(productId);

        List<ProductVariant> generated = combinations.stream()
                .map(combo -> {
                    String json = toJson(combo);
                    return ProductVariant.builder()
                            .product(product)
                            .combination(json)
                            .stockQuantity(existingStock.getOrDefault(json, 0))
                            .build();
                })
                .toList();

        return variantRepository.saveAll(generated);
    }

    private String toJson(Map<String, String> map) {
        try {
            return objectMapper.writeValueAsString(new TreeMap<>(map));
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize combination", e);
        }
    }

    private Product getProductOrThrow(Long productId) {
        return productRepository.findById(productId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
    }
}

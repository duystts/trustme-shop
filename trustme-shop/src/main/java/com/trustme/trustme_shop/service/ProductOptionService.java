package com.trustme.trustme_shop.service;

import com.trustme.trustme_shop.dto.ProductOptionRequest;
import com.trustme.trustme_shop.entity.Product;
import com.trustme.trustme_shop.entity.ProductOption;
import com.trustme.trustme_shop.entity.ProductOptionValue;
import com.trustme.trustme_shop.repository.ProductOptionRepository;
import com.trustme.trustme_shop.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductOptionService {

    private final ProductOptionRepository optionRepository;
    private final ProductRepository productRepository;

    public List<ProductOption> getOptions(Long productId) {
        getProductOrThrow(productId);
        return optionRepository.findByProductId(productId);
    }

    public ProductOption createOption(Long productId, ProductOptionRequest req) {
        Product product = getProductOrThrow(productId);
        ProductOption option = ProductOption.builder()
                .name(req.getName())
                .product(product)
                .build();
        List<ProductOptionValue> vals = req.getValues().stream()
                .map(v -> ProductOptionValue.builder().value(v).option(option).build())
                .toList();
        option.setValues(vals);
        return optionRepository.save(option);
    }

    public ProductOption updateOption(Long productId, Long optionId, ProductOptionRequest req) {
        ProductOption option = optionRepository.findByIdAndProductId(optionId, productId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Option not found"));
        option.setName(req.getName());
        option.getValues().clear();
        req.getValues().forEach(v -> option.getValues().add(
                ProductOptionValue.builder().value(v).option(option).build()
        ));
        return optionRepository.save(option);
    }

    public void deleteOption(Long productId, Long optionId) {
        ProductOption option = optionRepository.findByIdAndProductId(optionId, productId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Option not found"));
        optionRepository.delete(option);
    }

    private Product getProductOrThrow(Long productId) {
        return productRepository.findById(productId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
    }
}

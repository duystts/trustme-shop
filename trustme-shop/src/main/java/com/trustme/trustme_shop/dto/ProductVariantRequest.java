package com.trustme.trustme_shop.dto;

import jakarta.validation.constraints.Min;
import lombok.Data;

import java.util.Map;

@Data
public class ProductVariantRequest {
    private Map<String, String> combination; // {"Size":"S","Màu sắc":"Đỏ"}

    @Min(0)
    private int stockQuantity;
}

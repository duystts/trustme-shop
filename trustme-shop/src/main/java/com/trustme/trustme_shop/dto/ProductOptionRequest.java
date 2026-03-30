package com.trustme.trustme_shop.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class ProductOptionRequest {

    @NotBlank
    private String name;

    @NotEmpty
    private List<String> values; // just label strings, stock is managed via variants
}

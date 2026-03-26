package com.trustme.trustme_shop.dto;

import com.trustme.trustme_shop.entity.Product;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AiChatResponse {
    private String reply;
    private Product product; // optional — set when AI suggests a specific product
}

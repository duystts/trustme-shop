package com.trustme.trustme_shop.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PaymentInitResponse {
    private Long orderId;
    private String paymentMethod;
    /** Redirect URL for VNPAY / MOMO. null for COD. */
    private String paymentUrl;
    /** PENDING | CONFIRMED */
    private String status;
}

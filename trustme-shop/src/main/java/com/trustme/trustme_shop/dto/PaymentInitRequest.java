package com.trustme.trustme_shop.dto;

import lombok.Data;

@Data
public class PaymentInitRequest {
    private Long orderId;
    /** COD | VNPAY | MOMO */
    private String paymentMethod;
    /** Set by controller from HttpServletRequest */
    private String clientIp;
}

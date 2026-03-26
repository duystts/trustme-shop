package com.trustme.trustme_shop.controller;

import com.trustme.trustme_shop.entity.Payment;
import com.trustme.trustme_shop.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@Tag(name = "Payment", description = "Payment processing APIs")
public class PaymentController {

    private final PaymentService paymentService;

    @GetMapping("/order/{orderId}")
    @Operation(summary = "Get payment by order", description = "Retrieve payment information for a specific order")
    public ResponseEntity<Payment> getPaymentByOrderId(@PathVariable Long orderId) {
        return ResponseEntity.ok(paymentService.getPaymentByOrderId(orderId));
    }

    @PostMapping("/order/{orderId}")
    @Operation(summary = "Create payment", description = "Create a payment for an order with specified payment method")
    public ResponseEntity<Payment> createPayment(
            @PathVariable Long orderId,
            @RequestParam String paymentMethod) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(paymentService.createPayment(orderId, paymentMethod));
    }

    @PutMapping("/{paymentId}/confirm")
    @Operation(summary = "Confirm payment", description = "Confirm a payment and update status to PAID")
    public ResponseEntity<Payment> confirmPayment(@PathVariable Long paymentId) {
        return ResponseEntity.ok(paymentService.confirmPayment(paymentId));
    }
}

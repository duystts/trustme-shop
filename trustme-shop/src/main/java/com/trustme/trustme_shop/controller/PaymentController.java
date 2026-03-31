package com.trustme.trustme_shop.controller;

import com.trustme.trustme_shop.dto.PaymentInitRequest;
import com.trustme.trustme_shop.dto.PaymentInitResponse;
import com.trustme.trustme_shop.entity.Payment;
import com.trustme.trustme_shop.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@Tag(name = "Payment", description = "Payment processing APIs")
public class PaymentController {

    private final PaymentService paymentService;

    // ── Existing endpoints ────────────────────────────────────────────────────

    @GetMapping("/order/{orderId}")
    @Operation(summary = "Get payment by order")
    public ResponseEntity<Payment> getPaymentByOrderId(@PathVariable Long orderId) {
        return ResponseEntity.ok(paymentService.getPaymentByOrderId(orderId));
    }

    @PostMapping("/order/{orderId}")
    @Operation(summary = "Create payment (legacy)")
    public ResponseEntity<Payment> createPayment(
            @PathVariable Long orderId,
            @RequestParam String paymentMethod) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(paymentService.createPayment(orderId, paymentMethod));
    }

    @PutMapping("/{paymentId}/confirm")
    @Operation(summary = "Manually confirm payment (admin)")
    public ResponseEntity<Payment> confirmPayment(@PathVariable Long paymentId) {
        return ResponseEntity.ok(paymentService.confirmPayment(paymentId));
    }

    // ── Gateway endpoints ─────────────────────────────────────────────────────

    @PostMapping("/initiate")
    @Operation(summary = "Initiate payment — returns redirect URL for VNPay/MoMo, null for COD")
    public ResponseEntity<PaymentInitResponse> initiatePayment(
            @RequestBody PaymentInitRequest req,
            HttpServletRequest httpRequest) {
        String ip = httpRequest.getHeader("X-Forwarded-For");
        if (ip == null || ip.isBlank()) ip = httpRequest.getRemoteAddr();
        req.setClientIp(ip);
        return ResponseEntity.ok(paymentService.initPayment(req));
    }

    @GetMapping("/status/{orderId}")
    @Operation(summary = "Get payment status for an order")
    public ResponseEntity<Payment> getPaymentStatus(@PathVariable Long orderId) {
        return ResponseEntity.ok(paymentService.getPaymentByOrderId(orderId));
    }

    // ── Gateway callbacks (public — no JWT required) ──────────────────────────

    @GetMapping("/vnpay/return")
    @Operation(summary = "VNPay redirects user here after payment")
    public ResponseEntity<Void> vnpayReturn(@RequestParam Map<String, String> params) {
        paymentService.handleVNPayReturn(params);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/momo/ipn")
    @Operation(summary = "MoMo IPN — server-to-server payment notification")
    public ResponseEntity<Map<String, Object>> momoIPN(@RequestBody Map<String, Object> body) {
        paymentService.handleMoMoIPN(body);
        return ResponseEntity.ok(Map.of("status", 0, "message", "success"));
    }
}

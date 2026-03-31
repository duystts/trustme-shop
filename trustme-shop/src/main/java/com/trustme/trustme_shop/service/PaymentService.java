package com.trustme.trustme_shop.service;

import com.trustme.trustme_shop.dto.PaymentInitRequest;
import com.trustme.trustme_shop.dto.PaymentInitResponse;
import com.trustme.trustme_shop.entity.Order;
import com.trustme.trustme_shop.entity.Payment;
import com.trustme.trustme_shop.exception.ResourceNotFoundException;
import com.trustme.trustme_shop.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final OrderService orderService;
    private final VNPayService vnPayService;
    private final MoMoService moMoService;

    public Payment getPaymentByOrderId(Long orderId) {
        return paymentRepository.findByOrderId(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found for order id: " + orderId));
    }

    @Transactional
    public Payment createPayment(Long orderId, String paymentMethod) {
        Order order = orderService.getOrderById(orderId);
        Payment payment = Payment.builder()
                .order(order)
                .paymentMethod(paymentMethod)
                .paymentStatus("UNPAID")
                .build();
        return paymentRepository.save(payment);
    }

    @Transactional
    public Payment confirmPayment(Long paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with id: " + paymentId));
        payment.setPaymentStatus("PAID");
        payment.setPaymentDate(LocalDateTime.now());
        return paymentRepository.save(payment);
    }

    // ── Gateway integration ───────────────────────────────────────────────────

    @Transactional
    public PaymentInitResponse initPayment(PaymentInitRequest req) {
        Order order = orderService.getOrderById(req.getOrderId());
        String method = req.getPaymentMethod().toUpperCase();

        // Upsert payment record
        Payment payment = paymentRepository.findByOrderId(req.getOrderId())
                .orElseGet(() -> Payment.builder()
                        .order(order)
                        .paymentStatus("UNPAID")
                        .build());
        payment.setPaymentMethod(method);
        paymentRepository.save(payment);

        if ("COD".equals(method)) {
            payment.setPaymentStatus("CONFIRMED");
            payment.setPaymentDate(LocalDateTime.now());
            paymentRepository.save(payment);
            return PaymentInitResponse.builder()
                    .orderId(order.getId())
                    .paymentMethod(method)
                    .paymentUrl(null)
                    .status("CONFIRMED")
                    .build();
        }

        long amount = order.getTotalMoney().longValue();
        String paymentUrl;

        if ("VNPAY".equals(method)) {
            paymentUrl = vnPayService.createPaymentUrl(order.getId(), amount, req.getClientIp());
        } else if ("MOMO".equals(method)) {
            paymentUrl = moMoService.createPaymentUrl(order.getId(), amount);
        } else {
            throw new IllegalArgumentException("Unsupported payment method: " + method);
        }

        return PaymentInitResponse.builder()
                .orderId(order.getId())
                .paymentMethod(method)
                .paymentUrl(paymentUrl)
                .status("PENDING")
                .build();
    }

    @Transactional
    public void handleVNPayReturn(Map<String, String> params) {
        if (!vnPayService.verifyCallback(params)) return;
        Long orderId = vnPayService.extractOrderId(params);
        if (orderId == null) return;

        paymentRepository.findByOrderId(orderId).ifPresent(payment -> {
            if (vnPayService.isSuccess(params)) {
                payment.setPaymentStatus("PAID");
                payment.setPaymentDate(LocalDateTime.now());
                payment.setTransactionId(params.get("vnp_TransactionNo"));
            } else {
                payment.setPaymentStatus("FAILED");
            }
            paymentRepository.save(payment);
        });
    }

    @Transactional
    public void handleMoMoIPN(Map<String, Object> body) {
        if (!moMoService.verifyIPN(body)) return;
        Long orderId = moMoService.extractOrderId(body);
        if (orderId == null) return;

        paymentRepository.findByOrderId(orderId).ifPresent(payment -> {
            if (moMoService.isSuccess(body)) {
                payment.setPaymentStatus("PAID");
                payment.setPaymentDate(LocalDateTime.now());
                payment.setTransactionId(String.valueOf(body.getOrDefault("transId", "")));
            } else {
                payment.setPaymentStatus("FAILED");
            }
            paymentRepository.save(payment);
        });
    }
}

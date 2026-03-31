package com.trustme.trustme_shop.service;

import com.trustme.trustme_shop.dto.PaymentInitRequest;
import com.trustme.trustme_shop.dto.PaymentInitResponse;
import com.trustme.trustme_shop.entity.Order;
import com.trustme.trustme_shop.entity.Payment;
import com.trustme.trustme_shop.entity.User;
import com.trustme.trustme_shop.repository.PaymentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock private PaymentRepository paymentRepository;
    @Mock private OrderService orderService;
    @Mock private VNPayService vnPayService;
    @Mock private MoMoService moMoService;

    @InjectMocks
    private PaymentService paymentService;

    private Order testOrder;

    @BeforeEach
    void setUp() {
        User user = User.builder().id(1L).email("user@test.com").build();
        testOrder = Order.builder()
                .id(10L)
                .user(user)
                .status("PENDING")
                .totalMoney(300_000.0)
                .shippingAddress("123 Test St")
                .build();
    }

    // ── initPayment COD ───────────────────────────────────────────────────────

    @Test
    @DisplayName("initPayment COD confirms payment immediately, returns CONFIRMED")
    void initPayment_COD_confirmsImmediately() {
        PaymentInitRequest req = new PaymentInitRequest();
        req.setOrderId(10L);
        req.setPaymentMethod("COD");

        when(orderService.getOrderById(10L)).thenReturn(testOrder);
        when(paymentRepository.findByOrderId(10L)).thenReturn(Optional.empty());
        when(paymentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        PaymentInitResponse response = paymentService.initPayment(req);

        assertThat(response.getPaymentMethod()).isEqualTo("COD");
        assertThat(response.getPaymentUrl()).isNull();
        assertThat(response.getStatus()).isEqualTo("CONFIRMED");
        assertThat(response.getOrderId()).isEqualTo(10L);
    }

    @Test
    @DisplayName("initPayment COD reuses existing Payment record")
    void initPayment_COD_reusesExistingPayment() {
        PaymentInitRequest req = new PaymentInitRequest();
        req.setOrderId(10L);
        req.setPaymentMethod("COD");

        Payment existing = Payment.builder().order(testOrder).paymentStatus("UNPAID").build();
        when(orderService.getOrderById(10L)).thenReturn(testOrder);
        when(paymentRepository.findByOrderId(10L)).thenReturn(Optional.of(existing));
        when(paymentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        paymentService.initPayment(req);

        // Save called twice (once to set method, once to confirm)
        verify(paymentRepository, times(2)).save(existing);
    }

    // ── initPayment VNPAY ─────────────────────────────────────────────────────

    @Test
    @DisplayName("initPayment VNPAY returns PENDING with paymentUrl")
    void initPayment_VNPAY_returnsPendingWithUrl() {
        PaymentInitRequest req = new PaymentInitRequest();
        req.setOrderId(10L);
        req.setPaymentMethod("VNPAY");
        req.setClientIp("127.0.0.1");

        when(orderService.getOrderById(10L)).thenReturn(testOrder);
        when(paymentRepository.findByOrderId(10L)).thenReturn(Optional.empty());
        when(paymentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(vnPayService.createPaymentUrl(10L, 300_000L, "127.0.0.1"))
                .thenReturn("https://sandbox.vnpayment.vn/pay?token=abc");

        PaymentInitResponse response = paymentService.initPayment(req);

        assertThat(response.getPaymentMethod()).isEqualTo("VNPAY");
        assertThat(response.getPaymentUrl()).isEqualTo("https://sandbox.vnpayment.vn/pay?token=abc");
        assertThat(response.getStatus()).isEqualTo("PENDING");
    }

    // ── initPayment MOMO ──────────────────────────────────────────────────────

    @Test
    @DisplayName("initPayment MOMO returns PENDING with paymentUrl")
    void initPayment_MOMO_returnsPendingWithUrl() {
        PaymentInitRequest req = new PaymentInitRequest();
        req.setOrderId(10L);
        req.setPaymentMethod("MOMO");

        when(orderService.getOrderById(10L)).thenReturn(testOrder);
        when(paymentRepository.findByOrderId(10L)).thenReturn(Optional.empty());
        when(paymentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(moMoService.createPaymentUrl(10L, 300_000L))
                .thenReturn("https://test-payment.momo.vn/pay?id=xyz");

        PaymentInitResponse response = paymentService.initPayment(req);

        assertThat(response.getPaymentMethod()).isEqualTo("MOMO");
        assertThat(response.getPaymentUrl()).isEqualTo("https://test-payment.momo.vn/pay?id=xyz");
        assertThat(response.getStatus()).isEqualTo("PENDING");
    }

    @Test
    @DisplayName("initPayment with unsupported method throws IllegalArgumentException")
    void initPayment_unsupportedMethodThrows() {
        PaymentInitRequest req = new PaymentInitRequest();
        req.setOrderId(10L);
        req.setPaymentMethod("STRIPE");

        when(orderService.getOrderById(10L)).thenReturn(testOrder);
        when(paymentRepository.findByOrderId(10L)).thenReturn(Optional.empty());
        when(paymentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        assertThatThrownBy(() -> paymentService.initPayment(req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Unsupported payment method");
    }

    // ── handleVNPayReturn ─────────────────────────────────────────────────────

    @Test
    @DisplayName("handleVNPayReturn with invalid signature does nothing")
    void handleVNPayReturn_invalidSignatureNoOp() {
        Map<String, String> params = new HashMap<>();
        when(vnPayService.verifyCallback(params)).thenReturn(false);

        paymentService.handleVNPayReturn(params);

        verify(paymentRepository, never()).save(any());
    }

    @Test
    @DisplayName("handleVNPayReturn with valid successful callback sets payment to PAID")
    void handleVNPayReturn_successSetsPaid() {
        Map<String, String> params = new HashMap<>();
        params.put("vnp_TransactionNo", "TXN123456");
        Payment payment = Payment.builder().order(testOrder).paymentStatus("UNPAID").build();

        when(vnPayService.verifyCallback(params)).thenReturn(true);
        when(vnPayService.extractOrderId(params)).thenReturn(10L);
        when(vnPayService.isSuccess(params)).thenReturn(true);
        when(paymentRepository.findByOrderId(10L)).thenReturn(Optional.of(payment));
        when(paymentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        paymentService.handleVNPayReturn(params);

        assertThat(payment.getPaymentStatus()).isEqualTo("PAID");
        assertThat(payment.getTransactionId()).isEqualTo("TXN123456");
        assertThat(payment.getPaymentDate()).isNotNull();
        verify(paymentRepository).save(payment);
    }

    @Test
    @DisplayName("handleVNPayReturn with failed callback sets payment to FAILED")
    void handleVNPayReturn_failureSetsFailed() {
        Map<String, String> params = new HashMap<>();
        Payment payment = Payment.builder().order(testOrder).paymentStatus("UNPAID").build();

        when(vnPayService.verifyCallback(params)).thenReturn(true);
        when(vnPayService.extractOrderId(params)).thenReturn(10L);
        when(vnPayService.isSuccess(params)).thenReturn(false);
        when(paymentRepository.findByOrderId(10L)).thenReturn(Optional.of(payment));
        when(paymentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        paymentService.handleVNPayReturn(params);

        assertThat(payment.getPaymentStatus()).isEqualTo("FAILED");
    }

    // ── handleMoMoIPN ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("handleMoMoIPN with invalid signature does nothing")
    void handleMoMoIPN_invalidSignatureNoOp() {
        Map<String, Object> body = new HashMap<>();
        when(moMoService.verifyIPN(body)).thenReturn(false);

        paymentService.handleMoMoIPN(body);

        verify(paymentRepository, never()).save(any());
    }

    @Test
    @DisplayName("handleMoMoIPN with valid successful IPN sets payment to PAID")
    void handleMoMoIPN_successSetsPaid() {
        Map<String, Object> body = new HashMap<>();
        body.put("transId", "MOMOTXN789");
        Payment payment = Payment.builder().order(testOrder).paymentStatus("UNPAID").build();

        when(moMoService.verifyIPN(body)).thenReturn(true);
        when(moMoService.extractOrderId(body)).thenReturn(10L);
        when(moMoService.isSuccess(body)).thenReturn(true);
        when(paymentRepository.findByOrderId(10L)).thenReturn(Optional.of(payment));
        when(paymentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        paymentService.handleMoMoIPN(body);

        assertThat(payment.getPaymentStatus()).isEqualTo("PAID");
        assertThat(payment.getTransactionId()).isEqualTo("MOMOTXN789");
        assertThat(payment.getPaymentDate()).isNotNull();
        verify(paymentRepository).save(payment);
    }

    @Test
    @DisplayName("handleMoMoIPN with failed IPN sets payment to FAILED")
    void handleMoMoIPN_failureSetsFailed() {
        Map<String, Object> body = new HashMap<>();
        Payment payment = Payment.builder().order(testOrder).paymentStatus("UNPAID").build();

        when(moMoService.verifyIPN(body)).thenReturn(true);
        when(moMoService.extractOrderId(body)).thenReturn(10L);
        when(moMoService.isSuccess(body)).thenReturn(false);
        when(paymentRepository.findByOrderId(10L)).thenReturn(Optional.of(payment));
        when(paymentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        paymentService.handleMoMoIPN(body);

        assertThat(payment.getPaymentStatus()).isEqualTo("FAILED");
    }
}

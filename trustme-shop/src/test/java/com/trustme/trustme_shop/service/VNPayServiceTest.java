package com.trustme.trustme_shop.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.*;

class VNPayServiceTest {

    private VNPayService vnPayService;

    private static final String TEST_SECRET = "TESTKEY0123456789ABCDEFGHIJKLMNO";

    @BeforeEach
    void setUp() {
        vnPayService = new VNPayService();
        ReflectionTestUtils.setField(vnPayService, "tmnCode",   "TESTSHOP");
        ReflectionTestUtils.setField(vnPayService, "hashSecret", TEST_SECRET);
        ReflectionTestUtils.setField(vnPayService, "vnpayUrl",   "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html");
        ReflectionTestUtils.setField(vnPayService, "returnUrl",  "http://localhost:5173/checkout/result");
    }

    // ── isSuccess ─────────────────────────────────────────────────────────────

    @Test
    @DisplayName("isSuccess returns true for vnp_ResponseCode=00")
    void isSuccess_returnsTrueFor00() {
        Map<String, String> params = Map.of("vnp_ResponseCode", "00");
        assertThat(vnPayService.isSuccess(params)).isTrue();
    }

    @Test
    @DisplayName("isSuccess returns false for non-00 code")
    void isSuccess_returnsFalseForOtherCodes() {
        assertThat(vnPayService.isSuccess(Map.of("vnp_ResponseCode", "24"))).isFalse();
        assertThat(vnPayService.isSuccess(Map.of("vnp_ResponseCode", "99"))).isFalse();
        assertThat(vnPayService.isSuccess(new HashMap<>())).isFalse();
    }

    // ── extractOrderId ────────────────────────────────────────────────────────

    @Test
    @DisplayName("extractOrderId parses orderId from vnp_TxnRef format orderId_timestamp")
    void extractOrderId_parsesCorrectly() {
        Map<String, String> params = Map.of("vnp_TxnRef", "42_1711900000000");
        assertThat(vnPayService.extractOrderId(params)).isEqualTo(42L);
    }

    @Test
    @DisplayName("extractOrderId returns null for malformed vnp_TxnRef")
    void extractOrderId_malformedReturnsNull() {
        Map<String, String> params = Map.of("vnp_TxnRef", "not_a_number_abc");
        assertThat(vnPayService.extractOrderId(params)).isNull();
    }

    @Test
    @DisplayName("extractOrderId returns null when vnp_TxnRef is missing")
    void extractOrderId_missingReturnsNull() {
        assertThat(vnPayService.extractOrderId(new HashMap<>())).isNull();
    }

    // ── verifyCallback ────────────────────────────────────────────────────────

    @Test
    @DisplayName("verifyCallback returns true for valid signature from createPaymentUrl")
    void verifyCallback_validSignatureReturnsTrue() {
        // Generate a real URL, then parse its params back and verify
        String url = vnPayService.createPaymentUrl(1L, 300_000L, "127.0.0.1");
        String query = url.substring(url.indexOf('?') + 1);

        Map<String, String> params = new HashMap<>();
        for (String pair : query.split("&")) {
            int eq = pair.indexOf('=');
            String key = pair.substring(0, eq);
            String val = java.net.URLDecoder.decode(pair.substring(eq + 1), StandardCharsets.UTF_8);
            params.put(key, val);
        }

        assertThat(vnPayService.verifyCallback(params)).isTrue();
    }

    @Test
    @DisplayName("verifyCallback returns false for tampered signature")
    void verifyCallback_invalidSignatureReturnsFalse() {
        Map<String, String> params = new HashMap<>();
        params.put("vnp_Amount",      "30000000");
        params.put("vnp_ResponseCode","00");
        params.put("vnp_SecureHash",  "deadbeefdeadbeef");
        assertThat(vnPayService.verifyCallback(params)).isFalse();
    }

    @Test
    @DisplayName("verifyCallback returns false when SecureHash is absent")
    void verifyCallback_missingHashReturnsFalse() {
        assertThat(vnPayService.verifyCallback(new HashMap<>())).isFalse();
    }

    // ── createPaymentUrl ──────────────────────────────────────────────────────

    @Test
    @DisplayName("createPaymentUrl returns URL starting with VNPay sandbox host")
    void createPaymentUrl_returnsValidUrl() {
        String url = vnPayService.createPaymentUrl(1L, 300_000L, "127.0.0.1");
        assertThat(url).startsWith("https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?");
        assertThat(url).contains("vnp_TmnCode=TESTSHOP");
        assertThat(url).contains("vnp_Amount=30000000");   // 300_000 × 100
        assertThat(url).contains("vnp_SecureHash=");
    }

}

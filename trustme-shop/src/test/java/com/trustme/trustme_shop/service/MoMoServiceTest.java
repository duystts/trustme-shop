package com.trustme.trustme_shop.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.*;

class MoMoServiceTest {

    private MoMoService moMoService;

    @BeforeEach
    void setUp() {
        moMoService = new MoMoService();
        ReflectionTestUtils.setField(moMoService, "partnerCode", "MOMO");
        ReflectionTestUtils.setField(moMoService, "accessKey",   "F8BBA842ECF85");
        ReflectionTestUtils.setField(moMoService, "secretKey",   "K951B6PE1waDMi640xX08PD3vg6EkVlz");
        ReflectionTestUtils.setField(moMoService, "endpoint",    "https://test-payment.momo.vn/v2/gateway/api/create");
        ReflectionTestUtils.setField(moMoService, "returnUrl",   "http://localhost:5173/checkout/result");
        ReflectionTestUtils.setField(moMoService, "notifyUrl",   "http://localhost:8080/api/payments/momo/ipn");
    }

    // ── isSuccess ─────────────────────────────────────────────────────────────

    @Test
    @DisplayName("isSuccess returns true for resultCode=0")
    void isSuccess_returnsTrueFor0() {
        assertThat(moMoService.isSuccess(Map.of("resultCode", 0))).isTrue();
        assertThat(moMoService.isSuccess(Map.of("resultCode", "0"))).isTrue();
    }

    @Test
    @DisplayName("isSuccess returns false for non-zero resultCode")
    void isSuccess_returnsFalseForOther() {
        assertThat(moMoService.isSuccess(Map.of("resultCode", 1))).isFalse();
        assertThat(moMoService.isSuccess(Map.of("resultCode", 9000))).isFalse();
        assertThat(moMoService.isSuccess(new HashMap<>())).isFalse();
    }

    // ── extractOrderId ────────────────────────────────────────────────────────

    @Test
    @DisplayName("extractOrderId parses id from orderId format id_timestamp")
    void extractOrderId_parsesCorrectly() {
        Map<String, Object> params = Map.of("orderId", "55_1711900000000");
        assertThat(moMoService.extractOrderId(params)).isEqualTo(55L);
    }

    @Test
    @DisplayName("extractOrderId returns null for malformed orderId")
    void extractOrderId_malformedReturnsNull() {
        Map<String, Object> params = Map.of("orderId", "notanumber_timestamp");
        assertThat(moMoService.extractOrderId(params)).isNull();
    }

    @Test
    @DisplayName("extractOrderId returns null when orderId is missing")
    void extractOrderId_missingReturnsNull() {
        assertThat(moMoService.extractOrderId(new HashMap<>())).isNull();
    }

    // ── verifyIPN ─────────────────────────────────────────────────────────────

    @Test
    @DisplayName("verifyIPN returns false for tampered signature")
    void verifyIPN_tamperedReturnsFalse() {
        Map<String, Object> params = new HashMap<>();
        params.put("accessKey",    "F8BBA842ECF85");
        params.put("amount",       150000);
        params.put("extraData",    "");
        params.put("message",      "Successful.");
        params.put("orderId",      "1_1711900000000");
        params.put("orderInfo",    "Thanh toan don hang #1");
        params.put("orderType",    "momo_wallet");
        params.put("partnerCode",  "MOMO");
        params.put("payType",      "qr");
        params.put("requestId",    "1_1711900000000");
        params.put("responseTime", 1711900001000L);
        params.put("resultCode",   0);
        params.put("transId",      9999999L);
        params.put("signature",    "invalidsignature");

        assertThat(moMoService.verifyIPN(params)).isFalse();
    }

    @Test
    @DisplayName("verifyIPN returns false when signature field is absent")
    void verifyIPN_missingSignatureReturnsFalse() {
        assertThat(moMoService.verifyIPN(new HashMap<>())).isFalse();
    }
}

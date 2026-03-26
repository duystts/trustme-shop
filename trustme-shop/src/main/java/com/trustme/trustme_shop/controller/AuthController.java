package com.trustme.trustme_shop.controller;

import com.trustme.trustme_shop.dto.AuthResponse;
import com.trustme.trustme_shop.dto.ForgotPasswordRequest;
import com.trustme.trustme_shop.dto.LoginRequest;
import com.trustme.trustme_shop.dto.RegisterRequest;
import com.trustme.trustme_shop.dto.VerifyPinRequest;
import com.trustme.trustme_shop.service.AuthService;
import com.trustme.trustme_shop.service.ForgotPasswordService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Authentication and registration APIs")
public class AuthController {

    private final AuthService authService;
    private final ForgotPasswordService forgotPasswordService;

    @PostMapping("/register")
    @Operation(summary = "Register new user", description = "Register a new user account and get JWT token")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    @PostMapping("/login")
    @Operation(summary = "Login", description = "Authenticate user and get JWT token")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }
    
    @PostMapping("/forgot-password")
    @Operation(summary = "Forgot password", description = "Send 6-digit PIN to email for password reset")
    public ResponseEntity<String> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        forgotPasswordService.sendPasswordResetPin(request);
        return ResponseEntity.ok("Password reset PIN has been sent to your email. Please check your inbox.");
    }
    
    @PostMapping("/verify-pin")
    @Operation(summary = "Verify PIN and reset password", description = "Verify PIN code and set new password")
    public ResponseEntity<String> verifyPinAndResetPassword(@Valid @RequestBody VerifyPinRequest request) {
        forgotPasswordService.verifyPinAndResetPassword(request);
        return ResponseEntity.ok("Password has been reset successfully. You can now login with your new password.");
    }
}

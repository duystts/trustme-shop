package com.trustme.trustme_shop.service;

import com.trustme.trustme_shop.dto.ForgotPasswordRequest;
import com.trustme.trustme_shop.dto.VerifyPinRequest;
import com.trustme.trustme_shop.entity.PasswordResetToken;
import com.trustme.trustme_shop.entity.User;
import com.trustme.trustme_shop.exception.BadRequestException;
import com.trustme.trustme_shop.exception.ResourceNotFoundException;
import com.trustme.trustme_shop.repository.PasswordResetTokenRepository;
import com.trustme.trustme_shop.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class ForgotPasswordService {

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;

    @Value("${forgot.password.pin.expiration}")
    private Long pinExpirationMs;

    /**
     * Generates and sends a 6-digit PIN to user's email
     */
    @Transactional
    public void sendPasswordResetPin(ForgotPasswordRequest request) {
        // Check if user exists
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("No account found with email: " + request.getEmail()));

        // Delete any existing tokens for this email
        tokenRepository.deleteByEmail(request.getEmail());

        // Generate 6-digit PIN
        String pin = generatePin();

        // Calculate expiry time (5 minutes from now)
        LocalDateTime expiryDate = LocalDateTime.now().plusSeconds(pinExpirationMs / 1000);

        // Save token
        PasswordResetToken token = PasswordResetToken.builder()
                .email(request.getEmail())
                .pin(pin)
                .expiryDate(expiryDate)
                .used(false)
                .build();
        tokenRepository.save(token);

        // Send email
        emailService.sendPasswordResetPin(request.getEmail(), pin);
    }

    /**
     * Verifies PIN and resets password
     */
    @Transactional
    public void verifyPinAndResetPassword(VerifyPinRequest request) {
        // Find token
        PasswordResetToken token = tokenRepository.findByEmailAndPinAndUsedFalse(request.getEmail(), request.getPin())
                .orElseThrow(() -> new BadRequestException("Invalid or expired PIN"));

        // Check if token is expired
        if (token.getExpiryDate().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("PIN has expired. Please request a new one.");
        }

        // Get user
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Update password
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        // Delete used token immediately
        tokenRepository.delete(token);

        // Clean up any remaining expired tokens
        tokenRepository.deleteByExpiryDateBefore(LocalDateTime.now());
    }

    /**
     * Generates a random 6-digit PIN
     */
    private String generatePin() {
        SecureRandom random = new SecureRandom();
        int pin = 100000 + random.nextInt(900000);
        return String.valueOf(pin);
    }
}

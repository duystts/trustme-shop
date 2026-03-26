package com.trustme.trustme_shop.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    public void sendPasswordResetPin(String toEmail, String pin) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("noreply@trustme-shop.com");
            message.setTo(toEmail);
            message.setSubject("TrustMe Shop - Password Reset PIN");
            message.setText(buildEmailContent(pin));
            
            mailSender.send(message);
            log.info("Password reset PIN sent to: {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send email to: {}", toEmail, e);
            throw new RuntimeException("Failed to send email. Please try again later.");
        }
    }

    private String buildEmailContent(String pin) {
        return "Dear Customer,\n\n" +
                "You have requested to reset your password for TrustMe Shop.\n\n" +
                "Your password reset PIN is: " + pin + "\n\n" +
                "This PIN will expire in 5 minutes.\n\n" +
                "If you did not request this password reset, please ignore this email.\n\n" +
                "Best regards,\n" +
                "TrustMe Shop Team";
    }
}

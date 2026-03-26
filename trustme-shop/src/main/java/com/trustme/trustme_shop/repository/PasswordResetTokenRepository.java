package com.trustme.trustme_shop.repository;

import com.trustme.trustme_shop.entity.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    Optional<PasswordResetToken> findByEmailAndPinAndUsedFalse(String email, String pin);
    void deleteByExpiryDateBefore(LocalDateTime now);
    void deleteByEmail(String email);
}

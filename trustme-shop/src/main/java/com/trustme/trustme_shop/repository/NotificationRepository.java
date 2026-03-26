package com.trustme.trustme_shop.repository;

import com.trustme.trustme_shop.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByActiveTrueOrderByCreatedAtDesc();

    List<Notification> findByActiveTrueAndExpiresAtIsNullOrExpiresAtAfterOrderByCreatedAtDesc(LocalDateTime now);
}

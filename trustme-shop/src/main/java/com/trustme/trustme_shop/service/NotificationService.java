package com.trustme.trustme_shop.service;

import com.trustme.trustme_shop.entity.Notification;
import com.trustme.trustme_shop.exception.ResourceNotFoundException;
import com.trustme.trustme_shop.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    /** Active + not expired notifications for public display */
    public List<Notification> getActiveNotifications() {
        return notificationRepository.findByActiveTrueOrderByCreatedAtDesc()
                .stream()
                .filter(n -> n.getExpiresAt() == null || n.getExpiresAt().isAfter(LocalDateTime.now()))
                .toList();
    }

    /** All notifications for admin */
    public List<Notification> getAllNotifications() {
        return notificationRepository.findAll();
    }

    @Transactional
    public Notification create(Notification notification) {
        return notificationRepository.save(notification);
    }

    @Transactional
    public Notification update(Long id, Notification data) {
        Notification existing = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Thông báo không tồn tại"));
        existing.setTitle(data.getTitle());
        existing.setMessage(data.getMessage());
        existing.setType(data.getType());
        existing.setActive(data.isActive());
        existing.setExpiresAt(data.getExpiresAt());
        return notificationRepository.save(existing);
    }

    @Transactional
    public void delete(Long id) {
        notificationRepository.deleteById(id);
    }
}

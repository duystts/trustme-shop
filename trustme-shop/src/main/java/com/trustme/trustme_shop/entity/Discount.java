package com.trustme.trustme_shop.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "discounts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Discount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String code;

    private String description;

    /** PERCENTAGE or FIXED */
    @Column(nullable = false)
    private String discountType;

    /** % value (e.g. 10 = 10%) or fixed amount (e.g. 50000 = 50k VND) */
    @Column(nullable = false)
    private Double discountValue;

    /** Minimum order total to apply this discount */
    @Builder.Default
    private Double minOrderValue = 0.0;

    /** Cap for percentage discounts (null = no cap) */
    private Double maxDiscount;

    private LocalDateTime startDate;
    private LocalDateTime endDate;

    /** How many times this code can be used total (null = unlimited) */
    private Integer usageLimit;

    @Builder.Default
    private int usedCount = 0;

    @Builder.Default
    private boolean active = true;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}

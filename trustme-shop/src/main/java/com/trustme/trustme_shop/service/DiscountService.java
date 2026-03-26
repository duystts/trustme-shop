package com.trustme.trustme_shop.service;

import com.trustme.trustme_shop.entity.Discount;
import com.trustme.trustme_shop.exception.BadRequestException;
import com.trustme.trustme_shop.exception.ResourceNotFoundException;
import com.trustme.trustme_shop.repository.DiscountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DiscountService {

    private final DiscountRepository discountRepository;

    public List<Discount> getAllDiscounts() {
        return discountRepository.findAll();
    }

    public Discount getById(Long id) {
        return discountRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Mã giảm giá không tồn tại"));
    }

    @Transactional
    public Discount create(Discount discount) {
        if (discountRepository.existsByCodeIgnoreCase(discount.getCode())) {
            throw new BadRequestException("Mã '" + discount.getCode() + "' đã tồn tại");
        }
        discount.setCode(discount.getCode().toUpperCase());
        return discountRepository.save(discount);
    }

    @Transactional
    public Discount update(Long id, Discount data) {
        Discount existing = getById(id);
        existing.setCode(data.getCode().toUpperCase());
        existing.setDescription(data.getDescription());
        existing.setDiscountType(data.getDiscountType());
        existing.setDiscountValue(data.getDiscountValue());
        existing.setMinOrderValue(data.getMinOrderValue());
        existing.setMaxDiscount(data.getMaxDiscount());
        existing.setStartDate(data.getStartDate());
        existing.setEndDate(data.getEndDate());
        existing.setUsageLimit(data.getUsageLimit());
        existing.setActive(data.isActive());
        return discountRepository.save(existing);
    }

    @Transactional
    public void delete(Long id) {
        discountRepository.delete(getById(id));
    }

    /**
     * Validate a discount code against an order total.
     * Returns the discount amount to subtract.
     */
    public double validateAndCalculate(String code, double orderTotal) {
        Discount d = discountRepository.findByCodeIgnoreCase(code)
                .orElseThrow(() -> new BadRequestException("Mã giảm giá không tồn tại"));

        if (!d.isActive()) {
            throw new BadRequestException("Mã giảm giá đã bị vô hiệu hóa");
        }

        LocalDateTime now = LocalDateTime.now();
        if (d.getStartDate() != null && now.isBefore(d.getStartDate())) {
            throw new BadRequestException("Mã giảm giá chưa có hiệu lực");
        }
        if (d.getEndDate() != null && now.isAfter(d.getEndDate())) {
            throw new BadRequestException("Mã giảm giá đã hết hạn");
        }

        if (d.getUsageLimit() != null && d.getUsedCount() >= d.getUsageLimit()) {
            throw new BadRequestException("Mã giảm giá đã hết lượt sử dụng");
        }

        if (orderTotal < d.getMinOrderValue()) {
            throw new BadRequestException(
                    String.format("Đơn hàng tối thiểu %,.0f ₫ để áp dụng mã này", d.getMinOrderValue()));
        }

        double discountAmount;
        if ("PERCENTAGE".equalsIgnoreCase(d.getDiscountType())) {
            discountAmount = orderTotal * d.getDiscountValue() / 100.0;
            if (d.getMaxDiscount() != null && discountAmount > d.getMaxDiscount()) {
                discountAmount = d.getMaxDiscount();
            }
        } else {
            discountAmount = d.getDiscountValue();
        }

        return Math.min(discountAmount, orderTotal);
    }

    /** Increment usage count after order is placed */
    @Transactional
    public void markUsed(String code) {
        discountRepository.findByCodeIgnoreCase(code).ifPresent(d -> {
            d.setUsedCount(d.getUsedCount() + 1);
            discountRepository.save(d);
        });
    }
}

package com.trustme.trustme_shop.service;

import com.trustme.trustme_shop.dto.DiscountRequest;
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
    public Discount create(DiscountRequest req) {
        validateRequest(req);
        if (discountRepository.existsByCodeIgnoreCase(req.getCode())) {
            throw new BadRequestException("Mã '" + req.getCode() + "' đã tồn tại");
        }
        Discount discount = new Discount();
        applyFields(discount, req);
        return discountRepository.save(discount);
    }

    @Transactional
    public Discount update(Long id, DiscountRequest req) {
        validateRequest(req);
        Discount existing = getById(id);
        String newCode = req.getCode().toUpperCase();
        if (!newCode.equals(existing.getCode()) && discountRepository.existsByCodeIgnoreCase(newCode)) {
            throw new BadRequestException("Mã '" + newCode + "' đã tồn tại");
        }
        applyFields(existing, req);
        return discountRepository.save(existing);
    }

    private void validateRequest(DiscountRequest req) {
        if (req.getCode() == null || req.getCode().isBlank()) {
            throw new BadRequestException("Mã giảm giá không được để trống");
        }
        if (req.getDiscountType() == null ||
                (!req.getDiscountType().equalsIgnoreCase("PERCENTAGE") &&
                 !req.getDiscountType().equalsIgnoreCase("FIXED"))) {
            throw new BadRequestException("Loại giảm giá phải là PERCENTAGE hoặc FIXED");
        }
        if (req.getDiscountValue() == null || req.getDiscountValue() <= 0) {
            throw new BadRequestException("Giá trị giảm giá phải lớn hơn 0");
        }
        if (req.getStartDate() != null && req.getEndDate() != null
                && req.getStartDate().isAfter(req.getEndDate())) {
            throw new BadRequestException("Ngày bắt đầu phải trước ngày kết thúc");
        }
    }

    private void applyFields(Discount discount, DiscountRequest req) {
        discount.setCode(req.getCode().toUpperCase());
        discount.setDescription(req.getDescription());
        discount.setDiscountType(req.getDiscountType().toUpperCase());
        discount.setDiscountValue(req.getDiscountValue());
        discount.setMinOrderValue(req.getMinOrderValue() != null ? req.getMinOrderValue() : 0.0);
        discount.setMaxDiscount(req.getMaxDiscount());
        discount.setStartDate(req.getStartDate());
        discount.setEndDate(req.getEndDate());
        discount.setUsageLimit(req.getUsageLimit());
        discount.setActive(req.isActive());
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

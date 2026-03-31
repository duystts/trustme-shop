package com.trustme.trustme_shop.service;

import com.trustme.trustme_shop.entity.Discount;
import com.trustme.trustme_shop.exception.BadRequestException;
import com.trustme.trustme_shop.exception.ResourceNotFoundException;
import com.trustme.trustme_shop.repository.DiscountRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DiscountServiceTest {

    @Mock
    private DiscountRepository discountRepository;

    @InjectMocks
    private DiscountService discountService;

    private Discount activeDiscount;

    @BeforeEach
    void setUp() {
        activeDiscount = Discount.builder()
                .id(1L)
                .code("SALE10")
                .discountType("PERCENTAGE")
                .discountValue(10.0)
                .minOrderValue(0.0)
                .maxDiscount(null)
                .usageLimit(null)
                .usedCount(0)
                .active(true)
                .build();
    }

    // ── validateAndCalculate ──────────────────────────────────────────────────

    @Test
    @DisplayName("PERCENTAGE discount calculates correctly")
    void validateAndCalculate_percentage() {
        when(discountRepository.findByCodeIgnoreCase("SALE10")).thenReturn(Optional.of(activeDiscount));

        double result = discountService.validateAndCalculate("SALE10", 200_000);

        assertThat(result).isEqualTo(20_000.0);
    }

    @Test
    @DisplayName("PERCENTAGE discount is capped by maxDiscount")
    void validateAndCalculate_percentageCappedByMaxDiscount() {
        activeDiscount.setMaxDiscount(15_000.0);
        when(discountRepository.findByCodeIgnoreCase("SALE10")).thenReturn(Optional.of(activeDiscount));

        double result = discountService.validateAndCalculate("SALE10", 200_000);

        assertThat(result).isEqualTo(15_000.0);
    }

    @Test
    @DisplayName("FIXED discount deducts flat amount")
    void validateAndCalculate_fixed() {
        Discount fixed = Discount.builder()
                .code("FLAT50K")
                .discountType("FIXED")
                .discountValue(50_000.0)
                .minOrderValue(0.0)
                .active(true)
                .usedCount(0)
                .build();
        when(discountRepository.findByCodeIgnoreCase("FLAT50K")).thenReturn(Optional.of(fixed));

        double result = discountService.validateAndCalculate("FLAT50K", 150_000);

        assertThat(result).isEqualTo(50_000.0);
    }

    @Test
    @DisplayName("Discount amount cannot exceed order total")
    void validateAndCalculate_cannotExceedOrderTotal() {
        Discount fixed = Discount.builder()
                .code("BIG")
                .discountType("FIXED")
                .discountValue(999_000.0)
                .minOrderValue(0.0)
                .active(true)
                .usedCount(0)
                .build();
        when(discountRepository.findByCodeIgnoreCase("BIG")).thenReturn(Optional.of(fixed));

        double result = discountService.validateAndCalculate("BIG", 100_000);

        assertThat(result).isEqualTo(100_000.0);
    }

    @Test
    @DisplayName("Inactive discount throws BadRequestException")
    void validateAndCalculate_inactiveThrows() {
        activeDiscount.setActive(false);
        when(discountRepository.findByCodeIgnoreCase("SALE10")).thenReturn(Optional.of(activeDiscount));

        assertThatThrownBy(() -> discountService.validateAndCalculate("SALE10", 100_000))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("vô hiệu hóa");
    }

    @Test
    @DisplayName("Expired discount throws BadRequestException")
    void validateAndCalculate_expiredThrows() {
        activeDiscount.setEndDate(LocalDateTime.now().minusDays(1));
        when(discountRepository.findByCodeIgnoreCase("SALE10")).thenReturn(Optional.of(activeDiscount));

        assertThatThrownBy(() -> discountService.validateAndCalculate("SALE10", 100_000))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("hết hạn");
    }

    @Test
    @DisplayName("Not-started discount throws BadRequestException")
    void validateAndCalculate_notStartedThrows() {
        activeDiscount.setStartDate(LocalDateTime.now().plusDays(1));
        when(discountRepository.findByCodeIgnoreCase("SALE10")).thenReturn(Optional.of(activeDiscount));

        assertThatThrownBy(() -> discountService.validateAndCalculate("SALE10", 100_000))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("chưa có hiệu lực");
    }

    @Test
    @DisplayName("Usage limit exceeded throws BadRequestException")
    void validateAndCalculate_usageLimitExceededThrows() {
        activeDiscount.setUsageLimit(5);
        activeDiscount.setUsedCount(5);
        when(discountRepository.findByCodeIgnoreCase("SALE10")).thenReturn(Optional.of(activeDiscount));

        assertThatThrownBy(() -> discountService.validateAndCalculate("SALE10", 100_000))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("hết lượt");
    }

    @Test
    @DisplayName("Order below minimum value throws BadRequestException")
    void validateAndCalculate_belowMinOrderThrows() {
        activeDiscount.setMinOrderValue(500_000.0);
        when(discountRepository.findByCodeIgnoreCase("SALE10")).thenReturn(Optional.of(activeDiscount));

        assertThatThrownBy(() -> discountService.validateAndCalculate("SALE10", 100_000))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("tối thiểu");
    }

    @Test
    @DisplayName("Non-existent code throws BadRequestException")
    void validateAndCalculate_codeNotFoundThrows() {
        when(discountRepository.findByCodeIgnoreCase("INVALID")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> discountService.validateAndCalculate("INVALID", 100_000))
                .isInstanceOf(BadRequestException.class);
    }

    // ── create ────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("create duplicate code throws BadRequestException")
    void create_duplicateCodeThrows() {
        when(discountRepository.existsByCodeIgnoreCase("SALE10")).thenReturn(true);

        assertThatThrownBy(() -> discountService.create(activeDiscount))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("đã tồn tại");
    }

    @Test
    @DisplayName("create saves discount with uppercased code")
    void create_savesWithUppercaseCode() {
        Discount lower = Discount.builder().code("sale10").discountType("FIXED").discountValue(10.0).minOrderValue(0.0).active(true).build();
        when(discountRepository.existsByCodeIgnoreCase("sale10")).thenReturn(false);
        when(discountRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Discount saved = discountService.create(lower);

        assertThat(saved.getCode()).isEqualTo("SALE10");
    }

    // ── markUsed ──────────────────────────────────────────────────────────────

    @Test
    @DisplayName("markUsed increments usedCount")
    void markUsed_incrementsCount() {
        activeDiscount.setUsedCount(3);
        when(discountRepository.findByCodeIgnoreCase("SALE10")).thenReturn(Optional.of(activeDiscount));
        when(discountRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        discountService.markUsed("SALE10");

        assertThat(activeDiscount.getUsedCount()).isEqualTo(4);
        verify(discountRepository).save(activeDiscount);
    }

    // ── getById ───────────────────────────────────────────────────────────────

    @Test
    @DisplayName("getById missing id throws ResourceNotFoundException")
    void getById_notFoundThrows() {
        when(discountRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> discountService.getById(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}

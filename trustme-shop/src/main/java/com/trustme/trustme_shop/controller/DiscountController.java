package com.trustme.trustme_shop.controller;

import com.trustme.trustme_shop.entity.Discount;
import com.trustme.trustme_shop.service.DiscountService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/discounts")
@RequiredArgsConstructor
@Tag(name = "Discount", description = "Discount/Coupon APIs")
public class DiscountController {

    private final DiscountService discountService;

    @GetMapping
    @Operation(summary = "Get all discounts (admin)")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<List<Discount>> getAll() {
        return ResponseEntity.ok(discountService.getAllDiscounts());
    }

    @PostMapping
    @Operation(summary = "Create discount")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Discount> create(@RequestBody Discount discount) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(discountService.create(discount));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update discount")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Discount> update(@PathVariable Long id, @RequestBody Discount discount) {
        return ResponseEntity.ok(discountService.update(id, discount));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete discount")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        discountService.delete(id);
        return ResponseEntity.noContent().build();
    }

    /** Public endpoint: validate a code and preview discount amount */
    @PostMapping("/validate")
    @Operation(summary = "Validate discount code", description = "Check if a code is valid for a given order total and return the discount amount")
    public ResponseEntity<Map<String, Object>> validate(
            @RequestParam String code,
            @RequestParam double orderTotal) {
        double amount = discountService.validateAndCalculate(code, orderTotal);
        return ResponseEntity.ok(Map.of(
                "code", code.toUpperCase(),
                "discountAmount", amount
        ));
    }
}

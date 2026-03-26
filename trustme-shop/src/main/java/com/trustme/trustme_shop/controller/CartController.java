package com.trustme.trustme_shop.controller;

import com.trustme.trustme_shop.entity.CartItem;
import com.trustme.trustme_shop.service.CartService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
@Validated
@Tag(name = "Cart", description = "Shopping cart management APIs")
public class CartController {

    private final CartService cartService;

    @GetMapping("/user/{userId}")
    @Operation(summary = "Get cart items", description = "Retrieve all items in user's cart")
    public ResponseEntity<List<CartItem>> getCartItems(@PathVariable Long userId) {
        return ResponseEntity.ok(cartService.getCartItems(userId));
    }

    @PostMapping("/user/{userId}/add")
    @Operation(summary = "Add product to cart", description = "Add a product to user's cart with specified quantity")
    public ResponseEntity<CartItem> addProductToCart(
            @PathVariable Long userId,
            @RequestParam Long productId,
            @RequestParam @Min(value = 1, message = "Quantity must be at least 1") Integer quantity) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(cartService.addProductToCart(userId, productId, quantity));
    }

    @PutMapping("/item/{cartItemId}")
    @Operation(summary = "Update cart item quantity", description = "Update the quantity of a cart item")
    public ResponseEntity<CartItem> updateCartItemQuantity(
            @PathVariable Long cartItemId,
            @RequestParam @Min(value = 1, message = "Quantity must be at least 1") Integer quantity) {
        return ResponseEntity.ok(cartService.updateCartItemQuantity(cartItemId, quantity));
    }

    @DeleteMapping("/item/{cartItemId}")
    @Operation(summary = "Remove cart item", description = "Remove a specific item from cart")
    public ResponseEntity<Void> removeCartItem(@PathVariable Long cartItemId) {
        cartService.removeCartItem(cartItemId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/user/{userId}/clear")
    @Operation(summary = "Clear cart", description = "Remove all items from user's cart")
    public ResponseEntity<Void> clearCart(@PathVariable Long userId) {
        cartService.clearCart(userId);
        return ResponseEntity.noContent().build();
    }
}

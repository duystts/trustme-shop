package com.trustme.trustme_shop.service;

import com.trustme.trustme_shop.entity.Cart;
import com.trustme.trustme_shop.entity.CartItem;
import com.trustme.trustme_shop.entity.Product;
import com.trustme.trustme_shop.exception.ResourceNotFoundException;
import com.trustme.trustme_shop.repository.CartItemRepository;
import com.trustme.trustme_shop.repository.CartRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CartServiceTest {

    @Mock private CartRepository cartRepository;
    @Mock private CartItemRepository cartItemRepository;
    @Mock private ProductService productService;

    @InjectMocks
    private CartService cartService;

    private Cart cart;
    private Product product;

    @BeforeEach
    void setUp() {
        cart = Cart.builder().id(1L).build();
        product = Product.builder().id(10L).name("Áo").price(100_000.0).build();
    }

    // ── addProductToCart ──────────────────────────────────────────────────────

    @Test
    @DisplayName("addProductToCart creates new CartItem when not existing")
    void addProductToCart_newItem() {
        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(cart));
        when(productService.getProductById(10L)).thenReturn(product);
        when(cartItemRepository.findByCartIdAndProductId(1L, 10L)).thenReturn(Optional.empty());
        when(cartItemRepository.save(any(CartItem.class))).thenAnswer(inv -> inv.getArgument(0));

        CartItem result = cartService.addProductToCart(1L, 10L, 3);

        assertThat(result.getQuantity()).isEqualTo(3);
        assertThat(result.getProduct()).isEqualTo(product);
        assertThat(result.getCart()).isEqualTo(cart);
    }

    @Test
    @DisplayName("addProductToCart increments quantity for existing CartItem")
    void addProductToCart_existingItemIncrementsQty() {
        CartItem existing = CartItem.builder().id(5L).cart(cart).product(product).quantity(2).build();
        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(cart));
        when(productService.getProductById(10L)).thenReturn(product);
        when(cartItemRepository.findByCartIdAndProductId(1L, 10L)).thenReturn(Optional.of(existing));
        when(cartItemRepository.save(any(CartItem.class))).thenAnswer(inv -> inv.getArgument(0));

        CartItem result = cartService.addProductToCart(1L, 10L, 3);

        assertThat(result.getQuantity()).isEqualTo(5);
        verify(cartItemRepository).save(existing);
    }

    // ── updateCartItemQuantity ────────────────────────────────────────────────

    @Test
    @DisplayName("updateCartItemQuantity sets the new quantity")
    void updateCartItemQuantity_setsQty() {
        CartItem item = CartItem.builder().id(5L).cart(cart).product(product).quantity(2).build();
        when(cartItemRepository.findById(5L)).thenReturn(Optional.of(item));
        when(cartItemRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        CartItem result = cartService.updateCartItemQuantity(5L, 10);

        assertThat(result.getQuantity()).isEqualTo(10);
    }

    @Test
    @DisplayName("updateCartItemQuantity missing item throws ResourceNotFoundException")
    void updateCartItemQuantity_notFoundThrows() {
        when(cartItemRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> cartService.updateCartItemQuantity(99L, 1))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // ── clearCart ─────────────────────────────────────────────────────────────

    @Test
    @DisplayName("clearCart deletes all items for cart")
    void clearCart_deletesAllItems() {
        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(cart));

        cartService.clearCart(1L);

        verify(cartItemRepository).deleteByCartId(1L);
    }

    // ── getCartByUserId ───────────────────────────────────────────────────────

    @Test
    @DisplayName("getCartByUserId missing cart throws ResourceNotFoundException")
    void getCartByUserId_notFoundThrows() {
        when(cartRepository.findByUserId(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> cartService.getCartByUserId(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}

package com.trustme.trustme_shop.service;

import com.trustme.trustme_shop.entity.Cart;
import com.trustme.trustme_shop.entity.CartItem;
import com.trustme.trustme_shop.entity.Product;
import com.trustme.trustme_shop.entity.ProductVariant;
import com.trustme.trustme_shop.exception.BadRequestException;
import com.trustme.trustme_shop.exception.ResourceNotFoundException;
import com.trustme.trustme_shop.repository.CartItemRepository;
import com.trustme.trustme_shop.repository.CartRepository;
import com.trustme.trustme_shop.repository.ProductVariantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductService productService;
    private final ProductVariantRepository productVariantRepository;
    private final ObjectMapper objectMapper;

    public Cart getCartByUserId(Long userId) {
        return cartRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart not found for user id: " + userId));
    }

    @Transactional
    public CartItem addProductToCart(Long userId, Long productId, Integer quantity, Long variantId) {
        Cart cart = getCartByUserId(userId);
        Product product = productService.getProductById(productId);

        // Resolve variant and stock
        ProductVariant variant = null;
        String variantLabel = null;
        int available;

        if (variantId != null) {
            variant = productVariantRepository.findByIdAndProductId(variantId, productId)
                    .orElseThrow(() -> new BadRequestException("Biến thể không hợp lệ"));
            available = variant.getStockQuantity();
            variantLabel = buildVariantLabel(variant.getCombination());
        } else {
            available = product.getEffectiveStock();
        }

        if (available <= 0) {
            throw new BadRequestException("Sản phẩm \"" + product.getName() + "\" đã hết hàng");
        }

        final ProductVariant finalVariant = variant;
        final String finalLabel = variantLabel;

        CartItem cartItem = cartItemRepository.findByCartIdAndProductIdAndVariantId(cart.getId(), productId, variantId)
                .map(existing -> {
                    int newQty = existing.getQuantity() + quantity;
                    if (newQty > available) {
                        throw new BadRequestException(
                            "Chỉ còn " + available + " sản phẩm \"" + product.getName() + "\" trong kho");
                    }
                    existing.setQuantity(newQty);
                    return existing;
                })
                .orElseGet(() -> {
                    if (quantity > available) {
                        throw new BadRequestException(
                            "Chỉ còn " + available + " sản phẩm \"" + product.getName() + "\" trong kho");
                    }
                    return CartItem.builder()
                            .cart(cart)
                            .product(product)
                            .quantity(quantity)
                            .variantId(finalVariant != null ? finalVariant.getId() : null)
                            .variantLabel(finalLabel)
                            .build();
                });

        return cartItemRepository.save(cartItem);
    }

    private String buildVariantLabel(String combinationJson) {
        try {
            Map<String, String> map = objectMapper.readValue(combinationJson,
                    new TypeReference<Map<String, String>>() {});
            StringBuilder sb = new StringBuilder();
            map.forEach((k, v) -> { if (sb.length() > 0) sb.append(" / "); sb.append(k).append(": ").append(v); });
            return sb.toString();
        } catch (Exception e) {
            return combinationJson;
        }
    }

    @Transactional
    public CartItem updateCartItemQuantity(Long cartItemId, Integer quantity) {
        CartItem cartItem = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found with id: " + cartItemId));
        cartItem.setQuantity(quantity);
        return cartItemRepository.save(cartItem);
    }

    @Transactional
    public void removeCartItem(Long cartItemId) {
        cartItemRepository.deleteById(cartItemId);
    }

    @Transactional
    public void clearCart(Long userId) {
        Cart cart = getCartByUserId(userId);
        cartItemRepository.deleteByCartId(cart.getId());
    }

    public List<CartItem> getCartItems(Long userId) {
        Cart cart = getCartByUserId(userId);
        return cartItemRepository.findByCartId(cart.getId());
    }
}

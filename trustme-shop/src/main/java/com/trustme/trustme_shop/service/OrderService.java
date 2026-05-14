package com.trustme.trustme_shop.service;

import com.trustme.trustme_shop.entity.*;
import com.trustme.trustme_shop.exception.BadRequestException;
import com.trustme.trustme_shop.exception.ResourceNotFoundException;
import com.trustme.trustme_shop.repository.OrderRepository;
import com.trustme.trustme_shop.repository.OrderItemRepository;
import com.trustme.trustme_shop.repository.ProductVariantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final CartService cartService;
    private final UserService userService;
    private final DiscountService discountService;
    private final ProductVariantRepository productVariantRepository;

    @Transactional(readOnly = true)
    public List<Order> getAllOrders() {
        return orderRepository.findAllWithItems();
    }

    @Transactional(readOnly = true)
    public Order getOrderById(Long id) {
        return orderRepository.findByIdWithItems(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + id));
    }

    @Transactional(readOnly = true)
    public List<Order> getOrdersByUserId(Long userId) {
        return orderRepository.findByUserIdWithItems(userId);
    }

    @Transactional(readOnly = true)
    public List<Order> getOrdersByStatus(String status) {
        return orderRepository.findByStatusWithItems(status);
    }

    @Transactional
    public Order createOrderFromCart(Long userId, String shippingAddress, String discountCode) {
        User user = userService.getUserById(userId);
        List<CartItem> cartItems = cartService.getCartItems(userId);

        if (cartItems.isEmpty()) {
            throw new BadRequestException("Cart is empty");
        }

        double subtotal = cartItems.stream()
                .mapToDouble(item -> item.getProduct().getPrice() * item.getQuantity())
                .sum();

        double discountAmount = 0;
        if (discountCode != null && !discountCode.isBlank()) {
            discountAmount = discountService.validateAndCalculate(discountCode, subtotal);
            discountService.markUsed(discountCode);
        }

        double totalMoney = subtotal - discountAmount;

        Order order = Order.builder()
                .user(user)
                .status("PENDING")
                .totalMoney(totalMoney)
                .discountCode(discountCode)
                .discountAmount(discountAmount)
                .shippingAddress(shippingAddress)
                .build();

        Order savedOrder = orderRepository.save(order);

        // Kiểm tra tồn kho trước khi tạo đơn
        for (CartItem cartItem : cartItems) {
            Product product = cartItem.getProduct();
            int requested = cartItem.getQuantity();
            List<ProductVariant> variants = productVariantRepository.findByProductId(product.getId());
            if (!variants.isEmpty()) {
                int totalStock = variants.stream().mapToInt(ProductVariant::getStockQuantity).sum();
                if (totalStock < requested) {
                    throw new BadRequestException(
                            "Sản phẩm '" + product.getName() + "' không đủ tồn kho (còn " + totalStock + ")");
                }
            } else {
                int stock = product.getStockQuantity() != null ? product.getStockQuantity() : 0;
                if (stock < requested) {
                    throw new BadRequestException(
                            "Sản phẩm '" + product.getName() + "' không đủ tồn kho (còn " + stock + ")");
                }
            }
        }

        List<OrderItem> orderItems = cartItems.stream()
                .map(cartItem -> OrderItem.builder()
                        .order(savedOrder)
                        .product(cartItem.getProduct())
                        .price(cartItem.getProduct().getPrice())
                        .quantity(cartItem.getQuantity())
                        .variantId(cartItem.getVariantId())
                        .variantLabel(cartItem.getVariantLabel())
                        .build())
                .collect(Collectors.toList());

        orderItemRepository.saveAll(orderItems);

        // Trừ tồn kho sau khi tạo đơn
        for (CartItem cartItem : cartItems) {
            Product product = cartItem.getProduct();
            int requested = cartItem.getQuantity();
            List<ProductVariant> variants = productVariantRepository.findByProductId(product.getId());
            if (!variants.isEmpty()) {
                // Trừ lần lượt từng variant cho đến khi đủ số lượng
                int remaining = requested;
                for (ProductVariant variant : variants) {
                    if (remaining <= 0) break;
                    int deduct = Math.min(variant.getStockQuantity(), remaining);
                    variant.setStockQuantity(variant.getStockQuantity() - deduct);
                    remaining -= deduct;
                }
                productVariantRepository.saveAll(variants);
            } else {
                product.setStockQuantity(product.getStockQuantity() - requested);
            }
        }

        cartService.clearCart(userId);

        return savedOrder;
    }

    private static final java.util.Set<String> VALID_STATUSES =
            java.util.Set.of("PENDING", "SHIPPING", "DELIVERED", "CANCELLED");

    @Transactional
    public Order updateOrderStatus(Long orderId, String status) {
        if (!VALID_STATUSES.contains(status)) {
            throw new BadRequestException("Invalid order status: " + status +
                    ". Must be one of: PENDING, SHIPPING, DELIVERED, CANCELLED");
        }
        Order order = getOrderById(orderId);
        order.setStatus(status);
        return orderRepository.save(order);
    }

    @Transactional
    public void cancelOrder(Long orderId) {
        Order order = getOrderById(orderId);
        if (!"PENDING".equals(order.getStatus())) {
            throw new BadRequestException("Cannot cancel order with status: " + order.getStatus());
        }
        order.setStatus("CANCELLED");
        orderRepository.save(order);

        // Hoàn lại tồn kho
        for (OrderItem item : order.getOrderItems()) {
            Product product = item.getProduct();
            int qty = item.getQuantity();
            List<ProductVariant> variants = productVariantRepository.findByProductId(product.getId());
            if (!variants.isEmpty()) {
                variants.get(0).setStockQuantity(variants.get(0).getStockQuantity() + qty);
                productVariantRepository.save(variants.get(0));
            } else {
                int current = product.getStockQuantity() != null ? product.getStockQuantity() : 0;
                product.setStockQuantity(current + qty);
            }
        }
    }
}

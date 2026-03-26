package com.trustme.trustme_shop.service;

import com.trustme.trustme_shop.entity.*;
import com.trustme.trustme_shop.exception.BadRequestException;
import com.trustme.trustme_shop.exception.ResourceNotFoundException;
import com.trustme.trustme_shop.repository.OrderRepository;
import com.trustme.trustme_shop.repository.OrderItemRepository;
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

    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    public Order getOrderById(Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + id));
    }

    public List<Order> getOrdersByUserId(Long userId) {
        return orderRepository.findByUserIdOrderByOrderDateDesc(userId);
    }

    public List<Order> getOrdersByStatus(String status) {
        return orderRepository.findByStatus(status);
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

        List<OrderItem> orderItems = cartItems.stream()
                .map(cartItem -> OrderItem.builder()
                        .order(savedOrder)
                        .product(cartItem.getProduct())
                        .price(cartItem.getProduct().getPrice())
                        .quantity(cartItem.getQuantity())
                        .build())
                .collect(Collectors.toList());

        orderItemRepository.saveAll(orderItems);
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
    }
}

package com.trustme.trustme_shop.service;

import com.trustme.trustme_shop.entity.*;
import com.trustme.trustme_shop.exception.BadRequestException;
import com.trustme.trustme_shop.exception.ResourceNotFoundException;
import com.trustme.trustme_shop.repository.OrderItemRepository;
import com.trustme.trustme_shop.repository.OrderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock private OrderRepository orderRepository;
    @Mock private OrderItemRepository orderItemRepository;
    @Mock private CartService cartService;
    @Mock private UserService userService;
    @Mock private DiscountService discountService;

    @InjectMocks
    private OrderService orderService;

    private User testUser;
    private Product testProduct;

    @BeforeEach
    void setUp() {
        testUser = User.builder().id(1L).fullName("Test User").email("test@example.com").build();
        testProduct = Product.builder().id(10L).name("Áo thun").price(150_000.0).build();
    }

    // ── createOrderFromCart ───────────────────────────────────────────────────

    @Test
    @DisplayName("createOrderFromCart with empty cart throws BadRequestException")
    void createOrderFromCart_emptyCartThrows() {
        when(userService.getUserById(1L)).thenReturn(testUser);
        when(cartService.getCartItems(1L)).thenReturn(Collections.emptyList());

        assertThatThrownBy(() -> orderService.createOrderFromCart(1L, "123 Main St", null))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("empty");
    }

    @Test
    @DisplayName("createOrderFromCart without discount calculates correct total")
    void createOrderFromCart_noDiscount_correctTotal() {
        CartItem item = CartItem.builder().product(testProduct).quantity(2).build();
        Order savedOrder = Order.builder().id(100L).user(testUser).status("PENDING")
                .totalMoney(300_000.0).shippingAddress("123 Main St").build();

        when(userService.getUserById(1L)).thenReturn(testUser);
        when(cartService.getCartItems(1L)).thenReturn(List.of(item));
        when(orderRepository.save(any(Order.class))).thenReturn(savedOrder);
        when(orderItemRepository.saveAll(any())).thenReturn(Collections.emptyList());

        Order result = orderService.createOrderFromCart(1L, "123 Main St", null);

        assertThat(result.getId()).isEqualTo(100L);
        verify(orderRepository).save(argThat(o -> o.getTotalMoney() == 300_000.0 && o.getDiscountAmount() == 0.0));
        verify(cartService).clearCart(1L);
        verify(discountService, never()).validateAndCalculate(any(), anyDouble());
    }

    @Test
    @DisplayName("createOrderFromCart with discount applies discount and marks used")
    void createOrderFromCart_withDiscount_appliesDiscount() {
        CartItem item = CartItem.builder().product(testProduct).quantity(2).build();
        Order savedOrder = Order.builder().id(101L).user(testUser).status("PENDING")
                .totalMoney(270_000.0).shippingAddress("456 St").build();

        when(userService.getUserById(1L)).thenReturn(testUser);
        when(cartService.getCartItems(1L)).thenReturn(List.of(item));
        when(discountService.validateAndCalculate("SALE10", 300_000.0)).thenReturn(30_000.0);
        when(orderRepository.save(any(Order.class))).thenReturn(savedOrder);
        when(orderItemRepository.saveAll(any())).thenReturn(Collections.emptyList());

        orderService.createOrderFromCart(1L, "456 St", "SALE10");

        verify(orderRepository).save(argThat(o ->
                o.getTotalMoney() == 270_000.0
                && o.getDiscountAmount() == 30_000.0
                && "SALE10".equals(o.getDiscountCode())));
        verify(discountService).markUsed("SALE10");
        verify(cartService).clearCart(1L);
    }

    @Test
    @DisplayName("createOrderFromCart creates correct number of order items")
    void createOrderFromCart_createsOrderItems() {
        CartItem item1 = CartItem.builder().product(testProduct).quantity(1).build();
        Product p2 = Product.builder().id(11L).name("Quần jean").price(200_000.0).build();
        CartItem item2 = CartItem.builder().product(p2).quantity(3).build();

        Order savedOrder = Order.builder().id(102L).user(testUser).status("PENDING")
                .totalMoney(750_000.0).shippingAddress("789 St").build();

        when(userService.getUserById(1L)).thenReturn(testUser);
        when(cartService.getCartItems(1L)).thenReturn(List.of(item1, item2));
        when(orderRepository.save(any())).thenReturn(savedOrder);
        when(orderItemRepository.saveAll(any())).thenReturn(Collections.emptyList());

        orderService.createOrderFromCart(1L, "789 St", null);

        verify(orderItemRepository).saveAll(argThat(items -> {
            var list = (java.util.List<?>) items;
            return list.size() == 2;
        }));
    }

    // ── updateOrderStatus ─────────────────────────────────────────────────────

    @Test
    @DisplayName("updateOrderStatus with invalid status throws BadRequestException")
    void updateOrderStatus_invalidStatusThrows() {
        assertThatThrownBy(() -> orderService.updateOrderStatus(1L, "INVALID"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Invalid order status");
    }

    @Test
    @DisplayName("updateOrderStatus with valid status updates order")
    void updateOrderStatus_validStatusUpdates() {
        Order order = Order.builder().id(1L).status("PENDING").totalMoney(100_000.0)
                .shippingAddress("addr").user(testUser).build();
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
        when(orderRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Order updated = orderService.updateOrderStatus(1L, "SHIPPING");

        assertThat(updated.getStatus()).isEqualTo("SHIPPING");
    }

    @Test
    @DisplayName("updateOrderStatus accepts all valid statuses")
    void updateOrderStatus_allValidStatuses() {
        for (String status : List.of("PENDING", "SHIPPING", "DELIVERED", "CANCELLED")) {
            Order order = Order.builder().id(1L).status("PENDING").totalMoney(0.0)
                    .shippingAddress("addr").user(testUser).build();
            when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
            when(orderRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            assertThatCode(() -> orderService.updateOrderStatus(1L, status)).doesNotThrowAnyException();
        }
    }

    // ── cancelOrder ───────────────────────────────────────────────────────────

    @Test
    @DisplayName("cancelOrder on PENDING order sets status to CANCELLED")
    void cancelOrder_pendingOrderCancels() {
        Order order = Order.builder().id(1L).status("PENDING").totalMoney(0.0)
                .shippingAddress("addr").user(testUser).build();
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
        when(orderRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        orderService.cancelOrder(1L);

        assertThat(order.getStatus()).isEqualTo("CANCELLED");
        verify(orderRepository).save(order);
    }

    @Test
    @DisplayName("cancelOrder on non-PENDING order throws BadRequestException")
    void cancelOrder_nonPendingThrows() {
        for (String status : List.of("SHIPPING", "DELIVERED", "CANCELLED")) {
            Order order = Order.builder().id(1L).status(status).totalMoney(0.0)
                    .shippingAddress("addr").user(testUser).build();
            when(orderRepository.findById(1L)).thenReturn(Optional.of(order));

            assertThatThrownBy(() -> orderService.cancelOrder(1L))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("Cannot cancel");
        }
    }

    // ── getOrderById ──────────────────────────────────────────────────────────

    @Test
    @DisplayName("getOrderById missing id throws ResourceNotFoundException")
    void getOrderById_notFoundThrows() {
        when(orderRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> orderService.getOrderById(999L))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}

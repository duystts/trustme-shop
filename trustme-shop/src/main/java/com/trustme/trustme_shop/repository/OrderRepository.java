package com.trustme.trustme_shop.repository;

import com.trustme.trustme_shop.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    // Legacy derived queries (used internally by other services if needed)
    @Query("SELECT DISTINCT o FROM Order o LEFT JOIN FETCH o.orderItems i LEFT JOIN FETCH i.product WHERE o.status = :status ORDER BY o.orderDate DESC")
    List<Order> findByStatusWithItems(@Param("status") String status);

    List<Order> findByStatus(String status);

    /** Fetch all orders with their items and products in one query — avoids N+1 and LazyInitializationException */
    @Query("SELECT DISTINCT o FROM Order o LEFT JOIN FETCH o.orderItems i LEFT JOIN FETCH i.product ORDER BY o.orderDate DESC")
    List<Order> findAllWithItems();

    /** Fetch a single order with items and product details */
    @Query("SELECT o FROM Order o LEFT JOIN FETCH o.orderItems i LEFT JOIN FETCH i.product WHERE o.id = :id")
    Optional<Order> findByIdWithItems(@Param("id") Long id);

    /** Fetch orders for a specific user, newest first, with items and products */
    @Query("SELECT DISTINCT o FROM Order o LEFT JOIN FETCH o.orderItems i LEFT JOIN FETCH i.product WHERE o.user.id = :userId ORDER BY o.orderDate DESC")
    List<Order> findByUserIdWithItems(@Param("userId") Long userId);

    List<Order> findByUserIdOrderByOrderDateDesc(Long userId);
}

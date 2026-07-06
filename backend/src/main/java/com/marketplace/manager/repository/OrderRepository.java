package com.marketplace.manager.repository;

import com.marketplace.manager.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

  @Query("""
SELECT o
FROM Order o
WHERE
(:marketplaceId IS NULL OR o.marketplace.id = :marketplaceId)
AND (:categoryId IS NULL OR o.category.id = :categoryId)
AND (:productId IS NULL OR o.product.id = :productId)
AND (CAST(:startDate AS LocalDateTime) IS NULL OR o.dataPedido >= :startDate)
AND (CAST(:endDate AS LocalDateTime) IS NULL OR o.dataPedido <= :endDate)
ORDER BY o.dataPedido DESC
""")
    List<Order> findFilteredOrders(
        @Param("marketplaceId") Long marketplaceId,
        @Param("categoryId") Long categoryId,
        @Param("productId") Long productId,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );
}

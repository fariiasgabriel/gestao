package com.marketplace.manager.repository;

import com.marketplace.manager.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByNomeContainingIgnoreCase(String nome);
    List<Product> findByCategoryId(Long categoryId);
    List<Product> findByNomeContainingIgnoreCaseAndCategoryId(String nome, Long categoryId);
}

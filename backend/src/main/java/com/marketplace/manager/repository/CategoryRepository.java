package com.marketplace.manager.repository;

import com.marketplace.manager.model.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    List<Category> findByNomeContainingIgnoreCase(String nome);
}

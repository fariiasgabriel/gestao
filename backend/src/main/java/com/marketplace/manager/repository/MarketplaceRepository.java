package com.marketplace.manager.repository;

import com.marketplace.manager.model.Marketplace;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MarketplaceRepository extends JpaRepository<Marketplace, Long> {
    List<Marketplace> findByNomeContainingIgnoreCase(String nome);
}

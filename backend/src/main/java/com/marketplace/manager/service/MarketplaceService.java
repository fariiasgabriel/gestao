package com.marketplace.manager.service;

import com.marketplace.manager.dto.MarketplaceDTO;
import com.marketplace.manager.model.Marketplace;
import com.marketplace.manager.repository.MarketplaceRepository;
import com.marketplace.manager.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class MarketplaceService {

    @Autowired
    private MarketplaceRepository marketplaceRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Transactional(readOnly = true)
    public List<MarketplaceDTO> findAll(String search) {
        List<Marketplace> marketplaces;
        if (search != null && !search.trim().isEmpty()) {
            marketplaces = marketplaceRepository.findByNomeContainingIgnoreCase(search.trim());
        } else {
            marketplaces = marketplaceRepository.findAll();
        }
        return marketplaces.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public MarketplaceDTO findById(Long id) {
        Marketplace mkt = marketplaceRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Marketplace não encontrado com o ID: " + id));
        return convertToDTO(mkt);
    }

    @Transactional
    public MarketplaceDTO create(MarketplaceDTO dto) {
        if (dto.getNome() == null || dto.getNome().trim().isEmpty()) {
            throw new IllegalArgumentException("O nome do marketplace é obrigatório");
        }
        Marketplace mkt = Marketplace.builder()
            .nome(dto.getNome().trim())
            .build();
        return convertToDTO(marketplaceRepository.save(mkt));
    }

    @Transactional
    public MarketplaceDTO update(Long id, MarketplaceDTO dto) {
        Marketplace mkt = marketplaceRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Marketplace não encontrado com o ID: " + id));
        
        if (dto.getNome() == null || dto.getNome().trim().isEmpty()) {
            throw new IllegalArgumentException("O nome do marketplace é obrigatório");
        }

        mkt.setNome(dto.getNome().trim());
        return convertToDTO(marketplaceRepository.save(mkt));
    }

    @Transactional
    public void delete(Long id) {
        if (!marketplaceRepository.existsById(id)) {
            throw new RuntimeException("Marketplace não encontrado com o ID: " + id);
        }
        // Verify if orders are using this marketplace
        boolean inUse = orderRepository.findFilteredOrders(id, null, null, null, null).size() > 0;
        if (inUse) {
            throw new IllegalStateException("Não é possível excluir este marketplace pois há pedidos vinculados a ele");
        }
        marketplaceRepository.deleteById(id);
    }

    private MarketplaceDTO convertToDTO(Marketplace mkt) {
        return MarketplaceDTO.builder()
            .id(mkt.getId())
            .nome(mkt.getNome())
            .build();
    }
}

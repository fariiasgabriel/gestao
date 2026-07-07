package com.marketplace.manager.service;

import com.marketplace.manager.dto.SupplierDTO;
import com.marketplace.manager.model.Supplier;
import com.marketplace.manager.repository.SupplierRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class SupplierService {

    @Autowired
    private SupplierRepository supplierRepository;

    private SupplierDTO mapToDTO(Supplier supplier) {
        SupplierDTO dto = new SupplierDTO();
        dto.setId(supplier.getId());
        dto.setNome(supplier.getNome());
        dto.setContato(supplier.getContato());
        dto.setTelefone(supplier.getTelefone());
        dto.setCnpj(supplier.getCnpj());
        return dto;
    }

    private Supplier mapToEntity(SupplierDTO dto) {
        Supplier supplier = new Supplier();
        supplier.setNome(dto.getNome());
        supplier.setContato(dto.getContato());
        supplier.setTelefone(dto.getTelefone());
        supplier.setCnpj(dto.getCnpj());
        return supplier;
    }

    public List<SupplierDTO> getAllSuppliers(String search) {
        List<Supplier> suppliers;
        if (search != null && !search.isBlank()) {
            suppliers = supplierRepository.findByNomeContainingIgnoreCase(search);
        } else {
            suppliers = supplierRepository.findAll();
        }
        return suppliers.stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    public SupplierDTO createSupplier(SupplierDTO dto) {
        Supplier supplier = mapToEntity(dto);
        Supplier saved = supplierRepository.save(supplier);
        return mapToDTO(saved);
    }

    public SupplierDTO updateSupplier(Long id, SupplierDTO dto) {
        Optional<Supplier> optional = supplierRepository.findById(id);
        if (optional.isEmpty()) {
            throw new RuntimeException("Supplier not found");
        }
        Supplier supplier = optional.get();
        supplier.setNome(dto.getNome());
        supplier.setContato(dto.getContato());
        supplier.setTelefone(dto.getTelefone());
        supplier.setCnpj(dto.getCnpj());
        Supplier saved = supplierRepository.save(supplier);
        return mapToDTO(saved);
    }

    public void deleteSupplier(Long id) {
        if (!supplierRepository.existsById(id)) {
            throw new RuntimeException("Supplier not found");
        }
        supplierRepository.deleteById(id);
    }
}

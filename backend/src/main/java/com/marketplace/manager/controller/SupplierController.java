package com.marketplace.manager.controller;

import com.marketplace.manager.dto.SupplierDTO;
import com.marketplace.manager.service.SupplierService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/suppliers")
@CrossOrigin(origins = "*")
@Tag(name = "Fornecedores", description = "Gerenciamento de fornecedores")
public class SupplierController {

    @Autowired
    private SupplierService supplierService;

    @GetMapping
    @Operation(summary = "Listar fornecedores", description = "Retorna a lista de fornecedores, opcionalmente filtrada por nome.")
    public ResponseEntity<List<SupplierDTO>> getAll(@RequestParam(value = "search", required = false) String search) {
        return ResponseEntity.ok(supplierService.getAllSuppliers(search));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obter fornecedor por ID")
    public ResponseEntity<SupplierDTO> getById(@PathVariable Long id) {
        SupplierDTO dto = supplierService.getAllSuppliers(null).stream()
                .filter(s -> s.getId().equals(id))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Fornecedor não encontrado"));
        return ResponseEntity.ok(dto);
    }

    @PostMapping
    @Operation(summary = "Cadastrar novo fornecedor")
    public ResponseEntity<SupplierDTO> create(@Valid @RequestBody SupplierDTO dto) {
        SupplierDTO created = supplierService.createSupplier(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar fornecedor existente")
    public ResponseEntity<SupplierDTO> update(@PathVariable Long id, @Valid @RequestBody SupplierDTO dto) {
        SupplierDTO updated = supplierService.updateSupplier(id, dto);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Excluir fornecedor")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            supplierService.deleteSupplier(id);
            return ResponseEntity.ok().body("Fornecedor excluído com sucesso.");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }
}

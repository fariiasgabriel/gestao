package com.marketplace.manager.controller;

import com.marketplace.manager.dto.MarketplaceDTO;
import com.marketplace.manager.service.MarketplaceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/marketplaces")
@CrossOrigin(origins = "*")
@Tag(name = "Marketplaces", description = "Gerenciamento de canais de marketplaces")
public class MarketplaceController {

    @Autowired
    private MarketplaceService marketplaceService;

    @GetMapping
    @Operation(summary = "Listar marketplaces")
    public ResponseEntity<List<MarketplaceDTO>> getAll(@RequestParam(value = "search", required = false) String search) {
        return ResponseEntity.ok(marketplaceService.findAll(search));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obter marketplace por ID")
    public ResponseEntity<MarketplaceDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(marketplaceService.findById(id));
    }

    @PostMapping
    @Operation(summary = "Cadastrar novo marketplace")
    public ResponseEntity<MarketplaceDTO> create(@Valid @RequestBody MarketplaceDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(marketplaceService.create(dto));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar marketplace")
    public ResponseEntity<MarketplaceDTO> update(@PathVariable Long id, @Valid @RequestBody MarketplaceDTO dto) {
        return ResponseEntity.ok(marketplaceService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Excluir marketplace")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            marketplaceService.delete(id);
            return ResponseEntity.ok().body("Marketplace excluído com sucesso.");
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }
}

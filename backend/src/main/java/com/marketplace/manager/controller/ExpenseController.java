package com.marketplace.manager.controller;

import com.marketplace.manager.dto.ExpenseRequestDTO;
import com.marketplace.manager.dto.ExpenseResponseDTO;
import com.marketplace.manager.service.ExpenseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/expenses")
@CrossOrigin(origins = "*")
@Tag(name = "Despesas", description = "Gerenciamento de despesas e entrada de estoque")
public class ExpenseController {

    @Autowired
    private ExpenseService expenseService;

    @GetMapping
    @Operation(summary = "Listar despesas")
    public ResponseEntity<List<ExpenseResponseDTO>> getAll() {
        return ResponseEntity.ok(expenseService.findAll());
    }

    @PostMapping
    @Operation(summary = "Cadastrar nova despesa / dar entrada em estoque")
    public ResponseEntity<?> create(@Valid @RequestBody ExpenseRequestDTO dto) {
        try {
            ExpenseResponseDTO created = expenseService.create(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erro ao salvar despesa: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Excluir despesa e estornar estoque")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            expenseService.delete(id);
            return ResponseEntity.ok().body("Lançamento excluído com sucesso.");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erro ao excluir despesa: " + e.getMessage());
        }
    }
}

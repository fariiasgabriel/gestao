package com.marketplace.manager.controller;

import com.marketplace.manager.dto.OrderRequestDTO;
import com.marketplace.manager.dto.OrderResponseDTO;
import com.marketplace.manager.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "*")
@Tag(name = "Pedidos", description = "Lançamento e gerenciamento de pedidos e vendas")
public class OrderController {

    @Autowired
    private OrderService orderService;

    @GetMapping
    @Operation(summary = "Listar pedidos com filtros avançados")
    public ResponseEntity<List<OrderResponseDTO>> getOrders(
        @RequestParam(value = "marketplaceId", required = false) Long marketplaceId,
        @RequestParam(value = "categoryId", required = false) Long categoryId,
        @RequestParam(value = "productId", required = false) Long productId,
        @RequestParam(value = "startDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
        @RequestParam(value = "endDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate
    ) {
        return ResponseEntity.ok(orderService.findFiltered(marketplaceId, categoryId, productId, startDate, endDate));
    }

    @PostMapping
    @Operation(summary = "Lançar novo pedido (atualiza estoque e calcula lucros)")
    public ResponseEntity<?> createOrder(@Valid @RequestBody OrderRequestDTO dto) {
        try {
            OrderResponseDTO created = orderService.create(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ex.getMessage());
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erro ao processar pedido: " + ex.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Excluir/Estornar pedido (devolve quantidade ao estoque)")
    public ResponseEntity<?> deleteOrder(@PathVariable Long id) {
        try {
            orderService.delete(id);
            return ResponseEntity.ok("Pedido estornado e excluído com sucesso. Estoque restaurado.");
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ex.getMessage());
        }
    }
}

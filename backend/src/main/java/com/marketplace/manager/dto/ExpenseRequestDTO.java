package com.marketplace.manager.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExpenseRequestDTO {

    @NotBlank(message = "O tipo é obrigatório")
    private String tipo;

    private String descricao;
    
    private String produtoId; // pode ser "new" ou um numero

    private Long fornecedorId;

    private Integer quantidade;

    private BigDecimal custoUnitario;

    private BigDecimal valor;

    private java.time.OffsetDateTime data;

    private NewProductDTO newProduct;
}

package com.marketplace.manager.dto;

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
public class ExpenseResponseDTO {
    private Long id;
    private String tipo;
    private String descricao;
    private Long produtoId;
    private String produtoNome;
    private Long fornecedorId;
    private String fornecedorNome;
    private Integer quantidade;
    private BigDecimal custoUnitario;
    private BigDecimal valor;
    private LocalDateTime data;
}

package com.marketplace.manager.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderBatchRequestDTO {

    @NotNull(message = "Os itens são obrigatórios")
    @Size(min = 1, message = "O pedido deve ter pelo menos um item")
    @Valid
    private List<OrderBatchItemDTO> items;

    @NotNull(message = "O marketplace é obrigatório")
    private Long marketplaceId;

    @NotNull(message = "O tipo de comissão é obrigatório")
    private String comissaoTipo; // PERCENTUAL ou VALOR

    @NotNull(message = "A comissão é obrigatória")
    private BigDecimal comissaoInformada;

    @NotNull(message = "O frete é obrigatório")
    private BigDecimal frete;

    @NotNull(message = "A taxa fixa é obrigatória")
    private BigDecimal taxaFixa;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderBatchItemDTO {

        @NotNull(message = "O produto é obrigatório")
        private Long produtoId;

        @NotNull(message = "A quantidade é obrigatória")
        private Integer quantidade;

        @NotNull(message = "O valor de venda é obrigatório")
        private BigDecimal valorVenda;
    }
}

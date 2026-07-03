package com.marketplace.manager.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderRequestDTO {

    @NotNull(message = "O produto é obrigatório")
    private Long produtoId;

    @NotNull(message = "O marketplace é obrigatório")
    private Long marketplaceId;

    @NotNull(message = "A quantidade é obrigatória")
    @Min(value = 1, message = "A quantidade deve ser maior que zero")
    private Integer quantidade;

    @NotNull(message = "O valor da venda é obrigatório")
    @Min(value = 0, message = "O valor da venda não pode ser negativo")
    private BigDecimal valorVenda;

    @NotBlank(message = "O tipo de comissão é obrigatório")
    private String comissaoTipo; // PERCENTUAL or VALOR

    @NotNull(message = "A comissão é obrigatória")
    @Min(value = 0, message = "A comissão não pode ser negativa")
    private BigDecimal comissaoInformada; // Value or Percent input by user

    @NotNull(message = "O frete é obrigatório")
    @Min(value = 0, message = "O frete não pode ser negativo")
    private BigDecimal frete;

    @NotNull(message = "A taxa fixa é obrigatória")
    @Min(value = 0, message = "A taxa fixa não pode ser negativa")
    private BigDecimal taxaFixa;
}

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
public class ProductDTO {
    private Long id;

    @NotBlank(message = "O nome do produto é obrigatório")
    private String nome;

    @NotNull(message = "O custo do produto é obrigatório")
    @Min(value = 0, message = "O custo do produto não pode ser negativo")
    private BigDecimal custo;

    @NotNull(message = "A quantidade de estoque é obrigatória")
    @Min(value = 0, message = "A quantidade de estoque não pode ser negativa")
    private Integer quantidadeEstoque;

    @NotNull(message = "A categoria é obrigatória")
    private Long categoriaId;

    private String categoriaNome;
}

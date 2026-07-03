package com.marketplace.manager.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderResponseDTO {
    private Long id;
    private Long produtoId;
    private String produtoNome;
    private BigDecimal produtoCusto;
    private Long categoriaId;
    private String categoriaNome;
    private Long marketplaceId;
    private String marketplaceNome;
    private Integer quantidade;
    private BigDecimal valorVenda;
    private String comissaoTipo;
    private BigDecimal comissaoValor;
    private BigDecimal comissaoInformada;
    private BigDecimal frete;
    private BigDecimal taxaFixa;
    private BigDecimal lucroBruto;
    private BigDecimal lucroLiquido;
    private BigDecimal margemBruta;
    private BigDecimal margemLiquida;
    private LocalDateTime dataPedido;
}

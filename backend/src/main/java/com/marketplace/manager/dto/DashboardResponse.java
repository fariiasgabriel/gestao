package com.marketplace.manager.dto;

import lombok.*;
import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardResponse {
    private IndicatorsDTO indicators;
    private List<TopProductDTO> topProducts;
    private List<CategoryMarginDTO> marginsByCategory;
    private List<MarketplaceStatDTO> mktStats;
    private List<MonthlyEvolutionDTO> monthlyEvolution;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class IndicatorsDTO {
        private BigDecimal totalVendido;
        private Long totalPedidos;
        private BigDecimal lucroBrutoTotal;
        private BigDecimal lucroLiquidoTotal;
        private BigDecimal margemBrutaMedia;
        private BigDecimal margemLiquidaMedia;
        private BigDecimal ticketMedio;
        private Long totalQtdVendida;
        private Long produtosCadastrados;
        private Long totalEstoque;
        private Long categoriasCount;
        private Long marketplacesCount;
        private Long semEstoque;
        private Long estoqueBaixo;
        private BigDecimal totalEstoqueValor;
        private BigDecimal custosOperacionaisMes;
        private BigDecimal custosEstoqueMes;
        private BigDecimal totalDespesasMes;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TopProductDTO {
        private String nome;
        private Long qty;
        private BigDecimal totalValue;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CategoryMarginDTO {
        private String categoria;
        private BigDecimal margemBruta;
        private BigDecimal margemLiquida;
        private BigDecimal venda;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MarketplaceStatDTO {
        private String marketplace;
        private BigDecimal valorVendido;
        private BigDecimal lucroBruto;
        private BigDecimal lucroLiquido;
        private Long pedidos;
        private BigDecimal margemBruta;
        private BigDecimal margemLiquida;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MonthlyEvolutionDTO {
        private String mes;
        private BigDecimal vendas;
        private BigDecimal lucroBruto;
        private BigDecimal lucroLiquido;
        private Long pedidos;
        private BigDecimal custosEntrada;
        private BigDecimal custosGerais;
        private BigDecimal totalCustos;
    }
}

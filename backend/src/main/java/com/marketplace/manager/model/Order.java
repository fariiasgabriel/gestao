package com.marketplace.manager.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "pedidos")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "O produto é obrigatório")
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "produto_id", nullable = false)
    private Product product;

    @NotNull(message = "A categoria é obrigatória")
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "categoria_id", nullable = false)
    private Category category;

    @NotNull(message = "O marketplace é obrigatório")
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "marketplace_id", nullable = false)
    private Marketplace marketplace;

    @NotNull(message = "A quantidade é obrigatória")
    @Min(value = 1, message = "A quantidade deve ser maior que zero")
    @Column(nullable = false)
    private Integer quantidade;

    @NotNull(message = "O valor da venda é obrigatório")
    @Min(value = 0, message = "O valor da venda não pode ser negativo")
    @Column(name = "valor_venda", nullable = false, precision = 10, scale = 2)
    private BigDecimal valorVenda;

    @NotBlank(message = "O tipo de comissão é obrigatório")
    @Column(name = "comissao_tipo", nullable = false, length = 20)
    private String comissaoTipo; // PERCENTUAL or VALOR

    @NotNull(message = "O valor da comissão é obrigatório")
    @Min(value = 0, message = "A comissão não pode ser negativa")
    @Column(name = "comissao_valor", nullable = false, precision = 10, scale = 2)
    private BigDecimal comissaoValor;

    @NotNull(message = "O frete é obrigatório")
    @Min(value = 0, message = "O frete não pode ser negativo")
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal frete;

    @NotNull(message = "A taxa fixa é obrigatória")
    @Min(value = 0, message = "A taxa fixa não pode ser negativa")
    @Column(name = "taxa_fixa", nullable = false, precision = 10, scale = 2)
    private BigDecimal taxaFixa;

    @Column(name = "lucro_bruto", nullable = false, precision = 10, scale = 2)
    private BigDecimal lucroBruto;

    @Column(name = "lucro_liquido", nullable = false, precision = 10, scale = 2)
    private BigDecimal lucroLiquido;

    @Column(name = "margem_bruta", nullable = false, precision = 10, scale = 2)
    private BigDecimal margemBruta;

    @Column(name = "margem_liquida", nullable = false, precision = 10, scale = 2)
    private BigDecimal margemLiquida;

    @Column(name = "data_pedido", nullable = false)
    private LocalDateTime dataPedido;

    @PrePersist
    protected void onCreate() {
        if (this.dataPedido == null) {
            this.dataPedido = LocalDateTime.now();
        }
    }
}
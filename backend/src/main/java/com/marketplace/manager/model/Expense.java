package com.marketplace.manager.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "despesas")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Expense {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "O tipo é obrigatório")
    @Column(nullable = false, length = 20)
    private String tipo; // PRODUTO ou GERAL

    @NotBlank(message = "A descrição é obrigatória")
    @Column(nullable = false)
    private String descricao;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "produto_id")
    private Product product;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "fornecedor_id")
    private Supplier supplier;

    private Integer quantidade;

    @Column(name = "custo_unitario", precision = 10, scale = 2)
    private BigDecimal custoUnitario;

    @NotNull(message = "O valor é obrigatório")
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal valor;

    @Column(nullable = false)
    private LocalDateTime data;

    @PrePersist
    protected void onCreate() {
        if (this.data == null) {
            this.data = LocalDateTime.now();
        }
    }
}

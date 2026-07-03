package com.marketplace.manager.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Entity
@Table(name = "marketplaces")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Marketplace {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "O nome do marketplace é obrigatório")
    @Column(nullable = false, unique = true, length = 100)
    private String nome;
}

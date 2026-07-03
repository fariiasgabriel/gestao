package com.marketplace.manager.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MarketplaceDTO {
    private Long id;

    @NotBlank(message = "O nome do marketplace é obrigatório")
    private String nome;
}

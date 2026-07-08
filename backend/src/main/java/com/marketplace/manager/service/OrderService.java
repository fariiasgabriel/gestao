package com.marketplace.manager.service;

import com.marketplace.manager.dto.OrderBatchRequestDTO;
import com.marketplace.manager.dto.OrderRequestDTO;
import com.marketplace.manager.dto.OrderResponseDTO;
import com.marketplace.manager.model.Category;
import com.marketplace.manager.model.Marketplace;
import com.marketplace.manager.model.Order;
import com.marketplace.manager.model.Product;
import com.marketplace.manager.repository.CategoryRepository;
import com.marketplace.manager.repository.MarketplaceRepository;
import com.marketplace.manager.repository.OrderRepository;
import com.marketplace.manager.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class OrderService {

        @Autowired
        private OrderRepository orderRepository;

        @Autowired
        private ProductRepository productRepository;

        @Autowired
        private CategoryRepository categoryRepository;

        @Autowired
        private MarketplaceRepository marketplaceRepository;

        @Transactional(readOnly = true)
        public List<OrderResponseDTO> findFiltered(Long marketplaceId, Long categoryId, Long productId,
                        LocalDateTime startDate, LocalDateTime endDate) {
                List<Order> orders = orderRepository.findFilteredOrders(marketplaceId, categoryId, productId, startDate,
                                endDate);
                return orders.stream().map(this::convertToDTO).collect(Collectors.toList());
        }

        @Transactional
        public OrderResponseDTO create(OrderRequestDTO dto) {
                Product product = productRepository.findById(dto.getProdutoId())
                                .orElseThrow(() -> new RuntimeException(
                                                "Produto não encontrado com o ID: " + dto.getProdutoId()));

                Marketplace marketplace = marketplaceRepository.findById(dto.getMarketplaceId())
                                .orElseThrow(
                                                () -> new RuntimeException("Marketplace não encontrado com o ID: "
                                                                + dto.getMarketplaceId()));

                Category category = product.getCategory();

                if (product.getQuantidadeEstoque() < dto.getQuantidade()) {
                        throw new IllegalArgumentException(
                                        "Estoque insuficiente para o produto \"" + product.getNome() +
                                                        "\". Estoque atual: " + product.getQuantidadeEstoque()
                                                        + ". Solicitado: " + dto.getQuantidade());
                }

                BigDecimal valorVenda = dto.getValorVenda();
                BigDecimal frete = dto.getFrete();
                BigDecimal taxaFixa = dto.getTaxaFixa();
                BigDecimal comissaoInformada = dto.getComissaoInformada();

                BigDecimal comissaoValor;
                if ("PERCENTUAL".equalsIgnoreCase(dto.getComissaoTipo())) {
                        comissaoValor = comissaoInformada.divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP)
                                        .multiply(valorVenda)
                                        .setScale(2, RoundingMode.HALF_UP);
                } else {
                        comissaoValor = comissaoInformada.setScale(2, RoundingMode.HALF_UP);
                }

                BigDecimal lucroBruto = valorVenda.subtract(frete).subtract(taxaFixa).subtract(comissaoValor).setScale(
                                2,
                                RoundingMode.HALF_UP);

                BigDecimal custoTotal = product.getCusto().multiply(BigDecimal.valueOf(dto.getQuantidade()));

                BigDecimal lucroLiquido = lucroBruto.subtract(custoTotal).setScale(2, RoundingMode.HALF_UP);

                BigDecimal margemBruta = BigDecimal.ZERO;
                BigDecimal margemLiquida = BigDecimal.ZERO;
                if (valorVenda.compareTo(BigDecimal.ZERO) > 0) {
                        margemBruta = lucroBruto.divide(valorVenda, 4, RoundingMode.HALF_UP)
                                        .multiply(BigDecimal.valueOf(100))
                                        .setScale(2, RoundingMode.HALF_UP);
                        margemLiquida = lucroLiquido.divide(valorVenda, 4, RoundingMode.HALF_UP)
                                        .multiply(BigDecimal.valueOf(100))
                                        .setScale(2, RoundingMode.HALF_UP);
                }

                product.setQuantidadeEstoque(product.getQuantidadeEstoque() - dto.getQuantidade());
                productRepository.save(product);

                Order order = Order.builder()
                                .product(product)
                                .category(category)
                                .marketplace(marketplace)
                                .quantidade(dto.getQuantidade())
                                .valorVenda(valorVenda)
                                .comissaoTipo(dto.getComissaoTipo().toUpperCase())
                                .comissaoValor(comissaoValor)
                                .frete(frete)
                                .taxaFixa(taxaFixa)
                                .lucroBruto(lucroBruto)
                                .lucroLiquido(lucroLiquido)
                                .margemBruta(margemBruta)
                                .margemLiquida(margemLiquida)
                                .dataPedido(LocalDateTime.now())
                                .build();

                return convertToDTO(orderRepository.save(order));
        }

        @Transactional
        public List<OrderResponseDTO> createBatch(OrderBatchRequestDTO batchDto) {
                List<OrderResponseDTO> results = new ArrayList<>();

                for (OrderBatchRequestDTO.OrderBatchItemDTO item : batchDto.getItems()) {
                        OrderRequestDTO dto = OrderRequestDTO.builder()
                                .produtoId(item.getProdutoId())
                                .marketplaceId(batchDto.getMarketplaceId())
                                .quantidade(item.getQuantidade())
                                .valorVenda(item.getValorVenda())
                                .comissaoTipo(batchDto.getComissaoTipo())
                                .comissaoInformada(batchDto.getComissaoInformada())
                                .frete(batchDto.getFrete())
                                .taxaFixa(batchDto.getTaxaFixa())
                                .build();
                        results.add(create(dto));
                }
                return results;
        }

        @Transactional
        public OrderResponseDTO update(Long id, OrderRequestDTO dto) {
                Order order = orderRepository.findById(id)
                                .orElseThrow(() -> new RuntimeException("Pedido não encontrado com o ID: " + id));

                // Reverter estoque do produto antigo
                Product oldProduct = order.getProduct();
                oldProduct.setQuantidadeEstoque(oldProduct.getQuantidadeEstoque() + order.getQuantidade());
                productRepository.save(oldProduct);

                // Buscar novo produto
                Product newProduct = productRepository.findById(dto.getProdutoId())
                                .orElseThrow(() -> new RuntimeException("Produto não encontrado com o ID: " + dto.getProdutoId()));

                Marketplace marketplace = marketplaceRepository.findById(dto.getMarketplaceId())
                                .orElseThrow(() -> new RuntimeException("Marketplace não encontrado com o ID: " + dto.getMarketplaceId()));

                Category category = newProduct.getCategory();

                if (newProduct.getQuantidadeEstoque() < dto.getQuantidade()) {
                        throw new IllegalArgumentException(
                                        "Estoque insuficiente para o produto \"" + newProduct.getNome() +
                                                        "\". Estoque atual: " + newProduct.getQuantidadeEstoque()
                                                        + ". Solicitado: " + dto.getQuantidade());
                }

                BigDecimal valorVenda = dto.getValorVenda();
                BigDecimal frete = dto.getFrete();
                BigDecimal taxaFixa = dto.getTaxaFixa();
                BigDecimal comissaoInformada = dto.getComissaoInformada();

                BigDecimal comissaoValor;
                if ("PERCENTUAL".equalsIgnoreCase(dto.getComissaoTipo())) {
                        comissaoValor = comissaoInformada.divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP)
                                        .multiply(valorVenda)
                                        .setScale(2, RoundingMode.HALF_UP);
                } else {
                        comissaoValor = comissaoInformada.setScale(2, RoundingMode.HALF_UP);
                }

                BigDecimal lucroBruto = valorVenda.subtract(frete).subtract(taxaFixa).subtract(comissaoValor).setScale(2, RoundingMode.HALF_UP);
                BigDecimal custoTotal = newProduct.getCusto().multiply(BigDecimal.valueOf(dto.getQuantidade()));
                BigDecimal lucroLiquido = lucroBruto.subtract(custoTotal).setScale(2, RoundingMode.HALF_UP);

                BigDecimal margemBruta = BigDecimal.ZERO;
                BigDecimal margemLiquida = BigDecimal.ZERO;
                if (valorVenda.compareTo(BigDecimal.ZERO) > 0) {
                        margemBruta = lucroBruto.divide(valorVenda, 4, RoundingMode.HALF_UP)
                                        .multiply(BigDecimal.valueOf(100))
                                        .setScale(2, RoundingMode.HALF_UP);
                        margemLiquida = lucroLiquido.divide(valorVenda, 4, RoundingMode.HALF_UP)
                                        .multiply(BigDecimal.valueOf(100))
                                        .setScale(2, RoundingMode.HALF_UP);
                }

                // Atualizar novo estoque
                newProduct.setQuantidadeEstoque(newProduct.getQuantidadeEstoque() - dto.getQuantidade());
                productRepository.save(newProduct);

                // Atualizar dados do pedido
                order.setProduct(newProduct);
                order.setCategory(category);
                order.setMarketplace(marketplace);
                order.setQuantidade(dto.getQuantidade());
                order.setValorVenda(valorVenda);
                order.setComissaoTipo(dto.getComissaoTipo().toUpperCase());
                order.setComissaoValor(comissaoValor);
                order.setFrete(frete);
                order.setTaxaFixa(taxaFixa);
                order.setLucroBruto(lucroBruto);
                order.setLucroLiquido(lucroLiquido);
                order.setMargemBruta(margemBruta);
                order.setMargemLiquida(margemLiquida);

                return convertToDTO(orderRepository.save(order));
        }

        @Transactional
        public void delete(Long id) {
                Order order = orderRepository.findById(id)
                                .orElseThrow(() -> new RuntimeException("Pedido não encontrado com o ID: " + id));

                Product product = order.getProduct();
                product.setQuantidadeEstoque(product.getQuantidadeEstoque() + order.getQuantidade());
                productRepository.save(product);

                orderRepository.deleteById(id);
        }

        private OrderResponseDTO convertToDTO(Order order) {
                return OrderResponseDTO.builder()
                                .id(order.getId())
                                .produtoId(order.getProduct().getId())
                                .produtoNome(order.getProduct().getNome())
                                .produtoCusto(order.getProduct().getCusto())
                                .categoriaId(order.getCategory().getId())
                                .categoriaNome(order.getCategory().getNome())
                                .marketplaceId(order.getMarketplace().getId())
                                .marketplaceNome(order.getMarketplace().getNome())
                                .quantidade(order.getQuantidade())
                                .valorVenda(order.getValorVenda())
                                .comissaoTipo(order.getComissaoTipo())
                                .comissaoValor(order.getComissaoValor())
                                .comissaoInformada(order.getComissaoValor() /* default returned representation */)
                                .frete(order.getFrete())
                                .taxaFixa(order.getTaxaFixa())
                                .lucroBruto(order.getLucroBruto())
                                .lucroLiquido(order.getLucroLiquido())
                                .margemBruta(order.getMargemBruta())
                                .margemLiquida(order.getMargemLiquida())
                                .dataPedido(order.getDataPedido())
                                .build();
        }
}

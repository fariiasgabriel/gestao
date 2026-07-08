package com.marketplace.manager.service;

import com.marketplace.manager.dto.DashboardResponse;
import com.marketplace.manager.model.Category;
import com.marketplace.manager.model.Marketplace;
import com.marketplace.manager.model.Order;
import com.marketplace.manager.model.Product;
import com.marketplace.manager.model.Expense;
import com.marketplace.manager.repository.CategoryRepository;
import com.marketplace.manager.repository.MarketplaceRepository;
import com.marketplace.manager.repository.OrderRepository;
import com.marketplace.manager.repository.ProductRepository;
import com.marketplace.manager.repository.ExpenseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DashboardService {

        @Autowired
        private OrderRepository orderRepository;

        @Autowired
        private ProductRepository productRepository;

        @Autowired
        private CategoryRepository categoryRepository;

        @Autowired
        private MarketplaceRepository marketplaceRepository;

        @Autowired
        private ExpenseRepository expenseRepository;

        @Transactional(readOnly = true)
        public DashboardResponse getDashboardData() {
                List<Order> orders = orderRepository.findAll();
                List<Product> products = productRepository.findAll();
                List<Category> categories = categoryRepository.findAll();
                List<Marketplace> marketplaces = marketplaceRepository.findAll();
                List<Expense> expenses = expenseRepository.findAll();

                Long totalPedidos = (long) orders.size();
                BigDecimal totalVendido = orders.stream()
                                .map(Order::getValorVenda)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                BigDecimal lucroBrutoTotal = orders.stream()
                                .map(Order::getLucroBruto)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                BigDecimal lucroLiquidoTotal = orders.stream()
                                .map(Order::getLucroLiquido)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                Long totalQtdVendida = orders.stream()
                                .mapToLong(Order::getQuantidade)
                                .sum();

                BigDecimal ticketMedio = totalPedidos > 0
                                ? totalVendido.divide(BigDecimal.valueOf(totalPedidos), 2, RoundingMode.HALF_UP)
                                : BigDecimal.ZERO;

                BigDecimal margemBrutaMedia = totalVendido.compareTo(BigDecimal.ZERO) > 0
                                ? lucroBrutoTotal.divide(totalVendido, 4, RoundingMode.HALF_UP)
                                                .multiply(BigDecimal.valueOf(100))
                                                .setScale(2, RoundingMode.HALF_UP)
                                : BigDecimal.ZERO;

                BigDecimal margemLiquidaMedia = totalVendido.compareTo(BigDecimal.ZERO) > 0
                                ? lucroLiquidoTotal.divide(totalVendido, 4, RoundingMode.HALF_UP)
                                                .multiply(BigDecimal.valueOf(100))
                                                .setScale(2, RoundingMode.HALF_UP)
                                : BigDecimal.ZERO;

                Long produtosCadastrados = (long) products.size();
                Long totalEstoque = products.stream().mapToLong(Product::getQuantidadeEstoque).sum();
                Long categoriasCount = (long) categories.size();
                Long marketplacesCount = (long) marketplaces.size();

                Long semEstoque = products.stream().filter(p -> p.getQuantidadeEstoque() == 0).count();
                Long estoqueBaixo = products.stream()
                                .filter(p -> p.getQuantidadeEstoque() > 0 && p.getQuantidadeEstoque() <= 5)
                                .count();

                BigDecimal totalEstoqueValor = products.stream()
                                .map(p -> {
                                        BigDecimal c = p.getCusto() != null ? p.getCusto() : BigDecimal.ZERO;
                                        Long q = p.getQuantidadeEstoque() != null ? (long) p.getQuantidadeEstoque() : 0L;
                                        return c.multiply(BigDecimal.valueOf(q));
                                })
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                java.time.YearMonth currentMonth = java.time.YearMonth.now();
                BigDecimal custosOperacionaisMes = expenses.stream()
                                .filter(e -> e.getData() != null && java.time.YearMonth.from(e.getData()).equals(currentMonth))
                                .filter(e -> "GERAL".equalsIgnoreCase(e.getTipo()))
                                .map(Expense::getValor)
                                .filter(Objects::nonNull)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                BigDecimal custosEstoqueMes = expenses.stream()
                                .filter(e -> e.getData() != null && java.time.YearMonth.from(e.getData()).equals(currentMonth))
                                .filter(e -> "PRODUTO".equalsIgnoreCase(e.getTipo()))
                                .map(Expense::getValor)
                                .filter(Objects::nonNull)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                BigDecimal totalDespesasMes = custosOperacionaisMes.add(custosEstoqueMes);

                DashboardResponse.IndicatorsDTO indicators = DashboardResponse.IndicatorsDTO.builder()
                                .totalVendido(totalVendido).totalPedidos(totalPedidos)
                                .lucroBrutoTotal(lucroBrutoTotal).lucroLiquidoTotal(lucroLiquidoTotal)
                                .margemBrutaMedia(margemBrutaMedia)
                                .margemLiquidaMedia(margemLiquidaMedia)
                                .ticketMedio(ticketMedio)
                                .totalQtdVendida(totalQtdVendida)
                                .produtosCadastrados(produtosCadastrados)
                                .totalEstoque(totalEstoque)
                                .categoriasCount(categoriasCount)
                                .marketplacesCount(marketplacesCount)
                                .semEstoque(semEstoque)
                                .estoqueBaixo(estoqueBaixo)
                                .totalEstoqueValor(totalEstoqueValor)
                                .custosOperacionaisMes(custosOperacionaisMes)
                                .custosEstoqueMes(custosEstoqueMes)
                                .totalDespesasMes(totalDespesasMes)
                                .build();

                Map<Product, Long> productQtyMap = orders.stream()
                                .collect(Collectors.groupingBy(Order::getProduct,
                                                Collectors.summingLong(Order::getQuantidade)));

                Map<Product, BigDecimal> productRevenueMap = orders.stream()
                                .collect(Collectors.groupingBy(Order::getProduct,
                                                Collectors.reducing(BigDecimal.ZERO, Order::getValorVenda,
                                                                BigDecimal::add)));

                List<DashboardResponse.TopProductDTO> topProducts = productQtyMap.entrySet().stream()
                                .map(entry -> {
                                        Product p = entry.getKey();
                                        BigDecimal totalVal = productRevenueMap.getOrDefault(p, BigDecimal.ZERO);
                                        return new DashboardResponse.TopProductDTO(p.getNome(), entry.getValue(),
                                                        totalVal);
                                })
                                .sorted((a, b) -> Long.compare(b.getQty(), a.getQty()))
                                .limit(10)
                                .collect(Collectors.toList());

                Map<Category, List<Order>> categoryOrdersMap = orders.stream()
                                .collect(Collectors.groupingBy(Order::getCategory));
                List<DashboardResponse.CategoryMarginDTO> marginsByCategory = categoryOrdersMap.entrySet().stream()
                                .map(entry -> {
                                        Category c = entry.getKey();
                                        List<Order> list = entry.getValue();
                                        BigDecimal catVenda = list.stream().map(Order::getValorVenda).reduce(
                                                        BigDecimal.ZERO,
                                                        BigDecimal::add);
                                        BigDecimal catBruto = list.stream().map(Order::getLucroBruto).reduce(
                                                        BigDecimal.ZERO,
                                                        BigDecimal::add);
                                        BigDecimal catLiquido = list.stream().map(Order::getLucroLiquido).reduce(
                                                        BigDecimal.ZERO,
                                                        BigDecimal::add);

                                        BigDecimal mBruta = catVenda.compareTo(BigDecimal.ZERO) > 0
                                                        ? catBruto.divide(catVenda, 4, RoundingMode.HALF_UP)
                                                                        .multiply(BigDecimal.valueOf(100))
                                                                        .setScale(2, RoundingMode.HALF_UP)
                                                        : BigDecimal.ZERO;

                                        BigDecimal mLiquida = catVenda.compareTo(BigDecimal.ZERO) > 0
                                                        ? catLiquido.divide(catVenda, 4, RoundingMode.HALF_UP)
                                                                        .multiply(BigDecimal.valueOf(100))
                                                                        .setScale(2, RoundingMode.HALF_UP)
                                                        : BigDecimal.ZERO;

                                        return new DashboardResponse.CategoryMarginDTO(c.getNome(), mBruta, mLiquida,
                                                        catVenda);
                                })
                                .collect(Collectors.toList());

                Map<Marketplace, List<Order>> mktOrdersMap = orders.stream()
                                .collect(Collectors.groupingBy(Order::getMarketplace));
                List<DashboardResponse.MarketplaceStatDTO> mktStats = mktOrdersMap.entrySet().stream()
                                .map(entry -> {
                                        Marketplace m = entry.getKey();
                                        List<Order> list = entry.getValue();
                                        BigDecimal venda = list.stream().map(Order::getValorVenda)
                                                        .reduce(BigDecimal.ZERO, BigDecimal::add);
                                        BigDecimal bruto = list.stream().map(Order::getLucroBruto)
                                                        .reduce(BigDecimal.ZERO, BigDecimal::add);
                                        BigDecimal liquido = list.stream().map(Order::getLucroLiquido).reduce(
                                                        BigDecimal.ZERO,
                                                        BigDecimal::add);
                                        long pedidos = list.size();

                                        BigDecimal mBruta = venda.compareTo(BigDecimal.ZERO) > 0
                                                        ? bruto.divide(venda, 4, RoundingMode.HALF_UP)
                                                                        .multiply(BigDecimal.valueOf(100)).setScale(2,
                                                                                        RoundingMode.HALF_UP)
                                                        : BigDecimal.ZERO;

                                        BigDecimal mLiquida = venda.compareTo(BigDecimal.ZERO) > 0
                                                        ? liquido.divide(venda, 4, RoundingMode.HALF_UP)
                                                                        .multiply(BigDecimal.valueOf(100))
                                                                        .setScale(2, RoundingMode.HALF_UP)
                                                        : BigDecimal.ZERO;

                                        return new DashboardResponse.MarketplaceStatDTO(m.getNome(), venda, bruto,
                                                        liquido, pedidos, mBruta,
                                                        mLiquida);
                                })
                                .collect(Collectors.toList());

                DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM yyyy", new Locale("pt", "BR"));
                Map<String, List<Order>> monthlyOrdersMap = orders.stream()
                                .collect(Collectors.groupingBy(
                                                o -> o.getDataPedido().format(DateTimeFormatter.ofPattern("yyyy-MM"))));

                List<DashboardResponse.MonthlyEvolutionDTO> monthlyEvolution = monthlyOrdersMap.entrySet().stream()
                                .map(entry -> {
                                        String yyyyMM = entry.getKey();
                                        List<Order> list = entry.getValue();
                                        BigDecimal v = list.stream().map(Order::getValorVenda).reduce(BigDecimal.ZERO,
                                                        BigDecimal::add);
                                        BigDecimal b = list.stream().map(Order::getLucroBruto).reduce(BigDecimal.ZERO,
                                                        BigDecimal::add);
                                        BigDecimal liq = list.stream().map(Order::getLucroLiquido)
                                                        .reduce(BigDecimal.ZERO, BigDecimal::add);
                                        long pCount = list.size();

                                        BigDecimal custosEntrada = expenses.stream()
                                                        .filter(e -> e.getData() != null && e.getData().format(DateTimeFormatter.ofPattern("yyyy-MM")).equals(yyyyMM))
                                                        .filter(e -> "PRODUTO".equalsIgnoreCase(e.getTipo()))
                                                        .map(Expense::getValor)
                                                        .filter(Objects::nonNull)
                                                        .reduce(BigDecimal.ZERO, BigDecimal::add);
                                        
                                        BigDecimal custosGerais = expenses.stream()
                                                        .filter(e -> e.getData() != null && e.getData().format(DateTimeFormatter.ofPattern("yyyy-MM")).equals(yyyyMM))
                                                        .filter(e -> "GERAL".equalsIgnoreCase(e.getTipo()))
                                                        .map(Expense::getValor)
                                                        .filter(Objects::nonNull)
                                                        .reduce(BigDecimal.ZERO, BigDecimal::add);

                                        BigDecimal totalCustos = custosEntrada.add(custosGerais);

                                        String[] split = yyyyMM.split("-");
                                        int year = Integer.parseInt(split[0]);
                                        int month = Integer.parseInt(split[1]);
                                        Calendar cal = new GregorianCalendar(year, month - 1, 1);
                                        String label = cal.getDisplayName(Calendar.MONTH, Calendar.SHORT,
                                                        new Locale("pt", "BR")) + " "
                                                        + year;
                                        if (label.length() > 0) {
                                                label = label.substring(0, 1).toUpperCase() + label.substring(1);
                                        }

                                        return new DashboardResponse.MonthlyEvolutionDTO(label, v, b, liq, pCount, custosEntrada, custosGerais, totalCustos);
                                })
                                .sorted(Comparator.comparing(DashboardResponse.MonthlyEvolutionDTO::getMes)) // Sort
                                                                                                             // alphabetically/chronologically
                                .collect(Collectors.toList());

                return DashboardResponse.builder()
                                .indicators(indicators)
                                .topProducts(topProducts)
                                .marginsByCategory(marginsByCategory)
                                .mktStats(mktStats)
                                .monthlyEvolution(monthlyEvolution)
                                .build();
        }
}

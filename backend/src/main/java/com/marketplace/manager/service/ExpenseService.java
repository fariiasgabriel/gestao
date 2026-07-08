package com.marketplace.manager.service;

import com.marketplace.manager.dto.ExpenseRequestDTO;
import com.marketplace.manager.dto.ExpenseResponseDTO;
import com.marketplace.manager.model.Category;
import com.marketplace.manager.model.Expense;
import com.marketplace.manager.model.Product;
import com.marketplace.manager.model.Supplier;
import com.marketplace.manager.repository.CategoryRepository;
import com.marketplace.manager.repository.ExpenseRepository;
import com.marketplace.manager.repository.ProductRepository;
import com.marketplace.manager.repository.SupplierRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ExpenseService {

    @Autowired
    private ExpenseRepository expenseRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private SupplierRepository supplierRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Transactional(readOnly = true)
    public List<ExpenseResponseDTO> findAll() {
        return expenseRepository.findAllByOrderByDataDesc().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public ExpenseResponseDTO create(ExpenseRequestDTO dto) {
        if (!"PRODUTO".equals(dto.getTipo()) && !"GERAL".equals(dto.getTipo())) {
            throw new IllegalArgumentException("Tipo de lançamento inválido.");
        }

        Expense expense = new Expense();
        expense.setTipo(dto.getTipo());
        
        if (dto.getFornecedorId() != null) {
            Supplier supplier = supplierRepository.findById(dto.getFornecedorId())
                    .orElseThrow(() -> new IllegalArgumentException("Fornecedor não encontrado"));
            expense.setSupplier(supplier);
        }

        expense.setData(dto.getData() != null ? dto.getData() : LocalDateTime.now());

        if ("PRODUTO".equals(dto.getTipo())) {
            if (dto.getQuantidade() == null || dto.getQuantidade() <= 0) {
                throw new IllegalArgumentException("Quantidade deve ser maior que zero.");
            }
            if (dto.getCustoUnitario() == null || dto.getCustoUnitario().compareTo(BigDecimal.ZERO) < 0) {
                throw new IllegalArgumentException("Custo unitário inválido.");
            }

            Product product;
            if ("new".equals(dto.getProdutoId()) && dto.getNewProduct() != null) {
                if (dto.getNewProduct().getNome() == null || dto.getNewProduct().getNome().trim().isEmpty() || dto.getNewProduct().getCategoriaId() == null) {
                    throw new IllegalArgumentException("Nome e categoria do novo produto são obrigatórios.");
                }
                Category category = categoryRepository.findById(dto.getNewProduct().getCategoriaId())
                        .orElseThrow(() -> new IllegalArgumentException("Categoria não encontrada"));

                product = new Product();
                product.setNome(dto.getNewProduct().getNome().trim());
                product.setCusto(dto.getCustoUnitario());
                product.setQuantidadeEstoque(0);
                product.setCategory(category);
                product = productRepository.save(product);
            } else {
                try {
                    Long pId = Long.parseLong(dto.getProdutoId());
                    product = productRepository.findById(pId)
                            .orElseThrow(() -> new IllegalArgumentException("Produto não encontrado."));
                } catch (NumberFormatException e) {
                    throw new IllegalArgumentException("Produto inválido.");
                }
            }

            // Update product stock and cost
            product.setQuantidadeEstoque(product.getQuantidadeEstoque() + dto.getQuantidade());
            product.setCusto(dto.getCustoUnitario());
            productRepository.save(product);

            expense.setProduct(product);
            expense.setDescricao("Entrada de Estoque: " + product.getNome());
            expense.setQuantidade(dto.getQuantidade());
            expense.setCustoUnitario(dto.getCustoUnitario());
            expense.setValor(dto.getCustoUnitario().multiply(BigDecimal.valueOf(dto.getQuantidade())));
        } else {
            if (dto.getValor() == null || dto.getValor().compareTo(BigDecimal.ZERO) < 0) {
                throw new IllegalArgumentException("Valor inválido.");
            }
            if (dto.getDescricao() == null || dto.getDescricao().trim().isEmpty()) {
                throw new IllegalArgumentException("Descrição é obrigatória.");
            }
            expense.setDescricao(dto.getDescricao().trim());
            expense.setValor(dto.getValor());
        }

        return convertToDTO(expenseRepository.save(expense));
    }

    @Transactional
    public void delete(Long id) {
        Expense expense = expenseRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Lançamento não encontrado."));

        if ("PRODUTO".equals(expense.getTipo()) && expense.getProduct() != null && expense.getQuantidade() != null) {
            Product product = expense.getProduct();
            int newStock = Math.max(0, product.getQuantidadeEstoque() - expense.getQuantidade());
            product.setQuantidadeEstoque(newStock);
            productRepository.save(product);
        }

        expenseRepository.deleteById(id);
    }

    private ExpenseResponseDTO convertToDTO(Expense expense) {
        ExpenseResponseDTO dto = ExpenseResponseDTO.builder()
                .id(expense.getId())
                .tipo(expense.getTipo())
                .descricao(expense.getDescricao())
                .quantidade(expense.getQuantidade())
                .custoUnitario(expense.getCustoUnitario())
                .valor(expense.getValor())
                .data(expense.getData())
                .build();

        if (expense.getProduct() != null) {
            dto.setProdutoId(expense.getProduct().getId());
            dto.setProdutoNome(expense.getProduct().getNome());
        }
        if (expense.getSupplier() != null) {
            dto.setFornecedorId(expense.getSupplier().getId());
            dto.setFornecedorNome(expense.getSupplier().getNome());
        }

        return dto;
    }
}

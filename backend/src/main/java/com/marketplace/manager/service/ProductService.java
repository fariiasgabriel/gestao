package com.marketplace.manager.service;

import com.marketplace.manager.dto.ProductDTO;
import com.marketplace.manager.model.Category;
import com.marketplace.manager.model.Product;
import com.marketplace.manager.repository.CategoryRepository;
import com.marketplace.manager.repository.ProductRepository;
import com.marketplace.manager.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProductService {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Transactional(readOnly = true)
    public List<ProductDTO> findAll(String search, Long categoryId) {
        List<Product> products;
        if (search != null && !search.trim().isEmpty()) {
            if (categoryId != null) {
                products = productRepository.findByNomeContainingIgnoreCaseAndCategoryId(search.trim(), categoryId);
            } else {
                products = productRepository.findByNomeContainingIgnoreCase(search.trim());
            }
        } else if (categoryId != null) {
            products = productRepository.findByCategoryId(categoryId);
        } else {
            products = productRepository.findAll();
        }
        return products.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ProductDTO findById(Long id) {
        Product product = productRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Produto não encontrado com o ID: " + id));
        return convertToDTO(product);
    }

    @Transactional
    public ProductDTO create(ProductDTO dto) {
        Category category = categoryRepository.findById(dto.getCategoriaId())
            .orElseThrow(() -> new RuntimeException("Categoria não encontrada com o ID: " + dto.getCategoriaId()));

        Product product = Product.builder()
            .nome(dto.getNome().trim())
            .custo(dto.getCusto())
            .quantidadeEstoque(dto.getQuantidadeEstoque())
            .category(category)
            .build();

        return convertToDTO(productRepository.save(product));
    }

    @Transactional
    public ProductDTO update(Long id, ProductDTO dto) {
        Product product = productRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Produto não encontrado com o ID: " + id));

        Category category = categoryRepository.findById(dto.getCategoriaId())
            .orElseThrow(() -> new RuntimeException("Categoria não encontrada com o ID: " + dto.getCategoriaId()));

        product.setNome(dto.getNome().trim());
        product.setCusto(dto.getCusto());
        product.setQuantidadeEstoque(dto.getQuantidadeEstoque());
        product.setCategory(category);

        return convertToDTO(productRepository.save(product));
    }

    @Transactional
    public void delete(Long id) {
        if (!productRepository.existsById(id)) {
            throw new RuntimeException("Produto não encontrado com o ID: " + id);
        }
        // Check if there are orders using this product
        boolean inUse = orderRepository.findFilteredOrders(null, null, id, null, null).size() > 0;
        if (inUse) {
            throw new IllegalStateException("Não é possível excluir este produto pois há pedidos vinculados a ele");
        }
        productRepository.deleteById(id);
    }

    private ProductDTO convertToDTO(Product product) {
        return ProductDTO.builder()
            .id(product.getId())
            .nome(product.getNome())
            .custo(product.getCusto())
            .quantidadeEstoque(product.getQuantidadeEstoque())
            .categoriaId(product.getCategory().getId())
            .categoriaNome(product.getCategory().getNome())
            .build();
    }
}

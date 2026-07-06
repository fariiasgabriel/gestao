package com.marketplace.manager.service;

import com.marketplace.manager.dto.CategoryDTO;
import com.marketplace.manager.model.Category;
import com.marketplace.manager.repository.CategoryRepository;
import com.marketplace.manager.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CategoryService {

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private ProductRepository productRepository;

    @Transactional(readOnly = true)
    public List<CategoryDTO> findAll(String search) {
        List<Category> categories;
        if (search != null && !search.trim().isEmpty()) {
            categories = categoryRepository.findByNomeContainingIgnoreCase(search.trim());
        } else {
            categories = categoryRepository.findAll();
        }
        return categories.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CategoryDTO findById(Long id) {
        Category category = categoryRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Categoria não encontrada com o ID: " + id));
        return convertToDTO(category);
    }

    @Transactional
    public CategoryDTO create(CategoryDTO dto) {
        if (dto.getNome() == null || dto.getNome().trim().isEmpty()) {
            throw new IllegalArgumentException("O nome da categoria é obrigatório");
        }
        Category category = Category.builder()
            .nome(dto.getNome().trim())
            .build();
        return convertToDTO(categoryRepository.save(category));
    }

    @Transactional
    public CategoryDTO update(Long id, CategoryDTO dto) {
        Category category = categoryRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Categoria não encontrada com o ID: " + id));
        
        if (dto.getNome() == null || dto.getNome().trim().isEmpty()) {
            throw new IllegalArgumentException("O nome da categoria é obrigatório");
        }

        category.setNome(dto.getNome().trim());
        return convertToDTO(categoryRepository.save(category));
    }

    @Transactional
    public void delete(Long id) {
        if (!categoryRepository.existsById(id)) {
            throw new RuntimeException("Categoria não encontrada com o ID: " + id);
        }
        if (!productRepository.findByCategoryId(id).isEmpty()) {
            throw new IllegalStateException("Não é possível excluir esta categoria pois ela está vinculada a produtos");
        }
        categoryRepository.deleteById(id);
    }

    private CategoryDTO convertToDTO(Category category) {
        return CategoryDTO.builder()
            .id(category.getId())
            .nome(category.getNome())
            .build();
    }
}

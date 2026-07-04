package com.marketplace.manager;

import com.marketplace.manager.model.User;
import com.marketplace.manager.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootApplication
public class ManagerApplication {

    public static void main(String[] args) {
        SpringApplication.run(ManagerApplication.class, args);
        System.out.println("=================================================");
        System.out.println("Marketplace Operations Manager Backend is running!");
        System.out.println("Open Swagger Docs at http://localhost:8080/swagger-ui.html");
        System.out.println("=================================================");
    }

    @Bean
    public CommandLineRunner initUser(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            userRepository.findByUsername("gabriel").ifPresentOrElse(
                user -> {
                    user.setPassword(passwordEncoder.encode("admin123"));
                    userRepository.save(user);
                    System.out.println(">>> Senha do usuário 'gabriel' atualizada para 'admin123' com sucesso!");
                },
                () -> {
                    User newUser = User.builder()
                        .username("gabriel")
                        .password(passwordEncoder.encode("admin123"))
                        .role("ADMIN")
                        .build();
                    userRepository.save(newUser);
                    System.out.println(">>> Usuário 'gabriel' criado com a senha 'admin123' com sucesso!");
                }
            );
        };
    }
}

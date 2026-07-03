package com.marketplace.manager;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ManagerApplication {

    public static void main(String[] args) {
        SpringApplication.run(ManagerApplication.class, args);
        System.out.println("=================================================");
        System.out.println("Marketplace Operations Manager Backend is running!");
        System.out.println("Open Swagger Docs at http://localhost:8080/swagger-ui.html");
        System.out.println("=================================================");
    }
}

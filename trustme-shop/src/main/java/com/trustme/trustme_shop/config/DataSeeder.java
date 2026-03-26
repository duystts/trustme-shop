package com.trustme.trustme_shop.config;

import com.trustme.trustme_shop.entity.*;
import com.trustme.trustme_shop.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Arrays;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final ProductImageRepository productImageRepository;
    private final CartRepository cartRepository;
    private final PasswordEncoder passwordEncoder;

    private static final String ADMIN_EMAIL = "admin@trustme-shop.com";
    private static final String CUSTOMER_EMAIL = "customer@trustme.com";

    @Override
    public void run(String... args) throws Exception {
        if (!userRepository.existsByEmail(ADMIN_EMAIL)) {
            seedUsers();
        }
        if (categoryRepository.count() == 0) {
            seedCategories();
        }
    }

    private void seedUsers() {
        User admin = User.builder()
                .fullName("Admin User")
                .email(ADMIN_EMAIL)
                .password(passwordEncoder.encode("admin123"))
                .phone("+1234567890")
                .address("123 Admin Street")
                .role("ADMIN")
                .build();

        User customer = User.builder()
                .fullName("John Doe")
                .email(CUSTOMER_EMAIL)
                .password(passwordEncoder.encode("customer123"))
                .phone("+0987654321")
                .address("456 Customer Avenue")
                .role("CUSTOMER")
                .build();

        admin = userRepository.save(admin);
        customer = userRepository.save(customer);

        cartRepository.save(Cart.builder().user(admin).build());
        cartRepository.save(Cart.builder().user(customer).build());

        log.info(" Users seeded successfully!");
        log.info("Admin: admin@trustme-shop.com / admin123");
        log.info("Customer: customer@trustme.com / customer123");
    }

    private void seedCategories() {
        Category men = Category.builder()
                .name("Men")
                .description("Men's fashion and accessories")
                .build();

        Category women = Category.builder()
                .name("Women")
                .description("Women's fashion and accessories")
                .build();

        Category newArrivals = Category.builder()
                .name("New Arrivals")
                .description("Latest products and trending items")
                .build();

        Category accessories = Category.builder()
                .name("Accessories")
                .description("Fashion accessories for everyone")
                .build();

        categoryRepository.saveAll(Arrays.asList(men, women, newArrivals, accessories));
        log.info(" Categories seeded successfully!");
    }
}

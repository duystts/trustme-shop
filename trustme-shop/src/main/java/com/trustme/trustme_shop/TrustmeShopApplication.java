package com.trustme.trustme_shop;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class TrustmeShopApplication {

	public static void main(String[] args) {
		SpringApplication.run(TrustmeShopApplication.class, args);
	}

}

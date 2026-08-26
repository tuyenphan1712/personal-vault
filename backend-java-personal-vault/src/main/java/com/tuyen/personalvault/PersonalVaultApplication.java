package com.tuyen.personalvault;

import com.tuyen.personalvault.shared.security.JwtProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties(JwtProperties.class)
public class PersonalVaultApplication {

	public static void main(String[] args) {
		SpringApplication.run(PersonalVaultApplication.class, args);
	}

}

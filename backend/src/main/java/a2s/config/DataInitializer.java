package a2s.config;

import a2s.repository.DesignRepository;
import a2s.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Arrays;

@Configuration
public class DataInitializer {

    @Bean
    @SuppressWarnings("null")
    CommandLineRunner initDatabase(DesignRepository repository, UserRepository userRepository, PasswordEncoder encoder) {
        return args -> {
            // Seeding disabled as per dynamic data requirement
            System.out.println("[DB] Seeding disabled. Using live database.");
        };
    }
}

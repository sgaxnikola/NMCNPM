package vn.bluemoon.backend.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import vn.bluemoon.backend.service.ResidentSeedService;

@Configuration
public class DemoResidentDataLoader {

    @Bean
    public CommandLineRunner demoResidentSeeder(ResidentSeedService residentSeedService) {
        return args -> residentSeedService.seedIfEmpty();
    }
}


package vn.bluemoon.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Value("${app.cors.allowed-origin-patterns:http://localhost:*;http://127.0.0.1:*}")
    private String allowedOriginPatternsRaw;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        String[] allowedOriginPatterns = allowedOriginPatternsRaw
                .split("\\s*;\\s*");

        registry.addMapping("/api/**")
                // Prefer a restrictive default. Override via `app.cors.allowed-origin-patterns` when needed.
                .allowedOriginPatterns(allowedOriginPatterns)
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(false)
                .maxAge(3600);
    }
}


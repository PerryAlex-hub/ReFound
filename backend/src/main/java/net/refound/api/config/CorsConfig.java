package net.refound.api.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * Cross-origin rules for the Next.js frontend.
 *
 * <p>The browser blocks requests from {@code localhost:3000} to
 * {@code localhost:8080} unless the API says otherwise — different ports are
 * different origins.
 *
 * <p>Origins come from {@code app.base-url}, so development and production
 * differ by an environment variable rather than a code change. Never widen this
 * to {@code "*"}: it would let any website on the internet call the API with a
 * user's token.
 */
@Configuration
public class CorsConfig {

    @Value("${app.base-url}")
    private String frontendOrigin;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        configuration.setAllowedOrigins(List.of(frontendOrigin));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept"));

        // Lets the frontend read pagination headers if we ever add them.
        configuration.setExposedHeaders(List.of("Location"));

        // Tokens travel in the Authorization header, not cookies, so
        // credentials are unnecessary — and enabling them would forbid
        // wildcard origins anyway.
        configuration.setAllowCredentials(false);

        // Cache the preflight response for an hour.
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", configuration);
        return source;
    }
}

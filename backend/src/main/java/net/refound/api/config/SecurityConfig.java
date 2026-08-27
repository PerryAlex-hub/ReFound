package net.refound.api.config;

import lombok.RequiredArgsConstructor;
import net.refound.api.auth.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;

/**
 * The security filter chain.
 *
 * <p>Authorization happens at three levels, and only the first lives here:
 * <ol>
 *   <li><b>Path rules</b> — this class. Coarse: which URLs need a token, which
 *       need {@code ROLE_ADMIN}.</li>
 *   <li><b>{@code @PreAuthorize}</b> on service methods — role checks close to
 *       the logic they protect. Enabled by {@code @EnableMethodSecurity}.</li>
 *   <li><b>Ownership checks inside services</b> — "is this the claim's
 *       claimant, the item's finder, or an admin?" Path rules cannot express
 *       this, and it is where real access bugs live.</li>
 * </ol>
 *
 * <p>{@link JwtAuthenticationFilter} runs ahead of the authorization rules and
 * populates the security context from the bearer token. It never rejects a
 * request itself — the rules below decide what an unauthenticated caller means
 * for a given path.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final RestAuthenticationEntryPoint authenticationEntryPoint;
    private final RestAccessDeniedHandler accessDeniedHandler;
    private final CorsConfigurationSource corsConfigurationSource;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    /** Paths reachable without a token. */
    private static final String[] PUBLIC_PATHS = {
            "/api/auth/**",
            // The hosting platform polls this to decide whether the instance is
            // alive; it cannot present a token. Only health is exposed, and it
            // reports status without details — see management.* in application.yml.
            "/actuator/health",
            "/actuator/health/**",
            // Swagger UI and the OpenAPI document. Disabled on the prod
            // profile via springdoc.api-docs.enabled=false.
            "/swagger-ui.html",
            "/swagger-ui/**",
            "/v3/api-docs",
            "/v3/api-docs/**",
    };

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                // No cookies, no sessions, so there is no CSRF vector to protect.
                // Every request carries its own bearer token.
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource))

                // The API issues its own tokens; Spring's login page and basic
                // auth prompt would only get in the way.
                .formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                .logout(AbstractHttpConfigurer::disable)

                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                .exceptionHandling(handling -> handling
                        .authenticationEntryPoint(authenticationEntryPoint)   // 401
                        .accessDeniedHandler(accessDeniedHandler))            // 403

                .authorizeHttpRequests(auth -> auth
                        // CORS preflight must never require a token.
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers(PUBLIC_PATHS).permitAll()
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .anyRequest().authenticated())

                // Runs before the username/password filter, so a valid bearer
                // token has already populated the security context by the time
                // the authorization rules above are evaluated.
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)

                .build();
    }

    /**
     * BCrypt at strength 12 — roughly 250ms per hash on modern hardware. Slow
     * on purpose: it is what makes a stolen password table impractical to
     * brute-force. Do not lower it to speed up tests.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }
}

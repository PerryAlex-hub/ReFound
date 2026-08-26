package net.refound.api.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * Swagger UI, served at {@code /swagger-ui.html} on the dev profile.
 *
 * <p>This is how the API gets exercised before a frontend exists: register a
 * user, copy the access token, paste it into <b>Authorize</b>, and every
 * subsequent request carries the bearer header.
 *
 * <p>Disabled on the prod profile — a public catalogue of every endpoint is a
 * gift to anyone probing the service.
 */
@Configuration
public class OpenApiConfig {

    @Value("${server.port:8080}")
    private String port;

    @Bean
    public OpenAPI refoundOpenApi() {
        final String bearerScheme = "bearerAuth";

        return new OpenAPI()
                .info(new Info()
                        .title("ReFound API")
                        .description("""
                                Campus lost and found. Students report lost and found items;
                                the matcher suggests pairings; administrators verify ownership
                                before any contact details are released.

                                All endpoints except /api/auth/** require a bearer token.
                                """)
                        .version("v1")
                        .license(new License().name("MIT")))

                .servers(List.of(new Server()
                        .url("http://localhost:" + port)
                        .description("Local development")))

                // Declares the scheme...
                .components(new Components().addSecuritySchemes(bearerScheme,
                        new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("Paste the accessToken returned by /api/auth/login")))

                // ...and applies it to every operation by default, which is what
                // puts the Authorize button in the UI.
                .addSecurityItem(new SecurityRequirement().addList(bearerScheme));
    }
}

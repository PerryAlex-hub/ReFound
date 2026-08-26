package net.refound.api.config;

import tools.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import net.refound.api.common.response.ErrorResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * Returns the standard error body when an unauthenticated caller hits a
 * protected endpoint.
 *
 * <p>Spring Security's default is an empty 403 (or a browser login prompt),
 * neither of which a JSON client can interpret. This is why a security failure
 * looks the same as any other error to the frontend — those failures happen in
 * the filter chain, before {@code @RestControllerAdvice} can see them.
 */
@Component
@RequiredArgsConstructor
public class RestAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final ObjectMapper objectMapper;

    @Override
    public void commence(HttpServletRequest request,
                         HttpServletResponse response,
                         AuthenticationException authException) throws IOException {

        response.setStatus(HttpStatus.UNAUTHORIZED.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);

        // Deliberately vague: never reveal whether the token was absent,
        // expired, or malformed.
        ErrorResponse body = ErrorResponse.of(
                HttpStatus.UNAUTHORIZED.value(),
                "UNAUTHORIZED",
                "Authentication is required to access this resource",
                request.getRequestURI());

        objectMapper.writeValue(response.getOutputStream(), body);
    }
}

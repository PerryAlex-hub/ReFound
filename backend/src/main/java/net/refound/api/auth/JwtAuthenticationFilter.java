package net.refound.api.auth;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Reads {@code Authorization: Bearer <token>} and, if it verifies, marks the
 * request as authenticated.
 *
 * <p>Runs once per request, before Spring Security's authorization checks.
 *
 * <p><b>It never rejects anything.</b> A missing or invalid token simply leaves
 * the security context empty, and the authorization rules decide what that
 * means — 401 on a protected path, fine on a public one. Rejecting here would
 * break every public endpoint for anonymous callers.
 */
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtService jwtService;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain)
            throws ServletException, IOException {

        extractToken(request)
                .flatMap(jwtService::parse)
                .ifPresent(principal -> authenticate(principal, request));

        filterChain.doFilter(request, response);
    }

    private java.util.Optional<String> extractToken(HttpServletRequest request) {
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (header == null || !header.startsWith(BEARER_PREFIX)) {
            return java.util.Optional.empty();
        }
        String token = header.substring(BEARER_PREFIX.length()).trim();
        return token.isEmpty() ? java.util.Optional.empty() : java.util.Optional.of(token);
    }

    private void authenticate(AuthPrincipal principal, HttpServletRequest request) {
        // "ROLE_" is the prefix hasRole("ADMIN") expects. Omit it and every
        // admin check silently fails.
        var authorities = List.of(new SimpleGrantedAuthority("ROLE_" + principal.role().name()));

        var authentication = new UsernamePasswordAuthenticationToken(principal, null, authorities);
        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

        SecurityContextHolder.getContext().setAuthentication(authentication);
    }
}

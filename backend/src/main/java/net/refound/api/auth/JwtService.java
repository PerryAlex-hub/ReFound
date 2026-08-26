package net.refound.api.auth;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import net.refound.api.user.domain.Role;
import net.refound.api.user.domain.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.Optional;
import java.util.UUID;

/**
 * Issues and verifies access tokens.
 *
 * <p>Access tokens are short-lived and stateless: there is no way to revoke one
 * before it expires, which is exactly why the lifetime is minutes rather than
 * days. Long-lived sessions are the refresh token's job, and those <em>are</em>
 * revocable because they live in the database.
 */
@Slf4j
@Service
public class JwtService {

    private static final String CLAIM_EMAIL = "email";
    private static final String CLAIM_ROLE = "role";

    private final SecretKey signingKey;
    private final Duration accessTokenTtl;

    public JwtService(@Value("${app.jwt.secret}") String secret,
                      @Value("${app.jwt.expiry-minutes}") long expiryMinutes) {

        // HMAC-SHA256 requires at least 256 bits of key. Failing loudly at
        // startup beats discovering a weak or empty secret in production.
        byte[] keyBytes = secret == null ? new byte[0] : secret.getBytes(StandardCharsets.UTF_8);
        if (keyBytes.length < 32) {
            throw new IllegalStateException(
                    "app.jwt.secret must be at least 32 bytes. Set JWT_SECRET in .env — "
                    + "generate one with: openssl rand -base64 48");
        }

        this.signingKey = Keys.hmacShaKeyFor(keyBytes);
        this.accessTokenTtl = Duration.ofMinutes(expiryMinutes);
    }

    public String generateAccessToken(User user) {
        Instant now = Instant.now();

        return Jwts.builder()
                .subject(user.getId().toString())
                .claim(CLAIM_EMAIL, user.getEmail())
                .claim(CLAIM_ROLE, user.getRole().name())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(accessTokenTtl)))
                .signWith(signingKey)
                .compact();
    }

    /**
     * Verifies a token and rebuilds the caller from its claims.
     *
     * <p>Returns empty rather than throwing: an expired or forged token is an
     * ordinary event on a public API, not an exceptional one. The filter treats
     * empty as "not authenticated" and the entry point answers 401.
     */
    public Optional<AuthPrincipal> parse(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(signingKey)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            return Optional.of(new AuthPrincipal(
                    UUID.fromString(claims.getSubject()),
                    claims.get(CLAIM_EMAIL, String.class),
                    Role.valueOf(claims.get(CLAIM_ROLE, String.class))));

        } catch (JwtException | IllegalArgumentException ex) {
            // Never log the token itself.
            log.debug("Rejected access token: {}", ex.getMessage());
            return Optional.empty();
        }
    }

    /** Seconds until an access token expires — returned to the client. */
    public long accessTokenTtlSeconds() {
        return accessTokenTtl.toSeconds();
    }
}

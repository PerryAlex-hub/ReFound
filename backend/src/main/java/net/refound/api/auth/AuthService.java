package net.refound.api.auth;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.refound.api.auth.domain.RefreshToken;
import net.refound.api.auth.dto.AuthResponse;
import net.refound.api.auth.dto.LoginRequest;
import net.refound.api.auth.dto.RegisterRequest;
import net.refound.api.auth.repository.RefreshTokenRepository;
import net.refound.api.common.audit.AuditService;
import net.refound.api.common.exception.ConflictException;
import net.refound.api.common.exception.ForbiddenException;
import net.refound.api.user.domain.Role;
import net.refound.api.user.domain.User;
import net.refound.api.user.domain.UserStatus;
import net.refound.api.user.mapper.UserMapper;
import net.refound.api.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;

/**
 * Registration, login, and token lifecycle.
 *
 * <p>Two token types, doing different jobs:
 * <ul>
 *   <li><b>Access token</b> — a signed JWT, minutes long, not stored anywhere.
 *       Fast to verify, impossible to revoke early.</li>
 *   <li><b>Refresh token</b> — opaque random bytes, weeks long, stored as a
 *       SHA-256 hash. Revocable, and rotated on every use.</li>
 * </ul>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final int REFRESH_TOKEN_BYTES = 32;

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final UserMapper userMapper;
    private final AuditService auditService;
    private final RefreshTokenRevoker refreshTokenRevoker;

    @Value("${app.jwt.refresh-expiry-days}")
    private long refreshExpiryDays;

    // ------------------------------------------------------------------
    // Registration
    // ------------------------------------------------------------------

    @Transactional
    public AuthResponse register(RegisterRequest request) {

        // Checked up front so the caller gets a useful message. The unique
        // indexes remain the real guarantee: two simultaneous registrations
        // would both pass these checks, and the database still rejects one.
        if (userRepository.existsByEmailIgnoreCase(request.email())) {
            throw new ConflictException("An account with this email already exists");
        }
        if (userRepository.existsByMatricNumberIgnoreCase(request.matricNumber())) {
            throw new ConflictException("An account with this matric number already exists");
        }
        if (userRepository.existsByPhoneNumber(request.phoneNumber())) {
            throw new ConflictException("An account with this phone number already exists");
        }

        User user = new User();
        user.setFullName(request.fullName().trim());
        user.setMatricNumber(request.matricNumber().trim());
        user.setEmail(request.email().trim().toLowerCase());
        user.setPhoneNumber(request.phoneNumber().trim());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(Role.STUDENT);
        user.setStatus(UserStatus.ACTIVE);

        // TODO(email): flip to false and send a verification link once email
        // is wired up. Accounts created before then stay valid, and the gate
        // on claiming / posting found items goes in at the same time.
        user.setEmailVerified(true);

        userRepository.save(user);
        auditService.record(user, "USER", user.getId(), "USER_REGISTERED");

        log.info("Registered user {}", user.getId());
        return issueTokens(user);
    }

    // ------------------------------------------------------------------
    // Login
    // ------------------------------------------------------------------

    @Transactional
    public AuthResponse login(LoginRequest request) {

        // One generic failure for "no such account" and "wrong password".
        // Distinguishing them turns login into an account-enumeration oracle.
        User user = userRepository.findByEmailIgnoreCase(request.email())
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            log.debug("Failed login for user {}", user.getId());
            throw new BadCredentialsException("Invalid email or password");
        }

        // Checked after the password, so a suspended account is not revealed
        // to someone who does not already know the password.
        if (user.getStatus() == UserStatus.SUSPENDED) {
            throw new ForbiddenException("This account has been suspended");
        }

        return issueTokens(user);
    }

    // ------------------------------------------------------------------
    // Refresh and logout
    // ------------------------------------------------------------------

    /**
     * Exchanges a refresh token for a new pair, revoking the one presented.
     *
     * <p>Rotation means a stolen token is usable at most once, and the theft
     * surfaces when the legitimate client's next refresh is rejected.
     */
    @Transactional
    public AuthResponse refresh(String presentedToken) {

        RefreshToken stored = refreshTokenRepository.findByTokenHash(hash(presentedToken))
                .orElseThrow(() -> new BadCredentialsException("Invalid refresh token"));

        if (!stored.isActive(Instant.now())) {
            // Reuse of a revoked token suggests theft: drop every session for
            // that user rather than just refusing this one request.
            //
            // Delegated to a REQUIRES_NEW bean because the throw below rolls
            // this transaction back — a revocation written here would be undone
            // along with it, and the defence would silently do nothing.
            log.warn("Refresh token reuse detected for user {}", stored.getUser().getId());
            refreshTokenRevoker.revokeAllSessions(stored.getUser().getId());
            throw new BadCredentialsException("Invalid refresh token");
        }

        User user = stored.getUser();
        if (user.getStatus() == UserStatus.SUSPENDED) {
            throw new ForbiddenException("This account has been suspended");
        }

        stored.setRevokedAt(Instant.now());
        return issueTokens(user);
    }

    /** Revokes a single session. Other devices stay logged in. */
    @Transactional
    public void logout(String presentedToken) {
        refreshTokenRepository.findByTokenHash(hash(presentedToken))
                .ifPresent(token -> token.setRevokedAt(Instant.now()));
        // Silent on an unknown token: logout should never report failure.
    }

    // ------------------------------------------------------------------
    // Internals
    // ------------------------------------------------------------------

    private AuthResponse issueTokens(User user) {
        String accessToken = jwtService.generateAccessToken(user);
        String refreshTokenValue = generateRefreshToken();

        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUser(user);
        refreshToken.setTokenHash(hash(refreshTokenValue));
        refreshToken.setExpiresAt(Instant.now().plus(Duration.ofDays(refreshExpiryDays)));
        refreshTokenRepository.save(refreshToken);

        return new AuthResponse(
                accessToken,
                refreshTokenValue,          // the only time the raw value exists
                jwtService.accessTokenTtlSeconds(),
                userMapper.toResponse(user));
    }

    private String generateRefreshToken() {
        byte[] bytes = new byte[REFRESH_TOKEN_BYTES];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    /**
     * SHA-256, not BCrypt.
     *
     * <p>BCrypt is deliberately slow, which is right for a low-entropy secret a
     * human chose. A refresh token is 256 random bits — brute force is already
     * impossible — and it is verified on every refresh, so speed matters. The
     * hash exists so a database leak yields no usable tokens.
     */
    private String hash(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return Base64.getEncoder()
                    .encodeToString(digest.digest(token.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 unavailable", ex);
        }
    }
}

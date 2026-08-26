package net.refound.api.auth;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.refound.api.auth.repository.RefreshTokenRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

/**
 * Revokes every session for a user in its <em>own</em> transaction.
 *
 * <p>This exists because of a subtlety that is easy to get wrong. When
 * {@link AuthService#refresh} detects a revoked token being reused, it wants to
 * drop all of that user's sessions and <em>then</em> reject the request. But
 * throwing from a {@code @Transactional} method rolls the transaction back — so
 * a revocation written just before the throw would be quietly undone, and the
 * defence would do nothing at all.
 *
 * <p>{@code REQUIRES_NEW} suspends the caller's transaction and commits this one
 * independently, so the revocation survives the rejection that follows.
 *
 * <p>It is a separate bean rather than a method on {@code AuthService} because
 * Spring's transaction handling works through a proxy: calling a
 * {@code @Transactional} method from inside the same class bypasses the proxy
 * entirely and the new propagation would be ignored.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RefreshTokenRevoker {

    private final RefreshTokenRepository refreshTokenRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void revokeAllSessions(UUID userId) {
        int revoked = refreshTokenRepository.revokeAllForUser(userId, Instant.now());
        log.warn("Revoked {} active session(s) for user {}", revoked, userId);
    }
}

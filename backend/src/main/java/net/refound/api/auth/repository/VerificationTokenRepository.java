package net.refound.api.auth.repository;

import net.refound.api.auth.domain.TokenPurpose;
import net.refound.api.auth.domain.VerificationToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface VerificationTokenRepository extends JpaRepository<VerificationToken, UUID> {

    /** Tokens are looked up by hash — the raw value is never stored. */
    Optional<VerificationToken> findByTokenHash(String tokenHash);

    /** Invalidate any outstanding token before issuing a new one. */
    @Modifying
    @Query("""
            update VerificationToken t
               set t.usedAt = :now
             where t.user.id = :userId
               and t.purpose = :purpose
               and t.usedAt is null
            """)
    int invalidateOutstanding(@Param("userId") UUID userId,
                              @Param("purpose") TokenPurpose purpose,
                              @Param("now") Instant now);

    @Modifying
    @Query("delete from VerificationToken t where t.expiresAt < :cutoff")
    int deleteExpired(@Param("cutoff") Instant cutoff);
}

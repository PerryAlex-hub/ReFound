package net.refound.api.claim.repository;

import net.refound.api.claim.domain.Claim;
import net.refound.api.claim.domain.ClaimStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface ClaimRepository extends JpaRepository<Claim, UUID> {

    /** The admin review queue: oldest first, so nobody waits indefinitely. */
    Page<Claim> findByStatusOrderByCreatedAtAsc(ClaimStatus status, Pageable pageable);

    Page<Claim> findByClaimantIdOrderByCreatedAtDesc(UUID claimantId, Pageable pageable);

    /**
     * Sibling claims to reject when one is approved. Excludes the approved
     * claim itself.
     */
    @Query("""
            select c from Claim c
             where c.foundItem.id = :foundItemId
               and c.id <> :excludeClaimId
               and c.status in ('PENDING', 'AWAITING_INFO')
            """)
    List<Claim> findOtherOpenClaims(@Param("foundItemId") UUID foundItemId,
                                    @Param("excludeClaimId") UUID excludeClaimId);

    /** Pre-check for the partial unique index on one live claim per person. */
    @Query("""
            select count(c) > 0 from Claim c
             where c.foundItem.id = :foundItemId
               and c.claimant.id = :claimantId
               and c.status in ('PENDING', 'AWAITING_INFO')
            """)
    boolean hasOpenClaim(@Param("foundItemId") UUID foundItemId,
                         @Param("claimantId") UUID claimantId);

    /** Has this user been verified as the owner of this item? */
    @Query("""
            select count(c) > 0 from Claim c
             where c.foundItem.id = :foundItemId
               and c.claimant.id = :claimantId
               and c.status = 'APPROVED'
            """)
    boolean hasApprovedClaim(@Param("foundItemId") UUID foundItemId,
                             @Param("claimantId") UUID claimantId);

    long countByStatus(ClaimStatus status);
}

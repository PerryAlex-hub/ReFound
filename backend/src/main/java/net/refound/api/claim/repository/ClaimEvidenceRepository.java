package net.refound.api.claim.repository;

import net.refound.api.claim.domain.ClaimEvidence;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ClaimEvidenceRepository extends JpaRepository<ClaimEvidence, UUID> {

    List<ClaimEvidence> findByClaimId(UUID claimId);
}

package net.refound.api.claim.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import net.refound.api.claim.domain.ClaimStatus;
import net.refound.api.item.domain.Category;
import net.refound.api.user.dto.ContactResponse;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Everything an administrator needs to decide a claim, on one screen.
 *
 * <p>The two fields that matter sit side by side:
 * {@link #finderVerificationAnswer} — the private detail the finder recorded —
 * and {@link #claimantDescription} — what the claimant says about the item. The
 * decision is a comparison of two independent pieces of evidence rather than a
 * judgement call, which is the whole reason the verification question exists.
 *
 * <p>Admin-only. This record must never be returned from a student-facing
 * endpoint.
 *
 * @param competingClaims other live claims on the same item — several people
 *                        may claim one black umbrella, and at most one can be
 *                        approved
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record AdminClaimReviewResponse(
        UUID id,
        ClaimStatus status,

        // --- the item ---
        UUID foundItemId,
        String itemTitle,
        Category itemCategory,
        String itemDescription,
        String itemLocationLabel,
        List<String> itemPhotoUrls,

        // --- the evidence, side by side ---
        String finderVerificationAnswer,
        String claimantDescription,
        String claimantLostContext,
        List<String> claimantEvidenceUrls,

        /** Set when the claimant filed a matching lost report of their own. */
        UUID claimantLostItemId,

        // --- the people ---
        ContactResponse finder,
        ContactResponse claimant,
        String claimantMatricNumber,

        // --- process ---
        String infoRequest,
        String infoResponse,
        String decisionReason,
        Instant decidedAt,
        String reviewedByName,
        int competingClaims,

        Instant createdAt
) {
}

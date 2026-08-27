package net.refound.api.claim.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import net.refound.api.claim.domain.ClaimStatus;
import net.refound.api.item.domain.Category;
import net.refound.api.user.dto.ContactResponse;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * A claim, as seen by one of its participants.
 *
 * <p>{@code counterpartContact} is the point of the entire system — the
 * finder's details to the owner, and the owner's to the finder. It is populated
 * only once an administrator has approved the claim, and only for the two
 * people involved.
 *
 * <p>The finder's verification answer never appears here, not even after
 * approval: the claimant never needed it, and revealing it would teach a
 * rejected claimant exactly what to say next time.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ClaimDetailResponse(
        UUID id,
        UUID foundItemId,
        String itemTitle,
        Category itemCategory,
        ClaimStatus status,

        /** The claimant's account of distinguishing features. */
        String description,
        String lostContext,
        List<String> evidenceUrls,

        /** Set while the claim waits on the claimant. */
        String infoRequest,
        String infoResponse,

        /** Populated once decided. */
        String decisionReason,
        Instant decidedAt,

        // --- handover ---
        boolean finderConfirmed,
        boolean claimantConfirmed,

        /** CLAIMANT, FINDER or ADMIN — lets the UI show the right controls. */
        String viewerRole,

        // --- released only on approval, only to the two parties ---
        ContactResponse counterpartContact,

        Instant createdAt
) {
}

package net.refound.api.claim.dto;

import net.refound.api.claim.domain.ClaimStatus;
import net.refound.api.item.domain.Category;

import java.time.Instant;
import java.util.UUID;

/**
 * One row in a claim list — a claimant's dashboard, or an admin's review queue.
 *
 * <p>Carries no contact details and no verification answer: a queue is a list
 * of things to look at, not a place to release private data. The reviewer opens
 * the claim to see the evidence.
 */
public record ClaimSummaryResponse(
        UUID id,
        UUID foundItemId,
        String itemTitle,
        Category itemCategory,
        ClaimStatus status,
        /** Present once decided. */
        Instant decidedAt,
        Instant createdAt
) {
}

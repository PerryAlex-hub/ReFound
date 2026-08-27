package net.refound.api.claim.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * An administrator's decision on a claim.
 *
 * <p>The reason is mandatory, and the database enforces it too
 * ({@code claim_decision_complete}). A rejected claimant is owed an
 * explanation, and an approval that released someone's phone number should be
 * answerable later.
 */
public record ClaimDecisionRequest(

        @NotBlank(message = "A reason is required for every decision")
        @Size(min = 5, max = 1000, message = "Reason must be between 5 and 1000 characters")
        String reason
) {
}

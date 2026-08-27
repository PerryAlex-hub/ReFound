package net.refound.api.claim.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

/**
 * Asserting ownership of a found item.
 *
 * <p>{@code description} is the heart of the whole system: it is what an
 * administrator compares against the finder's private verification answer.
 * Vague claims fail review, which is the intended outcome.
 */
public record CreateClaimRequest(

        @NotNull(message = "Which item are you claiming?")
        UUID foundItemId,

        /**
         * The claimant's own lost report, if they filed one. Optional — many
         * people never report the loss and only find the item while browsing.
         */
        UUID lostItemId,

        @NotBlank(message = "Describe the item's distinguishing features")
        @Size(min = 10, max = 1000,
                message = "Describe the item in at least 10 characters — marks, damage, "
                        + "contents, anything only the owner would know")
        String description,

        @Size(max = 500, message = "Must be at most 500 characters")
        String lostContext
) {
}

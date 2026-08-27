package net.refound.api.claim.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** The claimant's answer to an administrator's follow-up question. */
public record InfoResponseRequest(

        @NotBlank(message = "An answer is required")
        @Size(min = 1, max = 1000, message = "Answer must be at most 1000 characters")
        String answer
) {
}

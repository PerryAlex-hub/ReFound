package net.refound.api.claim.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * A follow-up question from an administrator when a claim is plausible but not
 * yet convincing — "what is the lock screen wallpaper?", "what is in the side
 * pocket?".
 */
public record InfoRequestRequest(

        @NotBlank(message = "A question is required")
        @Size(min = 5, max = 500, message = "Question must be between 5 and 500 characters")
        String question
) {
}

package net.refound.api.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * A reason for a moderation action.
 *
 * <p>Mandatory, and recorded in the audit trail. Hiding a report or suspending
 * an account should always be answerable afterwards.
 */
public record ModerationRequest(

        @NotBlank(message = "A reason is required")
        @Size(min = 5, max = 500, message = "Reason must be between 5 and 500 characters")
        String reason
) {
}

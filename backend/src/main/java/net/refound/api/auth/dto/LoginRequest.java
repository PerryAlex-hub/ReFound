package net.refound.api.auth.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Login payload.
 *
 * <p>No {@code @Email} or length rules here — validating the shape of a login
 * attempt tells an attacker which inputs are worth trying. Every failure gets
 * the same generic answer.
 */
public record LoginRequest(

        @NotBlank(message = "Email is required")
        String email,

        @NotBlank(message = "Password is required")
        String password
) {
}

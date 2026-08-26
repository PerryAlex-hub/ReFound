package net.refound.api.auth.dto;

import jakarta.validation.constraints.NotBlank;

/** Carries a refresh token, for both refresh and logout. */
public record RefreshTokenRequest(

        @NotBlank(message = "Refresh token is required")
        String refreshToken
) {
}

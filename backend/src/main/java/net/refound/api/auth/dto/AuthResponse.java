package net.refound.api.auth.dto;

import net.refound.api.user.dto.UserResponse;

/**
 * What a successful register, login, or refresh returns.
 *
 * @param accessToken  short-lived JWT, sent as {@code Authorization: Bearer ...}
 * @param refreshToken long-lived opaque token; the only copy the client will
 *                     ever see, since the server stores only its hash
 * @param expiresIn    seconds until the access token expires, so the client can
 *                     refresh ahead of time rather than after a failed request
 * @param user         the caller's own profile, saving an immediate follow-up
 *                     call to {@code /users/me}
 */
public record AuthResponse(
        String accessToken,
        String refreshToken,
        long expiresIn,
        UserResponse user
) {
}

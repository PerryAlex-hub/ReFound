package net.refound.api.user.dto;

import net.refound.api.user.domain.Role;

import java.time.Instant;
import java.util.UUID;

/**
 * A user's own profile.
 *
 * <p><b>Contains contact details, so it may only ever be sent to the account
 * holder themselves.</b> Never use it to describe some other user — an item's
 * reporter, a claimant in a queue. Those need a separate, contact-free shape,
 * and sending this one instead would publish a phone number the whole
 * verification workflow exists to protect.
 *
 * <p>{@code passwordHash} is absent by construction.
 */
public record UserResponse(
        UUID id,
        String fullName,
        String matricNumber,
        String email,
        String phoneNumber,
        Role role,
        boolean emailVerified,
        Instant createdAt
) {
}

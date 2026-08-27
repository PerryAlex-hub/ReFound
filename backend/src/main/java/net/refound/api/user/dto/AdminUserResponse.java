package net.refound.api.user.dto;

import net.refound.api.user.domain.Role;
import net.refound.api.user.domain.UserStatus;

import java.time.Instant;
import java.util.UUID;

/**
 * A user as seen by an administrator.
 *
 * <p>Includes contact details and account state. Admin-only — never returned
 * from a student-facing endpoint.
 */
public record AdminUserResponse(
        UUID id,
        String fullName,
        String matricNumber,
        String email,
        String phoneNumber,
        Role role,
        UserStatus status,
        boolean emailVerified,
        Instant createdAt
) {
}

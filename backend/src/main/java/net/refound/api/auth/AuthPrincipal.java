package net.refound.api.auth;

import net.refound.api.user.domain.Role;

import java.util.UUID;

/**
 * The authenticated caller, rebuilt from the access token on every request.
 *
 * <p>Deliberately not the {@code User} entity. The token already carries who
 * the caller is, so a database read per request would be wasted work, and an
 * entity floating outside a transaction invites lazy-loading surprises.
 * Services that need the full record load it themselves.
 *
 * <p>Reachable in any controller via
 * {@code @AuthenticationPrincipal AuthPrincipal principal}.
 */
public record AuthPrincipal(UUID id, String email, Role role) {

    public boolean isAdmin() {
        return role == Role.ADMIN;
    }
}

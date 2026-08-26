package net.refound.api.user.domain;

/**
 * Account role. Stored as text; mirrors the app_user_role_valid check constraint.
 *
 * <p>Admins are never self-service: they are promoted by migration or by an
 * existing admin.
 */
public enum Role {
    STUDENT,
    ADMIN
}

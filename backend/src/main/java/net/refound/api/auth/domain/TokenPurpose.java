package net.refound.api.auth.domain;

/** Mirrors the verification_token_purpose_valid check constraint. */
public enum TokenPurpose {
    EMAIL_VERIFICATION,
    PASSWORD_RESET
}

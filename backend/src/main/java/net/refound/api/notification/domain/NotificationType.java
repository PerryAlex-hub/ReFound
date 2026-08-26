package net.refound.api.notification.domain;

/** Mirrors the notification_type_valid check constraint. */
public enum NotificationType {
    EMAIL_VERIFICATION,
    PASSWORD_RESET,
    /** A found item scored above the threshold against the recipient's lost report. */
    MATCH_FOUND,
    /** Someone has claimed the item the recipient found. */
    CLAIM_SUBMITTED,
    CLAIM_INFO_REQUESTED,
    /** Carries contact details. Sent to both claimant and finder. */
    CLAIM_APPROVED,
    CLAIM_REJECTED,
    HANDOVER_REMINDER,
    ITEM_EXPIRING
}

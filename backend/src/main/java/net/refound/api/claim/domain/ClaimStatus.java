package net.refound.api.claim.domain;

/**
 * Claim lifecycle.
 *
 * <pre>
 * PENDING ──► AWAITING_INFO ──► PENDING
 *    ├──────► APPROVED   (contact released to both parties)
 *    ├──────► REJECTED
 *    └──────► WITHDRAWN  (claimant backed out)
 * </pre>
 *
 * <p>APPROVED and REJECTED require a reviewer, a timestamp, and a reason —
 * enforced by the claim_decision_complete check constraint.
 */
public enum ClaimStatus {
    PENDING,
    AWAITING_INFO,
    APPROVED,
    REJECTED,
    WITHDRAWN
}

package net.refound.api.item.domain;

/**
 * Item lifecycle.
 *
 * <pre>
 * OPEN ──► CLAIM_PENDING ──► MATCHED ──► RETURNED
 *   │            │
 *   │            └──► OPEN        (every claim rejected)
 *   ├──► EXPIRED                  (90 days, no activity)
 *   └──► CANCELLED                (reporter withdrew it)
 * </pre>
 *
 * <p>CLAIM_PENDING does not block further claims: several people may claim the
 * same umbrella, and an admin approves at most one.
 */
public enum ItemStatus {
    OPEN,
    CLAIM_PENDING,
    MATCHED,
    RETURNED,
    EXPIRED,
    CANCELLED
}

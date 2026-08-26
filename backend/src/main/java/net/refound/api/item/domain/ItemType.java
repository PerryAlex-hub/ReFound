package net.refound.api.item.domain;

/**
 * Whether a report describes something lost or something found.
 *
 * <p>Both live in the same table, discriminated by this column, so matching a
 * lost report against a found one is a single self-join.
 */
public enum ItemType {
    LOST,
    FOUND
}

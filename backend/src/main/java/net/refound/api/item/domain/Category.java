package net.refound.api.item.domain;

/**
 * Item categories. Mirrors the item_category_valid check constraint — adding a
 * value here requires a migration that widens the constraint.
 *
 * <p>Category is the strongest matching signal: a mismatch short-circuits the
 * comparison entirely, since there is no point scoring a phone against a shoe.
 */
public enum Category {
    PHONE,
    LAPTOP,
    ID_CARD,
    KEYS,
    BAG,
    BOOK,
    WALLET,
    CLOTHING,
    JEWELLERY,
    OTHER
}

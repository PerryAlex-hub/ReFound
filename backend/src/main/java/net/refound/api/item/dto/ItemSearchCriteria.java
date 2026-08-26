package net.refound.api.item.dto;

import net.refound.api.item.domain.Category;
import net.refound.api.item.domain.ItemStatus;
import net.refound.api.item.domain.ItemType;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Browse filters. Every field is optional; null means "do not filter on this".
 *
 * <p>The four bounds arrive together from the map viewport — the frontend sends
 * whatever rectangle the user is currently looking at. They are applied only
 * when all four are present.
 */
public record ItemSearchCriteria(
        ItemType type,
        ItemStatus status,
        Category category,
        /** Free text, matched against title and description. */
        String q,
        LocalDate dateFrom,
        LocalDate dateTo,
        BigDecimal north,
        BigDecimal south,
        BigDecimal east,
        BigDecimal west
) {

    public boolean hasBounds() {
        return north != null && south != null && east != null && west != null;
    }

    public boolean hasQuery() {
        return q != null && !q.isBlank();
    }
}

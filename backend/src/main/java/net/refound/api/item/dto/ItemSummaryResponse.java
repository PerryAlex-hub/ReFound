package net.refound.api.item.dto;

import net.refound.api.item.domain.Category;
import net.refound.api.item.domain.ItemStatus;
import net.refound.api.item.domain.ItemType;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * One row in a browse listing — the deliberately vague public view.
 *
 * <p>Enough for an owner to recognise their own property, not enough for anyone
 * else to fake a claim. Note what has no field here at all: the reporter, their
 * contact details, and the verification answer. They cannot leak from a shape
 * that has nowhere to put them.
 *
 * @param thumbnailUrl the first photo, and only when the item's category allows
 *                     public photos — null for phones, laptops, wallets and ID
 *                     cards, where a clear image makes a false claim easy
 */
public record ItemSummaryResponse(
        UUID id,
        ItemType type,
        ItemStatus status,
        Category category,
        String title,
        String description,
        BigDecimal latitude,
        BigDecimal longitude,
        String locationLabel,
        LocalDate occurredOn,
        String thumbnailUrl,
        boolean hasPhotos,
        Instant createdAt
) {
}

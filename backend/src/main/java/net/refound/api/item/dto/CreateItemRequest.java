package net.refound.api.item.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;
import net.refound.api.item.domain.Category;
import net.refound.api.item.domain.ItemType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;

/**
 * Reporting a lost or found item.
 *
 * <p>Absent by design: {@code status}, {@code expiresAt}, {@code photosPublic},
 * {@code hidden}, {@code reporter}. All are decided by the server. A DTO that
 * accepted them would let a caller publish a phone's photo publicly or post on
 * someone else's behalf.
 *
 * <p>Two rules cannot be expressed with annotations and are enforced in the
 * service instead:
 * <ul>
 *   <li>{@code verificationAnswer} is required for FOUND and forbidden for LOST</li>
 *   <li>latitude and longitude are supplied together or not at all</li>
 * </ul>
 */
public record CreateItemRequest(

        @NotNull(message = "Type is required (LOST or FOUND)")
        ItemType type,

        @NotNull(message = "Category is required")
        Category category,

        @NotBlank(message = "Title is required")
        @Size(max = 120, message = "Title must be at most 120 characters")
        String title,

        @Size(max = 2000, message = "Description must be at most 2000 characters")
        String description,

        /* From the map pin. Optional: someone who lost a phone "somewhere on
         * campus" should still be able to file a report. */
        BigDecimal latitude,
        BigDecimal longitude,

        @Size(max = 200, message = "Location label must be at most 200 characters")
        String locationLabel,

        @Size(max = 500, message = "Location detail must be at most 500 characters")
        String locationDetail,

        @NotNull(message = "Date is required")
        @PastOrPresent(message = "Date cannot be in the future")
        LocalDate occurredOn,

        /** Category-specific fields: colour, brand, model, serial. */
        Map<String, Object> attributes,

        /**
         * FOUND only. The private detail only the true owner would know —
         * never returned to anyone but the reporter and admins.
         */
        @Size(max = 500, message = "Verification answer must be at most 500 characters")
        String verificationAnswer
) {
}

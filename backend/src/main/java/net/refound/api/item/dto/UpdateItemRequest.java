package net.refound.api.item.dto;

import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;

/**
 * Editing an existing report. Every field is optional — null means "leave it
 * alone".
 *
 * <p>{@code type} and {@code category} are absent deliberately. Changing either
 * after matches have been scored would invalidate them silently; withdraw the
 * report and file a new one instead.
 */
public record UpdateItemRequest(

        @Size(max = 120, message = "Title must be at most 120 characters")
        String title,

        @Size(max = 2000, message = "Description must be at most 2000 characters")
        String description,

        BigDecimal latitude,
        BigDecimal longitude,

        @Size(max = 200, message = "Location label must be at most 200 characters")
        String locationLabel,

        @Size(max = 500, message = "Location detail must be at most 500 characters")
        String locationDetail,

        @PastOrPresent(message = "Date cannot be in the future")
        LocalDate occurredOn,

        Map<String, Object> attributes,

        @Size(max = 500, message = "Verification answer must be at most 500 characters")
        String verificationAnswer
) {
}

package net.refound.api.notification.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import net.refound.api.notification.domain.NotificationType;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * One notification in a user's feed.
 *
 * <p>{@code payload} carries identifiers and titles for the UI to link from —
 * never contact details. Those are released through the claim endpoint, where
 * the approval check lives.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record NotificationResponse(
        UUID id,
        NotificationType type,
        Map<String, Object> payload,
        Instant readAt,
        Instant createdAt
) {
}

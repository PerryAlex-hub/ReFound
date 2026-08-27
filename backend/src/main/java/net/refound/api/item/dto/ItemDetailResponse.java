package net.refound.api.item.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import net.refound.api.item.domain.Category;
import net.refound.api.item.domain.ItemStatus;
import net.refound.api.item.domain.ItemType;
import net.refound.api.user.dto.ContactResponse;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * A single item, shaped by who is asking.
 *
 * <p>The last three fields are populated only for a viewer entitled to them and
 * omitted from the JSON otherwise, so an ordinary browser receives a response
 * with no trace of them:
 *
 * <table border="1">
 *   <caption>Visibility</caption>
 *   <tr><th>Field</th><th>Browsing</th><th>Reporter</th><th>Admin</th></tr>
 *   <tr><td>photos</td><td>only if public</td><td>always</td><td>always</td></tr>
 *   <tr><td>reporter</td><td>never</td><td>own</td><td>always</td></tr>
 *   <tr><td>verificationAnswer</td><td>never</td><td>own</td><td>always</td></tr>
 * </table>
 *
 * <p>Filling these in is {@code ItemMapper}'s job and nowhere else's.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ItemDetailResponse(
        UUID id,
        ItemType type,
        ItemStatus status,
        Category category,
        String title,
        String description,
        BigDecimal latitude,
        BigDecimal longitude,
        String locationLabel,
        String locationDetail,
        LocalDate occurredOn,
        Map<String, Object> attributes,
        List<ItemPhotoResponse> photos,
        Instant createdAt,

        /** True when the viewer owns this report — lets the UI show edit controls. */
        boolean viewerIsReporter,

        // --- restricted ---

        ContactResponse reporter,

        String verificationAnswer
) {
}

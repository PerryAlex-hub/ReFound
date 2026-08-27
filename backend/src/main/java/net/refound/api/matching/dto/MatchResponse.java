package net.refound.api.matching.dto;

import net.refound.api.item.dto.ItemSummaryResponse;
import net.refound.api.matching.domain.MatchStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * A suggested pairing, as shown to the owner of the lost report.
 *
 * <p>{@code candidate} is the ordinary public item view, so nothing restricted
 * leaks through this route — a suggestion is not evidence of ownership, and a
 * high score confers no privileges. The owner still has to file a claim and
 * pass verification like anyone else.
 *
 * @param breakdown per-signal detail, so the UI can explain <em>why</em> this
 *                  was suggested: "same category, found nearby, two days later"
 */
public record MatchResponse(
        UUID id,
        BigDecimal score,
        MatchStatus status,
        Map<String, Object> breakdown,
        UUID lostItemId,
        ItemSummaryResponse candidate,
        Instant createdAt
) {
}

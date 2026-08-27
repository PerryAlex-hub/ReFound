package net.refound.api.admin.dto;

import java.util.Map;

/**
 * Service-level numbers for the admin dashboard.
 *
 * <p>{@code recoveryRatePercent} is the headline: of the items people have
 * handed in, how many actually got back to their owner. It is the honest
 * measure of whether the system works, and the number worth putting in the
 * project report.
 *
 * @param medianReviewHours how long claims wait for a decision. Median rather
 *                          than mean: one claim left over a holiday weekend
 *                          would drag an average into meaninglessness.
 */
public record AdminStatsResponse(
        long totalUsers,
        long suspendedUsers,

        long totalItems,
        long lostReports,
        long foundReports,
        long openItems,
        long returnedItems,
        long expiredItems,

        double recoveryRatePercent,

        Map<String, Long> claimsByStatus,
        Double medianReviewHours,

        long matchesSuggested,
        long matchesDismissed,
        long matchesLeadingToClaims
) {
}

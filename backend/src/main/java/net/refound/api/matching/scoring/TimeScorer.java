package net.refound.api.matching.scoring;

import net.refound.api.item.domain.Item;
import org.springframework.stereotype.Component;

import java.time.temporal.ChronoUnit;

/**
 * How plausible the timing is.
 *
 * <p>Two ideas, one hard and one soft:
 *
 * <ul>
 *   <li><b>Causality.</b> An item cannot be found before it is lost. A found
 *       date earlier than the lost date scores zero — not low, zero — because
 *       the pair is impossible rather than unlikely. (One day of slack is
 *       allowed: people misremember which evening they lost something, and
 *       both dates are self-reported.)</li>
 *   <li><b>Decay.</b> Found the same day is a strong signal. Found six weeks
 *       later is weak but not nothing — things sit in drawers.</li>
 * </ul>
 */
@Component
public class TimeScorer {

    /** Tolerance for self-reported dates being a day out. */
    private static final long SLACK_DAYS = 1;

    /** Beyond this the signal has decayed to its floor. */
    private static final double DECAY_DAYS = 30.0;

    /** Never quite zero: a late find is still a find. */
    private static final double FLOOR = 0.15;

    /**
     * Whether this pair is possible at all.
     *
     * <p>A hard veto rather than a low score. Scoring impossibility as zero is
     * not enough: with category, location and description all agreeing, a pair
     * can clear the threshold on those alone and be suggested despite having
     * been found before it was lost. Some facts should outvote the others.
     */
    public boolean isCausallyPossible(Item lost, Item found) {
        return ChronoUnit.DAYS.between(lost.getOccurredOn(), found.getOccurredOn()) >= -SLACK_DAYS;
    }

    public SignalScore score(Item lost, Item found, double weight) {
        long gap = ChronoUnit.DAYS.between(lost.getOccurredOn(), found.getOccurredOn());

        if (gap < -SLACK_DAYS) {
            return SignalScore.of("time", 0.0, weight);   // found before it was lost
        }

        long effectiveGap = Math.max(0, gap);
        double decayed = 1.0 - (effectiveGap / DECAY_DAYS) * (1.0 - FLOOR);

        return SignalScore.of("time", Math.max(FLOOR, decayed), weight);
    }
}

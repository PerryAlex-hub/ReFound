package net.refound.api.matching;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Tuning for the matcher, bound from {@code app.matching} in application.yml.
 *
 * <p>Configuration rather than constants because the first numbers will be
 * wrong. Once there is real campus data, the weights want adjusting against it
 * — and doing that should not require a code change and a redeploy.
 *
 * @param scoreThreshold minimum combined score before a pair is suggested and
 *                       the owner notified. Too low and people get noise and
 *                       stop reading the emails; too high and real matches are
 *                       never surfaced. 0.55 is a starting guess.
 */
@ConfigurationProperties(prefix = "app.matching")
public record MatchingProperties(double scoreThreshold, Weights weights) {

    /**
     * Relative importance of each signal. They need not sum to 1: signals that
     * cannot be evaluated for a given pair are dropped and the rest
     * renormalised, so what matters is their ratio to each other.
     */
    public record Weights(
            double category,
            double time,
            double location,
            double text,
            double attributes
    ) {
    }
}

package net.refound.api.matching.scoring;

/**
 * One signal's contribution to a match score.
 *
 * @param name      identifier used in the stored breakdown
 * @param value     0.0 to 1.0
 * @param weight    relative importance, from configuration
 * @param available false when this signal cannot be judged for this pair — for
 *                  instance neither report carries coordinates. An unavailable
 *                  signal is dropped and the remaining weights renormalised,
 *                  rather than scored zero: "we do not know" is not the same as
 *                  "they do not match", and treating it as such would bury
 *                  every report filed without a map pin.
 */
public record SignalScore(String name, double value, double weight, boolean available) {

    public static SignalScore of(String name, double value, double weight) {
        return new SignalScore(name, clamp(value), weight, true);
    }

    public static SignalScore unavailable(String name, double weight) {
        return new SignalScore(name, 0.0, weight, false);
    }

    public double weighted() {
        return value * weight;
    }

    private static double clamp(double value) {
        return Math.max(0.0, Math.min(1.0, value));
    }
}

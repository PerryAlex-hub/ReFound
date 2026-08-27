package net.refound.api.matching.scoring;

import lombok.RequiredArgsConstructor;
import net.refound.api.item.domain.Item;
import net.refound.api.matching.MatchingProperties;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Combines the individual signals into one score for a lost/found pair.
 *
 * <p>The combination is a weighted mean over the signals that could actually be
 * judged:
 *
 * <pre>
 *   score = Σ(weight · value) / Σ(weight)     — available signals only
 * </pre>
 *
 * <p>Renormalising rather than scoring missing signals zero is the important
 * part. A pair with no coordinates on either side should be judged on category,
 * timing and description alone, and be able to reach a high score on those. The
 * naive alternative caps every such pair at 80% of the maximum and quietly
 * buries every report filed without a map pin — which is most of them.
 *
 * <p>Every score keeps its {@link Breakdown}, so a suggestion can be explained
 * afterwards and the weights tuned against real data rather than intuition.
 */
@Component
@RequiredArgsConstructor
public class MatchScorer {

    private final MatchingProperties properties;
    private final TimeScorer timeScorer;
    private final LocationScorer locationScorer;
    private final AttributeScorer attributeScorer;

    /**
     * @param textSimilarity trigram similarity of the two descriptions,
     *                       computed by Postgres — see
     *                       {@code ItemRepository.findMatchCandidatesWithSimilarity}
     */
    public Breakdown score(Item lost, Item found, double textSimilarity) {
        var weights = properties.weights();

        // A veto, applied before anything is weighed. An item cannot be found
        // before it is lost, and no amount of agreement elsewhere makes that
        // pair worth showing to anyone.
        if (!timeScorer.isCausallyPossible(lost, found)) {
            return new Breakdown(
                    BigDecimal.ZERO.setScale(3, RoundingMode.HALF_UP),
                    Map.of("vetoed", "found before it was lost"),
                    List.of());
        }

        List<SignalScore> signals = List.of(
                // Always 1.0: candidates are filtered to the same category in
                // SQL. Kept in the breakdown so the stored explanation shows
                // every signal that went into the decision.
                SignalScore.of("category", 1.0, weights.category()),
                timeScorer.score(lost, found, weights.time()),
                locationScorer.score(lost, found, weights.location()),
                SignalScore.of("text", textSimilarity, weights.text()),
                attributeScorer.score(lost, found, weights.attributes()));

        double totalWeight = signals.stream()
                .filter(SignalScore::available)
                .mapToDouble(SignalScore::weight)
                .sum();

        double weightedSum = signals.stream()
                .filter(SignalScore::available)
                .mapToDouble(SignalScore::weighted)
                .sum();

        double score = totalWeight == 0 ? 0.0 : weightedSum / totalWeight;

        return new Breakdown(round(score), explain(signals), signals);
    }

    public boolean meetsThreshold(Breakdown breakdown) {
        return breakdown.score().doubleValue() >= properties.scoreThreshold();
    }

    /** Stored as jsonb on the match row. */
    private Map<String, Object> explain(List<SignalScore> signals) {
        Map<String, Object> explanation = new LinkedHashMap<>();
        for (SignalScore signal : signals) {
            explanation.put(signal.name(), signal.available()
                    ? Map.of("value", round(signal.value()), "weight", signal.weight())
                    : Map.of("available", false, "weight", signal.weight()));
        }
        return explanation;
    }

    /** Three decimals — the column is numeric(4,3). */
    private BigDecimal round(double value) {
        return BigDecimal.valueOf(value).setScale(3, RoundingMode.HALF_UP);
    }

    /**
     * @param score     0.000 to 1.000
     * @param breakdown per-signal detail, persisted for explainability
     * @param signals   the raw scores, handy in tests
     */
    public record Breakdown(BigDecimal score, Map<String, Object> breakdown, List<SignalScore> signals) {
    }
}

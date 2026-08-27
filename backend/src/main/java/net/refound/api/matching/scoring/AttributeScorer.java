package net.refound.api.matching.scoring;

import net.refound.api.item.domain.Item;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Agreement between the structured attributes both reports happen to share.
 *
 * <p>Attributes are the category-specific extras — colour, brand, model,
 * serial. Two reports rarely fill in the same set, so only the keys present on
 * both are considered, and the signal is unavailable when there is no overlap
 * at all. Scoring an absent key as a mismatch would punish the many people who
 * simply left the optional fields blank.
 *
 * <p>A serial number agreeing is worth far more than a colour agreeing, and
 * this does not yet know that. Weighting individual keys is the obvious next
 * refinement.
 */
@Component
public class AttributeScorer {

    public SignalScore score(Item lost, Item found, double weight) {
        Map<String, Object> lostAttributes = lost.getAttributes();
        Map<String, Object> foundAttributes = found.getAttributes();

        if (lostAttributes.isEmpty() || foundAttributes.isEmpty()) {
            return SignalScore.unavailable("attributes", weight);
        }

        Set<String> sharedKeys = lostAttributes.keySet().stream()
                .filter(foundAttributes::containsKey)
                .collect(Collectors.toSet());

        if (sharedKeys.isEmpty()) {
            return SignalScore.unavailable("attributes", weight);
        }

        long agreeing = sharedKeys.stream()
                .filter(key -> matches(lostAttributes.get(key), foundAttributes.get(key)))
                .count();

        return SignalScore.of("attributes", (double) agreeing / sharedKeys.size(), weight);
    }

    /** Compared as trimmed, case-insensitive text: "Black" and "black" agree. */
    private boolean matches(Object left, Object right) {
        if (left == null || right == null) {
            return Objects.equals(left, right);
        }
        return left.toString().trim().equalsIgnoreCase(right.toString().trim());
    }
}

package net.refound.api.matching.scoring;

import net.refound.api.item.domain.Item;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

/**
 * How close together the two reports were pinned.
 *
 * <p>Distance is computed with the haversine formula — great-circle distance on
 * a sphere. Over a campus a flat approximation would do, but haversine costs
 * nothing and cannot embarrass us if the system is ever used somewhere larger.
 *
 * <p>Decay is deliberately generous at the short end. People remember roughly
 * where they lost something, finders pin roughly where they picked it up, and
 * items get carried a little way before anyone notices them. A hundred metres
 * apart is still a good match.
 *
 * <p>When either report has no coordinates the signal is unavailable rather
 * than zero — plenty of genuine reports say only "somewhere on campus".
 */
@Component
public class LocationScorer {

    private static final double EARTH_RADIUS_METRES = 6_371_000;

    public SignalScore score(Item lost, Item found, double weight) {
        if (!lost.hasCoordinates() || !found.hasCoordinates()) {
            return SignalScore.unavailable("location", weight);
        }

        double metres = distanceMetres(
                lost.getLatitude(), lost.getLongitude(),
                found.getLatitude(), found.getLongitude());

        return SignalScore.of("location", decay(metres), weight);
    }

    /** Piecewise rather than exponential: easier to reason about and to tune. */
    private double decay(double metres) {
        if (metres <= 50) return 1.00;     // same spot
        if (metres <= 150) return 0.90;    // same building
        if (metres <= 400) return 0.70;    // same faculty area
        if (metres <= 1000) return 0.40;   // same side of campus
        if (metres <= 3000) return 0.15;   // same campus
        return 0.05;                       // different place entirely
    }

    double distanceMetres(BigDecimal lat1, BigDecimal lon1, BigDecimal lat2, BigDecimal lon2) {
        double phi1 = Math.toRadians(lat1.doubleValue());
        double phi2 = Math.toRadians(lat2.doubleValue());
        double deltaPhi = Math.toRadians(lat2.doubleValue() - lat1.doubleValue());
        double deltaLambda = Math.toRadians(lon2.doubleValue() - lon1.doubleValue());

        double a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2)
                + Math.cos(phi1) * Math.cos(phi2)
                * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

        return EARTH_RADIUS_METRES * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
}

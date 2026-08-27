package net.refound.api.item.repository;

import jakarta.persistence.criteria.Predicate;
import net.refound.api.item.domain.Item;
import net.refound.api.item.dto.ItemSearchCriteria;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

/**
 * Builds the browse query from whichever filters were supplied.
 *
 * <p>Specifications rather than a hand-written SQL string: the filters are
 * genuinely optional and in any combination, and string-concatenating a query
 * from ten nullable parameters is how injection bugs and syntax errors get in.
 * Everything here is parameterised by the Criteria API.
 */
public final class ItemSpecifications {

    private ItemSpecifications() {
    }

    public static Specification<Item> matching(ItemSearchCriteria criteria) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Moderated items never appear in browse, for anyone.
            predicates.add(cb.isFalse(root.get("hidden")));

            if (criteria.type() != null) {
                predicates.add(cb.equal(root.get("type"), criteria.type()));
            }
            if (criteria.category() != null) {
                predicates.add(cb.equal(root.get("category"), criteria.category()));
            }

            if (criteria.status() != null) {
                predicates.add(cb.equal(root.get("status"), criteria.status()));
            } else {
                // Default view is "still findable" — hide returned, expired and
                // withdrawn reports rather than cluttering the list with items
                // nobody can act on.
                predicates.add(root.get("status").in(
                        net.refound.api.item.domain.ItemStatus.OPEN,
                        net.refound.api.item.domain.ItemStatus.CLAIM_PENDING));
            }

            if (criteria.dateFrom() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("occurredOn"), criteria.dateFrom()));
            }
            if (criteria.dateTo() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("occurredOn"), criteria.dateTo()));
            }

            if (criteria.hasQuery()) {
                String pattern = "%" + criteria.q().toLowerCase().trim() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("title")), pattern),
                        cb.like(cb.lower(root.get("description")), pattern)));
            }

            // Map viewport. Applied only when the whole rectangle is present;
            // items with no coordinates simply fall outside it.
            if (criteria.hasBounds()) {
                predicates.add(cb.between(root.get("latitude"), criteria.south(), criteria.north()));
                predicates.add(cb.between(root.get("longitude"), criteria.west(), criteria.east()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}

package net.refound.api.item.repository;

import net.refound.api.item.domain.Item;
import net.refound.api.item.domain.ItemStatus;
import net.refound.api.item.domain.ItemType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * {@code JpaSpecificationExecutor} supplies {@code findAll(Specification,
 * Pageable)}, which is how browse composes its optional filters — see
 * {@link ItemSpecifications}.
 */
public interface ItemRepository extends JpaRepository<Item, UUID>,
        JpaSpecificationExecutor<Item> {

    Page<Item> findByReporterIdOrderByCreatedAtDesc(UUID reporterId, Pageable pageable);

    /**
     * Candidate pool for the matcher: open items of the opposite type in the
     * same category, that could plausibly be the same object.
     *
     * <p>Category is filtered in SQL rather than scored in Java — a mismatch
     * contributes nothing, so there is no reason to load those rows at all.
     */
    @Query("""
            select i from Item i
             where i.type = :type
               and i.status = :status
               and i.category = :category
               and i.hidden = false
               and i.id <> :excludeId
            """)
    List<Item> findMatchCandidates(@Param("type") ItemType type,
                                   @Param("status") ItemStatus status,
                                   @Param("category") net.refound.api.item.domain.Category category,
                                   @Param("excludeId") UUID excludeId);

    /** Driven by the partial index on (expires_at) where status = 'OPEN'. */
    @Query("select i from Item i where i.status = 'OPEN' and i.expiresAt < :now")
    List<Item> findExpired(@Param("now") Instant now);

    /**
     * Candidates for the matcher, with their text similarity already computed.
     *
     * <p>Native rather than JPQL for one reason: {@code similarity()} is a
     * pg_trgm function with no JPQL equivalent. Letting Postgres do the trigram
     * work means we use the same battle-tested implementation the GIN indexes
     * are built on, instead of reimplementing it in Java.
     *
     * <p>Category is filtered here rather than scored later — a phone will
     * never be a shoe, so there is no reason to load the row at all.
     *
     * <p>{@code greatest(title, description)} takes whichever field matches
     * better. Someone writing "black iPhone" in the title and nothing else
     * should not be penalised against someone who filled in both.
     */
    @Query(value = """
            select i.id            as itemId,
                   greatest(
                       similarity(i.title, :title),
                       similarity(coalesce(i.description, ''), coalesce(:description, ''))
                   )               as textSimilarity
              from item i
             where i.type = :type
               and i.category = :category
               and i.status in ('OPEN', 'CLAIM_PENDING')
               and i.hidden = false
               and i.id <> :excludeId
            """, nativeQuery = true)
    List<MatchCandidateRow> findMatchCandidatesWithSimilarity(
            @Param("type") String oppositeType,
            @Param("category") String category,
            @Param("title") String title,
            @Param("description") String description,
            @Param("excludeId") UUID excludeId);

    /** Projection for {@link #findMatchCandidatesWithSimilarity}. */
    interface MatchCandidateRow {
        UUID getItemId();

        double getTextSimilarity();
    }

    /** Open reports past their expiry date, for the daily sweep. */
    @Query("select i from Item i where i.status = 'OPEN' and i.expiresAt < :now")
    List<Item> findExpiredOpenItems(@Param("now") Instant now);

    /** Open reports nearing expiry whose reporter has not been warned yet. */
    @Query("""
            select i from Item i
             where i.status = 'OPEN'
               and i.expiryWarnedAt is null
               and i.expiresAt between :now and :warnBefore
            """)
    List<Item> findItemsNeedingExpiryWarning(@Param("now") Instant now,
                                             @Param("warnBefore") Instant warnBefore);

    long countByType(ItemType type);

    long countByStatus(ItemStatus status);
}

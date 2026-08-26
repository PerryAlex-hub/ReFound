package net.refound.api.item.repository;

import net.refound.api.item.domain.Item;
import net.refound.api.item.domain.ItemStatus;
import net.refound.api.item.domain.ItemType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface ItemRepository extends JpaRepository<Item, UUID> {

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

    long countByStatus(ItemStatus status);
}

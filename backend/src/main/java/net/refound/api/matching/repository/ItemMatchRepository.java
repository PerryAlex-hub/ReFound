package net.refound.api.matching.repository;

import net.refound.api.matching.domain.ItemMatch;
import net.refound.api.matching.domain.MatchStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ItemMatchRepository extends JpaRepository<ItemMatch, UUID> {

    long countByStatus(MatchStatus status);

    /** A pair is scored once; a rescore updates the existing row. */
    Optional<ItemMatch> findByLostItemIdAndFoundItemId(UUID lostItemId, UUID foundItemId);

    /** "Best candidates for my lost item" — how the dashboard reads it. */
    @Query("""
            select m from ItemMatch m
             where m.lostItem.id = :lostItemId
               and m.status = 'SUGGESTED'
             order by m.score desc
            """)
    List<ItemMatch> findSuggestionsForLostItem(@Param("lostItemId") UUID lostItemId);

    @Query("""
            select m from ItemMatch m
             where m.lostItem.reporter.id = :userId
               and m.status = 'SUGGESTED'
             order by m.score desc
            """)
    List<ItemMatch> findSuggestionsForUser(@Param("userId") UUID userId);
}

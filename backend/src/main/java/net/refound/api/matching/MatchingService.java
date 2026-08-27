package net.refound.api.matching;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.refound.api.auth.AuthPrincipal;
import net.refound.api.common.exception.NotFoundException;
import net.refound.api.item.domain.Item;
import net.refound.api.item.domain.ItemPhoto;
import net.refound.api.item.domain.ItemType;
import net.refound.api.item.mapper.ItemMapper;
import net.refound.api.item.repository.ItemPhotoRepository;
import net.refound.api.item.repository.ItemRepository;
import net.refound.api.matching.domain.ItemMatch;
import net.refound.api.matching.domain.MatchStatus;
import net.refound.api.matching.dto.MatchResponse;
import net.refound.api.matching.repository.ItemMatchRepository;
import net.refound.api.matching.scoring.MatchScorer;
import net.refound.api.notification.NotificationService;
import net.refound.api.notification.domain.NotificationType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Finds likely pairings between lost and found reports.
 *
 * <p>This is what separates the system from a searchable notice board. Nobody
 * has to spot their own match: when a report is filed, it is scored against
 * every open report of the opposite type in the same category, and anything
 * above the threshold is surfaced to the person who lost the item.
 *
 * <p><b>Only the loser is notified.</b> The finder is not, deliberately. They
 * have no stake in a weak suggestion, and a finder who gets pinged about every
 * black umbrella in the database stops reading the notifications — and finders
 * are the scarce, unmotivated half of this system.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MatchingService {

    private final ItemRepository itemRepository;
    private final ItemPhotoRepository itemPhotoRepository;
    private final ItemMatchRepository itemMatchRepository;
    private final ItemMapper itemMapper;
    private final MatchScorer matchScorer;
    private final NotificationService notificationService;

    // ------------------------------------------------------------------
    // Scanning
    // ------------------------------------------------------------------

    /**
     * Scores a newly filed or edited report against the opposite pool.
     *
     * <p>Joins the caller's transaction: a match that references an item whose
     * creation was rolled back would be a dangling suggestion.
     */
    @Transactional(propagation = Propagation.MANDATORY)
    public int scanFor(Item item) {
        ItemType opposite = item.getType() == ItemType.LOST ? ItemType.FOUND : ItemType.LOST;

        List<ItemRepository.MatchCandidateRow> candidates =
                itemRepository.findMatchCandidatesWithSimilarity(
                        opposite.name(),
                        item.getCategory().name(),
                        item.getTitle(),
                        item.getDescription(),
                        item.getId());

        int suggested = 0;
        for (var candidate : candidates) {
            Item other = itemRepository.findById(candidate.getItemId()).orElse(null);
            if (other == null) {
                continue;
            }

            Item lost = item.getType() == ItemType.LOST ? item : other;
            Item found = item.getType() == ItemType.LOST ? other : item;

            var breakdown = matchScorer.score(lost, found, candidate.getTextSimilarity());
            if (!matchScorer.meetsThreshold(breakdown)) {
                continue;
            }

            if (upsert(lost, found, breakdown)) {
                suggested++;
            }
        }

        if (suggested > 0) {
            log.info("Matching: {} suggestion(s) for {} item {}", suggested, item.getType(), item.getId());
        }
        return suggested;
    }

    /**
     * @return true if this is a new suggestion worth notifying about. A rescore
     *         of an existing pair updates the row silently — the owner has
     *         already been told about this candidate, and telling them again
     *         because the reporter fixed a typo would be noise. A pair the
     *         owner has dismissed stays dismissed.
     */
    private boolean upsert(Item lost, Item found, MatchScorer.Breakdown breakdown) {
        var existing = itemMatchRepository.findByLostItemIdAndFoundItemId(lost.getId(), found.getId());

        if (existing.isPresent()) {
            ItemMatch match = existing.get();
            match.setScore(breakdown.score());
            match.setBreakdown(breakdown.breakdown());
            return false;
        }

        ItemMatch match = new ItemMatch();
        match.setLostItem(lost);
        match.setFoundItem(found);
        match.setScore(breakdown.score());
        match.setBreakdown(breakdown.breakdown());
        match.setStatus(MatchStatus.SUGGESTED);
        itemMatchRepository.save(match);

        notificationService.notify(lost.getReporter(), NotificationType.MATCH_FOUND,
                Map.of("lostItemId", lost.getId().toString(),
                        "foundItemId", found.getId().toString(),
                        "foundItemTitle", found.getTitle(),
                        "score", breakdown.score().toString()));

        return true;
    }

    // ------------------------------------------------------------------
    // Reading
    // ------------------------------------------------------------------

    /** Every open suggestion across all of the caller's lost reports. */
    @Transactional(readOnly = true)
    public List<MatchResponse> myMatches(AuthPrincipal viewer) {
        return toResponses(itemMatchRepository.findSuggestionsForUser(viewer.id()));
    }

    /** Suggestions for one lost report. Reporter only. */
    @Transactional(readOnly = true)
    public List<MatchResponse> matchesForItem(UUID lostItemId, AuthPrincipal viewer) {
        Item lostItem = itemRepository.findById(lostItemId)
                .orElseThrow(() -> NotFoundException.of("Item"));

        if (!lostItem.getReporter().getId().equals(viewer.id()) && !viewer.isAdmin()) {
            throw NotFoundException.of("Item");
        }

        return toResponses(itemMatchRepository.findSuggestionsForLostItem(lostItemId));
    }

    /** "That is not mine" — removes the suggestion without touching the item. */
    @Transactional
    public void dismiss(UUID matchId, AuthPrincipal viewer) {
        ItemMatch match = itemMatchRepository.findById(matchId)
                .orElseThrow(() -> NotFoundException.of("Match"));

        if (!match.getLostItem().getReporter().getId().equals(viewer.id())) {
            throw NotFoundException.of("Match");
        }

        match.setStatus(MatchStatus.DISMISSED);
        log.debug("User {} dismissed match {}", viewer.id(), matchId);
    }

    private List<MatchResponse> toResponses(List<ItemMatch> matches) {
        if (matches.isEmpty()) {
            return List.of();
        }

        // Photos for every candidate in one query rather than one per match.
        List<UUID> foundItemIds = matches.stream().map(m -> m.getFoundItem().getId()).toList();
        Map<UUID, List<ItemPhoto>> photos = itemPhotoRepository
                .findByItemIdInOrderByPositionAsc(foundItemIds).stream()
                .collect(java.util.stream.Collectors.groupingBy(photo -> photo.getItem().getId()));

        return matches.stream()
                .map(match -> new MatchResponse(
                        match.getId(),
                        match.getScore(),
                        match.getStatus(),
                        match.getBreakdown(),
                        match.getLostItem().getId(),
                        itemMapper.toSummary(match.getFoundItem(),
                                photos.getOrDefault(match.getFoundItem().getId(), List.of())),
                        match.getCreatedAt()))
                .toList();
    }
}

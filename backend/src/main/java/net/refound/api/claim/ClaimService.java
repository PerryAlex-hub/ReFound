package net.refound.api.claim;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.refound.api.auth.AuthPrincipal;
import net.refound.api.claim.domain.Claim;
import net.refound.api.claim.domain.ClaimStatus;
import net.refound.api.claim.dto.AdminClaimReviewResponse;
import net.refound.api.claim.dto.ClaimDetailResponse;
import net.refound.api.claim.dto.ClaimSummaryResponse;
import net.refound.api.claim.dto.CreateClaimRequest;
import net.refound.api.claim.mapper.ClaimMapper;
import net.refound.api.claim.repository.ClaimRepository;
import net.refound.api.common.audit.AuditService;
import net.refound.api.common.exception.BusinessRuleException;
import net.refound.api.common.exception.ConflictException;
import net.refound.api.common.exception.NotFoundException;
import net.refound.api.common.response.PageResponse;
import net.refound.api.item.domain.Item;
import net.refound.api.item.domain.ItemStatus;
import net.refound.api.item.domain.ItemType;
import net.refound.api.item.repository.ItemRepository;
import net.refound.api.notification.NotificationService;
import net.refound.api.notification.domain.NotificationType;
import net.refound.api.user.UserService;
import net.refound.api.user.domain.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Ownership claims and their review.
 *
 * <p>This is where the design earns its keep. A claim is one person asserting
 * that a found item is theirs; an administrator decides by comparing what the
 * claimant says against the private detail the finder recorded. Only on
 * approval does anyone's phone number change hands.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ClaimService {

    private final ClaimRepository claimRepository;
    private final ItemRepository itemRepository;
    private final ClaimMapper claimMapper;
    private final UserService userService;
    private final AuditService auditService;
    private final NotificationService notificationService;

    // ------------------------------------------------------------------
    // Submitting a claim
    // ------------------------------------------------------------------

    @Transactional
    public ClaimDetailResponse create(AuthPrincipal viewer, CreateClaimRequest request) {
        Item foundItem = itemRepository.findById(request.foundItemId())
                .orElseThrow(() -> NotFoundException.of("Item"));

        validateClaimable(foundItem, viewer);

        if (claimRepository.hasOpenClaim(foundItem.getId(), viewer.id())) {
            throw new ConflictException("You already have a claim under review for this item");
        }

        User claimant = userService.getById(viewer.id());

        Claim claim = new Claim();
        claim.setFoundItem(foundItem);
        claim.setClaimant(claimant);
        claim.setDescription(request.description().trim());
        claim.setLostContext(request.lostContext() == null ? null : request.lostContext().trim());
        claim.setStatus(ClaimStatus.PENDING);

        if (request.lostItemId() != null) {
            claim.setLostItem(resolveOwnLostItem(request.lostItemId(), viewer));
        }

        claimRepository.save(claim);

        // The item stays claimable: several people may claim one black
        // umbrella, and the admin picks at most one.
        foundItem.setStatus(ItemStatus.CLAIM_PENDING);

        auditService.record(claimant, "CLAIM", claim.getId(), "CLAIM_SUBMITTED",
                Map.of("itemId", foundItem.getId().toString()));

        notificationService.notify(foundItem.getReporter(), NotificationType.CLAIM_SUBMITTED,
                Map.of("itemId", foundItem.getId().toString(),
                        "itemTitle", foundItem.getTitle()));

        log.info("User {} claimed item {} (claim {})", viewer.id(), foundItem.getId(), claim.getId());
        return claimMapper.toDetail(claim, viewer);
    }

    private void validateClaimable(Item item, AuthPrincipal viewer) {
        if (item.isHidden()) {
            throw NotFoundException.of("Item");
        }
        if (item.getType() != ItemType.FOUND) {
            throw new BusinessRuleException("You can only claim an item someone has found");
        }
        if (item.getReporter().getId().equals(viewer.id())) {
            throw new BusinessRuleException("You cannot claim an item you reported yourself");
        }
        if (item.getStatus() != ItemStatus.OPEN && item.getStatus() != ItemStatus.CLAIM_PENDING) {
            throw new BusinessRuleException(
                    "This item is no longer available to claim (" + item.getStatus() + ")");
        }
    }

    /** The claimant may link only their own lost report, and only a LOST one. */
    private Item resolveOwnLostItem(UUID lostItemId, AuthPrincipal viewer) {
        Item lostItem = itemRepository.findById(lostItemId)
                .orElseThrow(() -> NotFoundException.of("Lost report"));

        if (!lostItem.getReporter().getId().equals(viewer.id())) {
            throw new BusinessRuleException("That lost report is not yours");
        }
        if (lostItem.getType() != ItemType.LOST) {
            throw new BusinessRuleException("The linked report must be a lost report");
        }
        return lostItem;
    }

    // ------------------------------------------------------------------
    // Reading
    // ------------------------------------------------------------------

    /** Visible to the claimant, the finder, and administrators — nobody else. */
    @Transactional(readOnly = true)
    public ClaimDetailResponse getDetail(UUID claimId, AuthPrincipal viewer) {
        return claimMapper.toDetail(getParticipantClaim(claimId, viewer), viewer);
    }

    @Transactional(readOnly = true)
    public PageResponse<ClaimSummaryResponse> listMine(AuthPrincipal viewer, Pageable pageable) {
        Page<Claim> page = claimRepository.findByClaimantIdOrderByCreatedAtDesc(viewer.id(), pageable);
        return PageResponse.from(page, claimMapper::toSummary);
    }

    // ------------------------------------------------------------------
    // Claimant actions
    // ------------------------------------------------------------------

    @Transactional
    public ClaimDetailResponse respondToInfoRequest(UUID claimId, String answer, AuthPrincipal viewer) {
        Claim claim = getParticipantClaim(claimId, viewer);

        if (!claim.getClaimant().getId().equals(viewer.id())) {
            throw new BusinessRuleException("Only the claimant can answer this question");
        }
        if (claim.getStatus() != ClaimStatus.AWAITING_INFO) {
            throw new BusinessRuleException("This claim is not waiting on further information");
        }

        claim.setInfoResponse(answer.trim());
        claim.setStatus(ClaimStatus.PENDING);   // back into the review queue

        auditService.record(claim.getClaimant(), "CLAIM", claim.getId(), "CLAIM_INFO_PROVIDED");
        return claimMapper.toDetail(claim, viewer);
    }

    @Transactional
    public void withdraw(UUID claimId, AuthPrincipal viewer) {
        Claim claim = getParticipantClaim(claimId, viewer);

        if (!claim.getClaimant().getId().equals(viewer.id())) {
            throw new BusinessRuleException("Only the claimant can withdraw this claim");
        }
        if (!claim.isOpen()) {
            throw new BusinessRuleException("Only a claim still under review can be withdrawn");
        }

        claim.setStatus(ClaimStatus.WITHDRAWN);
        releaseItemIfNoOpenClaims(claim);

        auditService.record(claim.getClaimant(), "CLAIM", claim.getId(), "CLAIM_WITHDRAWN");
    }

    /**
     * Either party confirming the item actually changed hands.
     *
     * <p>Both must confirm before the item is marked returned — one side saying
     * so is a claim, not a fact.
     */
    @Transactional
    public ClaimDetailResponse confirmHandover(UUID claimId, AuthPrincipal viewer) {
        Claim claim = getParticipantClaim(claimId, viewer);

        if (claim.getStatus() != ClaimStatus.APPROVED) {
            throw new BusinessRuleException("Handover can only be confirmed on an approved claim");
        }

        Item foundItem = claim.getFoundItem();
        Instant now = Instant.now();

        if (claim.getClaimant().getId().equals(viewer.id())) {
            claim.setClaimantConfirmedAt(now);
        } else if (foundItem.getReporter().getId().equals(viewer.id())) {
            claim.setFinderConfirmedAt(now);
        } else {
            throw new BusinessRuleException("Only the claimant or the finder can confirm the handover");
        }

        if (claim.isHandoverConfirmed()) {
            foundItem.setStatus(ItemStatus.RETURNED);
            if (claim.getLostItem() != null) {
                claim.getLostItem().setStatus(ItemStatus.RETURNED);
            }
            auditService.record(null, "CLAIM", claim.getId(), "HANDOVER_COMPLETED");
            log.info("Item {} returned to its owner (claim {})", foundItem.getId(), claim.getId());
        }

        return claimMapper.toDetail(claim, viewer);
    }

    // ------------------------------------------------------------------
    // Administrator review
    // ------------------------------------------------------------------

    @Transactional(readOnly = true)
    public PageResponse<ClaimSummaryResponse> queue(ClaimStatus status, Pageable pageable) {
        ClaimStatus target = status == null ? ClaimStatus.PENDING : status;
        Page<Claim> page = claimRepository.findByStatusOrderByCreatedAtAsc(target, pageable);
        return PageResponse.from(page, claimMapper::toSummary);
    }

    @Transactional(readOnly = true)
    public AdminClaimReviewResponse getForReview(UUID claimId) {
        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> NotFoundException.of("Claim"));

        int competing = claimRepository
                .findOtherOpenClaims(claim.getFoundItem().getId(), claim.getId()).size();

        return claimMapper.toAdminReview(claim, competing);
    }

    @Transactional
    public AdminClaimReviewResponse requestMoreInfo(UUID claimId, String question, AuthPrincipal admin) {
        Claim claim = requireDecidable(claimId);

        claim.setStatus(ClaimStatus.AWAITING_INFO);
        claim.setInfoRequest(question.trim());

        auditService.record(userService.getById(admin.id()), "CLAIM", claim.getId(),
                "CLAIM_INFO_REQUESTED", Map.of("question", question.trim()));

        notificationService.notify(claim.getClaimant(), NotificationType.CLAIM_INFO_REQUESTED,
                Map.of("claimId", claim.getId().toString(), "question", question.trim()));

        return claimMapper.toAdminReview(claim, 0);
    }

    /**
     * Approves a claim and releases contact details.
     *
     * <p>One transaction, all of it or none: mark the claim approved, move both
     * items to MATCHED, reject every competing claim with a reason, record the
     * audit trail, and notify both parties. A partial failure here could leave
     * an item matched with no approved claim, or two approved claims on one
     * item.
     */
    @Transactional
    public AdminClaimReviewResponse approve(UUID claimId, String reason, AuthPrincipal adminPrincipal) {
        Claim claim = requireDecidable(claimId);
        User admin = userService.getById(adminPrincipal.id());
        Item foundItem = claim.getFoundItem();
        Instant now = Instant.now();

        claim.setStatus(ClaimStatus.APPROVED);
        claim.setReviewedBy(admin);
        claim.setDecisionReason(reason.trim());
        claim.setDecidedAt(now);

        foundItem.setStatus(ItemStatus.MATCHED);
        if (claim.getLostItem() != null) {
            claim.getLostItem().setStatus(ItemStatus.MATCHED);
        }

        // At most one claim per item can be approved.
        List<Claim> competing = claimRepository.findOtherOpenClaims(foundItem.getId(), claim.getId());
        for (Claim other : competing) {
            other.setStatus(ClaimStatus.REJECTED);
            other.setReviewedBy(admin);
            other.setDecidedAt(now);
            other.setDecisionReason("Another claimant verified ownership of this item");
            notificationService.notify(other.getClaimant(), NotificationType.CLAIM_REJECTED,
                    Map.of("claimId", other.getId().toString()));
        }

        auditService.record(admin, "CLAIM", claim.getId(), "CLAIM_APPROVED",
                Map.of("itemId", foundItem.getId().toString(),
                        "reason", reason.trim(),
                        "competingClaimsRejected", competing.size()));

        // Logged separately: releasing someone's phone number is its own event,
        // and the one most likely to be questioned later.
        auditService.record(admin, "CLAIM", claim.getId(), "CONTACT_RELEASED",
                Map.of("finderId", foundItem.getReporter().getId().toString(),
                        "claimantId", claim.getClaimant().getId().toString()));

        // Both sides: the finder needs to reach the owner as much as the reverse.
        notificationService.notify(claim.getClaimant(), NotificationType.CLAIM_APPROVED,
                Map.of("claimId", claim.getId().toString(), "role", "CLAIMANT"));
        notificationService.notify(foundItem.getReporter(), NotificationType.CLAIM_APPROVED,
                Map.of("claimId", claim.getId().toString(), "role", "FINDER"));

        log.info("Admin {} approved claim {} on item {}, rejecting {} competing claim(s)",
                adminPrincipal.id(), claim.getId(), foundItem.getId(), competing.size());

        return claimMapper.toAdminReview(claim, 0);
    }

    @Transactional
    public AdminClaimReviewResponse reject(UUID claimId, String reason, AuthPrincipal adminPrincipal) {
        Claim claim = requireDecidable(claimId);
        User admin = userService.getById(adminPrincipal.id());

        claim.setStatus(ClaimStatus.REJECTED);
        claim.setReviewedBy(admin);
        claim.setDecisionReason(reason.trim());
        claim.setDecidedAt(Instant.now());

        releaseItemIfNoOpenClaims(claim);

        auditService.record(admin, "CLAIM", claim.getId(), "CLAIM_REJECTED",
                Map.of("reason", reason.trim()));

        notificationService.notify(claim.getClaimant(), NotificationType.CLAIM_REJECTED,
                Map.of("claimId", claim.getId().toString(), "reason", reason.trim()));

        return claimMapper.toAdminReview(claim, 0);
    }

    // ------------------------------------------------------------------
    // Shared
    // ------------------------------------------------------------------

    /**
     * A claim the viewer participates in — claimant, finder, or admin.
     *
     * <p>Not-found rather than forbidden for everyone else: claim ids are
     * opaque, and confirming one exists tells an outsider something about a
     * dispute they have no part in.
     */
    private Claim getParticipantClaim(UUID claimId, AuthPrincipal viewer) {
        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> NotFoundException.of("Claim"));

        boolean participant = claim.getClaimant().getId().equals(viewer.id())
                || claim.getFoundItem().getReporter().getId().equals(viewer.id());

        if (!participant && !viewer.isAdmin()) {
            throw NotFoundException.of("Claim");
        }
        return claim;
    }

    private Claim requireDecidable(UUID claimId) {
        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> NotFoundException.of("Claim"));

        if (!claim.isOpen()) {
            throw new BusinessRuleException(
                    "This claim has already been " + claim.getStatus().name().toLowerCase());
        }
        return claim;
    }

    /**
     * Returns the item to OPEN once nothing is pending on it, so it reappears
     * in browse instead of being stranded in CLAIM_PENDING forever.
     */
    private void releaseItemIfNoOpenClaims(Claim claim) {
        Item item = claim.getFoundItem();
        if (item.getStatus() != ItemStatus.CLAIM_PENDING) {
            return;
        }
        boolean othersOpen = !claimRepository
                .findOtherOpenClaims(item.getId(), claim.getId()).isEmpty();
        if (!othersOpen) {
            item.setStatus(ItemStatus.OPEN);
        }
    }
}

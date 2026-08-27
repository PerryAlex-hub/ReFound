package net.refound.api.claim.mapper;

import lombok.RequiredArgsConstructor;
import net.refound.api.auth.AuthPrincipal;
import net.refound.api.claim.domain.Claim;
import net.refound.api.claim.domain.ClaimEvidence;
import net.refound.api.claim.domain.ClaimStatus;
import net.refound.api.claim.dto.AdminClaimReviewResponse;
import net.refound.api.claim.dto.ClaimDetailResponse;
import net.refound.api.claim.dto.ClaimSummaryResponse;
import net.refound.api.item.domain.Item;
import net.refound.api.item.domain.ItemPhoto;
import net.refound.api.user.domain.User;
import net.refound.api.user.mapper.UserMapper;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Claim entities to DTOs, with the contact-release rule in one place.
 *
 * <p>Contact details cross the boundary in exactly one method
 * ({@link #toDetail}) and under exactly one condition: the claim is
 * {@code APPROVED} and the viewer is one of the two parties. Everything else
 * returns a shape that has nowhere to put them.
 *
 * <p>Call only from inside a transaction — items, users and evidence are lazy.
 */
@Component
@RequiredArgsConstructor
public class ClaimMapper {

    private final UserMapper userMapper;

    public ClaimSummaryResponse toSummary(Claim claim) {
        Item item = claim.getFoundItem();
        return new ClaimSummaryResponse(
                claim.getId(),
                item.getId(),
                item.getTitle(),
                item.getCategory(),
                claim.getStatus(),
                claim.getDecidedAt(),
                claim.getCreatedAt());
    }

    /**
     * Detail for a participant.
     *
     * @param viewer the caller — decides both {@code viewerRole} and whether
     *               contact details are attached
     */
    public ClaimDetailResponse toDetail(Claim claim, AuthPrincipal viewer) {
        Item item = claim.getFoundItem();

        boolean isClaimant = claim.getClaimant().getId().equals(viewer.id());
        boolean isFinder = item.getReporter().getId().equals(viewer.id());
        String role = isClaimant ? "CLAIMANT" : isFinder ? "FINDER" : "ADMIN";

        // The single gate on contact release.
        net.refound.api.user.dto.ContactResponse counterpart = null;
        if (claim.getStatus() == ClaimStatus.APPROVED) {
            if (isClaimant) {
                counterpart = userMapper.toContact(item.getReporter());   // finder's details
            } else if (isFinder) {
                counterpart = userMapper.toContact(claim.getClaimant());  // owner's details
            }
            // Admins get neither here: they already have the full review view.
        }

        return new ClaimDetailResponse(
                claim.getId(),
                item.getId(),
                item.getTitle(),
                item.getCategory(),
                claim.getStatus(),
                claim.getDescription(),
                claim.getLostContext(),
                evidenceUrls(claim),
                claim.getInfoRequest(),
                claim.getInfoResponse(),
                claim.getDecisionReason(),
                claim.getDecidedAt(),
                claim.getFinderConfirmedAt() != null,
                claim.getClaimantConfirmedAt() != null,
                role,
                counterpart,
                claim.getCreatedAt());
    }

    /** Admin review screen. Never reachable from a student endpoint. */
    public AdminClaimReviewResponse toAdminReview(Claim claim, int competingClaims) {
        Item item = claim.getFoundItem();
        User claimant = claim.getClaimant();

        return new AdminClaimReviewResponse(
                claim.getId(),
                claim.getStatus(),
                item.getId(),
                item.getTitle(),
                item.getCategory(),
                item.getDescription(),
                item.getLocationLabel(),
                item.getPhotos().stream().map(ItemPhoto::getUrl).toList(),

                // The comparison the decision rests on.
                item.getVerificationAnswer(),
                claim.getDescription(),
                claim.getLostContext(),
                evidenceUrls(claim),

                claim.getLostItem() == null ? null : claim.getLostItem().getId(),

                userMapper.toContact(item.getReporter()),
                userMapper.toContact(claimant),
                claimant.getMatricNumber(),

                claim.getInfoRequest(),
                claim.getInfoResponse(),
                claim.getDecisionReason(),
                claim.getDecidedAt(),
                claim.getReviewedBy() == null ? null : claim.getReviewedBy().getFullName(),
                competingClaims,

                claim.getCreatedAt());
    }

    private List<String> evidenceUrls(Claim claim) {
        return claim.getEvidence().stream().map(ClaimEvidence::getUrl).toList();
    }
}

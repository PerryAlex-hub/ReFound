package net.refound.api.item.mapper;

import net.refound.api.auth.AuthPrincipal;
import net.refound.api.item.domain.Item;
import net.refound.api.item.domain.ItemPhoto;
import net.refound.api.item.dto.ItemDetailResponse;
import net.refound.api.item.dto.ItemPhotoResponse;
import net.refound.api.item.dto.ItemSummaryResponse;
import net.refound.api.item.dto.ReporterContactResponse;
import net.refound.api.user.domain.User;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Entity to DTO conversion for items — <b>the most security-sensitive class in
 * the codebase.</b>
 *
 * <p>Three things must never reach a browsing student: the finder's
 * verification answer, the reporter's contact details, and photos of high-value
 * items. Every one of them is decided here.
 *
 * <p>Written by hand rather than generated, and the summary shape has no fields
 * for the restricted data at all — so leaking any of it takes a deliberate
 * change to a record definition, not a forgotten line.
 *
 * <p><b>Every method must be called from inside a transaction.</b> {@code
 * reporter} and {@code photos} are lazy, and {@code open-in-view} is off.
 */
@Component
public class ItemMapper {

    // ------------------------------------------------------------------
    // Browse listing — public shape, no restricted fields exist on it
    // ------------------------------------------------------------------

    /**
     * @param photos photos already loaded for this item, passed in rather than
     *               read from {@code item.getPhotos()} so a page of results
     *               costs one extra query instead of one per row
     */
    public ItemSummaryResponse toSummary(Item item, List<ItemPhoto> photos) {
        boolean showPhotos = item.isPhotosPublic() && !photos.isEmpty();

        return new ItemSummaryResponse(
                item.getId(),
                item.getType(),
                item.getStatus(),
                item.getCategory(),
                item.getTitle(),
                item.getDescription(),
                item.getLatitude(),
                item.getLongitude(),
                item.getLocationLabel(),
                item.getOccurredOn(),
                showPhotos ? photos.getFirst().getUrl() : null,
                // Signals that photos exist even when they are withheld, so the
                // UI can say "photo available after verification" rather than
                // implying the finder never took one.
                !photos.isEmpty(),
                item.getCreatedAt()
        );
    }

    // ------------------------------------------------------------------
    // Detail — shaped by the viewer
    // ------------------------------------------------------------------

    public ItemDetailResponse toDetail(Item item, AuthPrincipal viewer) {
        boolean privileged = isPrivileged(item, viewer);
        boolean isReporter = isReporter(item, viewer);

        List<ItemPhotoResponse> photos = (privileged || item.isPhotosPublic())
                ? item.getPhotos().stream().map(this::toPhoto).toList()
                : List.of();

        return new ItemDetailResponse(
                item.getId(),
                item.getType(),
                item.getStatus(),
                item.getCategory(),
                item.getTitle(),
                item.getDescription(),
                item.getLatitude(),
                item.getLongitude(),
                item.getLocationLabel(),
                item.getLocationDetail(),
                item.getOccurredOn(),
                item.getAttributes(),
                photos,
                item.getCreatedAt(),
                isReporter,

                // Restricted. Null here means the field is absent from the JSON
                // entirely — see @JsonInclude(NON_NULL) on the record.
                privileged ? toReporterContact(item.getReporter()) : null,
                privileged ? item.getVerificationAnswer() : null
        );
    }

    /**
     * Detail for a claimant whose claim has been approved: contact details are
     * released, but the verification answer stays secret — they never needed to
     * know it, and revealing it would teach them how the check works.
     */
    public ItemDetailResponse toDetailForApprovedClaimant(Item item, AuthPrincipal viewer) {
        ItemDetailResponse base = toDetail(item, viewer);

        return new ItemDetailResponse(
                base.id(), base.type(), base.status(), base.category(), base.title(),
                base.description(), base.latitude(), base.longitude(), base.locationLabel(),
                base.locationDetail(), base.occurredOn(), base.attributes(),
                item.getPhotos().stream().map(this::toPhoto).toList(),
                base.createdAt(), base.viewerIsReporter(),
                toReporterContact(item.getReporter()),
                null
        );
    }

    // ------------------------------------------------------------------
    // Internals
    // ------------------------------------------------------------------

    private ItemPhotoResponse toPhoto(ItemPhoto photo) {
        return new ItemPhotoResponse(photo.getId(), photo.getUrl(), photo.getPosition());
    }

    private ReporterContactResponse toReporterContact(User reporter) {
        return new ReporterContactResponse(
                reporter.getId(),
                reporter.getFullName(),
                reporter.getEmail(),
                reporter.getPhoneNumber());
    }

    private boolean isReporter(Item item, AuthPrincipal viewer) {
        return viewer != null && item.getReporter().getId().equals(viewer.id());
    }

    private boolean isPrivileged(Item item, AuthPrincipal viewer) {
        return viewer != null && (viewer.isAdmin() || isReporter(item, viewer));
    }
}

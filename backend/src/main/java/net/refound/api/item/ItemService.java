package net.refound.api.item;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.refound.api.auth.AuthPrincipal;
import net.refound.api.claim.repository.ClaimRepository;
import net.refound.api.common.audit.AuditService;
import net.refound.api.common.exception.BusinessRuleException;
import net.refound.api.common.exception.ForbiddenException;
import net.refound.api.common.exception.NotFoundException;
import net.refound.api.common.response.PageResponse;
import net.refound.api.item.domain.Category;
import net.refound.api.item.domain.Item;
import net.refound.api.item.domain.ItemPhoto;
import net.refound.api.item.domain.ItemStatus;
import net.refound.api.item.domain.ItemType;
import net.refound.api.item.dto.CreateItemRequest;
import net.refound.api.item.dto.ItemDetailResponse;
import net.refound.api.item.dto.ItemSearchCriteria;
import net.refound.api.item.dto.ItemSummaryResponse;
import net.refound.api.item.dto.UpdateItemRequest;
import net.refound.api.item.mapper.ItemMapper;
import net.refound.api.item.repository.ItemPhotoRepository;
import net.refound.api.item.repository.ItemRepository;
import net.refound.api.item.repository.ItemSpecifications;
import net.refound.api.matching.MatchingService;
import net.refound.api.storage.ImageValidator;
import net.refound.api.storage.StorageService;
import net.refound.api.storage.StoredFile;
import net.refound.api.user.UserService;
import net.refound.api.user.domain.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.Duration;
import java.time.Instant;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Lost and found reports.
 *
 * <p>Every method that returns data maps to a DTO <em>inside</em> the
 * transaction. Returning entities would either explode on a lazy field
 * ({@code open-in-view} is off) or serialise private columns straight to the
 * client.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ItemService {

    /**
     * Categories whose photos stay hidden until a claim is approved.
     *
     * <p>A clear photo of a phone lets anyone describe it convincingly, which
     * defeats the ownership check. A photo of an umbrella is the fastest way to
     * identify it and carries no such risk.
     */
    private static final Set<Category> HIGH_VALUE = EnumSet.of(
            Category.PHONE, Category.LAPTOP, Category.WALLET,
            Category.ID_CARD, Category.JEWELLERY);

    /** Also enforced by the item_photo_position_valid check constraint. */
    private static final int MAX_PHOTOS = 5;

    private final ItemRepository itemRepository;
    private final ItemPhotoRepository itemPhotoRepository;
    private final ItemMapper itemMapper;
    private final UserService userService;
    private final AuditService auditService;
    private final ClaimRepository claimRepository;
    private final MatchingService matchingService;
    private final StorageService storageService;
    private final ImageValidator imageValidator;

    @Value("${app.items.expiry-days}")
    private long expiryDays;

    // ------------------------------------------------------------------
    // Create
    // ------------------------------------------------------------------

    @Transactional
    public ItemDetailResponse create(AuthPrincipal viewer, CreateItemRequest request) {
        validateVerificationAnswer(request.type(), request.verificationAnswer());
        validateCoordinates(request.latitude(), request.longitude());

        User reporter = userService.getById(viewer.id());

        Item item = new Item();
        item.setType(request.type());
        item.setStatus(ItemStatus.OPEN);
        item.setReporter(reporter);
        item.setCategory(request.category());
        item.setTitle(request.title().trim());
        item.setDescription(trimOrNull(request.description()));
        item.setLatitude(request.latitude());
        item.setLongitude(request.longitude());
        item.setLocationLabel(trimOrNull(request.locationLabel()));
        item.setLocationDetail(trimOrNull(request.locationDetail()));
        item.setOccurredOn(request.occurredOn());
        item.setAttributes(request.attributes() == null ? Map.of() : request.attributes());
        item.setVerificationAnswer(trimOrNull(request.verificationAnswer()));

        // Decided by the server, never by the client.
        item.setPhotosPublic(!HIGH_VALUE.contains(request.category()));
        item.setExpiresAt(Instant.now().plus(Duration.ofDays(expiryDays)));

        itemRepository.save(item);
        auditService.record(reporter, "ITEM", item.getId(),
                request.type() == ItemType.FOUND ? "ITEM_FOUND_REPORTED" : "ITEM_LOST_REPORTED",
                Map.of("category", request.category().name()));

        // Score against the opposite pool straight away, so an owner hears
        // about a matching find within seconds of it being posted.
        matchingService.scanFor(item);

        log.info("User {} reported {} item {}", viewer.id(), request.type(), item.getId());
        return itemMapper.toDetail(item, viewer);
    }

    // ------------------------------------------------------------------
    // Read
    // ------------------------------------------------------------------

    @Transactional(readOnly = true)
    public PageResponse<ItemSummaryResponse> browse(ItemSearchCriteria criteria, Pageable pageable) {
        Page<Item> page = itemRepository.findAll(ItemSpecifications.matching(criteria), pageable);

        // Photos for the whole page in one query rather than one per row.
        Map<UUID, List<ItemPhoto>> photosByItem = loadPhotos(page.getContent());

        return PageResponse.from(page, item ->
                itemMapper.toSummary(item, photosByItem.getOrDefault(item.getId(), List.of())));
    }

    @Transactional(readOnly = true)
    public ItemDetailResponse getDetail(UUID id, AuthPrincipal viewer) {
        Item item = getVisibleItem(id, viewer);

        // Someone whose claim was approved has been verified as the owner, so
        // they see the photos and the finder's contact details — but never the
        // verification answer, which they never needed and which would teach a
        // future claimant exactly what to say.
        if (claimRepository.hasApprovedClaim(id, viewer.id())) {
            return itemMapper.toDetailForApprovedClaimant(item, viewer);
        }
        return itemMapper.toDetail(item, viewer);
    }

    @Transactional(readOnly = true)
    public PageResponse<ItemSummaryResponse> listMine(AuthPrincipal viewer, Pageable pageable) {
        Page<Item> page = itemRepository.findByReporterIdOrderByCreatedAtDesc(viewer.id(), pageable);
        Map<UUID, List<ItemPhoto>> photosByItem = loadPhotos(page.getContent());

        return PageResponse.from(page, item ->
                itemMapper.toSummary(item, photosByItem.getOrDefault(item.getId(), List.of())));
    }

    // ------------------------------------------------------------------
    // Update and withdraw
    // ------------------------------------------------------------------

    @Transactional
    public ItemDetailResponse update(UUID id, UpdateItemRequest request, AuthPrincipal viewer) {
        Item item = getOwnedItem(id, viewer);

        if (item.getStatus() != ItemStatus.OPEN) {
            throw new BusinessRuleException(
                    "Only an open report can be edited. This one is " + item.getStatus());
        }

        // Null means "leave alone", so each field is applied only when present.
        if (request.title() != null) item.setTitle(request.title().trim());
        if (request.description() != null) item.setDescription(trimOrNull(request.description()));
        if (request.locationLabel() != null) item.setLocationLabel(trimOrNull(request.locationLabel()));
        if (request.locationDetail() != null) item.setLocationDetail(trimOrNull(request.locationDetail()));
        if (request.occurredOn() != null) item.setOccurredOn(request.occurredOn());
        if (request.attributes() != null) item.setAttributes(request.attributes());

        if (request.latitude() != null || request.longitude() != null) {
            validateCoordinates(request.latitude(), request.longitude());
            item.setLatitude(request.latitude());
            item.setLongitude(request.longitude());
        }

        if (request.verificationAnswer() != null) {
            if (item.getType() != ItemType.FOUND) {
                throw new BusinessRuleException("Only a found item has a verification answer");
            }
            item.setVerificationAnswer(request.verificationAnswer().trim());
        }

        auditService.record(item.getReporter(), "ITEM", item.getId(), "ITEM_UPDATED");

        // Title, description and location all feed the score, so an edit can
        // change which candidates qualify.
        matchingService.scanFor(item);

        // No save() call: the entity is managed, so Hibernate's dirty checking
        // issues the UPDATE at commit.
        return itemMapper.toDetail(item, viewer);
    }

    /** Withdraws a report — "I found it in my bag after all". */
    @Transactional
    public void cancel(UUID id, AuthPrincipal viewer) {
        Item item = getOwnedItem(id, viewer);

        if (item.getStatus() == ItemStatus.RETURNED) {
            throw new BusinessRuleException("This item has already been returned");
        }
        if (item.getStatus() == ItemStatus.CANCELLED) {
            return;  // Idempotent: cancelling twice is not an error.
        }

        item.setStatus(ItemStatus.CANCELLED);
        auditService.record(item.getReporter(), "ITEM", item.getId(), "ITEM_CANCELLED");
        log.info("Item {} cancelled by {}", id, viewer.id());
    }

    /**
     * Flags an item for a moderator to look at.
     *
     * <p>Deliberately does not hide anything by itself. If reports auto-hid
     * items, anyone could silence a genuine report by flagging it a few times
     * — a moderation queue needs a human at the end of it.
     */
    @Transactional
    public void reportAbuse(UUID itemId, String reason, AuthPrincipal viewer) {
        Item item = getVisibleItem(itemId, viewer);
        User reporter = userService.getById(viewer.id());

        auditService.record(reporter, "ITEM", item.getId(), "ITEM_REPORTED_ABUSE",
                Map.of("reason", reason));

        log.warn("Item {} flagged by user {}: {}", itemId, viewer.id(), reason);
    }

    // ------------------------------------------------------------------
    // Photos
    // ------------------------------------------------------------------

    /**
     * Attaches a photo to a report.
     *
     * <p>The file passes through the API rather than going straight to the
     * storage provider, which is what makes these three checks possible: that
     * the caller owns the item, that the item can still take photos, and that
     * the bytes really are an image. A check performed in the browser is a
     * check an attacker simply skips.
     */
    @Transactional
    public ItemDetailResponse addPhoto(UUID itemId, MultipartFile file, AuthPrincipal viewer) {
        Item item = getOwnedItem(itemId, viewer);

        if (item.getStatus() != ItemStatus.OPEN) {
            throw new BusinessRuleException(
                    "Photos can only be added to an open report. This one is " + item.getStatus());
        }

        long existing = itemPhotoRepository.countByItemId(itemId);
        if (existing >= MAX_PHOTOS) {
            throw new BusinessRuleException("An item can have at most " + MAX_PHOTOS + " photos");
        }

        String format = imageValidator.validate(file);
        StoredFile stored = storageService.upload(file, "refound/items/" + itemId);

        ItemPhoto photo = new ItemPhoto();
        photo.setUrl(stored.url());
        photo.setPublicId(stored.publicId());
        photo.setPosition(nextPosition(itemId));
        item.addPhoto(photo);

        itemRepository.save(item);
        log.info("Added {} photo to item {} ({} of {})", format, itemId, existing + 1, MAX_PHOTOS);

        return itemMapper.toDetail(item, viewer);
    }

    @Transactional
    public void deletePhoto(UUID itemId, UUID photoId, AuthPrincipal viewer) {
        Item item = getOwnedItem(itemId, viewer);

        ItemPhoto photo = item.getPhotos().stream()
                .filter(candidate -> candidate.getId().equals(photoId))
                .findFirst()
                .orElseThrow(() -> NotFoundException.of("Photo"));

        String publicId = photo.getPublicId();
        item.removePhoto(photo);
        itemRepository.save(item);

        // Removed from storage only after the database change is safely made.
        // A failed delete leaves an orphan; a failed rollback would leave a row
        // pointing at a file that no longer exists, which is worse.
        storageService.delete(publicId);
        log.info("Removed photo {} from item {}", photoId, itemId);
    }

    /**
     * The lowest free slot in 0..4.
     *
     * <p>Not simply {@code count}, which would collide after a deletion: remove
     * the photo at position 0 of five and the count is 4, but position 4 is
     * still taken.
     */
    private int nextPosition(UUID itemId) {
        Set<Integer> used = itemPhotoRepository.findByItemIdOrderByPositionAsc(itemId).stream()
                .map(ItemPhoto::getPosition)
                .collect(Collectors.toSet());

        for (int position = 0; position < MAX_PHOTOS; position++) {
            if (!used.contains(position)) {
                return position;
            }
        }
        throw new BusinessRuleException("An item can have at most " + MAX_PHOTOS + " photos");
    }

    // ------------------------------------------------------------------
    // Shared lookups
    // ------------------------------------------------------------------

    /**
     * Loads an item the viewer is allowed to see at all.
     *
     * <p>A hidden item is reported as missing rather than forbidden — telling a
     * caller "this exists but was moderated" is information they have no claim
     * to.
     */
    @Transactional(readOnly = true)
    public Item getVisibleItem(UUID id, AuthPrincipal viewer) {
        Item item = itemRepository.findById(id).orElseThrow(() -> NotFoundException.of("Item"));

        boolean privileged = viewer != null
                && (viewer.isAdmin() || item.getReporter().getId().equals(viewer.id()));

        if (item.isHidden() && !privileged) {
            throw NotFoundException.of("Item");
        }
        return item;
    }

    /** Loads an item the viewer may modify: their own, or any if admin. */
    private Item getOwnedItem(UUID id, AuthPrincipal viewer) {
        Item item = itemRepository.findById(id).orElseThrow(() -> NotFoundException.of("Item"));

        boolean owns = item.getReporter().getId().equals(viewer.id());
        if (!owns && !viewer.isAdmin()) {
            // Forbidden rather than not-found: the caller reached a real item
            // whose existence they could already confirm by browsing.
            throw new ForbiddenException("This report belongs to someone else");
        }
        return item;
    }

    private Map<UUID, List<ItemPhoto>> loadPhotos(List<Item> items) {
        if (items.isEmpty()) {
            return Map.of();
        }
        List<UUID> ids = items.stream().map(Item::getId).toList();
        return itemPhotoRepository.findByItemIdInOrderByPositionAsc(ids).stream()
                .collect(Collectors.groupingBy(photo -> photo.getItem().getId()));
    }

    // ------------------------------------------------------------------
    // Validation the annotations cannot express
    // ------------------------------------------------------------------

    private void validateVerificationAnswer(ItemType type, String answer) {
        boolean provided = answer != null && !answer.isBlank();

        if (type == ItemType.FOUND && !provided) {
            throw new BusinessRuleException(
                    "A found item needs a verification question: name something about it "
                    + "only the owner would know");
        }
        if (type == ItemType.LOST && provided) {
            throw new BusinessRuleException(
                    "A lost report cannot carry a verification answer — the finder supplies it");
        }
    }

    private void validateCoordinates(Object latitude, Object longitude) {
        if ((latitude == null) != (longitude == null)) {
            throw new BusinessRuleException("Latitude and longitude must be provided together");
        }
    }

    private String trimOrNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}

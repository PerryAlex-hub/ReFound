package net.refound.api.item;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import net.refound.api.admin.dto.ModerationRequest;
import net.refound.api.auth.AuthPrincipal;
import net.refound.api.common.response.PageResponse;
import net.refound.api.item.domain.Category;
import net.refound.api.item.domain.ItemStatus;
import net.refound.api.item.domain.ItemType;
import net.refound.api.item.dto.CreateItemRequest;
import net.refound.api.item.dto.ItemDetailResponse;
import net.refound.api.item.dto.ItemSearchCriteria;
import net.refound.api.item.dto.ItemSummaryResponse;
import net.refound.api.item.dto.UpdateItemRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Lost and found reports.
 *
 * <p>Thin, as always: no business rules, no visibility decisions. What a given
 * caller may see is decided by {@code ItemMapper} inside the service, driven by
 * the authenticated principal — never by a query parameter.
 */
@RestController
@RequestMapping("/api/items")
@RequiredArgsConstructor
@Tag(name = "Items", description = "Reporting and browsing lost and found items")
public class ItemController {

    private final ItemService itemService;

    @PostMapping
    @Operation(summary = "Report a lost or found item",
            description = "FOUND items require a verification answer — something only "
                    + "the true owner would know. LOST items must not carry one.")
    public ResponseEntity<ItemDetailResponse> create(
            @AuthenticationPrincipal AuthPrincipal principal,
            @Valid @RequestBody CreateItemRequest request) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(itemService.create(principal, request));
    }

    @GetMapping
    @Operation(summary = "Browse items",
            description = "Paginated and filterable. Returns the deliberately vague public "
                    + "view: no reporter, no contact details, and no photos for high-value "
                    + "categories. Map bounds apply only when all four are supplied.")
    public ResponseEntity<PageResponse<ItemSummaryResponse>> browse(
            @RequestParam(required = false) ItemType type,
            @RequestParam(required = false) ItemStatus status,
            @RequestParam(required = false) Category category,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) LocalDate dateFrom,
            @RequestParam(required = false) LocalDate dateTo,
            @RequestParam(required = false) BigDecimal north,
            @RequestParam(required = false) BigDecimal south,
            @RequestParam(required = false) BigDecimal east,
            @RequestParam(required = false) BigDecimal west,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC)
            Pageable pageable) {

        var criteria = new ItemSearchCriteria(
                type, status, category, q, dateFrom, dateTo, north, south, east, west);

        return ResponseEntity.ok(itemService.browse(criteria, pageable));
    }

    @GetMapping("/mine")
    @Operation(summary = "My reports",
            description = "Full detail, including each item's own verification answer.")
    public ResponseEntity<PageResponse<ItemSummaryResponse>> mine(
            @AuthenticationPrincipal AuthPrincipal principal,
            @PageableDefault(size = 20) Pageable pageable) {

        return ResponseEntity.ok(itemService.listMine(principal, pageable));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Item detail",
            description = "The response shape depends on the caller: reporters and admins "
                    + "additionally receive contact details and the verification answer.")
    public ResponseEntity<ItemDetailResponse> detail(
            @AuthenticationPrincipal AuthPrincipal principal,
            @PathVariable UUID id) {

        return ResponseEntity.ok(itemService.getDetail(id, principal));
    }

    @PatchMapping("/{id}")
    @Operation(summary = "Edit my report",
            description = "Open reports only. Omitted fields are left unchanged. "
                    + "Type and category cannot be changed — withdraw and re-file instead.")
    public ResponseEntity<ItemDetailResponse> update(
            @AuthenticationPrincipal AuthPrincipal principal,
            @PathVariable UUID id,
            @Valid @RequestBody UpdateItemRequest request) {

        return ResponseEntity.ok(itemService.update(id, request, principal));
    }

    @PostMapping(value = "/{id}/photos", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Attach a photo",
            description = "Multipart upload, field name `file`. JPEG, PNG or WebP, "
                    + "5MB max, 5 photos per item. The file type is verified from the "
                    + "file's own bytes, not its name or Content-Type. Returns the "
                    + "updated item.")
    public ResponseEntity<ItemDetailResponse> addPhoto(
            @AuthenticationPrincipal AuthPrincipal principal,
            @PathVariable UUID id,
            @RequestParam("file") MultipartFile file) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(itemService.addPhoto(id, file, principal));
    }

    @DeleteMapping("/{id}/photos/{photoId}")
    @Operation(summary = "Remove a photo",
            description = "Deletes the file from storage as well as the record.")
    public ResponseEntity<Void> deletePhoto(
            @AuthenticationPrincipal AuthPrincipal principal,
            @PathVariable UUID id,
            @PathVariable UUID photoId) {

        itemService.deletePhoto(id, photoId, principal);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/report-abuse")
    @Operation(summary = "Flag an item for moderation",
            description = "Queues it for an administrator to review. Nothing is hidden "
                    + "automatically — otherwise a few malicious flags could silence a "
                    + "genuine report.")
    public ResponseEntity<Void> reportAbuse(
            @AuthenticationPrincipal AuthPrincipal principal,
            @PathVariable UUID id,
            @Valid @RequestBody ModerationRequest request) {

        itemService.reportAbuse(id, request.reason(), principal);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/cancel")
    @Operation(summary = "Withdraw my report",
            description = "For when the item turns up. Idempotent.")
    public ResponseEntity<Void> cancel(
            @AuthenticationPrincipal AuthPrincipal principal,
            @PathVariable UUID id) {

        itemService.cancel(id, principal);
        return ResponseEntity.noContent().build();
    }
}

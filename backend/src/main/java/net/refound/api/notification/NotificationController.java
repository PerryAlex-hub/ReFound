package net.refound.api.notification;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import net.refound.api.auth.AuthPrincipal;
import net.refound.api.common.exception.NotFoundException;
import net.refound.api.common.response.PageResponse;
import net.refound.api.notification.domain.Notification;
import net.refound.api.notification.dto.NotificationResponse;
import net.refound.api.notification.repository.NotificationRepository;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * The caller's own notification feed.
 *
 * <p>Every query is scoped to the authenticated user's id, so there is no path
 * by which one account can read another's.
 */
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications", description = "In-app notification feed")
public class NotificationController {

    private final NotificationRepository notificationRepository;

    @GetMapping
    @Operation(summary = "My notifications, newest first")
    @Transactional(readOnly = true)
    public ResponseEntity<PageResponse<NotificationResponse>> list(
            @AuthenticationPrincipal AuthPrincipal principal,
            @PageableDefault(size = 20) Pageable pageable) {

        var page = notificationRepository
                .findByUserIdOrderByCreatedAtDesc(principal.id(), pageable);

        return ResponseEntity.ok(PageResponse.from(page, this::toResponse));
    }

    @GetMapping("/unread-count")
    @Operation(summary = "Unread count for the badge")
    public ResponseEntity<Map<String, Long>> unreadCount(
            @AuthenticationPrincipal AuthPrincipal principal) {

        long count = notificationRepository.countByUserIdAndReadAtIsNull(principal.id());
        return ResponseEntity.ok(Map.of("unread", count));
    }

    @PostMapping("/{id}/read")
    @Operation(summary = "Mark one as read")
    @Transactional
    public ResponseEntity<Void> markRead(
            @AuthenticationPrincipal AuthPrincipal principal,
            @PathVariable UUID id) {

        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> NotFoundException.of("Notification"));

        // Not-found rather than forbidden: another user's notification should
        // not be distinguishable from one that does not exist.
        if (!notification.getUser().getId().equals(principal.id())) {
            throw NotFoundException.of("Notification");
        }

        if (notification.getReadAt() == null) {
            notification.setReadAt(Instant.now());
        }
        return ResponseEntity.noContent().build();
    }

    private NotificationResponse toResponse(Notification notification) {
        return new NotificationResponse(
                notification.getId(),
                notification.getType(),
                notification.getPayload(),
                notification.getReadAt(),
                notification.getCreatedAt());
    }
}

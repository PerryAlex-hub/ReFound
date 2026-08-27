package net.refound.api.admin;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import net.refound.api.admin.dto.AdminStatsResponse;
import net.refound.api.admin.dto.ModerationRequest;
import net.refound.api.auth.AuthPrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/** Item moderation and service statistics. Administrators only. */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin — Moderation & Stats", description = "Hiding items, and how the service is doing")
public class AdminItemController {

    private final AdminService adminService;

    @PostMapping("/items/{id}/hide")
    @Operation(summary = "Remove an item from browse",
            description = "Hidden, not deleted: the record survives for any later dispute, "
                    + "and the reporter can still see their own report. Idempotent.")
    public ResponseEntity<Void> hide(
            @AuthenticationPrincipal AuthPrincipal principal,
            @PathVariable UUID id,
            @Valid @RequestBody ModerationRequest request) {

        adminService.hideItem(id, request.reason(), principal);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/items/{id}/unhide")
    @Operation(summary = "Restore a hidden item")
    public ResponseEntity<Void> unhide(
            @AuthenticationPrincipal AuthPrincipal principal,
            @PathVariable UUID id) {

        adminService.unhideItem(id, principal);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/stats")
    @Operation(summary = "Service statistics",
            description = "Recovery rate is the headline: of the items handed in, how many "
                    + "reached their owner.")
    public ResponseEntity<AdminStatsResponse> stats() {
        return ResponseEntity.ok(adminService.stats());
    }
}

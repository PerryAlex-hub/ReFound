package net.refound.api.admin;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import net.refound.api.auth.AuthPrincipal;
import net.refound.api.claim.ClaimService;
import net.refound.api.claim.domain.ClaimStatus;
import net.refound.api.claim.dto.AdminClaimReviewResponse;
import net.refound.api.claim.dto.ClaimDecisionRequest;
import net.refound.api.claim.dto.ClaimSummaryResponse;
import net.refound.api.claim.dto.InfoRequestRequest;
import net.refound.api.common.response.PageResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * Claim review. Administrators only.
 *
 * <p>Protected twice over: {@code SecurityConfig} requires {@code ROLE_ADMIN}
 * for every path under {@code /api/admin/**}, and {@code @PreAuthorize} repeats
 * it here. Belt and braces on purpose — this is the only place a finder's
 * verification answer is ever served, and a future refactor of the path rules
 * must not quietly open it up.
 */
@RestController
@RequestMapping("/api/admin/claims")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin — Claims", description = "Verifying ownership before contact is released")
public class AdminClaimController {

    private final ClaimService claimService;

    @GetMapping
    @Operation(summary = "Review queue",
            description = "Oldest first, so nobody waits indefinitely. Defaults to PENDING.")
    public ResponseEntity<PageResponse<ClaimSummaryResponse>> queue(
            @RequestParam(required = false) ClaimStatus status,
            @PageableDefault(size = 20) Pageable pageable) {

        return ResponseEntity.ok(claimService.queue(status, pageable));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Full review detail",
            description = "Shows the finder's private verification answer beside the "
                    + "claimant's description — the comparison the decision rests on. "
                    + "Also lists competing claims on the same item.")
    public ResponseEntity<AdminClaimReviewResponse> review(@PathVariable UUID id) {
        return ResponseEntity.ok(claimService.getForReview(id));
    }

    @PostMapping("/{id}/request-info")
    @Operation(summary = "Ask the claimant a question",
            description = "For a plausible but unconvincing claim. Moves it to AWAITING_INFO.")
    public ResponseEntity<AdminClaimReviewResponse> requestInfo(
            @AuthenticationPrincipal AuthPrincipal principal,
            @PathVariable UUID id,
            @Valid @RequestBody InfoRequestRequest request) {

        return ResponseEntity.ok(claimService.requestMoreInfo(id, request.question(), principal));
    }

    @PostMapping("/{id}/approve")
    @Operation(summary = "Approve — releases contact details",
            description = "Marks both items matched, rejects every competing claim, and "
                    + "gives each party the other's name and phone number. A reason is "
                    + "required and permanently recorded.")
    public ResponseEntity<AdminClaimReviewResponse> approve(
            @AuthenticationPrincipal AuthPrincipal principal,
            @PathVariable UUID id,
            @Valid @RequestBody ClaimDecisionRequest request) {

        return ResponseEntity.ok(claimService.approve(id, request.reason(), principal));
    }

    @PostMapping("/{id}/reject")
    @Operation(summary = "Reject",
            description = "The item returns to browse if nothing else is pending on it. "
                    + "The claimant may submit a better-evidenced claim.")
    public ResponseEntity<AdminClaimReviewResponse> reject(
            @AuthenticationPrincipal AuthPrincipal principal,
            @PathVariable UUID id,
            @Valid @RequestBody ClaimDecisionRequest request) {

        return ResponseEntity.ok(claimService.reject(id, request.reason(), principal));
    }
}

package net.refound.api.claim;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import net.refound.api.auth.AuthPrincipal;
import net.refound.api.claim.dto.ClaimDetailResponse;
import net.refound.api.claim.dto.ClaimSummaryResponse;
import net.refound.api.claim.dto.CreateClaimRequest;
import net.refound.api.claim.dto.InfoResponseRequest;
import net.refound.api.common.response.PageResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * Claiming a found item, from the claimant's and finder's side.
 *
 * <p>Administrator review lives in {@code AdminClaimController} under
 * {@code /api/admin/**}, which the security config protects wholesale.
 */
@RestController
@RequestMapping("/api/claims")
@RequiredArgsConstructor
@Tag(name = "Claims", description = "Asserting ownership of a found item")
public class ClaimController {

    private final ClaimService claimService;

    @PostMapping
    @Operation(summary = "Claim a found item",
            description = "Describe marks, damage or contents — anything only the owner "
                    + "would know. An admin compares this against the private detail the "
                    + "finder recorded. You cannot claim an item you reported yourself.")
    public ResponseEntity<ClaimDetailResponse> create(
            @AuthenticationPrincipal AuthPrincipal principal,
            @Valid @RequestBody CreateClaimRequest request) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(claimService.create(principal, request));
    }

    @GetMapping("/mine")
    @Operation(summary = "My claims")
    public ResponseEntity<PageResponse<ClaimSummaryResponse>> mine(
            @AuthenticationPrincipal AuthPrincipal principal,
            @PageableDefault(size = 20) Pageable pageable) {

        return ResponseEntity.ok(claimService.listMine(principal, pageable));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Claim detail",
            description = "Visible to the claimant, the finder and admins. Once approved, "
                    + "each party receives the other's contact details here.")
    public ResponseEntity<ClaimDetailResponse> detail(
            @AuthenticationPrincipal AuthPrincipal principal,
            @PathVariable UUID id) {

        return ResponseEntity.ok(claimService.getDetail(id, principal));
    }

    @PostMapping("/{id}/respond")
    @Operation(summary = "Answer an admin's question",
            description = "Moves the claim back into the review queue.")
    public ResponseEntity<ClaimDetailResponse> respond(
            @AuthenticationPrincipal AuthPrincipal principal,
            @PathVariable UUID id,
            @Valid @RequestBody InfoResponseRequest request) {

        return ResponseEntity.ok(claimService.respondToInfoRequest(id, request.answer(), principal));
    }

    @PostMapping("/{id}/withdraw")
    @Operation(summary = "Withdraw my claim")
    public ResponseEntity<Void> withdraw(
            @AuthenticationPrincipal AuthPrincipal principal,
            @PathVariable UUID id) {

        claimService.withdraw(id, principal);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/confirm-handover")
    @Operation(summary = "Confirm the item changed hands",
            description = "Both the claimant and the finder must confirm before the item "
                    + "is marked returned.")
    public ResponseEntity<ClaimDetailResponse> confirmHandover(
            @AuthenticationPrincipal AuthPrincipal principal,
            @PathVariable UUID id) {

        return ResponseEntity.ok(claimService.confirmHandover(id, principal));
    }
}

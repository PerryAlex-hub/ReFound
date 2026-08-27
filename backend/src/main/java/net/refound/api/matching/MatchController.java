package net.refound.api.matching;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import net.refound.api.auth.AuthPrincipal;
import net.refound.api.matching.dto.MatchResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/**
 * Suggested pairings for the caller's lost reports.
 *
 * <p>A suggestion is a hint, not a verdict. Acting on one still means filing a
 * claim and passing the same ownership check as anyone who found the item by
 * browsing.
 */
@RestController
@RequestMapping("/api/matches")
@RequiredArgsConstructor
@Tag(name = "Matches", description = "Automatically suggested lost/found pairings")
public class MatchController {

    private final MatchingService matchingService;

    @GetMapping("/mine")
    @Operation(summary = "Suggestions for my lost reports",
            description = "Highest scoring first. Each carries a breakdown showing which "
                    + "signals contributed, so the UI can explain the suggestion.")
    public ResponseEntity<List<MatchResponse>> mine(@AuthenticationPrincipal AuthPrincipal principal) {
        return ResponseEntity.ok(matchingService.myMatches(principal));
    }

    @GetMapping("/for-item/{lostItemId}")
    @Operation(summary = "Suggestions for one lost report")
    public ResponseEntity<List<MatchResponse>> forItem(
            @AuthenticationPrincipal AuthPrincipal principal,
            @PathVariable UUID lostItemId) {

        return ResponseEntity.ok(matchingService.matchesForItem(lostItemId, principal));
    }

    @PostMapping("/{id}/dismiss")
    @Operation(summary = "Not my item",
            description = "Hides the suggestion. The report itself is untouched, and a "
                    + "later rescore will not bring it back.")
    public ResponseEntity<Void> dismiss(
            @AuthenticationPrincipal AuthPrincipal principal,
            @PathVariable UUID id) {

        matchingService.dismiss(id, principal);
        return ResponseEntity.noContent().build();
    }
}

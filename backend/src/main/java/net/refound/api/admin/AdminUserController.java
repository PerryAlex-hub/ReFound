package net.refound.api.admin;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import net.refound.api.admin.dto.ModerationRequest;
import net.refound.api.auth.AuthPrincipal;
import net.refound.api.common.response.PageResponse;
import net.refound.api.user.domain.User;
import net.refound.api.user.dto.AdminUserResponse;
import net.refound.api.user.repository.UserRepository;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/** Account administration. Administrators only. */
@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin — Users", description = "Accounts, suspension, and roles")
public class AdminUserController {

    private final AdminService adminService;
    private final UserRepository userRepository;

    @GetMapping
    @Operation(summary = "List or search users",
            description = "Search matches name, email or matric number.")
    @Transactional(readOnly = true)
    public ResponseEntity<PageResponse<AdminUserResponse>> list(
            @RequestParam(required = false) String q,
            @PageableDefault(size = 20) Pageable pageable) {

        var page = (q == null || q.isBlank())
                ? userRepository.findAllByOrderByCreatedAtDesc(pageable)
                : userRepository.search(q.trim(), pageable);

        return ResponseEntity.ok(PageResponse.from(page, this::toResponse));
    }

    @PostMapping("/{id}/suspend")
    @Operation(summary = "Suspend an account",
            description = "Also revokes every active session, so the user is locked out "
                    + "immediately rather than when their access token expires.")
    public ResponseEntity<Void> suspend(
            @AuthenticationPrincipal AuthPrincipal principal,
            @PathVariable UUID id,
            @Valid @RequestBody ModerationRequest request) {

        adminService.suspendUser(id, request.reason(), principal);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/reactivate")
    @Operation(summary = "Restore a suspended account")
    public ResponseEntity<Void> reactivate(
            @AuthenticationPrincipal AuthPrincipal principal,
            @PathVariable UUID id) {

        adminService.reactivateUser(id, principal);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/promote")
    @Operation(summary = "Make this user an administrator",
            description = "The first administrator must still be created directly in the "
                    + "database — an API that can mint its own is one anyone can mint through.")
    public ResponseEntity<Void> promote(
            @AuthenticationPrincipal AuthPrincipal principal,
            @PathVariable UUID id) {

        adminService.promoteToAdmin(id, principal);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/demote")
    @Operation(summary = "Return an administrator to student")
    public ResponseEntity<Void> demote(
            @AuthenticationPrincipal AuthPrincipal principal,
            @PathVariable UUID id) {

        adminService.demoteToStudent(id, principal);
        return ResponseEntity.noContent().build();
    }

    private AdminUserResponse toResponse(User user) {
        return new AdminUserResponse(
                user.getId(), user.getFullName(), user.getMatricNumber(),
                user.getEmail(), user.getPhoneNumber(), user.getRole(),
                user.getStatus(), user.isEmailVerified(), user.getCreatedAt());
    }
}

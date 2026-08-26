package net.refound.api.user;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import net.refound.api.auth.AuthPrincipal;
import net.refound.api.user.dto.UserResponse;
import net.refound.api.user.mapper.UserMapper;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * The caller's own profile.
 *
 * <p>{@code @AuthenticationPrincipal} injects whatever
 * {@code JwtAuthenticationFilter} put in the security context — so the caller's
 * identity comes from a verified signature, never from a request parameter.
 * Reading an id out of the path or body would let anyone read anyone.
 */
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "Users", description = "Profile of the authenticated user")
public class UserController {

    private final UserService userService;
    private final UserMapper userMapper;

    @GetMapping("/me")
    @Operation(summary = "Get my profile",
            description = "Includes the caller's own email and phone number. "
                    + "Never used to describe any other user.")
    public ResponseEntity<UserResponse> me(@AuthenticationPrincipal AuthPrincipal principal) {
        return ResponseEntity.ok(userMapper.toResponse(userService.getById(principal.id())));
    }
}

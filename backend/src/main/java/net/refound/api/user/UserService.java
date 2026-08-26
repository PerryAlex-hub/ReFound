package net.refound.api.user;

import lombok.RequiredArgsConstructor;
import net.refound.api.common.exception.NotFoundException;
import net.refound.api.user.domain.User;
import net.refound.api.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * User profile operations.
 */
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    /**
     * Loads the account behind an access token.
     *
     * <p>A valid token for a deleted account is possible — the token outlives
     * the row — so this genuinely can fail, and 404 is the honest answer.
     */
    @Transactional(readOnly = true)
    public User getById(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> NotFoundException.of("User"));
    }
}

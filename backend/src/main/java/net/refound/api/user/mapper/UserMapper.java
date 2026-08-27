package net.refound.api.user.mapper;

import net.refound.api.user.domain.User;
import net.refound.api.user.dto.ContactResponse;
import net.refound.api.user.dto.UserResponse;
import org.springframework.stereotype.Component;

/**
 * Entity to DTO conversion, written by hand rather than generated.
 *
 * <p>Deliberate: these mappers are where the redaction rules live, and a
 * generated mapper hides which fields cross the boundary. Here it is one
 * readable list, and a reviewer can see at a glance that {@code passwordHash}
 * never appears.
 */
@Component
public class UserMapper {

    /** Self-view only — includes email and phone. See {@link UserResponse}. */
    public UserResponse toResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getFullName(),
                user.getMatricNumber(),
                user.getEmail(),
                user.getPhoneNumber(),
                user.getRole(),
                user.isEmailVerified(),
                user.getCreatedAt()
        );
    }

    /**
     * Contact details for release to a verified counterpart.
     *
     * <p>Callers are responsible for having established that the recipient is
     * entitled to these — see {@link ContactResponse}.
     */
    public ContactResponse toContact(User user) {
        return new ContactResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhoneNumber()
        );
    }
}

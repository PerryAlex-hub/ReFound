package net.refound.api.user.dto;

import java.util.UUID;

/**
 * How to reach a person.
 *
 * <p><b>The payload the whole verification workflow exists to protect.</b> It
 * is released in exactly three situations:
 * <ul>
 *   <li>to the account holder, about themselves</li>
 *   <li>to an administrator</li>
 *   <li>to the two parties of an <em>approved</em> claim, about each other</li>
 * </ul>
 *
 * <p>It must never appear in a browse listing, an admin queue row, or any
 * response describing a pending claim. If you are attaching one of these,
 * be able to say which of the three cases applies.
 */
public record ContactResponse(
        UUID id,
        String fullName,
        String email,
        String phoneNumber
) {
}

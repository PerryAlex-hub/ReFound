package net.refound.api.item.dto;

import java.util.UUID;

/**
 * Who reported an item, including how to reach them.
 *
 * <p><b>This is the payload the entire verification workflow exists to
 * protect.</b> It may be attached to a response in exactly three cases:
 * <ul>
 *   <li>the viewer is the reporter, looking at their own report</li>
 *   <li>the viewer is an administrator</li>
 *   <li>the viewer is the claimant of an approved claim on this item</li>
 * </ul>
 *
 * <p>It must never appear in a browse listing. If you find yourself adding it
 * to a summary shape, stop.
 */
public record ReporterContactResponse(
        UUID id,
        String fullName,
        String email,
        String phoneNumber
) {
}

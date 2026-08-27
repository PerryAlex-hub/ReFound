package net.refound.api.item.dto;

import java.util.UUID;

/** A photo URL. Only ever included when the viewer is allowed to see it. */
public record ItemPhotoResponse(UUID id, String url, int position) {
}

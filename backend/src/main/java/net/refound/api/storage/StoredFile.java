package net.refound.api.storage;

/**
 * The result of a successful upload.
 *
 * @param url      public HTTPS URL of the stored image
 * @param publicId the provider's identifier, needed to delete it later
 */
public record StoredFile(String url, String publicId) {
}

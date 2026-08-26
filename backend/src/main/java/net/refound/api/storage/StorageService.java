package net.refound.api.storage;

import org.springframework.web.multipart.MultipartFile;

/**
 * Somewhere to put uploaded images.
 *
 * <p>An interface rather than a direct Cloudinary call so the rest of the
 * codebase never mentions a specific provider — swapping to S3 or Supabase
 * Storage later means one new implementation and no changes to
 * {@code ItemService}.
 */
public interface StorageService {

    /**
     * Validates and stores an image.
     *
     * @param folder provider-side folder, e.g. {@code refound/items/<uuid>}
     * @throws net.refound.api.common.exception.BusinessRuleException if the file
     *         is not a supported image, or storage is not configured
     */
    StoredFile upload(MultipartFile file, String folder);

    /**
     * Removes a stored file. Never throws: a failed delete leaves an orphaned
     * image, which is untidy but must not fail the user's request — the row is
     * already gone from our side.
     */
    void delete(String publicId);
}

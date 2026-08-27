package net.refound.api.storage;

import com.cloudinary.Cloudinary;
import com.cloudinary.Transformation;
import com.cloudinary.utils.ObjectUtils;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import net.refound.api.common.exception.BusinessRuleException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

/**
 * Cloudinary-backed image storage.
 *
 * <p>The account credentials live only on the server. That is the whole point
 * of proxying uploads: were the browser to upload directly it would need an
 * upload preset embedded in the JavaScript bundle, and anyone could lift it and
 * fill the account with junk.
 *
 * <p>If credentials are absent the application still starts — photo upload is
 * not needed to work on anything else — and uploads fail with a clear message
 * instead.
 */
@Slf4j
@Service
public class CloudinaryStorageService implements StorageService {

    private final String cloudName;
    private final String apiKey;
    private final String apiSecret;

    private Cloudinary cloudinary;

    public CloudinaryStorageService(
            @Value("${app.storage.cloudinary.cloud-name:}") String cloudName,
            @Value("${app.storage.cloudinary.api-key:}") String apiKey,
            @Value("${app.storage.cloudinary.api-secret:}") String apiSecret) {
        this.cloudName = cloudName;
        this.apiKey = apiKey;
        this.apiSecret = apiSecret;
    }

    @PostConstruct
    void init() {
        if (!isConfigured()) {
            log.warn("Cloudinary is not configured — photo upload will be rejected. "
                    + "Set CLOUDINARY_* in .env to enable it.");
            return;
        }
        this.cloudinary = new Cloudinary(ObjectUtils.asMap(
                "cloud_name", cloudName,
                "api_key", apiKey,
                "api_secret", apiSecret,
                "secure", true));   // always return https URLs
        log.info("Cloudinary storage ready (cloud: {})", cloudName);
    }

    @Override
    public StoredFile upload(MultipartFile file, String folder) {
        requireConfigured();

        try {
            Map<?, ?> result = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                    "folder", folder,

                    // Never trust the client's filename — it could collide, or
                    // carry path characters. Let Cloudinary generate the id.
                    "use_filename", false,
                    "unique_filename", true,

                    // Reject anything that is not an image at the far end too,
                    // as a second line of defence behind ImageValidator.
                    "resource_type", "image",

                    // Cap the long edge at 1600px and let Cloudinary pick the
                    // best format and quality per browser. Cuts storage and
                    // makes the app noticeably quicker on campus wifi.
                    "transformation", new Transformation<>()
                            .width(1600).height(1600).crop("limit")
                            .quality("auto")
                            .fetchFormat("auto")));

            String url = (String) result.get("secure_url");
            String publicId = (String) result.get("public_id");

            if (url == null || publicId == null) {
                throw new BusinessRuleException("Image upload failed — please try again");
            }

            log.debug("Uploaded image {} to {}", publicId, folder);
            return new StoredFile(url, publicId);

        } catch (IOException ex) {
            log.error("Cloudinary upload failed for folder {}", folder, ex);
            throw new BusinessRuleException("Image upload failed — please try again");
        }
    }

    @Override
    public void delete(String publicId) {
        if (publicId == null || publicId.isBlank() || !isConfigured()) {
            return;
        }
        try {
            cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
            log.debug("Deleted image {}", publicId);
        } catch (Exception ex) {
            // Swallowed on purpose. The database row is already gone; failing
            // the user's request over a leftover file would be worse than the
            // orphan itself.
            log.warn("Could not delete image {} from Cloudinary", publicId, ex);
        }
    }

    private boolean isConfigured() {
        return !cloudName.isBlank() && !apiKey.isBlank() && !apiSecret.isBlank();
    }

    private void requireConfigured() {
        if (cloudinary == null) {
            throw new BusinessRuleException(
                    "Photo upload is not available — image storage is not configured");
        }
    }
}

package net.refound.api.storage;

import net.refound.api.common.exception.BusinessRuleException;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

/**
 * Checks that an upload really is an image.
 *
 * <p>Filename extensions and the browser-supplied {@code Content-Type} are both
 * attacker-controlled — anyone can rename a script to {@code photo.jpg} or send
 * whatever header they like with curl. The only trustworthy signal is the
 * file's own leading bytes, its <em>magic number</em>.
 *
 * <p>This is why the upload goes through the API at all rather than straight to
 * Cloudinary: a check the client performs is a check the client can skip.
 */
@Component
public class ImageValidator {

    private static final long MAX_BYTES = 5L * 1024 * 1024;

    // JPEG: FF D8 FF
    private static final byte[] JPEG = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF};

    // PNG: 89 50 4E 47 0D 0A 1A 0A
    private static final byte[] PNG = {(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A};

    // WebP: "RIFF" then four size bytes then "WEBP"
    private static final byte[] RIFF = {0x52, 0x49, 0x46, 0x46};
    private static final byte[] WEBP = {0x57, 0x45, 0x42, 0x50};

    /** @return the detected format, for logging */
    public String validate(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessRuleException("No file was uploaded");
        }
        if (file.getSize() > MAX_BYTES) {
            throw new BusinessRuleException("Image must be 5MB or smaller");
        }

        byte[] header = readHeader(file);

        if (startsWith(header, JPEG)) return "JPEG";
        if (startsWith(header, PNG)) return "PNG";
        if (startsWith(header, RIFF) && regionMatches(header, 8, WEBP)) return "WebP";

        throw new BusinessRuleException("Only JPEG, PNG and WebP images are accepted");
    }

    private byte[] readHeader(MultipartFile file) {
        try (var stream = file.getInputStream()) {
            byte[] header = new byte[12];
            int read = stream.read(header);
            if (read < 12) {
                throw new BusinessRuleException("File is too small to be a valid image");
            }
            return header;
        } catch (java.io.IOException ex) {
            throw new BusinessRuleException("Could not read the uploaded file");
        }
    }

    private boolean startsWith(byte[] data, byte[] prefix) {
        return regionMatches(data, 0, prefix);
    }

    private boolean regionMatches(byte[] data, int offset, byte[] expected) {
        if (data.length < offset + expected.length) return false;
        for (int i = 0; i < expected.length; i++) {
            if (data[offset + i] != expected[i]) return false;
        }
        return true;
    }
}

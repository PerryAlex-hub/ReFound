package net.refound.api.common.exception;

import org.springframework.http.HttpStatus;

/**
 * Authenticated, but not permitted.
 *
 * <p>Use only where the caller already knows the resource exists — otherwise
 * prefer {@link NotFoundException}, which leaks nothing.
 */
public class ForbiddenException extends ApiException {

    public ForbiddenException(String message) {
        super(HttpStatus.FORBIDDEN, "FORBIDDEN", message);
    }
}

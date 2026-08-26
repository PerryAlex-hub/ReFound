package net.refound.api.common.exception;

import org.springframework.http.HttpStatus;

/**
 * The request conflicts with current state: an email already registered, a
 * second live claim on the same item, an item already matched.
 */
public class ConflictException extends ApiException {

    public ConflictException(String message) {
        super(HttpStatus.CONFLICT, "CONFLICT", message);
    }
}

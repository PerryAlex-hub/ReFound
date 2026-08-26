package net.refound.api.common.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

/**
 * Base class for every deliberate, expected failure.
 *
 * <p>Services throw these; {@link GlobalExceptionHandler} turns them into the
 * standard error body. Anything that escapes as a plain {@code RuntimeException}
 * is treated as a bug and becomes a 500 with a trace id.
 *
 * <p>Extends {@code RuntimeException} so it does not need declaring on every
 * method signature, and so throwing one still rolls back the transaction.
 */
@Getter
public abstract class ApiException extends RuntimeException {

    private final HttpStatus status;

    /** Stable machine-readable code the frontend can switch on. */
    private final String errorCode;

    protected ApiException(HttpStatus status, String errorCode, String message) {
        super(message);
        this.status = status;
        this.errorCode = errorCode;
    }
}

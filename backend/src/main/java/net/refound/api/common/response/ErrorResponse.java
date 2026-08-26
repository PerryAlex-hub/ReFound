package net.refound.api.common.response;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;
import java.util.List;

/**
 * The single error shape returned by every failing request.
 *
 * <p>Null fields are omitted, so a simple error carries no empty {@code
 * fieldErrors} array and no null {@code traceId}.
 *
 * <pre>
 * {
 *   "timestamp": "2026-08-26T10:15:30Z",
 *   "status": 400,
 *   "error": "VALIDATION_FAILED",
 *   "message": "Request validation failed",
 *   "path": "/api/items",
 *   "fieldErrors": [ { "field": "category", "message": "must not be null" } ]
 * }
 * </pre>
 *
 * @param error   a stable machine-readable code, not prose — the frontend
 *                switches on this, while {@code message} is for humans
 * @param traceId present only on unexpected 500s, and matches a logged entry
 *                so a user-reported failure can be found in the logs
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ErrorResponse(
        Instant timestamp,
        int status,
        String error,
        String message,
        String path,
        String traceId,
        List<FieldError> fieldErrors
) {

    /** One rejected field from bean validation. */
    public record FieldError(String field, String message) {
    }

    public static ErrorResponse of(int status, String error, String message, String path) {
        return new ErrorResponse(Instant.now(), status, error, message, path, null, null);
    }

    public static ErrorResponse validation(int status, String message, String path,
                                           List<FieldError> fieldErrors) {
        return new ErrorResponse(Instant.now(), status, "VALIDATION_FAILED", message, path,
                null, fieldErrors);
    }

    public static ErrorResponse internal(String path, String traceId) {
        return new ErrorResponse(Instant.now(), 500, "INTERNAL_ERROR",
                "An unexpected error occurred. Quote the reference when reporting it.",
                path, traceId, null);
    }
}

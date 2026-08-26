package net.refound.api.common.exception;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import net.refound.api.common.response.ErrorResponse;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.NoHandlerFoundException;

import java.util.List;
import java.util.UUID;

/**
 * Turns every exception into the one error shape.
 *
 * <p>Controllers never build error bodies themselves. If you find yourself
 * returning a {@code ResponseEntity} with an error inside a controller, throw
 * instead and add a handler here.
 *
 * <p>Two rules hold throughout:
 * <ul>
 *   <li><b>Never leak internals.</b> Stack traces, SQL, and constraint names go
 *       to the log, never to the client.</li>
 *   <li><b>Never confirm what the caller should not know.</b> Authentication
 *       failures are deliberately vague about whether an account exists.</li>
 * </ul>
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    /** Everything a service throws deliberately. */
    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ErrorResponse> handleApi(ApiException ex, HttpServletRequest request) {
        log.debug("{} at {}: {}", ex.getErrorCode(), request.getRequestURI(), ex.getMessage());
        return ResponseEntity
                .status(ex.getStatus())
                .body(ErrorResponse.of(ex.getStatus().value(), ex.getErrorCode(),
                        ex.getMessage(), request.getRequestURI()));
    }

    /** A DTO failed bean validation — reports every rejected field at once. */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex,
                                                          HttpServletRequest request) {
        List<ErrorResponse.FieldError> fieldErrors = ex.getBindingResult().getFieldErrors().stream()
                .map(error -> new ErrorResponse.FieldError(error.getField(), error.getDefaultMessage()))
                .toList();

        return ResponseEntity.badRequest().body(ErrorResponse.validation(
                HttpStatus.BAD_REQUEST.value(), "Request validation failed",
                request.getRequestURI(), fieldErrors));
    }

    /** Validation on a path variable or request parameter rather than a body. */
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ErrorResponse> handleConstraintViolation(ConstraintViolationException ex,
                                                                   HttpServletRequest request) {
        List<ErrorResponse.FieldError> fieldErrors = ex.getConstraintViolations().stream()
                .map(violation -> new ErrorResponse.FieldError(
                        violation.getPropertyPath().toString(), violation.getMessage()))
                .toList();

        return ResponseEntity.badRequest().body(ErrorResponse.validation(
                HttpStatus.BAD_REQUEST.value(), "Request validation failed",
                request.getRequestURI(), fieldErrors));
    }

    /** Malformed JSON, or a value that cannot be parsed into the target type. */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleUnreadable(HttpMessageNotReadableException ex,
                                                          HttpServletRequest request) {
        log.debug("Malformed request body at {}: {}", request.getRequestURI(), ex.getMessage());
        return ResponseEntity.badRequest().body(ErrorResponse.of(
                HttpStatus.BAD_REQUEST.value(), "MALFORMED_REQUEST",
                "Request body is missing or malformed", request.getRequestURI()));
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ErrorResponse> handleMissingParam(MissingServletRequestParameterException ex,
                                                            HttpServletRequest request) {
        return ResponseEntity.badRequest().body(ErrorResponse.of(
                HttpStatus.BAD_REQUEST.value(), "MISSING_PARAMETER",
                "Required parameter '" + ex.getParameterName() + "' is missing",
                request.getRequestURI()));
    }

    /** e.g. a malformed UUID in the path. */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> handleTypeMismatch(MethodArgumentTypeMismatchException ex,
                                                            HttpServletRequest request) {
        return ResponseEntity.badRequest().body(ErrorResponse.of(
                HttpStatus.BAD_REQUEST.value(), "INVALID_PARAMETER",
                "Parameter '" + ex.getName() + "' has an invalid value",
                request.getRequestURI()));
    }

    /**
     * A database constraint rejected the write — a duplicate email, a check
     * constraint, a broken foreign key.
     *
     * <p>Services should catch these cases first and throw a
     * {@link ConflictException} with a useful message. Reaching here means one
     * slipped through, so it is logged at warn: the generic response is correct
     * for the client, but somebody should look at it.
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> handleDataIntegrity(DataIntegrityViolationException ex,
                                                             HttpServletRequest request) {
        log.warn("Unhandled data integrity violation at {}", request.getRequestURI(), ex);
        return ResponseEntity.status(HttpStatus.CONFLICT).body(ErrorResponse.of(
                HttpStatus.CONFLICT.value(), "CONFLICT",
                "The request conflicts with existing data", request.getRequestURI()));
    }

    /**
     * A failed login or an invalid refresh token.
     *
     * <p>Reaches here rather than the security entry point because it is thrown
     * inside a controller, not in the filter chain. The message stays generic —
     * distinguishing "no such account" from "wrong password" would turn login
     * into an account-enumeration oracle.
     */
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ErrorResponse> handleAuthentication(AuthenticationException ex,
                                                              HttpServletRequest request) {
        log.debug("Authentication failed at {}: {}", request.getRequestURI(), ex.getMessage());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ErrorResponse.of(
                HttpStatus.UNAUTHORIZED.value(), "INVALID_CREDENTIALS",
                ex.getMessage(), request.getRequestURI()));
    }

    /** Thrown by @PreAuthorize and by method-level security checks. */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(AccessDeniedException ex,
                                                            HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ErrorResponse.of(
                HttpStatus.FORBIDDEN.value(), "FORBIDDEN",
                "You do not have permission to perform this action",
                request.getRequestURI()));
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ErrorResponse> handleMethodNotSupported(HttpRequestMethodNotSupportedException ex,
                                                                  HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED).body(ErrorResponse.of(
                HttpStatus.METHOD_NOT_ALLOWED.value(), "METHOD_NOT_ALLOWED",
                "Method " + ex.getMethod() + " is not supported for this endpoint",
                request.getRequestURI()));
    }

    @ExceptionHandler(NoHandlerFoundException.class)
    public ResponseEntity<ErrorResponse> handleNoHandler(NoHandlerFoundException ex,
                                                         HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ErrorResponse.of(
                HttpStatus.NOT_FOUND.value(), "NOT_FOUND",
                "No endpoint matches this request", request.getRequestURI()));
    }

    /**
     * Anything unanticipated. A trace id links the opaque client response to the
     * full stack trace in the log, so a user can report "reference abc123" and
     * it can be found.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleUnexpected(Exception ex, HttpServletRequest request) {
        String traceId = UUID.randomUUID().toString().substring(0, 8);
        log.error("Unhandled exception [{}] at {}", traceId, request.getRequestURI(), ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ErrorResponse.internal(request.getRequestURI(), traceId));
    }
}

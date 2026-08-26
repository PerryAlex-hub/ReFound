package net.refound.api.common.exception;

import org.springframework.http.HttpStatus;

/**
 * The requested resource does not exist — or the caller is not entitled to know
 * that it does.
 *
 * <p>Deliberately used in place of 403 wherever a 403 would confirm existence.
 * "Claim 7f3a… is not yours" tells an attacker that claim 7f3a exists; "not
 * found" tells them nothing.
 */
public class NotFoundException extends ApiException {

    public NotFoundException(String message) {
        super(HttpStatus.NOT_FOUND, "NOT_FOUND", message);
    }

    /** e.g. {@code notFound("Item", id)} produces "Item not found". */
    public static NotFoundException of(String resource) {
        return new NotFoundException(resource + " not found");
    }
}

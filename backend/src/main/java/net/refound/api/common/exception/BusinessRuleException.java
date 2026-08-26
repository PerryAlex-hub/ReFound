package net.refound.api.common.exception;

import org.springframework.http.HttpStatus;

/**
 * The request was well-formed and permitted, but breaks a rule of the domain:
 * approving a claim that is already decided, claiming your own found item,
 * confirming a handover before approval.
 *
 * <p>422 rather than 400 — nothing is wrong with the request itself.
 */
public class BusinessRuleException extends ApiException {

    public BusinessRuleException(String message) {
        super(HttpStatus.UNPROCESSABLE_CONTENT, "BUSINESS_RULE_VIOLATION", message);
    }
}

package net.refound.api.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Registration payload.
 *
 * <p>Note what is absent: no {@code role}, no {@code status}, no {@code
 * emailVerified}. A DTO that accepted those would let anyone register as an
 * administrator — the reason entities are never bound directly to request
 * bodies.
 */
public record RegisterRequest(

        @NotBlank(message = "Full name is required")
        @Size(max = 120, message = "Full name must be at most 120 characters")
        String fullName,

        @NotBlank(message = "Matric number is required")
        @Size(max = 30, message = "Matric number must be at most 30 characters")
        String matricNumber,

        @NotBlank(message = "Email is required")
        @Email(message = "Must be a valid email address")
        @Size(max = 200, message = "Email must be at most 200 characters")
        String email,

        /*
         * Permissive on purpose: accepts 08031234567, +234 803 123 4567, and
         * the variations in between. Over-strict phone validation rejects real
         * numbers, and the cost of a wrong number here is only a failed
         * handover, not a security hole.
         */
        @NotBlank(message = "Phone number is required")
        @Pattern(regexp = "^[+]?[0-9\\s-]{7,20}$", message = "Must be a valid phone number")
        String phoneNumber,

        @NotBlank(message = "Password is required")
        @Size(min = 8, max = 100, message = "Password must be between 8 and 100 characters")
        String password
) {
}

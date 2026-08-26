package net.refound.api.user.repository;

import net.refound.api.user.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

/**
 * Lookups are case-insensitive to match the unique indexes on lower(email) and
 * lower(matric_number). Querying by the raw column would miss rows and let a
 * duplicate account slip past the pre-check, only to fail at insert.
 */
public interface UserRepository extends JpaRepository<User, UUID> {

    @Query("select u from User u where lower(u.email) = lower(:email)")
    Optional<User> findByEmailIgnoreCase(@Param("email") String email);

    @Query("select count(u) > 0 from User u where lower(u.email) = lower(:email)")
    boolean existsByEmailIgnoreCase(@Param("email") String email);

    @Query("select count(u) > 0 from User u where lower(u.matricNumber) = lower(:matricNumber)")
    boolean existsByMatricNumberIgnoreCase(@Param("matricNumber") String matricNumber);

    boolean existsByPhoneNumber(String phoneNumber);
}

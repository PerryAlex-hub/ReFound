package net.refound.api.admin;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.refound.api.admin.dto.AdminStatsResponse;
import net.refound.api.auth.AuthPrincipal;
import net.refound.api.auth.RefreshTokenRevoker;
import net.refound.api.claim.domain.ClaimStatus;
import net.refound.api.claim.repository.ClaimRepository;
import net.refound.api.common.audit.AuditService;
import net.refound.api.common.exception.BusinessRuleException;
import net.refound.api.common.exception.NotFoundException;
import net.refound.api.item.domain.Item;
import net.refound.api.item.domain.ItemStatus;
import net.refound.api.item.domain.ItemType;
import net.refound.api.item.repository.ItemRepository;
import net.refound.api.matching.domain.MatchStatus;
import net.refound.api.matching.repository.ItemMatchRepository;
import net.refound.api.user.domain.Role;
import net.refound.api.user.domain.User;
import net.refound.api.user.domain.UserStatus;
import net.refound.api.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Moderation, account administration, and service statistics.
 *
 * <p>Every action here is audited. Hiding someone's report or suspending their
 * account is the sort of thing that gets questioned later, and "an admin did
 * it, we don't know which one or why" is not an acceptable answer.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AdminService {

    private final ItemRepository itemRepository;
    private final UserRepository userRepository;
    private final ClaimRepository claimRepository;
    private final ItemMatchRepository itemMatchRepository;
    private final AuditService auditService;
    private final RefreshTokenRevoker refreshTokenRevoker;

    // ------------------------------------------------------------------
    // Item moderation
    // ------------------------------------------------------------------

    /**
     * Removes an item from browse without deleting it.
     *
     * <p>Hidden rather than deleted so the record survives: a moderated report
     * may be evidence in a later dispute, and the reporter can still see their
     * own item.
     */
    @Transactional
    public void hideItem(UUID itemId, String reason, AuthPrincipal adminPrincipal) {
        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> NotFoundException.of("Item"));

        if (item.isHidden()) {
            return;   // idempotent
        }

        User admin = userRepository.findById(adminPrincipal.id())
                .orElseThrow(() -> NotFoundException.of("User"));

        item.setHidden(true);
        auditService.record(admin, "ITEM", itemId, "ITEM_HIDDEN", Map.of("reason", reason));
        log.info("Admin {} hid item {}: {}", adminPrincipal.id(), itemId, reason);
    }

    @Transactional
    public void unhideItem(UUID itemId, AuthPrincipal adminPrincipal) {
        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> NotFoundException.of("Item"));

        if (!item.isHidden()) {
            return;
        }

        User admin = userRepository.findById(adminPrincipal.id())
                .orElseThrow(() -> NotFoundException.of("User"));

        item.setHidden(false);
        auditService.record(admin, "ITEM", itemId, "ITEM_UNHIDDEN");
    }

    // ------------------------------------------------------------------
    // Accounts
    // ------------------------------------------------------------------

    /**
     * Suspends an account and drops every active session.
     *
     * <p>Revoking the refresh tokens matters: without it a suspended user keeps
     * working until their access token expires, and can quietly refresh for
     * another thirty days.
     */
    @Transactional
    public void suspendUser(UUID userId, String reason, AuthPrincipal adminPrincipal) {
        User target = userRepository.findById(userId)
                .orElseThrow(() -> NotFoundException.of("User"));

        if (target.getId().equals(adminPrincipal.id())) {
            throw new BusinessRuleException("You cannot suspend your own account");
        }
        if (target.getRole() == Role.ADMIN) {
            throw new BusinessRuleException(
                    "Demote this administrator before suspending the account");
        }

        User admin = userRepository.findById(adminPrincipal.id())
                .orElseThrow(() -> NotFoundException.of("User"));

        target.setStatus(UserStatus.SUSPENDED);
        refreshTokenRevoker.revokeAllSessions(target.getId());

        auditService.record(admin, "USER", userId, "USER_SUSPENDED", Map.of("reason", reason));
        log.warn("Admin {} suspended user {}: {}", adminPrincipal.id(), userId, reason);
    }

    @Transactional
    public void reactivateUser(UUID userId, AuthPrincipal adminPrincipal) {
        User target = userRepository.findById(userId)
                .orElseThrow(() -> NotFoundException.of("User"));

        User admin = userRepository.findById(adminPrincipal.id())
                .orElseThrow(() -> NotFoundException.of("User"));

        target.setStatus(UserStatus.ACTIVE);
        auditService.record(admin, "USER", userId, "USER_REACTIVATED");
    }

    /**
     * Promotes a student to administrator.
     *
     * <p>Only an existing admin can do this, so the first one still has to be
     * created directly in the database — deliberately. An API that can mint its
     * own first administrator is an API anyone can mint one through.
     */
    @Transactional
    public void promoteToAdmin(UUID userId, AuthPrincipal adminPrincipal) {
        User target = userRepository.findById(userId)
                .orElseThrow(() -> NotFoundException.of("User"));

        if (target.getStatus() == UserStatus.SUSPENDED) {
            throw new BusinessRuleException("Reactivate this account before promoting it");
        }

        User admin = userRepository.findById(adminPrincipal.id())
                .orElseThrow(() -> NotFoundException.of("User"));

        target.setRole(Role.ADMIN);
        auditService.record(admin, "USER", userId, "USER_PROMOTED_TO_ADMIN");
        log.warn("Admin {} promoted user {} to ADMIN", adminPrincipal.id(), userId);
    }

    @Transactional
    public void demoteToStudent(UUID userId, AuthPrincipal adminPrincipal) {
        User target = userRepository.findById(userId)
                .orElseThrow(() -> NotFoundException.of("User"));

        if (target.getId().equals(adminPrincipal.id())) {
            // Otherwise the last admin could lock everyone out of the queue.
            throw new BusinessRuleException("You cannot demote your own account");
        }

        User admin = userRepository.findById(adminPrincipal.id())
                .orElseThrow(() -> NotFoundException.of("User"));

        target.setRole(Role.STUDENT);
        auditService.record(admin, "USER", userId, "USER_DEMOTED_TO_STUDENT");
    }

    // ------------------------------------------------------------------
    // Statistics
    // ------------------------------------------------------------------

    @Transactional(readOnly = true)
    public AdminStatsResponse stats() {
        long found = itemRepository.countByType(ItemType.FOUND);
        long returned = itemRepository.countByStatus(ItemStatus.RETURNED);

        Map<String, Long> claimsByStatus = new LinkedHashMap<>();
        for (ClaimStatus status : ClaimStatus.values()) {
            claimsByStatus.put(status.name(), claimRepository.countByStatus(status));
        }

        return new AdminStatsResponse(
                userRepository.count(),
                userRepository.countByStatus(UserStatus.SUSPENDED),

                itemRepository.count(),
                itemRepository.countByType(ItemType.LOST),
                found,
                itemRepository.countByStatus(ItemStatus.OPEN),
                returned,
                itemRepository.countByStatus(ItemStatus.EXPIRED),

                // Of the items people handed in, how many got home. The honest
                // measure of whether any of this works.
                percentage(returned, found),

                claimsByStatus,
                round(claimRepository.findMedianReviewHours()),

                itemMatchRepository.countByStatus(MatchStatus.SUGGESTED),
                itemMatchRepository.countByStatus(MatchStatus.DISMISSED),
                itemMatchRepository.countByStatus(MatchStatus.CLAIMED));
    }

    private double percentage(long numerator, long denominator) {
        if (denominator == 0) {
            return 0.0;
        }
        return BigDecimal.valueOf(numerator * 100.0 / denominator)
                .setScale(1, RoundingMode.HALF_UP).doubleValue();
    }

    private Double round(Double value) {
        return value == null ? null
                : BigDecimal.valueOf(value).setScale(1, RoundingMode.HALF_UP).doubleValue();
    }
}

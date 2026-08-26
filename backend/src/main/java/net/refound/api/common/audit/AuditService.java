package net.refound.api.common.audit;

import lombok.RequiredArgsConstructor;
import net.refound.api.user.domain.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.UUID;

/**
 * Writes the append-only audit trail.
 *
 * <p>Records participate in the caller's transaction ({@code MANDATORY}), so an
 * audit row can never survive a rolled-back change or vice versa. If this throws
 * "no existing transaction", the caller is missing {@code @Transactional} — that
 * is the point, not a bug.
 *
 * <p>Anything a human could later dispute gets an entry: claim decisions,
 * contact releases, moderation, account suspension.
 */
@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditEventRepository auditEventRepository;

    /**
     * @param actor      who acted, or null for the system (expiry sweeps,
     *                   automatic matching)
     * @param entityType e.g. "USER", "ITEM", "CLAIM"
     * @param action     e.g. "USER_REGISTERED", "CLAIM_APPROVED"
     * @param metadata   anything worth keeping: the reason given, previous state
     */
    @Transactional(propagation = Propagation.MANDATORY)
    public void record(User actor, String entityType, UUID entityId,
                       String action, Map<String, Object> metadata) {

        AuditEvent event = new AuditEvent();
        event.setActor(actor);
        event.setEntityType(entityType);
        event.setEntityId(entityId);
        event.setAction(action);
        event.setMetadata(metadata == null ? Map.of() : metadata);

        auditEventRepository.save(event);
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public void record(User actor, String entityType, UUID entityId, String action) {
        record(actor, entityType, entityId, action, Map.of());
    }
}

package net.refound.api.common.audit;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

/**
 * Append-only. Deliberately exposes no update or delete method — the inherited
 * {@code delete*} operations must never be called on audit rows.
 */
public interface AuditEventRepository extends JpaRepository<AuditEvent, UUID> {

    Page<AuditEvent> findByEntityTypeAndEntityIdOrderByCreatedAtDesc(
            String entityType, UUID entityId, Pageable pageable);

    Page<AuditEvent> findByActorIdOrderByCreatedAtDesc(UUID actorId, Pageable pageable);
}

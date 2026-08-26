package net.refound.api.notification.repository;

import net.refound.api.notification.domain.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    Page<Notification> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    long countByUserIdAndReadAtIsNull(UUID userId);

    /** The outbox: persisted but not yet dispatched. */
    @Query("select n from Notification n where n.sentAt is null order by n.createdAt asc")
    List<Notification> findPending(Pageable pageable);
}

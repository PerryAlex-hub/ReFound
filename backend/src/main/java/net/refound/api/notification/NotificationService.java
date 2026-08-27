package net.refound.api.notification;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.refound.api.notification.domain.Notification;
import net.refound.api.notification.domain.NotificationChannel;
import net.refound.api.notification.domain.NotificationType;
import net.refound.api.notification.repository.NotificationRepository;
import net.refound.api.user.domain.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

/**
 * Records notifications for users.
 *
 * <p>Currently in-app only: rows are persisted and read back through
 * {@code /api/notifications}. Email dispatch is deliberately not wired up yet —
 * when it is, it reads the same rows, sets {@code sentAt}, and nothing else in
 * the codebase changes. That is why every notification is persisted first
 * rather than sent inline.
 *
 * <p>{@code MANDATORY} propagation ties each record to the caller's
 * transaction: a notification saying a claim was approved must not survive a
 * rollback of the approval itself.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    @Transactional(propagation = Propagation.MANDATORY)
    public void notify(User recipient, NotificationType type, Map<String, Object> payload) {
        Notification notification = new Notification();
        notification.setUser(recipient);
        notification.setType(type);
        notification.setPayload(payload == null ? Map.of() : payload);
        notification.setChannel(NotificationChannel.IN_APP);

        notificationRepository.save(notification);
        log.debug("Notified user {} of {}", recipient.getId(), type);
    }
}

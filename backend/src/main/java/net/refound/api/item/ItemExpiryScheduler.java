package net.refound.api.item;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.refound.api.common.audit.AuditService;
import net.refound.api.item.domain.Item;
import net.refound.api.item.domain.ItemStatus;
import net.refound.api.item.domain.ItemType;
import net.refound.api.item.repository.ItemRepository;
import net.refound.api.notification.NotificationService;
import net.refound.api.notification.domain.NotificationType;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;

/**
 * Retires reports nobody acted on.
 *
 * <p>Without this the browse list fills with months-old reports and stops being
 * useful — the fate of every physical notice board this system replaces.
 *
 * <p>Two passes, daily:
 * <ol>
 *   <li><b>Warn</b> reporters a week before expiry, so they can say the item is
 *       still missing, or that they are still holding it.</li>
 *   <li><b>Expire</b> anything past its date. The row survives; it just leaves
 *       the default browse view.</li>
 * </ol>
 *
 * <p>A found item that expires is the awkward case: a real object is still
 * sitting in someone's drawer. The notification tells the finder where to hand
 * it in — a person, not a cron job, has to close that loop.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ItemExpiryScheduler {

    private static final Duration WARN_BEFORE = Duration.ofDays(7);

    private final ItemRepository itemRepository;
    private final NotificationService notificationService;
    private final AuditService auditService;

    /**
     * Runs at 03:00 daily — quiet hours, and late enough that a report filed
     * on its ninetieth day still gets its full span.
     *
     * <p>The expression is a property so it can be driven fast in a test run
     * without waiting for the small hours.
     *
     * <p>In a multi-instance deployment this would need a lock so two servers
     * do not both sweep. Single instance for now, which is the honest scope.
     */
    @Scheduled(cron = "${app.items.expiry-cron:0 0 3 * * *}")
    @Transactional
    public void sweep() {
        int warned = sendExpiryWarnings();
        int expired = expireOverdueItems();

        if (warned > 0 || expired > 0) {
            log.info("Expiry sweep: warned {}, expired {}", warned, expired);
        }
    }

    private int sendExpiryWarnings() {
        Instant now = Instant.now();
        List<Item> approaching = itemRepository.findItemsNeedingExpiryWarning(now, now.plus(WARN_BEFORE));

        for (Item item : approaching) {
            notificationService.notify(item.getReporter(), NotificationType.ITEM_EXPIRING,
                    Map.of("itemId", item.getId().toString(),
                            "itemTitle", item.getTitle(),
                            "expiresAt", item.getExpiresAt().toString(),
                            // Found items need a real-world action, not just a click.
                            "action", item.getType() == ItemType.FOUND
                                    ? "STILL_HOLDING_IT"
                                    : "STILL_MISSING"));

            item.setExpiryWarnedAt(now);
        }
        return approaching.size();
    }

    private int expireOverdueItems() {
        List<Item> overdue = itemRepository.findExpiredOpenItems(Instant.now());

        for (Item item : overdue) {
            item.setStatus(ItemStatus.EXPIRED);
            // Actor is null: the system did this, not a person.
            auditService.record(null, "ITEM", item.getId(), "ITEM_EXPIRED",
                    Map.of("type", item.getType().name()));
        }
        return overdue.size();
    }
}

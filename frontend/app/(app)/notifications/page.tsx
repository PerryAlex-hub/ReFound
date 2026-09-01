'use client';

import { useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import useSWR, { mutate } from 'swr';
import gsap from 'gsap';
import { getNotifications, markNotificationRead } from '@/lib/api/notifications';
import { NotificationItem } from '@/components/notifications/NotificationItem';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { TopBar } from '@/components/layout/TopBar';
import { toast } from '@/components/ui/Toast';


export default function NotificationsPage() {
  const listRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useSWR(
    'notifications',
    () => getNotifications({ size: 50 }),
    { revalidateOnFocus: false }
  );

  useEffect(() => {
    // Guard on length too — gsap.from() against a selector that matches nothing (the
    // empty-state render has no .notif-item-anim elements) logs a console warning.
    if (!isLoading && data && data.content.length > 0) {
      const ctx = gsap.context(() => {
        gsap.from('.notif-item-anim', { opacity: 0, y: 14, stagger: 0.06, duration: 0.4, ease: 'power2.out' });
      });
      return () => ctx.revert();
    }
  }, [isLoading, data]);

  const handleRead = async (id: string) => {
    try {
      await markNotificationRead(id);
      await mutate('notifications');
      await mutate('unread-count');
    } catch { /* silent */ }
  };

  const handleMarkAll = async () => {
    const unread = data?.content.filter((n) => !n.readAt) ?? [];
    await Promise.all(unread.map((n) => markNotificationRead(n.id).catch(() => {})));
    await mutate('notifications');
    await mutate('unread-count');
    toast('All marked as read.', 'success');
  };

  const unreadCount = data?.content.filter((n) => !n.readAt).length ?? 0;

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar
        title="Notifications"
        trailing={
          unreadCount > 0 ? (
            <div className="flex items-center gap-3">
              <span className="bg-[#F97316] text-white text-xs font-bold px-2.5 py-1 rounded-full">
                {unreadCount} New
              </span>
              <button
                onClick={handleMarkAll}
                className="text-xs font-bold text-[#F97316] hover:opacity-80"
              >
                Mark all as read
              </button>
            </div>
          ) : undefined
        }
      />

      <div ref={listRef} className="px-4 pb-6 flex flex-col gap-3">
        {isLoading ? (
          <ListSkeleton count={4} />
        ) : !data?.content.length ? (
          <EmptyState
            icon={<Bell size={24} />}
            title="No notifications"
            description="You're all caught up. Notifications will appear here."
          />
        ) : (
          data.content.map((n) => (
            <div key={n.id} className="notif-item-anim">
              <NotificationItem notification={n} onRead={handleRead} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

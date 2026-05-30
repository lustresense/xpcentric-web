import { useCallback, useEffect, useState } from 'react';
import { apiGet, apiPost } from '@/lib/api';

export interface AppNotification {
  id: number;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  entityType?: string;
  entityId?: string;
  createdAt: string;
}

export function useNotifications(authToken?: string | null) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const refreshUnreadCount = useCallback(async () => {
    if (!authToken) {
      setUnreadCount(0);
      return;
    }
    try {
      const countData = await apiGet<{ unread: number }>('/notifications/count', authToken);
      setUnreadCount(Number(countData.unread || 0));
    } catch {
      // Notification polling is best-effort and should not break navigation.
    }
  }, [authToken]);

  const refreshNotifications = useCallback(async () => {
    if (!authToken) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    setLoading(true);
    try {
      const [countData, listData] = await Promise.all([
        apiGet<{ unread: number }>('/notifications/count', authToken),
        apiGet<{ notifications: AppNotification[] }>('/notifications', authToken),
      ]);
      setUnreadCount(Number(countData.unread || 0));
      setNotifications(Array.isArray(listData.notifications) ? listData.notifications : []);
    } catch {
      // best-effort
    } finally {
      setLoading(false);
    }
  }, [authToken]);

  const markNotificationRead = useCallback(async (notificationId: number) => {
    if (!authToken) {
      return;
    }
    try {
      await apiPost(`/notifications/${notificationId}/read`, {}, authToken);
      setNotifications((prev) => prev.map((item) => (
        item.id === notificationId ? { ...item, isRead: true } : item
      )));
      setUnreadCount((prev) => (prev > 0 ? prev - 1 : 0));
    } catch {
      // best-effort
    }
  }, [authToken]);

  useEffect(() => {
    if (!authToken) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    refreshNotifications();
    const timer = window.setInterval(() => {
      refreshUnreadCount();
    }, 30_000);
    return () => window.clearInterval(timer);
  }, [authToken, refreshNotifications, refreshUnreadCount]);

  return {
    notifications,
    unreadCount,
    loading,
    refreshNotifications,
    refreshUnreadCount,
    markNotificationRead,
  };
}

import { useState, useEffect, useCallback } from 'react';
import {
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  isInWatchlist,
  updateWatchlistItem,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearAllNotifications,
  getUnreadCount,
  WatchlistItem,
  Notification,
} from '@/services/watchlistService';
import { useToast } from '@/hooks/use-toast';

export function useWatchlist() {
  const { toast } = useToast();
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load watchlist and notifications on mount
  useEffect(() => {
    loadWatchlist();
    loadNotifications();
  }, []);

  const loadWatchlist = useCallback(() => {
    setWatchlist(getWatchlist());
  }, []);

  const loadNotifications = useCallback(() => {
    const notifs = getNotifications();
    setNotifications(notifs);
    setUnreadCount(getUnreadCount());
  }, []);

  const addListing = useCallback(
    (
      listingId: number,
      options?: {
        notifyOnPriceChange?: boolean;
        notifyOnExpiration?: boolean;
        targetPrice?: number;
      }
    ) => {
      const success = addToWatchlist(listingId, options);
      
      if (success) {
        loadWatchlist();
        toast({
          title: 'Added to Watchlist',
          description: `Listing #${listingId} has been added to your watchlist.`,
        });
      } else {
        toast({
          title: 'Already in Watchlist',
          description: 'This listing is already in your watchlist.',
          variant: 'destructive',
        });
      }
      
      return success;
    },
    [loadWatchlist, toast]
  );

  const removeListing = useCallback(
    (listingId: number) => {
      const success = removeFromWatchlist(listingId);
      
      if (success) {
        loadWatchlist();
        toast({
          title: 'Removed from Watchlist',
          description: `Listing #${listingId} has been removed from your watchlist.`,
        });
      }
      
      return success;
    },
    [loadWatchlist, toast]
  );

  const toggleListing = useCallback(
    (listingId: number) => {
      if (isInWatchlist(listingId)) {
        return removeListing(listingId);
      } else {
        return addListing(listingId);
      }
    },
    [addListing, removeListing]
  );

  const updateItem = useCallback(
    (listingId: number, updates: Partial<Omit<WatchlistItem, 'listingId' | 'addedAt'>>) => {
      const success = updateWatchlistItem(listingId, updates);
      
      if (success) {
        loadWatchlist();
      }
      
      return success;
    },
    [loadWatchlist]
  );

  const markAsRead = useCallback(
    (notificationId: string) => {
      markNotificationAsRead(notificationId);
      loadNotifications();
    },
    [loadNotifications]
  );

  const markAllAsRead = useCallback(() => {
    markAllNotificationsAsRead();
    loadNotifications();
  }, [loadNotifications]);

  const deleteNotif = useCallback(
    (notificationId: string) => {
      deleteNotification(notificationId);
      loadNotifications();
    },
    [loadNotifications]
  );

  const clearAllNotifs = useCallback(() => {
    clearAllNotifications();
    loadNotifications();
  }, [loadNotifications]);

  return {
    watchlist,
    notifications,
    unreadCount,
    isWatching: isInWatchlist,
    addListing,
    removeListing,
    toggleListing,
    updateItem,
    markAsRead,
    markAllAsRead,
    deleteNotification: deleteNotif,
    clearAllNotifications: clearAllNotifs,
    refresh: () => {
      loadWatchlist();
      loadNotifications();
    },
  };
}


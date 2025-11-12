// Watchlist/Favorites service for marketplace listings

const WATCHLIST_KEY = 'carbon_vault_watchlist';
const NOTIFICATIONS_KEY = 'carbon_vault_notifications';

export interface WatchlistItem {
  listingId: number;
  addedAt: string;
  notifyOnPriceChange: boolean;
  notifyOnExpiration: boolean;
  targetPrice?: number;
}

export interface Notification {
  id: string;
  listingId: number;
  type: 'price_change' | 'expiration' | 'sold' | 'cancelled';
  message: string;
  timestamp: string;
  read: boolean;
}

// Get watchlist from localStorage
export function getWatchlist(): WatchlistItem[] {
  try {
    const stored = localStorage.getItem(WATCHLIST_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading watchlist:', error);
    return [];
  }
}

// Save watchlist to localStorage
export function saveWatchlist(watchlist: WatchlistItem[]): void {
  try {
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(watchlist));
  } catch (error) {
    console.error('Error saving watchlist:', error);
  }
}

// Add listing to watchlist
export function addToWatchlist(
  listingId: number,
  options: {
    notifyOnPriceChange?: boolean;
    notifyOnExpiration?: boolean;
    targetPrice?: number;
  } = {}
): boolean {
  try {
    const watchlist = getWatchlist();
    
    // Check if already in watchlist
    if (watchlist.some(item => item.listingId === listingId)) {
      return false;
    }
    
    const newItem: WatchlistItem = {
      listingId,
      addedAt: new Date().toISOString(),
      notifyOnPriceChange: options.notifyOnPriceChange ?? true,
      notifyOnExpiration: options.notifyOnExpiration ?? true,
      targetPrice: options.targetPrice,
    };
    
    watchlist.push(newItem);
    saveWatchlist(watchlist);
    return true;
  } catch (error) {
    console.error('Error adding to watchlist:', error);
    return false;
  }
}

// Remove listing from watchlist
export function removeFromWatchlist(listingId: number): boolean {
  try {
    const watchlist = getWatchlist();
    const filtered = watchlist.filter(item => item.listingId !== listingId);
    
    if (filtered.length === watchlist.length) {
      return false; // Item not found
    }
    
    saveWatchlist(filtered);
    return true;
  } catch (error) {
    console.error('Error removing from watchlist:', error);
    return false;
  }
}

// Check if listing is in watchlist
export function isInWatchlist(listingId: number): boolean {
  const watchlist = getWatchlist();
  return watchlist.some(item => item.listingId === listingId);
}

// Update watchlist item settings
export function updateWatchlistItem(
  listingId: number,
  updates: Partial<Omit<WatchlistItem, 'listingId' | 'addedAt'>>
): boolean {
  try {
    const watchlist = getWatchlist();
    const index = watchlist.findIndex(item => item.listingId === listingId);
    
    if (index === -1) {
      return false;
    }
    
    watchlist[index] = { ...watchlist[index], ...updates };
    saveWatchlist(watchlist);
    return true;
  } catch (error) {
    console.error('Error updating watchlist item:', error);
    return false;
  }
}

// Get notifications
export function getNotifications(): Notification[] {
  try {
    const stored = localStorage.getItem(NOTIFICATIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading notifications:', error);
    return [];
  }
}

// Save notifications
export function saveNotifications(notifications: Notification[]): void {
  try {
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
  } catch (error) {
    console.error('Error saving notifications:', error);
  }
}

// Add notification
export function addNotification(
  listingId: number,
  type: Notification['type'],
  message: string
): void {
  try {
    const notifications = getNotifications();
    
    const newNotification: Notification = {
      id: `notif-${Date.now()}-${Math.random()}`,
      listingId,
      type,
      message,
      timestamp: new Date().toISOString(),
      read: false,
    };
    
    notifications.unshift(newNotification);
    
    // Keep only last 50 notifications
    if (notifications.length > 50) {
      notifications.splice(50);
    }
    
    saveNotifications(notifications);
  } catch (error) {
    console.error('Error adding notification:', error);
  }
}

// Mark notification as read
export function markNotificationAsRead(notificationId: string): void {
  try {
    const notifications = getNotifications();
    const notification = notifications.find(n => n.id === notificationId);
    
    if (notification) {
      notification.read = true;
      saveNotifications(notifications);
    }
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
}

// Mark all notifications as read
export function markAllNotificationsAsRead(): void {
  try {
    const notifications = getNotifications();
    notifications.forEach(n => n.read = true);
    saveNotifications(notifications);
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
  }
}

// Get unread notification count
export function getUnreadCount(): number {
  const notifications = getNotifications();
  return notifications.filter(n => !n.read).length;
}

// Delete notification
export function deleteNotification(notificationId: string): void {
  try {
    const notifications = getNotifications();
    const filtered = notifications.filter(n => n.id !== notificationId);
    saveNotifications(filtered);
  } catch (error) {
    console.error('Error deleting notification:', error);
  }
}

// Clear all notifications
export function clearAllNotifications(): void {
  try {
    localStorage.removeItem(NOTIFICATIONS_KEY);
  } catch (error) {
    console.error('Error clearing notifications:', error);
  }
}

// Clear old notifications (older than 30 days)
export function clearOldNotifications(): void {
  try {
    const notifications = getNotifications();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const filtered = notifications.filter(n => 
      new Date(n.timestamp) > thirtyDaysAgo
    );
    
    saveNotifications(filtered);
  } catch (error) {
    console.error('Error clearing old notifications:', error);
  }
}

// Export watchlist data
export function exportWatchlist(): string {
  const watchlist = getWatchlist();
  return JSON.stringify(watchlist, null, 2);
}

// Import watchlist data
export function importWatchlist(data: string): boolean {
  try {
    const parsed = JSON.parse(data) as WatchlistItem[];
    
    // Validate structure
    if (!Array.isArray(parsed)) {
      return false;
    }
    
    for (const item of parsed) {
      if (typeof item.listingId !== 'number' || !item.addedAt) {
        return false;
      }
    }
    
    saveWatchlist(parsed);
    return true;
  } catch (error) {
    console.error('Error importing watchlist:', error);
    return false;
  }
}


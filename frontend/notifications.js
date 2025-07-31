// Notification Component for Frontend
class NotificationManager {
  constructor(apiBaseUrl) {
    this.apiBaseUrl = apiBaseUrl;
    this.notifications = [];
    this.unreadCount = 0;
    this.isOpen = false;
    this.init();
  }

  async init() {
    this.createNotificationUI();
    await this.loadNotifications();
    this.startPolling();
  }

  createNotificationUI() {
    // Create notification bell icon
    const notificationBell = document.createElement('div');
    notificationBell.className = 'notification-bell';
    notificationBell.innerHTML = `
      <div class="notification-icon" onclick="notificationManager.toggleNotifications()">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
        <span class="notification-badge" id="notificationBadge" style="display: none;">0</span>
      </div>
    `;

    // Create notification panel
    const notificationPanel = document.createElement('div');
    notificationPanel.className = 'notification-panel';
    notificationPanel.id = 'notificationPanel';
    notificationPanel.style.display = 'none';
    notificationPanel.innerHTML = `
      <div class="notification-header">
        <h3>Notifications</h3>
        <button onclick="notificationManager.markAllAsRead()" class="mark-all-read">Mark all read</button>
      </div>
      <div class="notification-list" id="notificationList">
        <div class="loading">Loading notifications...</div>
      </div>
    `;

    // Add to page
    const header = document.querySelector('header') || document.body;
    header.appendChild(notificationBell);
    header.appendChild(notificationPanel);

    // Add CSS
    this.addNotificationStyles();
  }

  addNotificationStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .notification-bell {
        position: relative;
        cursor: pointer;
        margin-left: 20px;
      }

      .notification-icon {
        position: relative;
        display: inline-block;
      }

      .notification-badge {
        position: absolute;
        top: -8px;
        right: -8px;
        background: #ef4444;
        color: white;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        font-size: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
      }

      .notification-panel {
        position: absolute;
        top: 60px;
        right: 20px;
        width: 400px;
        max-height: 500px;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        z-index: 1000;
        overflow: hidden;
      }

      .notification-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px;
        border-bottom: 1px solid #e5e7eb;
        background: #f9fafb;
      }

      .notification-header h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
      }

      .mark-all-read {
        background: none;
        border: none;
        color: #3b82f6;
        cursor: pointer;
        font-size: 14px;
        text-decoration: underline;
      }

      .notification-list {
        max-height: 400px;
        overflow-y: auto;
      }

      .notification-item {
        padding: 12px 16px;
        border-bottom: 1px solid #f3f4f6;
        cursor: pointer;
        transition: background-color 0.2s;
      }

      .notification-item:hover {
        background-color: #f9fafb;
      }

      .notification-item.unread {
        background-color: #eff6ff;
      }

      .notification-title {
        font-weight: 600;
        font-size: 14px;
        margin-bottom: 4px;
      }

      .notification-message {
        font-size: 13px;
        color: #6b7280;
        margin-bottom: 4px;
      }

      .notification-time {
        font-size: 12px;
        color: #9ca3af;
      }

      .loading {
        padding: 20px;
        text-align: center;
        color: #6b7280;
      }

      .empty-notifications {
        padding: 20px;
        text-align: center;
        color: #6b7280;
      }
    `;
    document.head.appendChild(style);
  }

           async loadNotifications() {
           try {
             const token = localStorage.getItem('authToken');
             if (!token) return;
       
             const response = await fetch(`${this.apiBaseUrl}/api/v1/notifications?limit=20`, {
               headers: {
                 'Authorization': `Bearer ${token}`
               }
             });
       
             // Handle token expiration
             if (response.status === 401) {
               console.log('Token expired in notifications, attempting refresh...');
               const refreshToken = localStorage.getItem('refreshToken');
               if (refreshToken) {
                 try {
                   const refreshResponse = await fetch(`${this.apiBaseUrl}/api/v1/auth/refresh`, {
                     method: 'POST',
                     headers: {
                       'Content-Type': 'application/json'
                     },
                     body: JSON.stringify({ refreshToken })
                   });
                   
                   const refreshData = await refreshResponse.json();
                   if (refreshData.success) {
                     localStorage.setItem('authToken', refreshData.data.token);
                     // Retry the notification request
                     const retryResponse = await fetch(`${this.apiBaseUrl}/api/v1/notifications?limit=20`, {
                       headers: {
                         'Authorization': `Bearer ${refreshData.data.token}`
                       }
                     });
                     
                     if (retryResponse.ok) {
                       const data = await retryResponse.json();
                       this.notifications = data.data.notifications;
                       this.unreadCount = data.data.pagination.unreadCount;
                       this.updateNotificationUI();
                     }
                   }
                 } catch (refreshError) {
                   console.error('Token refresh failed in notifications:', refreshError);
                 }
               }
               return;
             }
       
             if (response.ok) {
               const data = await response.json();
               this.notifications = data.data.notifications;
               this.unreadCount = data.data.pagination.unreadCount;
               this.updateNotificationUI();
             }
           } catch (error) {
             console.error('Failed to load notifications:', error);
           }
         }

  updateNotificationUI() {
    const badge = document.getElementById('notificationBadge');
    const list = document.getElementById('notificationList');

    // Update badge
    if (this.unreadCount > 0) {
      badge.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }

    // Update notification list
    if (this.notifications.length === 0) {
      list.innerHTML = '<div class="empty-notifications">No notifications</div>';
    } else {
      list.innerHTML = this.notifications.map(notification => `
        <div class="notification-item ${!notification.isRead ? 'unread' : ''}" 
             onclick="notificationManager.markAsRead('${notification.id}')">
          <div class="notification-title">${notification.title}</div>
          <div class="notification-message">${notification.message}</div>
          <div class="notification-time">${this.formatTime(notification.createdAt)}</div>
        </div>
      `).join('');
    }
  }

  formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  }

  toggleNotifications() {
    const panel = document.getElementById('notificationPanel');
    this.isOpen = !this.isOpen;
    panel.style.display = this.isOpen ? 'block' : 'none';
    
    if (this.isOpen) {
      this.loadNotifications();
    }
  }

  async markAsRead(notificationId) {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch(`${this.apiBaseUrl}/api/v1/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Update local state
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification) {
          notification.isRead = true;
          this.unreadCount = Math.max(0, this.unreadCount - 1);
          this.updateNotificationUI();
        }
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }

  async markAllAsRead() {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch(`${this.apiBaseUrl}/api/v1/notifications/read-all`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        this.notifications.forEach(n => n.isRead = true);
        this.unreadCount = 0;
        this.updateNotificationUI();
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }

  startPolling() {
    // Poll for new notifications every 30 seconds
    setInterval(() => {
      this.loadNotifications();
    }, 30000);
  }
}

// Initialize notification manager when page loads
let notificationManager;
document.addEventListener('DOMContentLoaded', () => {
  const apiBaseUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : `http://${window.location.hostname}:3000`;
  notificationManager = new NotificationManager(apiBaseUrl);
}); 
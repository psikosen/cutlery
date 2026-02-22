import React from 'react';
import type { Notification } from '../../types';
import { SystemNotification } from './SystemNotification';

interface NotificationStackProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
}

export function NotificationStack({ notifications, onDismiss }: NotificationStackProps) {
  if (notifications.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 12,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '90%',
      maxWidth: 420,
      zIndex: 1000,
      pointerEvents: 'none',
    }}>
      <div style={{ pointerEvents: 'auto' }}>
        {notifications.slice(0, 3).map(n => (
          <SystemNotification key={n.id} notification={n} onDismiss={onDismiss} />
        ))}
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import type { Notification } from '../../types';
import { DOMAIN_COLORS } from '../../types';

interface SystemNotificationProps {
  notification: Notification;
  onDismiss: (id: string) => void;
}

export function SystemNotification({ notification, onDismiss }: SystemNotificationProps) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => onDismiss(notification.id), 300);
    }, notification.duration || 3000);
    return () => clearTimeout(timer);
  }, [notification, onDismiss]);

  const color = notification.domain ? DOMAIN_COLORS[notification.domain] : '#00ccff';
  const isEvolution = notification.type === 'evolution';
  const isRank = notification.type === 'rank';

  return (
    <div style={{
      position: 'relative',
      padding: '12px 16px',
      marginBottom: 8,
      background: 'rgba(5, 2, 8, 0.95)',
      border: `1px solid ${color}60`,
      borderRadius: 4,
      boxShadow: `0 0 20px ${color}30, inset 0 0 20px ${color}10`,
      opacity: visible && !exiting ? 1 : 0,
      transform: visible && !exiting ? 'translateY(0)' : 'translateY(-20px)',
      transition: 'all 0.3s ease',
      fontFamily: 'Rajdhani, sans-serif',
    }}>
      {/* System header */}
      <div style={{
        fontSize: 10,
        letterSpacing: 3,
        color: color,
        marginBottom: 4,
        fontWeight: 600,
      }}>
        {isEvolution ? '⌜ EVOLUTION ⌝' : isRank ? '⌜ RANK UP ⌝' : '⌜ SYSTEM ⌝'}
      </div>
      <div style={{
        fontSize: 14,
        fontWeight: 700,
        color: '#fff',
        marginBottom: 2,
      }}>
        {notification.title}
      </div>
      <div style={{
        fontSize: 12,
        color: 'rgba(255,255,255,0.7)',
      }}>
        {notification.message}
      </div>
      {/* Corner brackets */}
      <div style={{ position: 'absolute', top: 2, left: 2, width: 8, height: 8, borderTop: `1px solid ${color}`, borderLeft: `1px solid ${color}` }} />
      <div style={{ position: 'absolute', top: 2, right: 2, width: 8, height: 8, borderTop: `1px solid ${color}`, borderRight: `1px solid ${color}` }} />
      <div style={{ position: 'absolute', bottom: 2, left: 2, width: 8, height: 8, borderBottom: `1px solid ${color}`, borderLeft: `1px solid ${color}` }} />
      <div style={{ position: 'absolute', bottom: 2, right: 2, width: 8, height: 8, borderBottom: `1px solid ${color}`, borderRight: `1px solid ${color}` }} />
    </div>
  );
}

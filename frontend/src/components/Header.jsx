import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Header({ title, description, portal, onPortalSwitch }) {
  const { user, agencyId } = useAuth();
  const [showPortalMenu, setShowPortalMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  useEffect(() => {
    if (portal === 'agency') {
      api.agency.getNotifications()
        .then((data) => {
          if (Array.isArray(data)) {
            setNotifications(data.map(n => ({
              id: n.id,
              text: `${n.title}: ${n.message}`,
              time: n.date || 'Recent',
              read: Boolean(n.read)
            })));
          }
        })
        .catch(() => setNotifications([]));
    }
  }, [portal, agencyId]);

  const getPortalLabel = () => {
    switch (portal) {
      case 'agency': return 'Agency Portal';
      case 'user': return 'Traveller App';
      case 'yatra-team': return 'Team Admin';
      default: return 'Portal Select';
    }
  };

  const getPortalIconColor = () => {
    switch (portal) {
      case 'agency': return '#2563EB';
      case 'user': return '#059669';
      case 'yatra-team': return '#6366F1';
      default: return '#64748B';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
    notifications.forEach(n => {
      if (!n.read) api.agency.markNotificationRead(n.id).catch(() => {});
    });
  };

  const userCode = user?.agency_id || user?.user_id || user?.id || agencyId;
  const userName = user?.name || getPortalLabel();
  const initials = userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || (portal === 'agency' ? 'AG' : 'TR');

  return (
    <header className="header">
      {/* Title / Description */}
      <div>
        <h2 className="header-title">{title}</h2>
        {description && (
          <p className="header-subtitle">{description}</p>
        )}
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', position: 'relative' }}>
        
        {/* Search */}
        <div className="header-search">
          <Icons.Search size={15} style={{ color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search anything..." 
          />
        </div>

        {/* Portal Switch Dropdown */}
        <div style={{ position: 'relative' }}>
          <button 
            onClick={() => { setShowPortalMenu(!showPortalMenu); setShowNotifMenu(false); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '7px 12px',
              borderRadius: '8px',
              background: '#fff',
              border: '1px solid var(--border)',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-xs)',
              transition: 'all var(--transition)'
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: getPortalIconColor() }}></span>
            {getPortalLabel()}
            <Icons.ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
          </button>

          {showPortalMenu && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: '42px',
              background: '#fff',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              boxShadow: 'var(--shadow-lg)',
              width: '190px',
              overflow: 'hidden',
              zIndex: 100,
              padding: '6px'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <button 
                  onClick={() => { onPortalSwitch('agency'); setShowPortalMenu(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px', width: '100%',
                    padding: '8px 12px', borderRadius: '7px', fontSize: '12px', textAlign: 'left',
                    color: portal === 'agency' ? '#2563EB' : 'var(--text-primary)',
                    background: portal === 'agency' ? 'rgba(37,99,235,0.08)' : 'transparent',
                    fontWeight: portal === 'agency' ? 700 : 500,
                    cursor: 'pointer', border: 'none'
                  }}
                >
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#2563EB' }}></span>
                  Agency Portal
                </button>
                <button 
                  onClick={() => { onPortalSwitch('user'); setShowPortalMenu(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px', width: '100%',
                    padding: '8px 12px', borderRadius: '7px', fontSize: '12px', textAlign: 'left',
                    color: portal === 'user' ? '#059669' : 'var(--text-primary)',
                    background: portal === 'user' ? 'rgba(5,150,105,0.08)' : 'transparent',
                    fontWeight: portal === 'user' ? 700 : 500,
                    cursor: 'pointer', border: 'none'
                  }}
                >
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#059669' }}></span>
                  Traveller Portal
                </button>
                <button 
                  onClick={() => { onPortalSwitch('yatra-team'); setShowPortalMenu(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px', width: '100%',
                    padding: '8px 12px', borderRadius: '7px', fontSize: '12px', textAlign: 'left',
                    color: portal === 'yatra-team' ? '#6366F1' : 'var(--text-primary)',
                    background: portal === 'yatra-team' ? 'rgba(99,102,241,0.08)' : 'transparent',
                    fontWeight: portal === 'yatra-team' ? 700 : 500,
                    cursor: 'pointer', border: 'none'
                  }}
                >
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#6366F1' }}></span>
                  Team Admin
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Notifications Bell */}
        <div style={{ position: 'relative' }}>
          <button 
            onClick={() => { setShowNotifMenu(!showNotifMenu); setShowPortalMenu(false); }}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: '#fff',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              boxShadow: 'var(--shadow-xs)'
            }}
          >
            <Icons.Bell size={16} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-3px',
                right: '-3px',
                background: 'var(--danger)',
                color: 'white',
                fontSize: '9px',
                fontWeight: 800,
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid #fff'
              }}>
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifMenu && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: '44px',
              background: '#fff',
              border: '1px solid var(--border)',
              borderRadius: '14px',
              boxShadow: 'var(--shadow-xl)',
              width: '320px',
              overflow: 'hidden',
              zIndex: 100
            }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>Notifications</span>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 600, border: 'none', background: 'none', cursor: 'pointer' }}>Mark all read</button>
                )}
              </div>
              <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '24px 16px', fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center' }}>
                    No new notifications
                  </div>
                ) : (
                  notifications.map(notif => (
                    <div key={notif.id} style={{
                      padding: '12px 18px',
                      borderBottom: '1px solid var(--border-light)',
                      background: notif.read ? '#fff' : 'rgba(37,99,235,0.04)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '3px'
                    }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: notif.read ? 500 : 700 }}>{notif.text}</span>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{notif.time}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Avatar & ID Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {userCode && (
            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              background: 'rgba(37, 99, 235, 0.08)',
              color: 'var(--primary)',
              padding: '4px 8px',
              borderRadius: '6px',
              fontFamily: 'monospace',
              border: '1px solid rgba(37, 99, 235, 0.15)'
            }}>
              {userCode}
            </span>
          )}
          <div 
            className="avatar sm" 
            style={{ background: 'linear-gradient(135deg, #2563EB, #1D4ED8)', color: 'white', fontWeight: 700 }}
            title={userName}
          >
            {initials}
          </div>
        </div>

      </div>
    </header>
  );
}

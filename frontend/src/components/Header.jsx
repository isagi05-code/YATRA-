import React, { useState } from 'react';
import * as Icons from 'lucide-react';

export default function Header({ title, description, portal, onPortalSwitch }) {
  const [showPortalMenu, setShowPortalMenu] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, text: "New expense submitted by Ramesh Kumar", time: "5m ago", read: false },
    { id: 2, text: "Kedarnath Tour reached Gaurikund checkpoint", time: "1h ago", read: false },
    { id: 3, text: "System maintenance scheduled for tonight", time: "5h ago", read: true }
  ]);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  const getPortalLabel = () => {
    switch (portal) {
      case 'agency': return 'Agency Portal';
      case 'user': return 'Traveller App';
      case 'yatra-team': return 'Yatra Team Admin';
      default: return 'Portal Select';
    }
  };

  const getPortalIconColor = () => {
    switch (portal) {
      case 'agency': return '#2563EB';
      case 'user': return '#10B981';
      case 'yatra-team': return '#6366F1';
      default: return '#64748B';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  return (
    <header className="header" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      borderBottom: '1px solid var(--border)',
      height: 'var(--header-height)',
      background: 'var(--surface)',
      position: 'sticky',
      top: 0,
      zIndex: 90
    }}>
      {/* Title / Description */}
      <div>
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h2>
        {description && (
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>{description}</p>
        )}
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative' }}>
        
        {/* Search */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Icons.Search size={16} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search..." 
            style={{
              padding: '8px 12px 8px 36px',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              fontSize: '13px',
              outline: 'none',
              background: 'var(--bg)',
              width: '180px',
              transition: 'all 0.2s'
            }}
            onFocus={(e) => e.target.style.width = '240px'}
            onBlur={(e) => e.target.style.width = '180px'}
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
              padding: '8px 14px',
              borderRadius: '8px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--text-primary)'
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: getPortalIconColor() }}></span>
            {getPortalLabel()}
            <Icons.ChevronDown size={14} />
          </button>

          {showPortalMenu && (
            <div className="dropdown-menu show" style={{
              position: 'absolute',
              right: 0,
              top: '40px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              boxShadow: 'var(--shadow-lg)',
              width: '180px',
              overflow: 'hidden',
              zIndex: 100
            }}>
              <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <button 
                  onClick={() => { onPortalSwitch('agency'); setShowPortalMenu(false); }}
                  className="dropdown-item" 
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
                    padding: '8px 12px', borderRadius: '6px', fontSize: '12px', textAlign: 'left',
                    color: portal === 'agency' ? 'var(--primary)' : 'var(--text-primary)',
                    background: portal === 'agency' ? 'var(--primary-10)' : 'transparent',
                    fontWeight: portal === 'agency' ? 600 : 500
                  }}
                >
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#2563EB' }}></span>
                  Agency Portal
                </button>
                <button 
                  onClick={() => { onPortalSwitch('user'); setShowPortalMenu(false); }}
                  className="dropdown-item" 
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
                    padding: '8px 12px', borderRadius: '6px', fontSize: '12px', textAlign: 'left',
                    color: portal === 'user' ? 'var(--success)' : 'var(--text-primary)',
                    background: portal === 'user' ? 'var(--success-bg)' : 'transparent',
                    fontWeight: portal === 'user' ? 600 : 500
                  }}
                >
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981' }}></span>
                  Traveller Portal
                </button>
                <button 
                  onClick={() => { onPortalSwitch('yatra-team'); setShowPortalMenu(false); }}
                  className="dropdown-item" 
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
                    padding: '8px 12px', borderRadius: '6px', fontSize: '12px', textAlign: 'left',
                    color: portal === 'yatra-team' ? 'var(--info)' : 'var(--text-primary)',
                    background: portal === 'yatra-team' ? 'var(--info-bg)' : 'transparent',
                    fontWeight: portal === 'yatra-team' ? 600 : 500
                  }}
                >
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#6366F1' }}></span>
                  Yatra Team Admin
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
              padding: '8px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Icons.Bell size={16} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: 'var(--danger)',
                color: 'white',
                fontSize: '9px',
                fontWeight: 700,
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifMenu && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: '40px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              boxShadow: 'var(--shadow-lg)',
              width: '320px',
              overflow: 'hidden',
              zIndex: 100
            }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: 700 }}>Notifications</span>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 600 }}>Mark all read</button>
                )}
              </div>
              <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
                {notifications.map(notif => (
                  <div key={notif.id} style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--border-light)',
                    background: notif.read ? 'white' : 'var(--primary-10)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px'
                  }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: notif.read ? 500 : 600 }}>{notif.text}</span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{notif.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="avatar sm" style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-light))', color: 'white', fontWeight: 700 }}>
            {portal === 'agency' ? 'RT' : portal === 'user' ? 'PS' : 'YA'}
          </div>
        </div>

      </div>
    </header>
  );
}

import React from 'react';
import * as Icons from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AGENCY_NAV = [
  { icon: 'LayoutDashboard', label: 'Dashboard',    id: 'dashboard',    badge: null },
  { icon: 'Map',              label: 'Tours',         id: 'tours',        badge: null },
  { icon: 'Receipt',          label: 'Expenses',      id: 'expenses',     badge: null },
  { icon: 'UserCircle',      label: 'Drivers',       id: 'drivers',      badge: null },
  { icon: 'Truck',            label: 'Vehicles',      id: 'vehicles',     badge: null },
  { icon: 'Sparkles',         label: 'AI Itinerary',  id: 'ai-itinerary', badge: 'New', badgeClass: 'success' },
  { icon: 'FileText',        label: 'Invoices',      id: 'invoice',      badge: null },
  { icon: 'BarChart2',      label: 'Reports',       id: 'reports',      badge: null },
  { icon: 'TrendingUp',      label: 'Analytics',     id: 'analytics',    badge: null },
  { icon: 'MapPin',          label: 'Maps',          id: 'tour-detail',  badge: null },
];

const TRAVELLER_NAV = [
  { icon: 'LayoutDashboard', label: 'Dashboard',      id: 'dashboard',      badge: null },
  { icon: 'Calendar',         label: 'My Trips',       id: 'trips',          badge: null },
  { icon: 'Receipt',          label: 'My Expenses',    id: 'expenses',       badge: null },
  { icon: 'Sparkles',         label: 'AI Assistant',   id: 'ai-assistant',   badge: 'New', badgeClass: 'success' },
  { icon: 'Star',             label: 'Reviews',        id: 'reviews',        badge: null },
];

const YATRA_TEAM_NAV = [
  { icon: 'LayoutDashboard', label: 'Overview',     id: 'overview',   badge: null },
  { icon: 'Building2',       label: 'Agencies',     id: 'agencies',   badge: null },
  { icon: 'Users',            label: 'Travellers',   id: 'travellers', badge: null },
  { icon: 'TrendingUp',      label: 'Revenue',      id: 'revenue',    badge: null },
  { icon: 'BarChart2',      label: 'Analytics',    id: 'analytics',  badge: null },
  { icon: 'Activity',        label: 'System Health', id: 'health',     badge: 'OK',  badgeClass: 'success' },
];

export default function Sidebar({ portal, activePage, onNavigate, onLogout }) {
  const { user, agencyId } = useAuth();

  const getNavItems = () => {
    switch (portal) {
      case 'agency': return AGENCY_NAV;
      case 'user': return TRAVELLER_NAV;
      case 'yatra-team': return YATRA_TEAM_NAV;
      default: return [];
    }
  };

  const getPortalName = () => {
    switch (portal) {
      case 'agency': return 'Agency Portal';
      case 'user': return 'Traveller App';
      case 'yatra-team': return 'Team Admin';
      default: return 'Yatra AI';
    }
  };

  const navItems = getNavItems();

  const userName = user?.name || (portal === 'agency' ? 'Agency User' : portal === 'user' ? 'Traveller User' : 'Yatra Admin');
  const userId = user?.agency_id || user?.user_id || user?.id || agencyId || (portal === 'agency' ? 'AGY-1001' : portal === 'user' ? 'TRV-1001' : 'ADM-1001');
  const initials = userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'YA';

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon" style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src="/yatralogo.jpg" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div>
          <div className="sidebar-logo-text" style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 800 }}>
            Yatra <span style={{ color: 'var(--primary)' }}>AI</span>
          </div>
          <div className="sidebar-logo-sub" style={{ fontSize: '10px', opacity: 0.6 }}>
            {getPortalName()}
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="sidebar-nav" style={{ flex: 1, padding: '20px 12px' }}>
        <ul style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {navItems.map((item) => {
            const IconComponent = Icons[item.icon] || Icons.HelpCircle;
            const isActive = activePage === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onNavigate(item.id)}
                  className={`nav-item ${isActive ? 'active' : ''}`}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                    background: isActive ? 'var(--primary-10)' : 'transparent',
                    textAlign: 'left',
                    transition: 'all 0.2s',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <IconComponent size={18} style={{ strokeWidth: isActive ? 2.2 : 1.8 }} />
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {item.badge && (
                    <span className={`badge ${item.badgeClass || 'blue'}`} style={{ fontSize: '10px', padding: '2px 8px' }}>
                      {item.badge}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Footer */}
      <div className="sidebar-footer" style={{ padding: '16px 20px', borderTop: '1px solid var(--border-light)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <div className="avatar md" style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-light))', color: 'white', fontWeight: 700 }}>
            {initials}
          </div>
          <div style={{ overflow: 'hidden', flex: 1 }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {userName}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 700, fontFamily: 'monospace' }}>
              ID: {userId}
            </div>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="btn btn-outline"
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '8px 12px', fontSize: '12px', borderRadius: '8px', cursor: 'pointer' }}
        >
          <Icons.LogOut size={14} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}

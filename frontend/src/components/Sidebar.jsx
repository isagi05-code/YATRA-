import React from 'react';
import * as Icons from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AGENCY_NAV_SECTIONS = [
  {
    title: 'Operations',
    items: [
      { icon: 'LayoutDashboard', label: 'Dashboard',    id: 'dashboard',    badge: null },
      { icon: 'Map',             label: 'Tours',        id: 'tours',        badge: null },
      { icon: 'Receipt',         label: 'Expenses',     id: 'expenses',     badge: null },
      { icon: 'UserCircle',     label: 'Drivers',      id: 'drivers',      badge: null },
      { icon: 'Truck',           label: 'Vehicles',     id: 'vehicles',     badge: null },
    ]
  },
  {
    title: 'Intelligence',
    items: [
      { icon: 'Sparkles',        label: 'AI Itinerary', id: 'ai-itinerary', badge: 'AI', badgeClass: 'blue' },
      { icon: 'FileText',       label: 'Invoices',     id: 'invoice',      badge: null },
      { icon: 'BarChart2',     label: 'Reports',      id: 'reports',      badge: null },
      { icon: 'TrendingUp',     label: 'Analytics',    id: 'analytics',    badge: null },
      { icon: 'MapPin',         label: 'Maps & Live',  id: 'tour-detail',  badge: null },
    ]
  }
];

const TRAVELLER_NAV_SECTIONS = [
  {
    title: 'My Travel',
    items: [
      { icon: 'LayoutDashboard', label: 'Dashboard',     id: 'dashboard',    badge: null },
      { icon: 'Calendar',        label: 'My Trips',      id: 'trips',        badge: null },
      { icon: 'Receipt',         label: 'My Expenses',   id: 'expenses',     badge: null },
      { icon: 'Sparkles',        label: 'AI Assistant',  id: 'ai-assistant', badge: 'New', badgeClass: 'success' },
      { icon: 'Star',            label: 'Reviews',       id: 'reviews',      badge: null },
    ]
  }
];

const YATRA_TEAM_NAV_SECTIONS = [
  {
    title: 'Platform Control',
    items: [
      { icon: 'LayoutDashboard', label: 'Overview',      id: 'overview',     badge: null },
      { icon: 'Building2',       label: 'Agencies',      id: 'agencies',     badge: null },
      { icon: 'Users',           label: 'Travellers',    id: 'travellers',   badge: null },
    ]
  },
  {
    title: 'Monitoring',
    items: [
      { icon: 'TrendingUp',      label: 'Revenue',       id: 'revenue',      badge: null },
      { icon: 'BarChart2',     label: 'Analytics',     id: 'analytics',    badge: null },
      { icon: 'Activity',       label: 'System Health', id: 'health',       badge: '99.9%', badgeClass: 'success' },
    ]
  }
];

export default function Sidebar({ portal, activePage, onNavigate, onLogout }) {
  const { user, agencyId } = useAuth();

  const getNavSections = () => {
    switch (portal) {
      case 'agency': return AGENCY_NAV_SECTIONS;
      case 'user': return TRAVELLER_NAV_SECTIONS;
      case 'yatra-team': return YATRA_TEAM_NAV_SECTIONS;
      default: return [];
    }
  };

  const getPortalName = () => {
    switch (portal) {
      case 'agency': return 'Agency Portal';
      case 'user': return 'Traveller App';
      case 'yatra-team': return 'Team Admin';
      default: return 'VittAro';
    }
  };

  const navSections = getNavSections();

  const userName = user?.name || (portal === 'agency' ? 'Agency Partner' : portal === 'user' ? 'Traveller User' : 'VittAro Admin');
  const userId = user?.agency_id || user?.user_id || user?.id || agencyId || (portal === 'agency' ? 'AGY-1001' : portal === 'user' ? 'TRV-1001' : 'ADM-1001');
  const initials = userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'VA';

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-brand">
        <div className="brand-logo">
          <img src="/yatralogo.jpg" alt="VittAro Logo" />
        </div>
        <div className="brand-content">
          <h2>VittAro</h2>
          <span className="portal-chip">
            {getPortalName()}
          </span>
        </div>
      </div>

      {/* Grouped Navigation */}
      <nav className="sidebar-nav">
        {navSections.map((section, sIdx) => (
          <div key={sIdx} style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '8px' }}>
            {section.title && (
              <div className="nav-section-title">
                {section.title}
              </div>
            )}
            {section.items.map((item) => {
              const Icon = Icons[item.icon] || Icons.HelpCircle;
              const active = activePage === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`nav-item ${active ? 'active' : ''}`}
                >
                  <div className="nav-icon-wrap">
                    <Icon size={17} strokeWidth={active ? 2.2 : 1.8} />
                  </div>
                  <span className="nav-title">{item.label}</span>
                  {item.badge && (
                    <span className={`badge ${item.badgeClass || 'blue'}`}>
                      {item.badge}
                    </span>
                  )}
                  {active && (
                    <Icons.ChevronRight size={14} style={{ opacity: 0.7 }} />
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Profile & Footer Controls */}
      <div className="sidebar-profile">
        <div className="profile-top">
          <div className="avatar xl">
            {initials}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h4 style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{userName}</h4>
            <p>{userId}</p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="btn sidebar-logout"
        >
          <Icons.LogOut size={15} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}

import React, { useState } from 'react';
import LandingPortal from './portals/LandingPortal';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import AgencyPortal from './portals/AgencyPortal';
import TeamPortal from './portals/TeamPortal';
import { AuthProvider, useAuth } from './context/AuthContext';

function AppContent() {
  const { logout } = useAuth();
  const [portal, setPortal] = useState('landing');

  // Navigation sub-page state for each portal
  const [agencyPage, setAgencyPage] = useState('dashboard');
  const [teamPage, setTeamPage] = useState('overview');

  // Handle Select Role / Login from Landing Page
  const handleSelectRole = (selectedRole) => {
    setPortal(selectedRole);
    setAgencyPage('dashboard');
    setTeamPage('overview');
  };

  const handleLogout = () => {
    logout();
    setPortal('landing');
  };

  const handlePortalSwitch = (targetPortal) => {
    setPortal(targetPortal);
    if (targetPortal === 'agency') setAgencyPage('dashboard');
    if (targetPortal === 'yatra-team') setTeamPage('overview');
  };

  const getActivePage = () => {
    switch (portal) {
      case 'agency': return agencyPage;
      case 'yatra-team': return teamPage;
      default: return '';
    }
  };

  const handleNavigate = (pageId) => {
    switch (portal) {
      case 'agency':
        setAgencyPage(pageId);
        break;
      case 'yatra-team':
        setTeamPage(pageId);
        break;
      default:
        break;
    }
  };

  const getHeaderMeta = () => {
    if (portal === 'agency') {
      switch (agencyPage) {
        case 'dashboard': return { title: 'Agency Dashboard', desc: 'Performances, stats, and summaries' };
        case 'tours': return { title: 'Tour Packages', desc: 'Plan and manage routes & itineraries' };
        case 'tour-detail': return { title: 'Tour Detail', desc: 'Live route and checkpoint tracking' };
        case 'expenses': return { title: 'Expenses', desc: 'Review receipt claims and tallies' };
        case 'invoice': return { title: 'Invoice Preview', desc: 'Download and print statement details' };
        case 'vehicles': return { title: 'Fleet Manager', desc: 'Uptime, insurance compliance, and utilization' };
        case 'drivers': return { title: 'Drivers List', desc: 'Performances, satisfaction ratings, and profiles' };
        case 'reports': return { title: 'Reports & Downloads', desc: 'Generate exportable P&L and metrics' };
        case 'analytics': return { title: 'Analytics', desc: 'Growth charts, margins, and trends' };
        default: return { title: 'Agency Portal', desc: 'Management services' };
      }
    } else if (portal === 'yatra-team') {
      switch (teamPage) {
        case 'overview': return { title: 'Platform Control Room', desc: 'Super-admin overview metrics' };
        case 'agencies': return { title: 'Agencies List', desc: 'Verify and register partner agency profiles' };
        case 'travellers': return { title: 'Travellers List', desc: 'Monitor user statistics' };
        case 'revenue': return { title: 'Platform Revenue', desc: 'Consolidated subscription fee collections' };
        case 'analytics': return { title: 'Platform Analytics', desc: 'Vitals, sessions, and transaction charts' };
        case 'health': return { title: 'Service Health', desc: 'Real-time gateway status checks' };
        default: return { title: 'VittAro Admin Portal', desc: 'Super administration' };
      }
    }
    return { title: 'VittAro', desc: '' };
  };

  if (portal === 'landing') {
    return <LandingPortal onSelectRole={handleSelectRole} />;
  }

  const headerMeta = getHeaderMeta();

  return (
    <div className="app-layout">
      {/* Dynamic Sidebar */}
      <Sidebar
        portal={portal}
        activePage={getActivePage()}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
      />

      <main className="main-content">
        {/* Dynamic Header */}
        <Header
          title={headerMeta.title}
          description={headerMeta.desc}
          portal={portal}
          onPortalSwitch={handlePortalSwitch}
        />

        <div className="page-content">
          {portal === 'agency' && (
            <AgencyPortal page={agencyPage} onNavigate={handleNavigate} />
          )}

          {portal === 'yatra-team' && (
            <TeamPortal page={teamPage} />
          )}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

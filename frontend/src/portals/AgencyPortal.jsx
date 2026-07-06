import React, { useState } from 'react';
import DashboardPage from './AgencyPortal/DashboardPage';
import ToursPage from './AgencyPortal/ToursPage';
import TourDetailPage from './AgencyPortal/TourDetailPage';
import ExpensesPage from './AgencyPortal/ExpensesPage';
import InvoicePage from './AgencyPortal/InvoicePage';
import AiItineraryPage from './AgencyPortal/AiItineraryPage';
import VehiclesPage from './AgencyPortal/VehiclesPage';
import DriversPage from './AgencyPortal/DriversPage';
import ReportsPage from './AgencyPortal/ReportsPage';
import AnalyticsPage from './AgencyPortal/AnalyticsPage';

export default function AgencyPortal({ page, onNavigate }) {
  const [selectedTourId, setSelectedTourId] = useState(1);

  switch (page) {
    case 'dashboard':
      return <DashboardPage onNavigate={onNavigate} />;
    case 'tours':
      return <ToursPage onSelectTour={(id) => { setSelectedTourId(id); onNavigate('tour-detail'); }} />;
    case 'tour-detail':
      return <TourDetailPage tourId={selectedTourId} onBack={() => onNavigate('tours')} />;
    case 'expenses':
      return <ExpensesPage />;
    case 'invoice':
      return <InvoicePage />;
    case 'ai-itinerary':
      return <AiItineraryPage />;
    case 'vehicles':
      return <VehiclesPage />;
    case 'drivers':
      return <DriversPage />;
    case 'reports':
      return <ReportsPage />;
    case 'analytics':
      return <AnalyticsPage />;
    default:
      return <DashboardPage onNavigate={onNavigate} />;
  }
}

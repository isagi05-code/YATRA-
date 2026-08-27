import { Button } from '../../../components/ui';
import { MapPlus } from 'lucide-react';
import { safeNum, toLakh } from '../utils/dashboardStats';

export default function DashboardHero({ summary, onNavigate }) {
  const stats = summary?.stats || {};
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  return <section className="agency-hero"><div className="agency-hero__content"><div className="agency-hero__eyebrow">{greeting}, VittAro partner</div><h1 className="agency-hero__title">Your agency, ready for the road.</h1><p className="agency-hero__text">Plan trips, keep your fleet moving, and make every journey profitable.</p><div className="ui-page__actions" style={{ marginTop: 18 }}><Button icon={MapPlus} onClick={() => onNavigate('tours')}>Create tour</Button></div></div><div className="agency-hero__metrics"><div className="agency-hero__metric"><strong>₹{toLakh(stats.total_revenue)}L</strong><span>Revenue</span></div><div className="agency-hero__metric"><strong>{safeNum(stats.active_tours)}</strong><span>Active tours</span></div><div className="agency-hero__metric"><strong>{safeNum(stats.upcoming_tours)}</strong><span>Upcoming</span></div></div></section>;
}

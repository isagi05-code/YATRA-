import { useEffect, useState } from 'react';
import { ArcElement, BarElement, CategoryScale, Chart as ChartJS, Filler, Legend, LineElement, LinearScale, PointElement, Tooltip } from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';
import { AlertCircle, CalendarDays, CheckCircle2, Map, PieChart, Star, TrendingUp } from 'lucide-react';
import { api } from '../../services/api';
import { ChartCard, EmptyState, LoadingState, PageHeader, PageLayout, StatCard } from '../../components/ui';
import { expenseCategoryChart, radialOptions, responsiveOptions, revenueChart } from './utils/chartConfig';
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Filler);

export default function AnalyticsPage() {
  const [graphs, setGraphs] = useState(null); const [error, setError] = useState('');
  useEffect(() => { api.agency.getGraphs().then(setGraphs).catch(err => { console.error('Failed to load analytics graphs', err); setError('Could not load analytics data. Make sure the backend is running.'); }); }, []);
  if (!graphs && !error) return <LoadingState message="Loading analytics data…" />;
  if (error) return <EmptyState icon={AlertCircle} title="Analytics unavailable" message={error} />;
  const ratings = graphs.driver_performance?.ratings || [];
  const metrics = [{ label: 'Active tours', value: graphs.tours_status?.active ?? 0, icon: Map, tone: 'green' }, { label: 'Completed tours', value: graphs.tours_status?.completed ?? 0, icon: CheckCircle2, tone: 'blue' }, { label: 'Upcoming tours', value: graphs.tours_status?.upcoming ?? 0, icon: CalendarDays, tone: 'amber' }, { label: 'Average driver rating', value: ratings.length ? `${(ratings.reduce((total, rating) => total + rating, 0) / ratings.length).toFixed(1)} ★` : '—', icon: Star, tone: 'blue' }];
  const hasRevenue = (graphs.revenue_vs_expense?.labels || []).length > 0; const hasExpenses = (graphs.category_wise_expense?.labels || []).length > 0;
  return <PageLayout><PageHeader eyebrow="Business intelligence" title="Analytics & insights" description="Understand revenue, costs, tour demand, and operational performance." /><div className="agency-chart-grid"><ChartCard title="Revenue vs expenses" subtitle="Month-on-month movement">{hasRevenue ? <Line data={revenueChart(graphs)} options={responsiveOptions} /> : <EmptyState icon={TrendingUp} title="No revenue data" message="Add tours and expenses to reveal revenue trends." />}</ChartCard><ChartCard title="Expense distribution" subtitle="By spending category">{hasExpenses ? <Doughnut data={expenseCategoryChart(graphs)} options={radialOptions} /> : <EmptyState icon={PieChart} title="No expense categories" message="Categorised expenses will appear here." />}</ChartCard></div><div className="ui-stats">{metrics.map(metric => <StatCard key={metric.label} {...metric} />)}</div></PageLayout>;
}

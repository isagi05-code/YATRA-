import { useEffect, useState } from 'react';
import { Bar, Doughnut, Line, Pie, Radar } from 'react-chartjs-2';
import { ArcElement, BarElement, CategoryScale, Chart as ChartJS, Filler, Legend, LineElement, LinearScale, PointElement, RadialLinearScale, Title, Tooltip } from 'chart.js';
import { api } from '../../services/api';
import { ChartCard, LoadingState, PageLayout, StatCard } from '../../components/ui';
import DashboardHero from './components/DashboardHero';
import QuickActions from './components/QuickActions';
import { createDashboardStats } from './utils/dashboardStats';
import { driverChart, expenseCategoryChart, expenseChart, radialOptions, responsiveOptions, revenueChart, tourStatusChart } from './utils/chartConfig';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, RadialLinearScale, ArcElement, Title, Tooltip, Legend, Filler);

export default function DashboardPage({ onNavigate }) {
  const [summary, setSummary] = useState(null);
  const [graphs, setGraphs] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { Promise.all([api.agency.getSummary(), api.agency.getGraphs()]).then(([summaryData, graphsData]) => { setSummary(summaryData); setGraphs(graphsData); }).catch(error => console.error('Failed to load dashboard data', error)).finally(() => setLoading(false)); }, []);
  if (loading) return <LoadingState message="Loading live agency metrics…" />;
  const stats = createDashboardStats(summary);
  return <PageLayout><DashboardHero summary={summary} onNavigate={onNavigate} /><QuickActions onNavigate={onNavigate} /><div className="ui-stats">{stats.map(stat => <StatCard key={stat.label} {...stat} />)}</div><div className="agency-chart-grid"><ChartCard title="Revenue vs expenses" subtitle="Month-on-month performance"><Line data={revenueChart(graphs)} options={responsiveOptions} /></ChartCard><ChartCard title="Expense split" subtitle="Spending by category"><Doughnut data={expenseCategoryChart(graphs)} options={radialOptions} /></ChartCard></div><div className="agency-chart-grid agency-chart-grid--three"><ChartCard title="Monthly expenses"><Bar data={expenseChart(graphs)} options={responsiveOptions} /></ChartCard><ChartCard title="Tour status"><Pie data={tourStatusChart(graphs)} options={radialOptions} /></ChartCard><ChartCard title="Driver ratings"><Radar data={driverChart(graphs)} options={radialOptions} /></ChartCard></div></PageLayout>;
}

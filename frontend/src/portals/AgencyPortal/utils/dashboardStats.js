import * as Icons from 'lucide-react';

export const safeNum = value => Number.parseFloat(value) || 0;
export const toLakh = value => (safeNum(value) / 100000).toFixed(1);
export const formatRupees = value => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(safeNum(value));

export function createDashboardStats(summary) {
  const stats = summary?.stats || {};
  return [
    { label: 'Total revenue', value: `₹${toLakh(stats.total_revenue)}L`, detail: safeNum(stats.total_revenue) ? 'From completed tours' : 'No tours completed yet', icon: Icons.IndianRupee, tone: 'blue' },
    { label: 'Net profit', value: `₹${toLakh(stats.profit)}L`, detail: safeNum(stats.profit) >= 0 ? 'Operating profit' : 'Operating loss', icon: Icons.TrendingUp, tone: safeNum(stats.profit) >= 0 ? 'green' : 'red' },
    { label: 'Active tours', value: String(safeNum(stats.active_tours)), detail: safeNum(stats.active_tours) ? `${stats.active_tours} currently underway` : 'No active tours', icon: Icons.Map, tone: 'green' },
    { label: 'Pending payments', value: `₹${toLakh(stats.pending_payments)}L`, detail: safeNum(stats.pending_payments) ? 'Invoices awaiting payment' : 'All invoices settled', icon: Icons.ReceiptIndianRupee, tone: 'red' },
    { label: 'Fleet size', value: String(safeNum(stats.total_vehicles)), detail: safeNum(stats.total_vehicles) ? 'Vehicles in your fleet' : 'Add a vehicle to begin', icon: Icons.BusFront, tone: 'blue' },
    { label: 'Drivers', value: String(safeNum(stats.total_drivers)), detail: safeNum(stats.total_drivers) ? 'Registered team members' : 'Add your first driver', icon: Icons.UsersRound, tone: 'amber' },
    { label: 'Total expenses', value: `₹${toLakh(stats.total_expenses)}L`, detail: stats.expense_trend || (safeNum(stats.total_expenses) ? 'Recorded expenditure' : 'No expenses yet'), icon: Icons.WalletCards, tone: 'red' },
    { label: 'Upcoming trips', value: String(safeNum(stats.upcoming_tours)), detail: safeNum(stats.upcoming_tours) ? 'Scheduled in the next 30 days' : 'No upcoming trips', icon: Icons.CalendarDays, tone: 'amber' },
  ];
}

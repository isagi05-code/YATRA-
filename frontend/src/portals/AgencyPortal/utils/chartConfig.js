const colors = {
  blue: '#2563EB',
  blueSoft: 'rgba(37, 99, 235, 0.08)',
  teal: '#0D9488',
  tealSoft: 'rgba(13, 148, 136, 0.08)',
  emerald: '#059669',
  emeraldSoft: 'rgba(5, 150, 105, 0.08)',
  amber: '#D97706',
  amberSoft: 'rgba(217, 119, 6, 0.08)',
  rose: '#E11D48',
  roseSoft: 'rgba(225, 29, 72, 0.08)',
  indigo: '#6366F1',
  indigoSoft: 'rgba(99, 102, 241, 0.08)',
  slate: '#64748B',
  grid: '#F1F5F9'
};

export const responsiveOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        usePointStyle: true,
        boxWidth: 7,
        padding: 16,
        color: '#475569',
        font: { size: 12, weight: 600, family: "'Inter', sans-serif" }
      }
    },
    tooltip: {
      backgroundColor: '#0F172A',
      titleFont: { size: 12, weight: 700, family: "'Inter', sans-serif" },
      bodyFont: { size: 12, family: "'Inter', sans-serif" },
      padding: 10,
      cornerRadius: 8,
      displayColors: true
    }
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: '#94A3B8', font: { size: 11, family: "'Inter', sans-serif" } }
    },
    y: {
      border: { display: false },
      grid: { color: colors.grid },
      ticks: { color: '#94A3B8', font: { size: 11, family: "'Inter', sans-serif" } }
    }
  }
};

export const radialOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        usePointStyle: true,
        boxWidth: 8,
        padding: 16,
        color: '#475569',
        font: { size: 12, weight: 600, family: "'Inter', sans-serif" }
      }
    },
    tooltip: {
      backgroundColor: '#0F172A',
      titleFont: { size: 12, weight: 700, family: "'Inter', sans-serif" },
      bodyFont: { size: 12, family: "'Inter', sans-serif" },
      padding: 10,
      cornerRadius: 8
    }
  }
};

export const revenueChart = graphs => ({
  labels: graphs?.revenue_vs_expense?.labels || [],
  datasets: [
    {
      label: 'Revenue (₹ Lakhs)',
      data: graphs?.revenue_vs_expense?.revenue || [],
      borderColor: colors.blue,
      backgroundColor: 'rgba(37, 99, 235, 0.12)',
      fill: true,
      tension: 0.35,
      pointRadius: 4,
      pointHoverRadius: 6,
      pointBackgroundColor: colors.blue,
      borderWidth: 2.5
    },
    {
      label: 'Expenses (₹ Lakhs)',
      data: graphs?.revenue_vs_expense?.expense || [],
      borderColor: colors.rose,
      backgroundColor: 'rgba(225, 29, 72, 0.08)',
      fill: true,
      tension: 0.35,
      pointRadius: 4,
      pointHoverRadius: 6,
      pointBackgroundColor: colors.rose,
      borderWidth: 2.5
    }
  ]
});

export const expenseChart = graphs => ({
  labels: graphs?.monthly_expense?.labels || [],
  datasets: [
    {
      label: 'Monthly Expenses (₹ Lakhs)',
      data: graphs?.monthly_expense?.data || [],
      backgroundColor: colors.blue,
      borderRadius: 8,
      maxBarThickness: 32
    }
  ]
});

export const expenseCategoryChart = graphs => ({
  labels: graphs?.category_wise_expense?.labels || [],
  datasets: [
    {
      data: graphs?.category_wise_expense?.percentages || [],
      backgroundColor: [
        colors.blue,
        colors.emerald,
        colors.amber,
        colors.rose,
        colors.indigo,
        colors.teal,
        colors.slate
      ],
      borderWidth: 2,
      borderColor: '#FFFFFF'
    }
  ]
});

export const tourStatusChart = graphs => ({
  labels: ['Active', 'Completed', 'Upcoming'],
  datasets: [
    {
      data: [
        graphs?.tours_status?.active || 0,
        graphs?.tours_status?.completed || 0,
        graphs?.tours_status?.upcoming || 0
      ],
      backgroundColor: [colors.emerald, colors.blue, colors.amber],
      borderWidth: 2,
      borderColor: '#FFFFFF'
    }
  ]
});

export const driverChart = graphs => ({
  labels: graphs?.driver_performance?.labels || [],
  datasets: [
    {
      label: 'Driver Rating ★',
      data: graphs?.driver_performance?.ratings || [],
      borderColor: colors.indigo,
      backgroundColor: 'rgba(99, 102, 241, 0.16)',
      pointBackgroundColor: colors.indigo,
      pointHoverRadius: 5,
      fill: true
    }
  ]
});

// MotoCRM Pro Chart configurations
// Overhauled for SaaS Design Theme

(function() {
  let charts = {};

  const getThemeColors = () => {
    const isDark = document.documentElement.classList.contains('dark');
    return {
      textColor: isDark ? '#a1a1aa' : '#64748b',
      gridColor: isDark ? 'rgba(39, 39, 42, 0.4)' : 'rgba(226, 232, 240, 0.5)',
      accentOrange: '#ff5c35', // Brand Orange
      accentBlue: '#0b57d0', // Accent Blue
      accentGray: isDark ? '#27272a' : '#cbd5e1',
      orangeGradientStart: 'rgba(255, 92, 53, 0.25)',
      orangeGradientStop: 'rgba(255, 92, 53, 0)'
    };
  };

  // Helper parsers for raw database collections vs array fallbacks
  const parseMonthlyLeads = (data) => {
    if (!data || data.length === 0) return [0, 0, 0, 0, 0, 0];
    if (typeof data[0] === 'object') {
      return data.map(item => item.count || 0);
    }
    return data;
  };

  const parseMonthlyLabels = (data) => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    if (data && data.length > 0 && typeof data[0] === 'object') {
      return data.map(item => {
        const m = item._id && item._id.month ? item._id.month - 1 : 0;
        return monthNames[m] || 'Month';
      });
    }
    return [];
  };

  const parseSalesPerformance = (data) => {
    if (!data || data.length === 0) return [0, 0, 0, 0, 0, 0, 0, 0];
    if (typeof data[0] === 'object') {
      return data.map(item => item.count || 0);
    }
    return data;
  };

  const parseSalesLabels = (data) => {
    if (data && data.length > 0 && typeof data[0] === 'object') {
      return data.map(item => item._id || 'Stage');
    }
    return ['New', 'Contacted', 'Interested', 'Test Ride Booked', 'Negotiation', 'Sold', 'Delivered', 'Lost'];
  };

  // 1. Monthly Lead Growth (Line Chart)
  const createMonthlyGrowthChart = () => {
    const canvas = document.getElementById('monthlyGrowthChart');
    if (!canvas || !window.monthlyLeadsData) return;

    const ctx = canvas.getContext('2d');
    const colors = getThemeColors();

    const dataVals = parseMonthlyLeads(window.monthlyLeadsData);
    const labelVals = parseMonthlyLabels(window.monthlyLeadsData);

    charts.monthlyGrowth = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labelVals,
        datasets: [{
          label: 'Leads',
          data: dataVals,
          borderColor: colors.accentOrange,
          borderWidth: 3,
          fill: false,
          tension: 0.4,
          pointBackgroundColor: '#ffffff',
          pointBorderColor: colors.accentOrange,
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 1000, easing: 'easeInOutQuart' },
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              color: colors.textColor,
              font: { family: 'Plus Jakarta Sans', size: 10, weight: '600' }
            }
          },
          y: {
            grid: { color: colors.gridColor, drawBorder: false },
            ticks: {
              color: colors.textColor,
              font: { family: 'Plus Jakarta Sans', size: 10, weight: '500' }
            }
          }
        }
      }
    });
  };

  // 2. Lead Conversion Trends (Area Chart)
  const createLeadConversionChart = () => {
    const canvas = document.getElementById('leadConversionChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const colors = getThemeColors();

    // Map monthly counts dynamically to actual conversion rates from database
    let conversionRates = [];
    if (window.monthlyLeadsData && window.monthlyLeadsData.length > 0) {
      conversionRates = window.monthlyLeadsData.map(item => item.convRate || 0);
    } else {
      conversionRates = [0, 0, 0, 0, 0, 0];
    }
    let labelVals = parseMonthlyLabels(window.monthlyLeadsData);

    const gradient = ctx.createLinearGradient(0, 0, 0, 220);
    gradient.addColorStop(0, colors.orangeGradientStart);
    gradient.addColorStop(1, colors.orangeGradientStop);

    charts.leadConversion = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labelVals,
        datasets: [{
          label: 'Conversion Rate',
          data: conversionRates,
          borderColor: colors.accentOrange,
          borderWidth: 2.5,
          backgroundColor: gradient,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#ffffff',
          pointBorderColor: colors.accentOrange,
          pointBorderWidth: 1.5,
          pointRadius: 3,
          pointHoverRadius: 5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 1200, easing: 'easeInOutQuart' },
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              color: colors.textColor,
              font: { family: 'Plus Jakarta Sans', size: 10, weight: '600' }
            }
          },
          y: {
            grid: { color: colors.gridColor, drawBorder: false },
            ticks: {
              color: colors.textColor,
              font: { family: 'Plus Jakarta Sans', size: 10, weight: '500' },
              callback: function(value) { return value + '%'; }
            }
          }
        }
      }
    });
  };

  // 3. Sales Performance (Bar Chart)
  const createSalesPerformanceChart = () => {
    const canvas = document.getElementById('salesPerformanceChart');
    if (!canvas || !window.salesPerformanceData) return;

    const ctx = canvas.getContext('2d');
    const colors = getThemeColors();

    const dataVals = parseSalesPerformance(window.salesPerformanceData);
    const labelVals = parseSalesLabels(window.salesPerformanceData);

    charts.salesPerformance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labelVals,
        datasets: [{
          label: 'Active Leads Count',
          data: dataVals,
          backgroundColor: colors.accentOrange,
          borderRadius: 6,
          maxBarThickness: 16
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 800, easing: 'easeOutQuart' },
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              color: colors.textColor,
              font: { family: 'Plus Jakarta Sans', size: 9, weight: '605' }
            }
          },
          y: {
            grid: { color: colors.gridColor, drawBorder: false },
            ticks: {
              color: colors.textColor,
              font: { family: 'Plus Jakarta Sans', size: 10, weight: '500' },
              stepSize: 1
            }
          }
        }
      }
    });
  };

  // Reports page charts helper (if present)
  const createReportsCharts = () => {
    const canvas = document.getElementById('revenueOverviewChart');
    if (!canvas || !window.newUnitsRevenue) return;

    const ctx = canvas.getContext('2d');
    const colors = getThemeColors();

    charts.revenueOverview = new Chart(ctx, {
      type: 'line',
      data: {
        labels: window.monthsLabels || [],
        datasets: [
          {
            label: 'New Units',
            data: window.newUnitsRevenue,
            borderColor: colors.accentOrange,
            borderWidth: 3,
            tension: 0.3,
            fill: false,
            pointRadius: 3
          },
          {
            label: 'Pre-Owned',
            data: window.preOwnedRevenue || [0, 0, 0, 0, 0, 0],
            borderColor: colors.accentBlue,
            borderWidth: 3,
            tension: 0.3,
            fill: false,
            pointRadius: 3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              color: colors.textColor,
              font: { family: 'Plus Jakarta Sans', size: 11, weight: '500' }
            }
          },
          y: {
            grid: { color: colors.gridColor, drawBorder: false },
            ticks: {
              color: colors.textColor,
              font: { family: 'Plus Jakarta Sans', size: 11, weight: '500' }
            }
          }
        }
      }
    });
  };

  const initAllCharts = () => {
    createMonthlyGrowthChart();
    createLeadConversionChart();
    createSalesPerformanceChart();
    createReportsCharts();
  };

  // Re-draw and apply styling when light/dark theme shifts
  const updateChartThemes = () => {
    const colors = getThemeColors();

    if (charts.monthlyGrowth) {
      const chart = charts.monthlyGrowth;
      chart.options.scales.x.ticks.color = colors.textColor;
      chart.options.scales.y.ticks.color = colors.textColor;
      chart.options.scales.y.grid.color = colors.gridColor;
      chart.update();
    }

    if (charts.leadConversion) {
      const chart = charts.leadConversion;
      const ctx = chart.ctx;
      const gradient = ctx.createLinearGradient(0, 0, 0, 220);
      gradient.addColorStop(0, colors.orangeGradientStart);
      gradient.addColorStop(1, colors.orangeGradientStop);
      
      chart.data.datasets[0].backgroundColor = gradient;
      chart.options.scales.x.ticks.color = colors.textColor;
      chart.options.scales.y.ticks.color = colors.textColor;
      chart.options.scales.y.grid.color = colors.gridColor;
      chart.update();
    }

    if (charts.salesPerformance) {
      const chart = charts.salesPerformance;
      chart.data.datasets[0].backgroundColor = colors.accentOrange;
      chart.options.scales.x.ticks.color = colors.textColor;
      chart.options.scales.y.ticks.color = colors.textColor;
      chart.options.scales.y.grid.color = colors.gridColor;
      chart.update();
    }

    if (charts.revenueOverview) {
      const chart = charts.revenueOverview;
      chart.data.datasets[0].borderColor = colors.accentOrange;
      chart.data.datasets[1].borderColor = colors.accentBlue;
      chart.options.scales.x.ticks.color = colors.textColor;
      chart.options.scales.y.ticks.color = colors.textColor;
      chart.options.scales.y.grid.color = colors.gridColor;
      chart.update();
    }
  };

  document.addEventListener('DOMContentLoaded', initAllCharts);
  window.addEventListener('theme-change', updateChartThemes);
  
  // Custom event listener for PJAX page switches
  window.addEventListener('content-loaded', () => {
    // Destroy previous charts to allow canvas reuse
    Object.keys(charts).forEach(key => {
      if (charts[key]) {
        charts[key].destroy();
        delete charts[key];
      }
    });
    initAllCharts();
  });
})();

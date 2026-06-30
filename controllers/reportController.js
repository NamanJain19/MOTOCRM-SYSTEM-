const Lead = require('../models/Lead');
const Task = require('../models/Task');
const TestRide = require('../models/TestRide');
const User = require('../models/User');
const Delivery = require('../models/Delivery');
const Inventory = require('../models/Inventory');

const getPercentageChange = (current, previous) => {
  if (previous === 0) {
    if (current === 0) return 'Stable —';
    return `+100.0% ↑`;
  }
  const pct = ((current - previous) / previous * 100).toFixed(1);
  if (current > previous) {
    return `+${pct}% ↑`;
  } else if (current < previous) {
    return `${pct}% ↓`;
  } else {
    return `Stable —`;
  }
};

const getDaysChange = (current, previous) => {
  if (previous === 0 || isNaN(previous)) {
    if (current === 0 || isNaN(current)) return 'Stable —';
    return `+${current.toFixed(1)}d ↑`;
  }
  const diff = current - previous;
  if (diff > 0) {
    return `+${diff.toFixed(1)}d ↑`;
  } else if (diff < 0) {
    return `${diff.toFixed(1)}d ↓`;
  } else {
    return `Stable —`;
  }
};

exports.getReports = async (req, res) => {
  try {
    const { source, bikeModel, startDate, endDate } = req.query;

    let query = {};
    if (source && source !== 'All') {
      query.leadSource = source;
    }
    if (bikeModel) {
      query.bikeModel = { $regex: bikeModel, $options: 'i' };
    }
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    // MoM Date Ranges
    const startOfCurrentMonth = new Date();
    startOfCurrentMonth.setDate(1);
    startOfCurrentMonth.setHours(0, 0, 0, 0);

    const startOfLastMonth = new Date(startOfCurrentMonth);
    startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);

    const endOfLastMonth = new Date(startOfCurrentMonth);
    endOfLastMonth.setMilliseconds(-1);

    // Queries for main counts & revenue using a single status aggregation pipeline
    const statusCounts = await Lead.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalBudget: { 
            $sum: { 
              $cond: [
                { $in: ['$status', ['Sold', 'Delivered']] },
                { $ifNull: ['$targetBudget', 28500] },
                0
              ]
            } 
          }
        }
      }
    ]);

    const statusMap = {
      'New': 0, 'Contacted': 0, 'Interested': 0, 'Test Ride Booked': 0, 
      'Negotiation': 0, 'Sold': 0, 'Delivered': 0, 'Lost': 0
    };
    let revenueVal = 0;
    statusCounts.forEach(item => {
      statusMap[item._id] = item.count;
      revenueVal += item.totalBudget;
    });

    const totalLeadsCount = Object.values(statusMap).reduce((sum, c) => sum + c, 0);
    const soldCount = statusMap['Sold'] + statusMap['Delivered'];
    const contactedCount = statusMap['Contacted'];
    const testRideCount = statusMap['Test Ride Booked'];
    const negotiationCount = statusMap['Negotiation'];
    const interestedCount = statusMap['Interested'];

    // Compute Delivery Stats
    let totalDeliveries = 0;
    let deliveredCount = 0;
    let pendingCount = 0;
    let cancelledCount = 0;
    const monthlyCounts = {
      'JAN': 0, 'FEB': 0, 'MAR': 0, 'APR': 0, 'MAY': 0, 'JUN': 0, 'JUL': 0, 'AUG': 0, 'SEP': 0, 'OCT': 0, 'NOV': 0, 'DEC': 0
    };

    let deliveryQuery = {};
    if (bikeModel) {
      deliveryQuery.bikeModel = { $regex: bikeModel, $options: 'i' };
    }
    if (startDate || endDate) {
      deliveryQuery.deliveryDate = {};
      if (startDate) {
        deliveryQuery.deliveryDate.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        deliveryQuery.deliveryDate.$lte = end;
      }
    }
    if (source && source !== 'All') {
      const matchingLeads = await Lead.find({ leadSource: source }).select('_id').lean();
      const matchingLeadIds = matchingLeads.map(l => l._id);
      deliveryQuery.lead = { $in: matchingLeadIds };
    }

    const allDeliveries = await Delivery.find(deliveryQuery).lean();
    totalDeliveries = allDeliveries.length;
    deliveredCount = allDeliveries.filter(d => d.status === 'Delivered').length;
    pendingCount = allDeliveries.filter(d => ['Pending', 'Preparing', 'Ready for Delivery'].includes(d.status)).length;
    cancelledCount = allDeliveries.filter(d => d.status === 'Cancelled').length;

    allDeliveries.forEach(d => {
      const monthNamesAbbr = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      const mIdx = new Date(d.deliveryDate).getMonth();
      const mName = monthNamesAbbr[mIdx];
      if (monthlyCounts[mName] !== undefined) {
        monthlyCounts[mName]++;
      }
    });

    const successRate = totalDeliveries > 0 ? ((deliveredCount / totalDeliveries) * 100).toFixed(1) + '%' : '0.0%';

    const deliveryStats = {
      total: totalDeliveries,
      delivered: deliveredCount,
      pending: pendingCount,
      cancelled: cancelledCount,
      successRate,
      monthlyCounts
    };

    // Calculate revenue dynamically from status aggregation
    const revenueStr = `$${(revenueVal / 1000000).toFixed(2)}M`;

    // Dynamic calculations for MoM comparison
    const [
      currRevenueLeads,
      prevRevenueLeads,
      currTotalLeadsMoM,
      prevTotalLeadsMoM,
      currSoldLeadsMoM,
      prevSoldLeadsMoM,
      currActiveDealsMoM,
      prevActiveDealsMoM
    ] = await Promise.all([
      Lead.find({ status: { $in: ['Sold', 'Delivered'] }, createdAt: { $gte: startOfCurrentMonth } }).select('targetBudget').lean(),
      Lead.find({ status: { $in: ['Sold', 'Delivered'] }, createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } }).select('targetBudget').lean(),
      Lead.countDocuments({ createdAt: { $gte: startOfCurrentMonth } }),
      Lead.countDocuments({ createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } }),
      Lead.countDocuments({ status: { $in: ['Sold', 'Delivered'] }, createdAt: { $gte: startOfCurrentMonth } }),
      Lead.countDocuments({ status: { $in: ['Sold', 'Delivered'] }, createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } }),
      Lead.countDocuments({ status: { $in: ['Interested', 'Test Ride Booked', 'Negotiation'] }, createdAt: { $gte: startOfCurrentMonth } }),
      Lead.countDocuments({ status: { $in: ['Interested', 'Test Ride Booked', 'Negotiation'] }, createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } })
    ]);

    const currRevenueVal = currRevenueLeads.reduce((sum, l) => sum + (l.targetBudget || 28500), 0);
    const prevRevenueVal = prevRevenueLeads.reduce((sum, l) => sum + (l.targetBudget || 28500), 0);

    const revenueChange = getPercentageChange(currRevenueVal, prevRevenueVal);

    const currConvRate = currTotalLeadsMoM > 0 ? (currSoldLeadsMoM / currTotalLeadsMoM * 100) : 0;
    const prevConvRate = prevTotalLeadsMoM > 0 ? (prevSoldLeadsMoM / prevTotalLeadsMoM * 100) : 0;
    const conversionChange = getPercentageChange(currConvRate, prevConvRate);

    const activeDeals = negotiationCount + testRideCount + interestedCount;
    const dealsChange = getPercentageChange(currActiveDealsMoM, prevActiveDealsMoM);

    // Calculate Avg Days to Close dynamically
    const closedLeads = await Lead.find({ ...query, status: { $in: ['Sold', 'Delivered'] }, closedAt: { $exists: true, $ne: null } }).select('createdAt closedAt').lean();
    let avgDaysVal = 0;
    if (closedLeads.length > 0) {
      const totalDays = closedLeads.reduce((sum, lead) => {
        const diffTime = Math.abs(lead.closedAt - lead.createdAt);
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        return sum + diffDays;
      }, 0);
      avgDaysVal = totalDays / closedLeads.length;
    }

    // MoM Avg Days calculation
    const currClosedLeads = await Lead.find({ status: { $in: ['Sold', 'Delivered'] }, closedAt: { $exists: true, $ne: null }, createdAt: { $gte: startOfCurrentMonth } }).select('createdAt closedAt').lean();
    const prevClosedLeads = await Lead.find({ status: { $in: ['Sold', 'Delivered'] }, closedAt: { $exists: true, $ne: null }, createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } }).select('createdAt closedAt').lean();

    const getAvgDays = (leadsList) => {
      if (leadsList.length === 0) return 0;
      const sum = leadsList.reduce((acc, l) => acc + (Math.abs(l.closedAt - l.createdAt) / (1000 * 60 * 60 * 24)), 0);
      return sum / leadsList.length;
    };

    const currAvgDays = getAvgDays(currClosedLeads);
    const prevAvgDays = getAvgDays(prevClosedLeads);
    const daysChange = getDaysChange(currAvgDays, prevAvgDays);

    const stats = {
      totalRevenue: revenueStr,
      revenueChange,
      leadConversion: totalLeadsCount > 0 ? ((soldCount / totalLeadsCount) * 100).toFixed(1) + '%' : '0.0%',
      conversionChange,
      activeDeals,
      dealsChange,
      avgDaysToClose: avgDaysVal > 0 ? avgDaysVal.toFixed(1) : '0.0',
      daysChange
    };

    // Cumulative Funnel steps calculation (reuses statusMap to avoid DB queries!)
    const funnel = {
      leads: totalLeadsCount,
      contacted: totalLeadsCount - statusMap['New'] - statusMap['Lost'],
      testRide: statusMap['Test Ride Booked'] + statusMap['Negotiation'] + statusMap['Sold'] + statusMap['Delivered'],
      quote: statusMap['Negotiation'] + statusMap['Sold'] + statusMap['Delivered'],
      sold: statusMap['Sold'] + statusMap['Delivered']
    };

    funnel.contactedPct = funnel.leads > 0 ? ((funnel.contacted / funnel.leads) * 100).toFixed(1) + '%' : '0.0%';
    funnel.testRidePct = funnel.contacted > 0 ? ((funnel.testRide / funnel.contacted) * 100).toFixed(1) + '%' : '0.0%';
    funnel.quotePct = funnel.testRide > 0 ? ((funnel.quote / funnel.testRide) * 100).toFixed(1) + '%' : '0.0%';
    funnel.soldPct = funnel.quote > 0 ? ((funnel.sold / funnel.quote) * 100).toFixed(1) + '%' : '0.0%';

    // Lead efficiency progress rows (optimized to 1 aggregate query instead of 12)
    const sourcesList = ['WhatsApp', 'Facebook', 'Instagram', 'Website', 'Walk-in', 'Referral'];
    const sourceStats = await Lead.aggregate([
      { $match: query },
      {
        $group: {
          _id: { 
            source: '$leadSource', 
            isSold: { $in: ['$status', ['Sold', 'Delivered']] } 
          },
          count: { $sum: 1 }
        }
      }
    ]);
    
    const sourceMap = {};
    sourcesList.forEach(src => {
      sourceMap[src] = { total: 0, sold: 0 };
    });
    (sourceStats || []).forEach(stat => {
      const src = stat._id.source;
      if (sourceMap[src]) {
        sourceMap[src].total += stat.count;
        if (stat._id.isSold) {
          sourceMap[src].sold += stat.count;
        }
      }
    });

    const leadEfficiency = sourcesList.map(src => {
      const data = sourceMap[src];
      const convRate = data.total > 0 ? Math.round((data.sold / data.total) * 100) : 0;
      return { channel: src, convRate };
    });

    // Bike demand ranking from inventory + enquiries (optimized to 1 aggregate query instead of N)
    const inventory = await Inventory.find().lean();
    const bikeModels = inventory.length > 0 ? inventory.map(i => i.bikeModel) : ['Low Rider™ ST', 'Street Glide™', 'Iron 883™', 'Fat Boy™ 114'];
    
    const bikeEnquiriesStats = await Lead.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$bikeModel',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const bikeEnquiriesMap = {};
    (bikeEnquiriesStats || []).forEach(stat => {
      if (stat._id) {
        bikeEnquiriesMap[stat._id] = stat.count;
      }
    });

    const bikeDemand = bikeModels.map(model => {
      const enquiries = bikeEnquiriesMap[model] || 0;
      let status = 'LOW';
      let demandClass = 'low';
      if (enquiries >= 5) {
        status = 'HIGH DEMAND';
        demandClass = 'high';
      } else if (enquiries >= 3) {
        status = 'STABLE';
        demandClass = 'stable';
      } else if (enquiries >= 1) {
        status = 'MODERATE';
        demandClass = 'moderate';
      }
      return { model, enquiries, status, demandClass };
    });
    bikeDemand.sort((a, b) => b.enquiries - a.enquiries);

    // Chart Data for Line Chart (Dynamic last 6 months)
    const monthNamesAbbr = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const months = [];
    const monthsIndices = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(monthNamesAbbr[d.getMonth()]);
      monthsIndices.push({ year: d.getFullYear(), month: d.getMonth() });
    }

    const newUnitsRevenue = [0, 0, 0, 0, 0, 0];
    const preOwnedRevenue = [0, 0, 0, 0, 0, 0];

    const soldLeads = await Lead.find({ ...query, status: { $in: ['Sold', 'Delivered'] } });
    soldLeads.forEach(lead => {
      const leadDate = lead.createdAt;
      const y = leadDate.getFullYear();
      const m = leadDate.getMonth();
      const idx = monthsIndices.findIndex(item => item.year === y && item.month === m);
      if (idx !== -1) {
        const price = (lead.targetBudget && lead.targetBudget > 0) ? lead.targetBudget : 28500;
        if (lead.conditionPreference === 'New') {
          newUnitsRevenue[idx] += price / 1000;
        } else {
          preOwnedRevenue[idx] += price / 1000;
        }
      }
    });

    const activeFilters = {
      source: source || 'All',
      bikeModel: bikeModel || '',
      startDate: startDate || '',
      endDate: endDate || ''
    };

    res.render('reports', {
      title: 'Reports & Analytics',
      stats,
      funnel,
      leadEfficiency,
      bikeDemand,
      months,
      newUnitsRevenue,
      preOwnedRevenue,
      deliveryStats,
      activeFilters
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};

// Expose clean reports data for exports
exports.getReportsData = async (req, res) => {
  try {
    const { source, bikeModel, startDate, endDate } = req.query;

    let query = {};
    if (source && source !== 'All') {
      query.leadSource = source;
    }
    if (bikeModel) {
      query.bikeModel = { $regex: bikeModel, $options: 'i' };
    }
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const leads = await Lead.find(query).lean();
    const leadIds = leads.map(l => l._id);

    // Fetch followups related to these leads
    const followups = await Task.find({ lead: { $in: leadIds } }).populate('lead').lean();

    // Fetch test rides related to these leads
    const testRides = await TestRide.find({ lead: { $in: leadIds } }).populate('lead').lean();

    // Fetch deliveries matching filters
    let deliveryQuery = {};
    if (bikeModel) {
      deliveryQuery.bikeModel = { $regex: bikeModel, $options: 'i' };
    }
    if (startDate || endDate) {
      deliveryQuery.deliveryDate = {};
      if (startDate) {
        deliveryQuery.deliveryDate.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        deliveryQuery.deliveryDate.$lte = end;
      }
    }
    if (source && source !== 'All') {
      deliveryQuery.lead = { $in: leadIds };
    }
    const deliveries = await Delivery.find(deliveryQuery).populate('lead').lean();

    // Funnel stages
    const pipeline = {
      new: leads.filter(l => l.status === 'New').length,
      contacted: leads.filter(l => l.status === 'Contacted').length,
      interested: leads.filter(l => l.status === 'Interested').length,
      testRideBooked: leads.filter(l => l.status === 'Test Ride Booked').length,
      negotiation: leads.filter(l => l.status === 'Negotiation').length,
      sold: leads.filter(l => l.status === 'Sold').length,
      lost: leads.filter(l => l.status === 'Lost').length
    };

    const soldLeads = leads.filter(l => ['Sold', 'Delivered'].includes(l.status));
    const totalRevenue = soldLeads.reduce((acc, l) => acc + (l.targetBudget || 28500), 0);
    const leadConversion = leads.length > 0 ? ((soldLeads.length / leads.length) * 100).toFixed(1) + '%' : '0.0%';

    const sales = {
      totalRevenue: `$${(totalRevenue / 1000000).toFixed(2)}M`,
      leadConversion,
      activeDeals: leads.filter(l => ['Interested', 'Test Ride Booked', 'Negotiation'].includes(l.status)).length
    };

    res.json({
      success: true,
      filters: {
        source: source || 'All',
        bikeModel: bikeModel || 'All',
        startDate: startDate || 'All',
        endDate: endDate || 'All'
      },
      leads,
      pipeline,
      followups,
      testRides,
      deliveries,
      sales
    });
  } catch (error) {
    console.error('Error compiling reports data:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

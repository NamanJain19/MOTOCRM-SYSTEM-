const Lead = require('../models/Lead');
const Activity = require('../models/Activity');
const Task = require('../models/Task');
const TestRide = require('../models/TestRide');
const Inventory = require('../models/Inventory');

exports.getDashboard = async (req, res) => {
  try {
    const startOfCurrentMonth = new Date();
    startOfCurrentMonth.setDate(1);
    startOfCurrentMonth.setHours(0, 0, 0, 0);

    const startOfLastMonth = new Date(startOfCurrentMonth);
    startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);

    const endOfLastMonth = new Date(startOfCurrentMonth);
    endOfLastMonth.setMilliseconds(-1);

    // Dynamic 6 months leads trend calculation
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyLeads = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
      const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
      
      const count = await Lead.countDocuments({
        createdAt: { $gte: startOfMonth, $lte: endOfMonth }
      });
      const soldCount = await Lead.countDocuments({
        status: { $in: ['Sold', 'Delivered'] },
        createdAt: { $gte: startOfMonth, $lte: endOfMonth }
      });
      const convRate = count > 0 ? parseFloat((soldCount / count * 100).toFixed(1)) : 0;
      monthlyLeads.push({
        _id: { year: d.getFullYear(), month: d.getMonth() + 1 },
        count,
        convRate
      });
    }

    // Run remaining queries in parallel
    const [
      metrics,
      sourceCounts,
      salesPerformanceRaw,
      recentActivities,
      upcomingTestRides,
      completedTestRidesCount,
      inventoryItems,
      currTotalLeads,
      prevTotalLeads,
      currNewLeads,
      prevNewLeads,
      currSoldLeads,
      prevSoldLeads
    ] = await Promise.all([
      // 1. Metrics aggregation
      Lead.aggregate([
        {
          $group: {
            _id: null,
            totalLeads: { $sum: 1 },
            newLeads: { $sum: { $cond: [{ $eq: ['$status', 'New'] }, 1, 0] } },
            contactedLeads: { $sum: { $cond: [{ $eq: ['$status', 'Contacted'] }, 1, 0] } },
            interestedLeads: { $sum: { $cond: [{ $eq: ['$status', 'Interested'] }, 1, 0] } },
            testRidesBooked: { $sum: { $cond: [{ $eq: ['$status', 'Test Ride Booked'] }, 1, 0] } },
            negotiationLeads: { $sum: { $cond: [{ $eq: ['$status', 'Negotiation'] }, 1, 0] } },
            soldLeads: { $sum: { $cond: [{ $eq: ['$status', 'Sold'] }, 1, 0] } },
            lostLeads: { $sum: { $cond: [{ $eq: ['$status', 'Lost'] }, 1, 0] } }
          }
        }
      ]),
      // 2. Lead sources distribution
      Lead.aggregate([
        {
          $group: {
            _id: '$leadSource',
            count: { $sum: 1 }
          }
        }
      ]),
      // 3. Sales performance raw
      Lead.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),
      // 4. Recent activities (Filter out delivery and bike_sold logs)
      Activity.find({ type: { $nin: ['delivery', 'bike_sold'] } }).sort({ createdAt: -1 }).limit(15).lean().catch(err => {
        console.warn('Could not fetch activities:', err.message);
        return [];
      }),
      // 5. Upcoming test rides
      TestRide.find({ status: 'Scheduled' }).populate('lead').sort({ date: 1 }).limit(3).lean().catch(err => {
        console.warn('Could not fetch upcoming test rides:', err.message);
        return [];
      }),
      // 6. Completed test rides count
      TestRide.countDocuments({ status: 'Completed' }).catch(err => {
        console.warn('Could not count completed test rides:', err.message);
        return 0;
      }),
      // 7. Inventory items
      Inventory.find().lean().catch(err => {
        console.warn('Could not fetch inventory items:', err.message);
        return [];
      }),
      // MoM metric counts
      Lead.countDocuments({ createdAt: { $gte: startOfCurrentMonth } }),
      Lead.countDocuments({ createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } }),
      Lead.countDocuments({ status: 'New', createdAt: { $gte: startOfCurrentMonth } }),
      Lead.countDocuments({ status: 'New', createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } }),
      Lead.countDocuments({ status: 'Sold', createdAt: { $gte: startOfCurrentMonth } }),
      Lead.countDocuments({ status: 'Sold', createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } })
    ]);

    const metricsData = metrics[0] || {
      totalLeads: 0,
      newLeads: 0,
      contactedLeads: 0,
      interestedLeads: 0,
      testRidesBooked: 0,
      negotiationLeads: 0,
      soldLeads: 0,
      lostLeads: 0
    };

    // Calculate conversion rate (sold / total)
    const convRate = metricsData.totalLeads > 0 
      ? ((metricsData.soldLeads / metricsData.totalLeads) * 100).toFixed(1) 
      : '0';

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

    const totalLeadsChange = getPercentageChange(currTotalLeads, prevTotalLeads);
    const newLeadsChange = getPercentageChange(currNewLeads, prevNewLeads);
    const soldBikesChange = getPercentageChange(currSoldLeads, prevSoldLeads);

    const donutData = {
      WhatsApp: 0,
      Facebook: 0,
      Instagram: 0,
      Website: 0,
      'Walk-in': 0,
      Referral: 0
    };

    sourceCounts.forEach(source => {
      if (source._id in donutData) {
        donutData[source._id] = source.count;
      }
    });

    // Populate salesPerformance fully for all statuses in correct order
    const allowedStatuses = ['New', 'Contacted', 'Interested', 'Test Ride Booked', 'Negotiation', 'Sold', 'Delivered', 'Lost'];
    const salesPerformanceMap = {};
    allowedStatuses.forEach(status => {
      salesPerformanceMap[status] = 0;
    });
    salesPerformanceRaw.forEach(item => {
      if (item._id in salesPerformanceMap) {
        salesPerformanceMap[item._id] = item.count;
      }
    });
    const salesPerformance = allowedStatuses.map(status => ({
      _id: status,
      count: salesPerformanceMap[status]
    }));

    // Calculate inventory stats & low stock alerts
    let inventorySummary = { totalModels: 0, totalStock: 0, totalReserved: 0, totalSold: 0, lowStockCount: 0 };
    let lowStockAlerts = [];
    inventorySummary.totalModels = inventoryItems.length;
    inventoryItems.forEach(item => {
      inventorySummary.totalStock += item.stockQuantity;
      inventorySummary.totalReserved += item.reservedBikes;
      inventorySummary.totalSold += item.soldBikes;
      if (item.stockQuantity <= item.lowStockThreshold) {
        inventorySummary.lowStockCount++;
        lowStockAlerts.push(item);
      }
    });

    res.render('dashboard', {
      title: 'Dashboard',
      stats: {
        totalLeads: metricsData.totalLeads,
        newLeads: metricsData.newLeads,
        interestedLeads: metricsData.interestedLeads,
        testRides: metricsData.testRidesBooked,
        soldBikes: metricsData.soldLeads,
        convRate: convRate + '%',
        totalLeadsChange,
        newLeadsChange,
        soldBikesChange
      },
      recentActivities,
      donutData,
      monthlyLeads,
      salesPerformance,
      upcomingTestRides,
      completedTestRidesCount,
      inventorySummary,
      lowStockAlerts
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.render('dashboard', {
      title: 'Dashboard',
      stats: {
        totalLeads: 0,
        newLeads: 0,
        interestedLeads: 0,
        testRides: 0,
        soldBikes: 0,
        convRate: '0%',
        totalLeadsChange: 'Stable —',
        newLeadsChange: 'Stable —',
        soldBikesChange: 'Stable —'
      },
      recentActivities: [],
      donutData: {},
      monthlyLeads: [],
      salesPerformance: [],
      upcomingTestRides: [],
      completedTestRidesCount: 0,
      inventorySummary: { totalModels: 0, totalStock: 0, totalReserved: 0, totalSold: 0, lowStockCount: 0 },
      lowStockAlerts: [],
      error: 'Error loading dashboard data'
    });
  }
};

exports.deleteActivity = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Delete activity request received for ID:', id);
    const result = await Activity.findByIdAndDelete(id);
    console.log('Delete result:', result);
    if (!result) {
      console.log('Activity not found with ID:', id);
    }
    res.json({ success: true, message: 'Activity log deleted successfully.' });
  } catch (error) {
    console.error('Error deleting activity log:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

exports.bulkDeleteActivities = async (req, res) => {
  try {
    console.log('Bulk delete request received:', req.body);
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      console.log('No valid IDs provided');
      return res.status(400).json({ success: false, message: 'No activity IDs provided.' });
    }
    console.log('Deleting activities with IDs:', ids);
    console.log('Activity model:', Activity.modelName);
    
    // Convert string IDs to ObjectId if needed
    const mongoose = require('mongoose');
    const objectIds = ids.map(id => {
      try {
        return new mongoose.Types.ObjectId(id);
      } catch (e) {
        console.log('Invalid ObjectId:', id);
        return id;
      }
    });
    
    console.log('Converted ObjectIds:', objectIds);
    const result = await Activity.deleteMany({ _id: { $in: objectIds } });
    console.log('Delete result:', result);
    console.log('Deleted count:', result.deletedCount);
    
    if (result.deletedCount === 0) {
      console.log('No documents deleted, checking if activities exist...');
      const existing = await Activity.find({ _id: { $in: objectIds } });
      console.log('Existing activities:', existing);
    }
    
    res.json({ success: true, message: `${result.deletedCount || ids.length} activity log(s) deleted successfully.` });
  } catch (error) {
    console.error('Error bulk deleting activity logs:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

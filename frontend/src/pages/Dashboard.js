import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useBlockchain } from '../context/BlockchainContext';

const Dashboard = () => {
  const { contract, participant, STATUS } = useBlockchain();
  const [stats, setStats] = useState({
    totalBatches: 0,
    myBatches: 0,
    pendingTransfers: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [contract, participant]);

  const loadDashboardData = async () => {
    if (!contract || !participant) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Get total batches
      const total = await contract.getTotalBatches();
      
      // Get my batches
      const myBatchIds = await contract.getBatchesByOwner(participant.address);
      
      // Get recent batches for activity
      const recentActivity = [];
      const batchCount = Number(total);
      const startIndex = Math.max(1, batchCount - 4); // Last 5 batches

      for (let i = batchCount; i >= startIndex && i >= 1; i--) {
        try {
          const batch = await contract.getBatchDetails(i);
          recentActivity.push({
            id: i,
            batchType: batch.batchType,
            quantity: Number(batch.quantity),
            status: Number(batch.status),
            currentOwner: batch.currentOwner,
            createdAt: Number(batch.createdAt)
          });
        } catch (err) {
          console.error(`Error loading batch ${i}:`, err);
        }
      }

      setStats({
        totalBatches: batchCount,
        myBatches: myBatchIds.length,
        pendingTransfers: 0, // Can be enhanced
        recentActivity
      });

      setLoading(false);
    } catch (err) {
      console.error('Error loading dashboard:', err);
      setLoading(false);
    }
  };

  const getRoleSpecificActions = () => {
    const role = participant?.role;
    switch (role) {
      case 1: // Refinery
        return [
          { title: 'Create New Batch', icon: '➕', href: '/batches/create', color: 'bg-green-500' },
          { title: 'My Batches', icon: '📦', href: '/batches', color: 'bg-blue-500' },
          { title: 'Initiate Transfer', icon: '🚚', href: '/transfers', color: 'bg-purple-500' },
        ];
      case 2: // Distributor
        return [
          { title: 'View Batches', icon: '📦', href: '/batches', color: 'bg-blue-500' },
          { title: 'Manage Transfers', icon: '🔄', href: '/transfers', color: 'bg-purple-500' },
          { title: 'Update Status', icon: '📍', href: '/batches', color: 'bg-yellow-500' },
        ];
      case 3: // Terminal
        return [
          { title: 'Receive Batches', icon: '📥', href: '/transfers', color: 'bg-green-500' },
          { title: 'Quality Testing', icon: '🔬', href: '/batches', color: 'bg-indigo-500' },
          { title: 'View Inventory', icon: '📦', href: '/batches', color: 'bg-blue-500' },
        ];
      case 4: // Regulator
        return [
          { title: 'Audit Trail', icon: '📝', href: '/audit', color: 'bg-red-500' },
          { title: 'All Batches', icon: '📊', href: '/batches', color: 'bg-blue-500' },
          { title: 'Approve/Reject', icon: '✅', href: '/batches', color: 'bg-green-500' },
        ];
      case 5: // Airline
        return [
          { title: 'My Inventory', icon: '✈️', href: '/batches', color: 'bg-blue-500' },
          { title: 'Consumption', icon: '⛽', href: '/batches', color: 'bg-orange-500' },
          { title: 'History', icon: '📜', href: '/audit', color: 'bg-gray-500' },
        ];
      default:
        return [];
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="card bg-gradient-to-r from-primary-500 to-primary-700 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome back, {participant?.name}!</h1>
            <p className="text-primary-100 text-lg">
              Role: {participant?.roleName} • {participant?.location}
            </p>
          </div>
          <div className="hidden md:block text-6xl opacity-20">
            {participant?.role === 1 && '🏭'}
            {participant?.role === 2 && '🚛'}
            {participant?.role === 3 && '🏢'}
            {participant?.role === 4 && '👮'}
            {participant?.role === 5 && '✈️'}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Total Batches</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalBatches}</p>
            </div>
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-3xl">
              📦
            </div>
          </div>
        </div>

        <div className="card hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">My Batches</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.myBatches}</p>
            </div>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-3xl">
              ✅
            </div>
          </div>
        </div>

        <div className="card hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Pending Transfers</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.pendingTransfers}</p>
            </div>
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center text-3xl">
              🔄
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {getRoleSpecificActions().map((action, index) => (
            <Link
              key={index}
              to={action.href}
              className="card hover:shadow-xl transition transform hover:-translate-y-1 cursor-pointer"
            >
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center text-2xl`}>
                  {action.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{action.title}</h3>
                  <p className="text-sm text-gray-500">Click to proceed</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Recent Activity</h2>
          <Link to="/batches" className="text-primary-600 hover:text-primary-700 font-medium">
            View All →
          </Link>
        </div>
        
        {stats.recentActivity.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-500">No recent activity</p>
          </div>
        ) : (
          <div className="space-y-3">
            {stats.recentActivity.map((batch) => (
              <Link
                key={batch.id}
                to={`/batches/${batch.id}`}
                className="card hover:shadow-lg transition flex items-center justify-between"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center text-white font-bold">
                    #{batch.id}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{batch.batchType}</h3>
                    <p className="text-sm text-gray-500">{batch.quantity.toLocaleString()} liters</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`badge ${getStatusClass(batch.status)}`}>
                    {STATUS[batch.status]}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(batch.createdAt * 1000).toLocaleDateString()}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  function getStatusClass(status) {
    const classes = ['badge-created', 'badge-intransit', 'badge-delivered', 'badge-tested', 'badge-approved', 'badge-rejected', 'badge-consumed'];
    return classes[status] || 'badge';
  }
};

export default Dashboard;


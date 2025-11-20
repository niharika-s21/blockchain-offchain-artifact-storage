import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useBlockchain } from '../context/BlockchainContext';

const AuditTrail = () => {
  const { contract, formatAddress, formatDate } = useBlockchain();
  const [auditEntries, setAuditEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterBatchId, setFilterBatchId] = useState('');

  useEffect(() => {
    loadAuditTrail();
  }, [contract]);

  const loadAuditTrail = async () => {
    if (!contract) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const total = await contract.getTotalBatches();
      const batchCount = Number(total);
      
      const allEntries = [];
      
      for (let i = 1; i <= batchCount; i++) {
        try {
          const trail = await contract.getBatchAuditTrail(i);
          trail.forEach(entry => {
            allEntries.push({
              batchId: i,
              actor: entry.actor,
              action: entry.action,
              details: entry.details,
              timestamp: Number(entry.timestamp),
              locationData: entry.locationData
            });
          });
        } catch (err) {
          console.error(`Error loading audit trail for batch ${i}:`, err);
        }
      }

      // Sort by timestamp descending (newest first)
      allEntries.sort((a, b) => b.timestamp - a.timestamp);
      
      setAuditEntries(allEntries);
      setLoading(false);
    } catch (err) {
      console.error('Error loading audit trail:', err);
      setLoading(false);
    }
  };

  const filteredEntries = filterBatchId
    ? auditEntries.filter(entry => entry.batchId.toString() === filterBatchId)
    : auditEntries;

  const getActionColor = (action) => {
    const colors = {
      'BATCH_CREATED': 'bg-blue-100 text-blue-800',
      'STATUS_UPDATED': 'bg-green-100 text-green-800',
      'TRANSFER_REQUESTED': 'bg-yellow-100 text-yellow-800',
      'TRANSFER_ACCEPTED': 'bg-purple-100 text-purple-800',
      'TRANSFER_REJECTED': 'bg-red-100 text-red-800',
      'TRANSFER_CANCELLED': 'bg-gray-100 text-gray-800',
      'BATCH_REJECTED': 'bg-red-100 text-red-800',
    };
    return colors[action] || 'bg-gray-100 text-gray-800';
  };

  const getActionIcon = (action) => {
    const icons = {
      'BATCH_CREATED': '✨',
      'STATUS_UPDATED': '📝',
      'TRANSFER_REQUESTED': '📤',
      'TRANSFER_ACCEPTED': '✅',
      'TRANSFER_REJECTED': '❌',
      'TRANSFER_CANCELLED': '🚫',
      'BATCH_REJECTED': '⚠️',
    };
    return icons[action] || '📌';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Audit Trail</h1>
        <p className="text-gray-500 mt-1">Complete history of all supply chain operations</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <p className="text-gray-500 text-sm font-medium">Total Events</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{auditEntries.length}</p>
        </div>
        <div className="card">
          <p className="text-gray-500 text-sm font-medium">Batches Tracked</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {new Set(auditEntries.map(e => e.batchId)).size}
          </p>
        </div>
        <div className="card">
          <p className="text-gray-500 text-sm font-medium">Latest Update</p>
          <p className="text-sm font-semibold text-gray-900 mt-2">
            {auditEntries.length > 0 ? formatDate(auditEntries[0].timestamp) : 'N/A'}
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="card">
        <div className="flex items-center space-x-4">
          <label className="font-semibold text-gray-700">Filter by Batch ID:</label>
          <input
            type="number"
            value={filterBatchId}
            onChange={(e) => setFilterBatchId(e.target.value)}
            className="input-field max-w-xs"
            placeholder="Enter batch ID..."
            min="1"
          />
          {filterBatchId && (
            <button
              onClick={() => setFilterBatchId('')}
              className="btn-secondary"
            >
              Clear Filter
            </button>
          )}
        </div>
      </div>

      {/* Audit Entries */}
      <div className="card">
        {filteredEntries.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Audit Entries</h3>
            <p className="text-gray-500">No audit trail entries found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEntries.map((entry, index) => (
              <div
                key={index}
                className="border-l-4 border-primary-500 bg-gray-50 rounded-r-lg p-4 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    {/* Icon */}
                    <div className="text-3xl">{getActionIcon(entry.action)}</div>
                    
                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <Link
                          to={`/batches/${entry.batchId}`}
                          className="font-bold text-primary-600 hover:text-primary-700"
                        >
                          Batch #{entry.batchId}
                        </Link>
                        <span className={`badge ${getActionColor(entry.action)}`}>
                          {entry.action}
                        </span>
                      </div>
                      
                      <p className="text-gray-900 mb-2">{entry.details}</p>
                      
                      {entry.locationData && (
                        <p className="text-sm text-gray-600 mb-2">
                          📍 Location: {entry.locationData}
                        </p>
                      )}
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>👤 Actor: {formatAddress(entry.actor)}</span>
                        <span>•</span>
                        <span>🕐 {formatDate(entry.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Export Button (Placeholder) */}
      <div className="card bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Export Audit Trail</h3>
            <p className="text-sm text-gray-600">Download complete audit history for compliance reporting</p>
          </div>
          <button className="btn-secondary" disabled>
            📥 Export (Coming Soon)
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuditTrail;


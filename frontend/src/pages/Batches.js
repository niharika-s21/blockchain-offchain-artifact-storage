import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useBlockchain } from '../context/BlockchainContext';

const Batches = () => {
  const { contract, participant, STATUS, formatAddress } = useBlockchain();
  const navigate = useNavigate();
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, my, available

  useEffect(() => {
    loadBatches();
  }, [contract, filter]);

  const loadBatches = async () => {
    if (!contract) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const total = await contract.getTotalBatches();
      const batchCount = Number(total);
      
      const batchesData = [];
      for (let i = batchCount; i >= 1; i--) {
        try {
          const batch = await contract.getBatchDetails(i);
          const batchData = {
            id: i,
            creator: batch.creator,
            currentOwner: batch.currentOwner,
            pendingOwner: batch.pendingOwner,
            status: Number(batch.status),
            batchType: batch.batchType,
            quantity: Number(batch.quantity),
            originLocation: batch.originLocation,
            metadataURI: batch.metadataURI,
            createdAt: Number(batch.createdAt),
            updatedAt: Number(batch.updatedAt)
          };

          // Apply filter
          if (filter === 'my' && batch.currentOwner.toLowerCase() !== participant.address.toLowerCase()) {
            continue;
          }
          if (filter === 'available' && batch.currentOwner.toLowerCase() === participant.address.toLowerCase()) {
            continue;
          }

          batchesData.push(batchData);
        } catch (err) {
          console.error(`Error loading batch ${i}:`, err);
        }
      }

      setBatches(batchesData);
      setLoading(false);
    } catch (err) {
      console.error('Error loading batches:', err);
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    const classes = ['badge-created', 'badge-intransit', 'badge-delivered', 'badge-tested', 'badge-approved', 'badge-rejected', 'badge-consumed'];
    return classes[status] || 'badge';
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Batches</h1>
          <p className="text-gray-500 mt-1">Manage and track fuel batches</p>
        </div>
        {participant?.role === 1 && ( // Refinery can create batches
          <Link to="/batches/create" className="btn-primary mt-4 md:mt-0">
            + Create New Batch
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Batches
          </button>
          <button
            onClick={() => setFilter('my')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'my'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            My Batches
          </button>
          <button
            onClick={() => setFilter('available')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'available'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Available
          </button>
        </div>
      </div>

      {/* Batches List */}
      {batches.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-6xl mb-4">📦</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Batches Found</h3>
          <p className="text-gray-500">
            {filter === 'my'
              ? 'You don\'t own any batches yet.'
              : 'No batches available in the system.'}
          </p>
          {participant?.role === 1 && (
            <Link to="/batches/create" className="btn-primary mt-6 inline-block">
              Create Your First Batch
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {batches.map((batch) => (
            <div
              key={batch.id}
              className="card hover:shadow-xl transition"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-2xl font-bold text-primary-600">#{batch.id}</span>
                    <span className={`badge ${getStatusBadgeClass(batch.status)}`}>
                      {STATUS[batch.status]}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">{batch.batchType}</h3>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm">
                  <span className="text-gray-500 w-24">Quantity:</span>
                  <span className="font-semibold text-gray-900">
                    {batch.quantity.toLocaleString()} L
                  </span>
                </div>
                <div className="flex items-center text-sm">
                  <span className="text-gray-500 w-24">Origin:</span>
                  <span className="font-medium text-gray-700">{batch.originLocation}</span>
                </div>
                <div className="flex items-center text-sm">
                  <span className="text-gray-500 w-24">Owner:</span>
                  <span className="font-mono text-xs text-gray-600">
                    {batch.currentOwner.toLowerCase() === participant.address.toLowerCase()
                      ? 'You'
                      : formatAddress(batch.currentOwner)}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 space-y-2">
                <p className="text-xs text-gray-500">
                  Created {new Date(batch.createdAt * 1000).toLocaleDateString()}
                </p>
                <div className="flex space-x-2">
                  <button
                    onClick={() => navigate(`/batch/${batch.id}`)}
                    className="flex-1 btn-primary text-sm py-2"
                  >
                    View Details
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/batch/${batch.id}/history`);
                    }}
                    className="flex-1 btn-secondary text-sm py-2"
                    title="View History Timeline"
                  >
                    📊 History
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Batches;


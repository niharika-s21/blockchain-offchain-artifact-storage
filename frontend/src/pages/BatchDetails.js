import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBlockchain } from '../context/BlockchainContext';

const BatchDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { contract, participant, STATUS, formatAddress, formatDate } = useBlockchain();
  
  const [batch, setBatch] = useState(null);
  const [ownershipHistory, setOwnershipHistory] = useState([]);
  const [auditTrail, setAuditTrail] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details'); // details, history, audit

  useEffect(() => {
    loadBatchData();
  }, [id, contract]);

  const loadBatchData = async () => {
    if (!contract || !id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Get batch details
      const batchData = await contract.getBatchDetails(id);
      setBatch({
        id: Number(id),
        creator: batchData.creator,
        currentOwner: batchData.currentOwner,
        pendingOwner: batchData.pendingOwner,
        status: Number(batchData.status),
        batchType: batchData.batchType,
        quantity: Number(batchData.quantity),
        originLocation: batchData.originLocation,
        metadataURI: batchData.metadataURI,
        createdAt: Number(batchData.createdAt),
        updatedAt: Number(batchData.updatedAt)
      });

      // Get ownership history
      const history = await contract.getOwnershipHistory(id);
      setOwnershipHistory(history);

      // Get audit trail
      const trail = await contract.getBatchAuditTrail(id);
      setAuditTrail(trail.map(entry => ({
        batchId: Number(entry.batchId),
        actor: entry.actor,
        action: entry.action,
        details: entry.details,
        timestamp: Number(entry.timestamp),
        locationData: entry.locationData
      })));

      setLoading(false);
    } catch (err) {
      console.error('Error loading batch:', err);
      setLoading(false);
    }
  };

  const isOwner = batch && batch.currentOwner.toLowerCase() === participant?.address.toLowerCase();
  const isRegulator = participant?.role === 4;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="card text-center py-12">
        <div className="text-6xl mb-4">❌</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Batch Not Found</h3>
        <p className="text-gray-500">The batch you're looking for doesn't exist.</p>
        <button onClick={() => navigate('/batches')} className="btn-primary mt-4">
          Back to Batches
        </button>
      </div>
    );
  }

  const getStatusBadgeClass = (status) => {
    const classes = ['badge-created', 'badge-intransit', 'badge-delivered', 'badge-tested', 'badge-approved', 'badge-rejected', 'badge-consumed'];
    return classes[status] || 'badge';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/batches')}
            className="text-gray-500 hover:text-gray-700"
          >
            ← Back
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Batch #{batch.id}</h1>
            <p className="text-gray-500 mt-1">{batch.batchType}</p>
          </div>
        </div>
        <span className={`badge text-lg ${getStatusBadgeClass(batch.status)}`}>
          {STATUS[batch.status]}
        </span>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {['details', 'history', 'audit'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition ${
                activeTab === tab
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* Details Tab */}
      {activeTab === 'details' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Batch Information */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Batch Information</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Batch Type</label>
                <p className="text-lg font-semibold text-gray-900">{batch.batchType}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Quantity</label>
                <p className="text-lg font-semibold text-gray-900">{batch.quantity.toLocaleString()} Liters</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Origin Location</label>
                <p className="text-lg font-semibold text-gray-900">{batch.originLocation}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <p className="text-lg">
                  <span className={`badge ${getStatusBadgeClass(batch.status)}`}>
                    {STATUS[batch.status]}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Ownership Information */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Ownership</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Creator</label>
                <p className="text-sm font-mono text-gray-900">{formatAddress(batch.creator)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Current Owner</label>
                <p className="text-sm font-mono text-gray-900">
                  {isOwner ? (
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                      You ({formatAddress(batch.currentOwner)})
                    </span>
                  ) : (
                    formatAddress(batch.currentOwner)
                  )}
                </p>
              </div>
              {batch.pendingOwner !== '0x0000000000000000000000000000000000000000' && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Pending Transfer To</label>
                  <p className="text-sm font-mono text-gray-900">
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                      {formatAddress(batch.pendingOwner)}
                    </span>
                  </p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-500">Created</label>
                <p className="text-sm text-gray-900">{formatDate(batch.createdAt)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Last Updated</label>
                <p className="text-sm text-gray-900">{formatDate(batch.updatedAt)}</p>
              </div>
            </div>
          </div>

          {/* Metadata */}
          {batch.metadataURI && batch.metadataURI !== 'ipfs://pending' && (
            <div className="card lg:col-span-2">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Metadata</h2>
              <p className="text-sm font-mono text-gray-600 break-all">{batch.metadataURI}</p>
            </div>
          )}

          {/* Actions */}
          {(isOwner || isRegulator) && (
            <div className="card lg:col-span-2">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
              <div className="flex flex-wrap gap-3">
                {isOwner && batch.status !== 5 && batch.status !== 6 && (
                  <button className="btn-primary" onClick={() => navigate('/transfers', { state: { batchId: batch.id } })}>
                    Initiate Transfer
                  </button>
                )}
                <button className="btn-secondary">Update Status</button>
                <button className="btn-secondary">View on Explorer</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Ownership History</h2>
          {ownershipHistory.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No ownership history</p>
          ) : (
            <div className="space-y-3">
              {ownershipHistory.map((owner, index) => (
                <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center font-bold text-primary-700">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-mono text-sm text-gray-900">{formatAddress(owner)}</p>
                    {index === ownershipHistory.length - 1 && (
                      <span className="text-xs text-green-600 font-semibold">Current Owner</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Audit Trail Tab */}
      {activeTab === 'audit' && (
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Audit Trail</h2>
          {auditTrail.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No audit entries</p>
          ) : (
            <div className="space-y-4">
              {auditTrail.map((entry, index) => (
                <div key={index} className="border-l-4 border-primary-500 pl-4 py-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{entry.action}</p>
                      <p className="text-sm text-gray-600 mt-1">{entry.details}</p>
                      {entry.locationData && (
                        <p className="text-xs text-gray-500 mt-1">📍 {entry.locationData}</p>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-xs text-gray-500">{formatDate(entry.timestamp)}</p>
                      <p className="text-xs font-mono text-gray-400">{formatAddress(entry.actor)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BatchDetails;


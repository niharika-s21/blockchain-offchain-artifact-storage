import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBlockchain } from '../context/BlockchainContext';

const BatchHistoryVisualization = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { contract, formatAddress, formatDate, STATUS } = useBlockchain();
  
  const [batch, setBatch] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('timeline'); // timeline or flowchart
  const [filter, setFilter] = useState('all'); // all, transfers, status, certificates

  useEffect(() => {
    loadBatchHistory();
  }, [id, contract]);

  const loadBatchHistory = async () => {
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
        batchType: batchData.batchType,
        quantity: Number(batchData.quantity),
        originLocation: batchData.originLocation,
        status: Number(batchData.status),
        createdAt: Number(batchData.createdAt),
        currentOwner: batchData.currentOwner
      });

      // Query all events for this batch
      await queryAllEvents(id);

      setLoading(false);
    } catch (err) {
      console.error('Error loading batch history:', err);
      setLoading(false);
    }
  };

  const queryAllEvents = async (batchId) => {
    try {
      const allEvents = [];
      
      // Get the current block number
      const currentBlock = await contract.runner.provider.getBlockNumber();
      const fromBlock = 0; // Start from genesis block

      // Query BatchRegistered events
      const batchRegisteredFilter = contract.filters.BatchRegistered(batchId);
      const batchRegisteredEvents = await contract.queryFilter(batchRegisteredFilter, fromBlock, currentBlock);
      
      batchRegisteredEvents.forEach(event => {
        allEvents.push({
          type: 'BatchRegistered',
          batchId: Number(event.args.batchId),
          creator: event.args.creator,
          batchType: event.args.batchType,
          quantity: Number(event.args.quantity),
          timestamp: Number(event.args.timestamp),
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash,
          category: 'creation'
        });
      });

      // Query BatchStatusUpdated events
      const statusUpdatedFilter = contract.filters.BatchStatusUpdated(batchId);
      const statusUpdatedEvents = await contract.queryFilter(statusUpdatedFilter, fromBlock, currentBlock);
      
      statusUpdatedEvents.forEach(event => {
        allEvents.push({
          type: 'BatchStatusUpdated',
          batchId: Number(event.args.batchId),
          newStatus: Number(event.args.newStatus),
          updatedBy: event.args.updatedBy,
          timestamp: Number(event.args.timestamp),
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash,
          category: 'status'
        });
      });

      // Query TransferRequested events
      const transferRequestedFilter = contract.filters.TransferRequested(null, batchId);
      const transferRequestedEvents = await contract.queryFilter(transferRequestedFilter, fromBlock, currentBlock);
      
      transferRequestedEvents.forEach(event => {
        allEvents.push({
          type: 'TransferRequested',
          requestId: Number(event.args.requestId),
          batchId: Number(event.args.batchId),
          from: event.args.from,
          to: event.args.to,
          reason: event.args.reason,
          timestamp: Number(event.args.timestamp),
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash,
          category: 'transfer'
        });
      });

      // Query TransferApproved events
      const transferApprovedFilter = contract.filters.TransferApproved(null, batchId);
      const transferApprovedEvents = await contract.queryFilter(transferApprovedFilter, fromBlock, currentBlock);
      
      transferApprovedEvents.forEach(event => {
        allEvents.push({
          type: 'TransferApproved',
          requestId: Number(event.args.requestId),
          batchId: Number(event.args.batchId),
          from: event.args.from,
          to: event.args.to,
          timestamp: Number(event.args.timestamp),
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash,
          category: 'transfer'
        });
      });

      // Query TransferRejected events
      const transferRejectedFilter = contract.filters.TransferRejected(null, batchId);
      const transferRejectedEvents = await contract.queryFilter(transferRejectedFilter, fromBlock, currentBlock);
      
      transferRejectedEvents.forEach(event => {
        allEvents.push({
          type: 'TransferRejected',
          requestId: Number(event.args.requestId),
          batchId: Number(event.args.batchId),
          from: event.args.from,
          to: event.args.to,
          reason: event.args.reason,
          timestamp: Number(event.args.timestamp),
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash,
          category: 'transfer'
        });
      });

      // Query OwnershipTransferred events
      const ownershipTransferredFilter = contract.filters.OwnershipTransferred(batchId);
      const ownershipTransferredEvents = await contract.queryFilter(ownershipTransferredFilter, fromBlock, currentBlock);
      
      ownershipTransferredEvents.forEach(event => {
        allEvents.push({
          type: 'OwnershipTransferred',
          batchId: Number(event.args.batchId),
          previousOwner: event.args.previousOwner,
          newOwner: event.args.newOwner,
          timestamp: Number(event.args.timestamp),
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash,
          category: 'transfer'
        });
      });

      // Query CertificateLinked events
      const certificateLinkedFilter = contract.filters.CertificateLinked(batchId);
      const certificateLinkedEvents = await contract.queryFilter(certificateLinkedFilter, fromBlock, currentBlock);
      
      certificateLinkedEvents.forEach(event => {
        allEvents.push({
          type: 'CertificateLinked',
          batchId: Number(event.args.batchId),
          certificateType: event.args.certificateType,
          ipfsHash: event.args.ipfsHash,
          issuedBy: event.args.issuedBy,
          timestamp: Number(event.args.timestamp),
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash,
          category: 'certificate'
        });
      });

      // Query CertificateRevoked events
      const certificateRevokedFilter = contract.filters.CertificateRevoked(batchId);
      const certificateRevokedEvents = await contract.queryFilter(certificateRevokedFilter, fromBlock, currentBlock);
      
      certificateRevokedEvents.forEach(event => {
        allEvents.push({
          type: 'CertificateRevoked',
          batchId: Number(event.args.batchId),
          ipfsHash: event.args.ipfsHash,
          revokedBy: event.args.revokedBy,
          timestamp: Number(event.args.timestamp),
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash,
          category: 'certificate'
        });
      });

      // Sort events by timestamp (oldest first)
      allEvents.sort((a, b) => a.timestamp - b.timestamp);

      console.log('📊 Loaded events:', allEvents);
      setEvents(allEvents);
    } catch (err) {
      console.error('Error querying events:', err);
    }
  };

  const getEventIcon = (eventType) => {
    const icons = {
      'BatchRegistered': '📦',
      'BatchStatusUpdated': '🔄',
      'TransferRequested': '📤',
      'TransferApproved': '✅',
      'TransferRejected': '❌',
      'OwnershipTransferred': '🔑',
      'CertificateLinked': '📜',
      'CertificateRevoked': '🚫'
    };
    return icons[eventType] || '•';
  };

  const getEventColor = (eventType) => {
    const colors = {
      'BatchRegistered': 'bg-blue-100 border-blue-500 text-blue-900',
      'BatchStatusUpdated': 'bg-purple-100 border-purple-500 text-purple-900',
      'TransferRequested': 'bg-yellow-100 border-yellow-500 text-yellow-900',
      'TransferApproved': 'bg-green-100 border-green-500 text-green-900',
      'TransferRejected': 'bg-red-100 border-red-500 text-red-900',
      'OwnershipTransferred': 'bg-indigo-100 border-indigo-500 text-indigo-900',
      'CertificateLinked': 'bg-teal-100 border-teal-500 text-teal-900',
      'CertificateRevoked': 'bg-gray-100 border-gray-500 text-gray-900'
    };
    return colors[eventType] || 'bg-gray-100 border-gray-500 text-gray-900';
  };

  const formatEventDetails = (event) => {
    switch (event.type) {
      case 'BatchRegistered':
        return (
          <div>
            <p className="font-semibold">Batch Created</p>
            <p className="text-sm">Type: {event.batchType}</p>
            <p className="text-sm">Quantity: {event.quantity.toLocaleString()} liters</p>
            <p className="text-sm">Creator: {formatAddress(event.creator)}</p>
          </div>
        );
      
      case 'BatchStatusUpdated':
        return (
          <div>
            <p className="font-semibold">Status Updated</p>
            <p className="text-sm">New Status: <span className="font-bold">{STATUS[event.newStatus]}</span></p>
            <p className="text-sm">Updated By: {formatAddress(event.updatedBy)}</p>
          </div>
        );
      
      case 'TransferRequested':
        return (
          <div>
            <p className="font-semibold">Transfer Requested</p>
            <p className="text-sm">From: {formatAddress(event.from)}</p>
            <p className="text-sm">To: {formatAddress(event.to)}</p>
            <p className="text-sm">Reason: {event.reason}</p>
          </div>
        );
      
      case 'TransferApproved':
        return (
          <div>
            <p className="font-semibold">Transfer Approved</p>
            <p className="text-sm">From: {formatAddress(event.from)}</p>
            <p className="text-sm">To: {formatAddress(event.to)}</p>
          </div>
        );
      
      case 'TransferRejected':
        return (
          <div>
            <p className="font-semibold">Transfer Rejected</p>
            <p className="text-sm">From: {formatAddress(event.from)}</p>
            <p className="text-sm">To: {formatAddress(event.to)}</p>
            <p className="text-sm">Reason: {event.reason}</p>
          </div>
        );
      
      case 'OwnershipTransferred':
        return (
          <div>
            <p className="font-semibold">Ownership Transferred</p>
            <p className="text-sm">From: {formatAddress(event.previousOwner)}</p>
            <p className="text-sm">To: {formatAddress(event.newOwner)}</p>
          </div>
        );
      
      case 'CertificateLinked':
        return (
          <div>
            <p className="font-semibold">Certificate Linked</p>
            <p className="text-sm">Type: {event.certificateType}</p>
            <p className="text-sm">IPFS: {event.ipfsHash.substring(0, 20)}...</p>
            <p className="text-sm">Issued By: {formatAddress(event.issuedBy)}</p>
          </div>
        );
      
      case 'CertificateRevoked':
        return (
          <div>
            <p className="font-semibold">Certificate Revoked</p>
            <p className="text-sm">IPFS: {event.ipfsHash.substring(0, 20)}...</p>
            <p className="text-sm">Revoked By: {formatAddress(event.revokedBy)}</p>
          </div>
        );
      
      default:
        return <p className="font-semibold">{event.type}</p>;
    }
  };

  const filteredEvents = events.filter(event => {
    if (filter === 'all') return true;
    if (filter === 'transfers') return event.category === 'transfer';
    if (filter === 'status') return event.category === 'status';
    if (filter === 'certificates') return event.category === 'certificate';
    return true;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading blockchain events...</p>
        </div>
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(`/batch/${id}`)}
            className="text-gray-500 hover:text-gray-700"
          >
            ← Back to Details
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Batch History Verification</h1>
            <p className="text-gray-500 mt-1">Batch #{batch.id} - {batch.batchType}</p>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-blue-50">
          <div className="text-2xl mb-2">📊</div>
          <p className="text-sm text-gray-600">Total Events</p>
          <p className="text-2xl font-bold text-gray-900">{events.length}</p>
        </div>
        <div className="card bg-green-50">
          <div className="text-2xl mb-2">🔑</div>
          <p className="text-sm text-gray-600">Ownership Changes</p>
          <p className="text-2xl font-bold text-gray-900">
            {events.filter(e => e.type === 'OwnershipTransferred').length}
          </p>
        </div>
        <div className="card bg-purple-50">
          <div className="text-2xl mb-2">🔄</div>
          <p className="text-sm text-gray-600">Status Updates</p>
          <p className="text-2xl font-bold text-gray-900">
            {events.filter(e => e.type === 'BatchStatusUpdated').length}
          </p>
        </div>
        <div className="card bg-teal-50">
          <div className="text-2xl mb-2">📜</div>
          <p className="text-sm text-gray-600">Certificates</p>
          <p className="text-2xl font-bold text-gray-900">
            {events.filter(e => e.type === 'CertificateLinked').length}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">View:</label>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('timeline')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                  viewMode === 'timeline'
                    ? 'bg-white text-primary-700 shadow'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                📅 Timeline
              </button>
              <button
                onClick={() => setViewMode('flowchart')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                  viewMode === 'flowchart'
                    ? 'bg-white text-primary-700 shadow'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                🔀 Flowchart
              </button>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Filter:</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="input-field w-40"
            >
              <option value="all">All Events</option>
              <option value="transfers">Transfers</option>
              <option value="status">Status Changes</option>
              <option value="certificates">Certificates</option>
            </select>
          </div>
        </div>
      </div>

      {/* Timeline View */}
      {viewMode === 'timeline' && (
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Event Timeline</h2>
          
          {filteredEvents.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-3">📭</div>
              <p>No events found for this filter</p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>
              
              {/* Events */}
              <div className="space-y-6">
                {filteredEvents.map((event, index) => (
                  <div key={index} className="relative flex items-start space-x-4">
                    {/* Timeline dot */}
                    <div className="flex-shrink-0 w-16 flex justify-center">
                      <div className={`w-12 h-12 rounded-full border-4 ${getEventColor(event.type)} 
                        flex items-center justify-center text-xl z-10 shadow-lg`}>
                        {getEventIcon(event.type)}
                      </div>
                    </div>
                    
                    {/* Event content */}
                    <div className={`flex-1 border-l-4 ${getEventColor(event.type)} pl-4 pb-6`}>
                      <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition">
                        {formatEventDetails(event)}
                        
                        <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500 space-y-1">
                          <p>⏰ {formatDate(event.timestamp)}</p>
                          <p>📦 Block: #{event.blockNumber}</p>
                          <p className="font-mono">🔗 {event.transactionHash.substring(0, 20)}...</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Flowchart View */}
      {viewMode === 'flowchart' && (
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Provenance Flowchart</h2>
          
          {filteredEvents.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-3">📭</div>
              <p>No events found for this filter</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="inline-flex flex-col space-y-4 min-w-full">
                {filteredEvents.map((event, index) => (
                  <div key={index} className="flex items-center">
                    {/* Event box */}
                    <div className={`min-w-96 border-4 rounded-xl ${getEventColor(event.type)} p-4 shadow-lg`}>
                      <div className="flex items-start space-x-3">
                        <div className="text-3xl flex-shrink-0">{getEventIcon(event.type)}</div>
                        <div className="flex-1">
                          {formatEventDetails(event)}
                          <div className="mt-2 text-xs opacity-75">
                            <p>⏰ {formatDate(event.timestamp)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Arrow */}
                    {index < filteredEvents.length - 1 && (
                      <div className="flex items-center justify-center w-16 text-3xl text-gray-400">
                        ↓
                      </div>
                    )}
                  </div>
                ))}
                
                {/* Final status */}
                <div className="flex items-center">
                  <div className="min-w-96 border-4 rounded-xl bg-gradient-to-r from-green-100 to-blue-100 border-green-500 p-4 shadow-lg">
                    <div className="flex items-start space-x-3">
                      <div className="text-3xl">🎯</div>
                      <div>
                        <p className="font-bold text-lg">Current State</p>
                        <p className="text-sm">Status: <span className="font-bold">{STATUS[batch.status]}</span></p>
                        <p className="text-sm">Owner: {formatAddress(batch.currentOwner)}</p>
                        <p className="text-sm mt-2">✅ Fully Verified on Blockchain</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Verification Badge */}
      <div className="card bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200">
        <div className="flex items-center space-x-4">
          <div className="text-5xl">✅</div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900">Blockchain Verified</h3>
            <p className="text-sm text-gray-700 mt-1">
              All events have been verified on the blockchain. This batch's complete history is 
              immutable and cryptographically secured. Total of <strong>{events.length} events</strong> recorded.
            </p>
          </div>
          <button 
            onClick={() => navigate(`/batch/${id}`)}
            className="btn-primary"
          >
            View Batch Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default BatchHistoryVisualization;


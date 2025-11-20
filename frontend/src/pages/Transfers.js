import React, { useState } from 'react';
import { useBlockchain } from '../context/BlockchainContext';

const Transfers = () => {
  const { contract, participant, formatAddress } = useBlockchain();
  
  const [transferForm, setTransferForm] = useState({
    batchId: '',
    newOwner: '',
    reason: '',
    transportDetails: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setTransferForm({
      ...transferForm,
      [e.target.name]: e.target.value
    });
  };

  const handleRequestTransfer = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!transferForm.batchId || !transferForm.newOwner || !transferForm.reason) {
      setError('Please fill in all required fields');
      return;
    }

    if (transferForm.newOwner === participant.address) {
      setError('Cannot transfer to yourself');
      return;
    }

    try {
      setLoading(true);

      const tx = await contract.requestTransfer(
        transferForm.batchId,
        transferForm.newOwner,
        transferForm.reason,
        transferForm.transportDetails || 'Standard transport'
      );

      console.log('Transfer request sent:', tx.hash);
      
      const receipt = await tx.wait();
      console.log('Transfer requested:', receipt);

      setSuccess(`Transfer request created successfully! Request ID: ${receipt.events?.[0]?.args?.requestId || 'N/A'}`);
      setTransferForm({
        batchId: '',
        newOwner: '',
        reason: '',
        transportDetails: ''
      });
      setLoading(false);
    } catch (err) {
      console.error('Error requesting transfer:', err);
      setError(err.reason || err.message || 'Failed to request transfer');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Transfers</h1>
        <p className="text-gray-500 mt-1">Manage batch ownership transfers</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Request Transfer Form */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Request Transfer</h2>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}
          
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
              {success}
            </div>
          )}

          <form onSubmit={handleRequestTransfer} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Batch ID <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="batchId"
                value={transferForm.batchId}
                onChange={handleChange}
                className="input-field"
                placeholder="e.g., 1"
                required
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                New Owner Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="newOwner"
                value={transferForm.newOwner}
                onChange={handleChange}
                className="input-field font-mono text-sm"
                placeholder="0x..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Transfer Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                name="reason"
                value={transferForm.reason}
                onChange={handleChange}
                className="input-field"
                rows="3"
                placeholder="e.g., Delivery to terminal for quality inspection"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Transport Details
              </label>
              <textarea
                name="transportDetails"
                value={transferForm.transportDetails}
                onChange={handleChange}
                className="input-field"
                rows="2"
                placeholder="e.g., Truck transport via I-10, ETA 3 days"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50"
            >
              {loading ? 'Requesting Transfer...' : 'Request Transfer'}
            </button>
          </form>
        </div>

        {/* Instructions */}
        <div className="space-y-6">
          <div className="card bg-blue-50 border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-3">📋 Transfer Process</h3>
            <ol className="text-sm text-blue-800 space-y-2">
              <li><strong>1. Request:</strong> Current owner requests transfer</li>
              <li><strong>2. Accept/Reject:</strong> New owner must accept or reject</li>
              <li><strong>3. Complete:</strong> Ownership transfers on acceptance</li>
            </ol>
          </div>

          <div className="card bg-yellow-50 border-yellow-200">
            <h3 className="font-semibold text-yellow-900 mb-3">⚠️ Important Notes</h3>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• You must be the current owner</li>
              <li>• New owner must be registered participant</li>
              <li>• Only one pending transfer per batch</li>
              <li>• Cannot transfer rejected/consumed batches</li>
              <li>• New owner must explicitly accept</li>
            </ul>
          </div>

          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-3">🔍 Check Transfer Status</h3>
            <p className="text-sm text-gray-600 mb-3">
              To view pending transfers or accept/reject transfers, go to the Batch Details page.
            </p>
            <button
              onClick={() => window.location.href = '/batches'}
              className="btn-secondary w-full"
            >
              View My Batches
            </button>
          </div>
        </div>
      </div>

      {/* Recent Transfers Section (Placeholder) */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Transfer Requests</h2>
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔄</div>
          <p className="text-gray-500">Transfer history will be displayed here</p>
          <p className="text-sm text-gray-400 mt-2">
            This feature will show all transfer requests with their status
          </p>
        </div>
      </div>
    </div>
  );
};

export default Transfers;


import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBlockchain } from '../context/BlockchainContext';

const CreateBatch = () => {
  const { contract, participant } = useBlockchain();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    batchType: '',
    quantity: '',
    originLocation: '',
    metadataURI: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Check if user is Refinery
  if (participant?.role !== 1) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">Only Refineries can create new batches.</p>
        </div>
      </div>
    );
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.batchType || !formData.quantity || !formData.originLocation) {
      setError('Please fill in all required fields');
      return;
    }

    if (isNaN(formData.quantity) || Number(formData.quantity) <= 0) {
      setError('Quantity must be a positive number');
      return;
    }

    try {
      setLoading(true);

      const tx = await contract.registerBatch(
        formData.batchType,
        formData.quantity,
        formData.originLocation,
        formData.metadataURI || 'ipfs://pending'
      );

      console.log('Transaction sent:', tx.hash);
      
      // Wait for confirmation
      const receipt = await tx.wait();
      console.log('Batch created:', receipt);

      // Navigate to batches page
      navigate('/batches');
    } catch (err) {
      console.error('Error creating batch:', err);
      setError(err.reason || err.message || 'Failed to create batch');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Create New Batch</h1>
        <p className="text-gray-500 mt-1">Register a new fuel batch in the supply chain</p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Batch Type */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Batch Type <span className="text-red-500">*</span>
          </label>
          <select
            name="batchType"
            value={formData.batchType}
            onChange={handleChange}
            className="input-field"
            required
          >
            <option value="">Select fuel type...</option>
            <option value="Jet Fuel A1">Jet Fuel A1</option>
            <option value="Jet Fuel A">Jet Fuel A</option>
            <option value="Diesel">Diesel</option>
            <option value="Aviation Gasoline">Aviation Gasoline</option>
            <option value="Kerosene">Kerosene</option>
          </select>
        </div>

        {/* Quantity */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Quantity (Liters) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="quantity"
            value={formData.quantity}
            onChange={handleChange}
            className="input-field"
            placeholder="e.g., 15000"
            required
            min="1"
          />
        </div>

        {/* Origin Location */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Origin Location <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="originLocation"
            value={formData.originLocation}
            onChange={handleChange}
            className="input-field"
            placeholder="e.g., Houston Refinery, TX"
            required
          />
        </div>

        {/* Metadata URI */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Metadata URI (Optional)
          </label>
          <input
            type="text"
            name="metadataURI"
            value={formData.metadataURI}
            onChange={handleChange}
            className="input-field"
            placeholder="ipfs://... (will be added for IPFS integration)"
          />
          <p className="text-xs text-gray-500 mt-1">
            IPFS hash or URL containing additional batch metadata
          </p>
        </div>

        {/* Submit Buttons */}
        <div className="flex space-x-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Batch...
              </span>
            ) : (
              'Create Batch'
            )}
          </button>
          <button
            type="button"
            onClick={() => navigate('/batches')}
            className="btn-secondary"
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </form>

      {/* Info Card */}
      <div className="card mt-6 bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">📝 Note</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• All fields marked with * are required</li>
          <li>• Batch will be created with status "Created"</li>
          <li>• You will be set as the initial owner</li>
          <li>• Transaction requires gas fees to be paid</li>
        </ul>
      </div>
    </div>
  );
};

export default CreateBatch;


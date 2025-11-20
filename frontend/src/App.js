import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { BlockchainProvider } from './context/BlockchainContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Batches from './pages/Batches';
import CreateBatch from './pages/CreateBatch';
import BatchDetails from './pages/BatchDetails';
import Transfers from './pages/Transfers';
import AuditTrail from './pages/AuditTrail';

function App() {
  return (
    <BlockchainProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/batches" element={<Batches />} />
            <Route path="/batches/create" element={<CreateBatch />} />
            <Route path="/batches/:id" element={<BatchDetails />} />
            <Route path="/transfers" element={<Transfers />} />
            <Route path="/audit" element={<AuditTrail />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </Router>
    </BlockchainProvider>
  );
}

export default App;


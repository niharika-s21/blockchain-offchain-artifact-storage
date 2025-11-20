import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useBlockchain } from '../context/BlockchainContext';

const Layout = ({ children }) => {
  const { account, participant, connectWallet, disconnectWallet, formatAddress } = useBlockchain();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: '📊' },
    { name: 'Batches', href: '/batches', icon: '📦' },
    { name: 'Transfers', href: '/transfers', icon: '🔄' },
    { name: 'Audit Trail', href: '/audit', icon: '📝' },
  ];

  const isActive = (href) => {
    return location.pathname === href;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center text-white text-xl font-bold">
                  SC
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Supply Chain</h1>
                  <p className="text-xs text-gray-500">Blockchain Provenance</p>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`px-4 py-2 rounded-lg transition ${
                    isActive(item.href)
                      ? 'bg-primary-50 text-primary-700 font-semibold'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* Wallet Connection */}
            <div className="flex items-center space-x-3">
              {account ? (
                <>
                  {participant && (
                    <div className="hidden sm:block text-right mr-3">
                      <p className="text-sm font-semibold text-gray-900">{participant.name}</p>
                      <p className="text-xs text-gray-500">{participant.roleName}</p>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <div className="px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm font-mono text-green-700">{formatAddress(account)}</p>
                    </div>
                    <button
                      onClick={disconnectWallet}
                      className="p-2 text-gray-500 hover:text-red-600 transition"
                      title="Disconnect"
                    >
                      ⏻
                    </button>
                  </div>
                </>
              ) : (
                <button onClick={connectWallet} className="btn-primary">
                  Connect Wallet
                </button>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-gray-100"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <nav className="md:hidden pb-4 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-2 rounded-lg transition ${
                    isActive(item.href)
                      ? 'bg-primary-50 text-primary-700 font-semibold'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.name}
                </Link>
              ))}
            </nav>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!account ? (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">🔐</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Connect Your Wallet</h2>
              <p className="text-gray-600 mb-8">
                Please connect your MetaMask wallet to access the Supply Chain Dashboard and interact with the blockchain.
              </p>
              <button onClick={connectWallet} className="btn-primary text-lg px-8">
                Connect MetaMask
              </button>
            </div>
          </div>
        ) : !participant ? (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">⚠️</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Participant Not Registered</h2>
              <p className="text-gray-600 mb-4">
                Your wallet address is not registered as a participant in the supply chain system.
              </p>
              <p className="text-sm text-gray-500">
                Connected: <span className="font-mono">{formatAddress(account)}</span>
              </p>
              <p className="text-sm text-gray-500 mt-4">
                Please contact the administrator to register your account.
              </p>
            </div>
          </div>
        ) : (
          children
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-sm text-gray-500">
              © 2025 Supply Chain Provenance System. Built on Ethereum.
            </p>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>Solidity 0.8.28</span>
              <span>•</span>
              <span>Hardhat</span>
              <span>•</span>
              <span>React 18</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;


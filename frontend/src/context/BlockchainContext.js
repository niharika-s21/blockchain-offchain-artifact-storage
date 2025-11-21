import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';

// Import contract ABI
const SupplyChainABI = require('../contracts/SupplyChain.json').abi;

const BlockchainContext = createContext();

export const useBlockchain = () => {
  const context = useContext(BlockchainContext);
  if (!context) {
    throw new Error('useBlockchain must be used within BlockchainProvider');
  }
  return context;
};

export const BlockchainProvider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [participant, setParticipant] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Contract address - update this after deployment
  const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"

  // Role names mapping
  const ROLES = {
    0: 'None',
    1: 'Refinery',
    2: 'Distributor',
    3: 'Terminal',
    4: 'Regulator',
    5: 'Airline'
  };

  // Status names mapping
  const STATUS = {
    0: 'Created',
    1: 'InTransit',
    2: 'Delivered',
    3: 'QualityTested',
    4: 'Approved',
    5: 'Rejected',
    6: 'Consumed'
  };

  // Connect to MetaMask
  const connectWallet = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!window.ethereum) {
        throw new Error('MetaMask is not installed. Please install MetaMask to use this app.');
      }

      // Request account access and force account selection
      const accounts = await window.ethereum.request({
        method: 'wallet_requestPermissions',
        params: [{ eth_accounts: {} }],
      }).then(() => window.ethereum.request({ method: 'eth_requestAccounts' }));

      console.log('🎯 Selected accounts from MetaMask:', accounts);
      console.log('🎯 Account[0]:', accounts[0]);

      // Create provider and signer
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      const web3Signer = await web3Provider.getSigner();
      
      console.log('🎯 Signer address:', await web3Signer.getAddress());

      // Create contract instance
      const supplyChainContract = new ethers.Contract(
        CONTRACT_ADDRESS,
        SupplyChainABI,
        web3Signer
      );

      setProvider(web3Provider);
      setSigner(web3Signer);
      setContract(supplyChainContract);
      setAccount(accounts[0]);

      // Load participant info
      await loadParticipantInfo(supplyChainContract, accounts[0]);

      setLoading(false);
      return accounts[0];
    } catch (err) {
      console.error('Error connecting wallet:', err);
      setError(err.message);
      setLoading(false);
      throw err;
    }
  };

  // Load participant information
  const loadParticipantInfo = async (contractInstance, address) => {
    try {
      console.log('🔍 Loading participant for address:', address);
      console.log('📄 Contract address:', CONTRACT_ADDRESS);
      const participantData = await contractInstance.participants(address);
      console.log('📊 Participant data:', participantData);
      console.log('✅ Is Active:', participantData.isActive);
      
      if (participantData.isActive) {
        setParticipant({
          address: participantData.participantAddress,
          role: Number(participantData.role),
          roleName: ROLES[Number(participantData.role)],
          name: participantData.name,
          location: participantData.location,
          isActive: participantData.isActive,
          registeredAt: Number(participantData.registeredAt)
        });
        console.log('✅ Participant loaded:', participantData.name);
      } else {
        console.log('❌ Participant not active');
        setParticipant(null);
      }
    } catch (err) {
      console.error('❌ Error loading participant:', err);
      setParticipant(null);
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setContract(null);
    setParticipant(null);
  };

  // Listen for account changes
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', async (accounts) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          console.log('🔄 Account changed to:', accounts[0]);
          // Recreate provider, signer, and contract with new account
          try {
            const web3Provider = new ethers.BrowserProvider(window.ethereum);
            const web3Signer = await web3Provider.getSigner();
            const supplyChainContract = new ethers.Contract(
              CONTRACT_ADDRESS,
              SupplyChainABI,
              web3Signer
            );
            
            setProvider(web3Provider);
            setSigner(web3Signer);
            setContract(supplyChainContract);
            setAccount(accounts[0]);
            
            await loadParticipantInfo(supplyChainContract, accounts[0]);
            console.log('✅ Account switch complete');
          } catch (err) {
            console.error('❌ Error switching account:', err);
          }
        }
      });

      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', () => {});
        window.ethereum.removeListener('chainChanged', () => {});
      }
    };
  }, []);

  // Utility functions
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    return new Date(Number(timestamp) * 1000).toLocaleString();
  };

  const getStatusBadgeClass = (status) => {
    const statusNum = Number(status);
    const classes = {
      0: 'badge-created',
      1: 'badge-intransit',
      2: 'badge-delivered',
      3: 'badge-tested',
      4: 'badge-approved',
      5: 'badge-rejected',
      6: 'badge-consumed'
    };
    return classes[statusNum] || 'badge';
  };

  const value = {
    account,
    provider,
    signer,
    contract,
    participant,
    loading,
    error,
    connectWallet,
    disconnectWallet,
    formatAddress,
    formatDate,
    getStatusBadgeClass,
    ROLES,
    STATUS,
    CONTRACT_ADDRESS
  };

  return (
    <BlockchainContext.Provider value={value}>
      {children}
    </BlockchainContext.Provider>
  );
};


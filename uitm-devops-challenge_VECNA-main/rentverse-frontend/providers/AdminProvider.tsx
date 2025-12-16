'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AdminAccessManager from '@/utils/adminAccess';
import AdminAccessModal from '@/components/AdminAccessModal';

interface AdminContextType {
  isAdminMode: boolean;
  adminToken: string | null;
  accessMethod: string | null;
  enableAdminMode: (token: string) => void;
  disableAdminMode: () => void;
  showAdminModal: boolean;
  setShowAdminModal: (show: boolean) => void;
  adminStatus: {
    isEnabled: boolean;
    methods: any[];
    timestamp: string;
  } | null;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

interface AdminProviderProps {
  children: ReactNode;
}

export function AdminProvider({ children }: AdminProviderProps) {
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [accessMethod, setAccessMethod] = useState<string | null>(null);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminStatus, setAdminStatus] = useState<any>(null);
  const [adminManager, setAdminManager] = useState<AdminAccessManager | null>(null);

  useEffect(() => {
    // Initialize admin access manager
    const manager = new AdminAccessManager();
    setAdminManager(manager);
    setAdminStatus(manager.getStatus());

    // Listen for admin access events
    const handleAdminAccess = (event: any) => {
      setAccessMethod(event.detail.method);
      setShowAdminModal(true);
    };

    window.addEventListener('adminAccess', handleAdminAccess);

    // Check if admin mode was previously enabled (session storage)
    const savedAdminToken = sessionStorage.getItem('adminToken');
    if (savedAdminToken && manager.validateToken(savedAdminToken)) {
      setAdminToken(savedAdminToken);
      setIsAdminMode(true);
    }

    return () => {
      window.removeEventListener('adminAccess', handleAdminAccess);
    };
  }, []);

  const enableAdminMode = (token: string) => {
    if (adminManager && adminManager.validateToken(token)) {
      setAdminToken(token);
      setIsAdminMode(true);
      setShowAdminModal(false);
      setAccessMethod(null);
      
      // Save to session storage
      sessionStorage.setItem('adminToken', token);
      
      console.log('🔓 Admin mode enabled');
    } else {
      console.error('❌ Invalid admin token');
    }
  };

  const disableAdminMode = () => {
    setIsAdminMode(false);
    setAdminToken(null);
    setAccessMethod(null);
    
    // Clear from session storage
    sessionStorage.removeItem('adminToken');
    
    console.log('🔒 Admin mode disabled');
  };

  const value: AdminContextType = {
    isAdminMode,
    adminToken,
    accessMethod,
    enableAdminMode,
    disableAdminMode,
    showAdminModal,
    setShowAdminModal,
    adminStatus
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
      
      {/* Admin Access Modal */}
      <AdminAccessModal
        isOpen={showAdminModal}
        onClose={() => setShowAdminModal(false)}
        onAdminAccess={enableAdminMode}
      />
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}
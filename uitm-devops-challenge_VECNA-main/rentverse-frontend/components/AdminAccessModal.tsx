'use client';

import { useState, useEffect } from 'react';
import AdminAccessManager from '@/utils/adminAccess';

interface AdminAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdminAccess: (token: string) => void;
}

export default function AdminAccessModal({ isOpen, onClose, onAdminAccess }: AdminAccessModalProps) {
  const [adminToken, setAdminToken] = useState('');
  const [accessMethod, setAccessMethod] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [accessTime, setAccessTime] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Auto-enable admin access manager when modal opens
      const manager = new AdminAccessManager();
      manager.enable();

      // Listen for admin access events
      const handleAdminAccess = (event: any) => {
        setAccessMethod(event.detail.method);
        setAccessTime(event.detail.timestamp);
        setAdminToken(event.detail.token);
        setShowTokenInput(true);
      };

      window.addEventListener('adminAccess', handleAdminAccess);
      
      return () => {
        window.removeEventListener('adminAccess', handleAdminAccess);
      };
    }
  }, [isOpen]);

  const handleTokenSubmit = () => {
    if (adminToken.trim()) {
      onAdminAccess(adminToken);
      onClose();
    }
  };

  const handleClose = () => {
    setShowTokenInput(false);
    setAdminToken('');
    setAccessMethod('');
    setAccessTime('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <span className="mr-2">🔓</span>
            Admin Access Portal
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Access Method Info */}
        {accessMethod && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center mb-2">
              <span className="text-blue-600 mr-2">🎯</span>
              <span className="font-medium text-blue-900">Access Method</span>
            </div>
            <p className="text-blue-800 text-sm capitalize">
              {accessMethod.replace('_', ' ')} triggered at {new Date(accessTime).toLocaleTimeString()}
            </p>
          </div>
        )}

        {/* Token Input */}
        {showTokenInput ? (
          <div className="space-y-4">
            <div>
              <label htmlFor="adminToken" className="block text-sm font-medium text-gray-700 mb-2">
                Admin Access Token
              </label>
              <input
                id="adminToken"
                type="text"
                value={adminToken}
                onChange={(e) => setAdminToken(e.target.value)}
                placeholder="Enter admin access token"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleTokenSubmit}
                disabled={!adminToken.trim()}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Access Admin Panel
              </button>
              <button
                onClick={handleClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-600 text-sm">
              Admin access has been triggered. Please enter your admin access token to continue.
            </p>
            
            <div className="bg-gray-50 p-3 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Available Access Methods:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• <strong>Keyboard:</strong> Press Ctrl+Shift+A</li>
                <li>• <strong>Console:</strong> Type adminAccess() in browser console</li>
                <li>• <strong>URL:</strong> Add ?admin_access=true to URL</li>
                <li>• <strong>Click:</strong> Triple-click on logo/title elements</li>
              </ul>
            </div>

            <div className="flex justify-center">
              <button
                onClick={() => setShowTokenInput(true)}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
              >
                Enter Token Manually
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            🔒 Secure Admin Access • RentVerse Enhanced Security
          </p>
        </div>
      </div>
    </div>
  );
}
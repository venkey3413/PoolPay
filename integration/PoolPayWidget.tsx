import React, { useState } from 'react';
import { Wallet } from 'lucide-react';

interface PoolPayWidgetProps {
  onOpen: () => void;
}

export const PoolPayWidget: React.FC<PoolPayWidgetProps> = ({ onOpen }) => {
  return (
    <button
      onClick={onOpen}
      className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
    >
      <Wallet size={20} />
      <span>PoolPay</span>
    </button>
  );
};

export const PoolPayModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg w-full max-w-4xl h-5/6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 z-10"
        >
          ✕
        </button>
        <iframe
          src="/poolpay"
          className="w-full h-full rounded-lg"
          title="PoolPay Application"
        />
      </div>
    </div>
  );
};
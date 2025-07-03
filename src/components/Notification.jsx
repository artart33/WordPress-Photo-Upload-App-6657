import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiCheck, FiAlert, FiInfo, FiX } = FiIcons;

const Notification = ({ notification }) => {
  if (!notification) return null;

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return FiCheck;
      case 'error':
        return FiX;
      case 'warning':
        return FiAlert;
      default:
        return FiInfo;
    }
  };

  const getColors = () => {
    switch (notification.type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className={`fixed top-4 right-4 z-50 border rounded-lg p-4 shadow-lg max-w-sm ${getColors()}`}
      >
        <div className="flex items-center space-x-3">
          <SafeIcon icon={getIcon()} className="text-lg flex-shrink-0" />
          <p className="text-sm font-medium">{notification.message}</p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default Notification;
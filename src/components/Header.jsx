import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiCamera, FiSettings, FiClock, FiUpload } = FiIcons;

const Header = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: FiUpload, label: 'Upload' },
    { path: '/history', icon: FiClock, label: 'Geschiedenis' },
    { path: '/settings', icon: FiSettings, label: 'Instellingen' }
  ];

  return (
    <header className="bg-white shadow-lg border-b border-gray-200">
      <div className="container mx-auto px-4 py-4 max-w-4xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-2 rounded-xl">
              <SafeIcon icon={FiCamera} className="text-white text-xl" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">WordPress Uploader</h1>
              <p className="text-sm text-gray-600">Foto's direct naar je WordPress site</p>
            </div>
          </div>

          <nav className="flex space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="relative"
              >
                <motion.div
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                    location.pathname === item.path
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <SafeIcon icon={item.icon} className="text-lg" />
                  <span className="hidden sm:block text-sm font-medium">{item.label}</span>
                </motion.div>
                {location.pathname === item.path && (
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full"
                    layoutId="activeTab"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
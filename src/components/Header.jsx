import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FiCamera, FiSettings, FiClock, FiUpload, FiMenu, FiX } from 'react-icons/fi'
import SafeIcon from '../common/SafeIcon'

const Header = () => {
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navItems = [
    { path: '/', icon: FiUpload, label: 'Upload' },
    { path: '/history', icon: FiClock, label: 'Geschiedenis' },
    { path: '/settings', icon: FiSettings, label: 'Instellingen' }
  ]

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  return (
    <header className="glassmorphism-header mx-4 mt-4 mb-6">
      <div className="container mx-auto px-6 py-4 max-w-4xl">
        <div className="flex items-center justify-between">
          {/* Logo Section */}
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-3 rounded-2xl shadow-lg">
              <SafeIcon icon={FiCamera} className="text-white text-2xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-primary heading-primary">
                WordPress Uploader
              </h1>
              <p className="text-sm text-secondary hidden sm:block">
                Foto's direct naar je WordPress site
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="relative"
              >
                <motion.div
                  className={`flex items-center space-x-3 px-5 py-3 rounded-2xl transition-all duration-300 ${
                    location.pathname === item.path
                      ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg'
                      : 'text-secondary hover:bg-white/10 hover:text-primary'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <SafeIcon icon={item.icon} className="text-lg" />
                  <span className="text-sm font-medium">
                    {item.label}
                  </span>
                </motion.div>
                {location.pathname === item.path && (
                  <motion.div
                    className="absolute -bottom-1 left-0 right-0 h-1 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full"
                    layoutId="activeTab"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </Link>
            ))}
          </nav>

          {/* Mobile Menu Button */}
          <motion.button
            onClick={toggleMobileMenu}
            className="md:hidden flex items-center justify-center p-3 rounded-2xl bg-white/10 hover:bg-white/20 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <SafeIcon 
              icon={isMobileMenuOpen ? FiX : FiMenu} 
              className="text-2xl text-primary" 
            />
          </motion.button>
        </div>

        {/* Mobile Navigation Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden mt-4 pt-4 border-t border-white/20"
            >
              <nav className="flex flex-col space-y-2">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={closeMobileMenu}
                    className="relative"
                  >
                    <motion.div
                      className={`flex items-center space-x-4 px-4 py-4 rounded-2xl transition-all duration-300 ${
                        location.pathname === item.path
                          ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg'
                          : 'text-secondary hover:bg-white/10 hover:text-primary'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <SafeIcon icon={item.icon} className="text-xl" />
                      <span className="text-base font-medium">
                        {item.label}
                      </span>
                    </motion.div>
                  </Link>
                ))}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  )
}

export default Header
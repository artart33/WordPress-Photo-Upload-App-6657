import React from 'react'
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Header from './components/Header'
import EnhancedPhotoUploader from './components/EnhancedPhotoUploader'
import Settings from './components/Settings'
import PostHistory from './components/PostHistory'
import { SettingsProvider } from './context/SettingsContext'
import './App.css'

function App() {
  return (
    <SettingsProvider>
      <Router>
        <div className="min-h-screen app-container">
          <Header />
          <main className="container mx-auto px-4 py-6 max-w-4xl">
            <AnimatePresence mode="wait">
              <Routes>
                <Route path="/" element={
                  <motion.div
                    key="upload"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <EnhancedPhotoUploader />
                  </motion.div>
                } />
                <Route path="/settings" element={
                  <motion.div
                    key="settings"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Settings />
                  </motion.div>
                } />
                <Route path="/history" element={
                  <motion.div
                    key="history"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <PostHistory />
                  </motion.div>
                } />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AnimatePresence>
          </main>
        </div>
      </Router>
    </SettingsProvider>
  )
}

export default App
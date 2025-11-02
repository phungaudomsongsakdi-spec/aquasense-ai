// ✅ src/App.js - เวอร์ชันเว็บไซต์ปกติ
import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import { ref, onValue } from "firebase/database";
import { db } from "./firebase";

import AquaSenseDashboard from './components/AquaSenseDashboard';
import PlantManager from './components/PlantManager';
import WeatherForecast from './components/WeatherForecast';
import WateringAI from './components/WateringAI';
import SystemSettings from './components/SystemSettings';
import Reports from './components/Reports';
import WateringHistory from './components/WateringHistory';
import ErrorBoundary from './components/ErrorBoundary';
import { ThemeProvider } from './contexts/ThemeContext';

function Navigation() {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [systemStatus, setSystemStatus] = useState({
    sensor: true,
    esp32: true,
    database: true
  });

  useEffect(() => {
    const sensorRef = ref(db, "sensorData");
    const controlRef = ref(db, "control");

    const sensorUnsubscribe = onValue(sensorRef, (snapshot) => {
      setSystemStatus(prev => ({ ...prev, sensor: !!snapshot.val() }));
    });

    const controlUnsubscribe = onValue(controlRef, (snapshot) => {
      setSystemStatus(prev => ({ ...prev, esp32: !!snapshot.val() }));
    });

    return () => {
      sensorUnsubscribe();
      controlUnsubscribe();
    };
  }, []);

  const navItems = [
    { path: "/", icon: "📊", label: "แดชบอร์ด" },
    { path: "/plants", icon: "🌿", label: "จัดการพืชพันธุ์" },
    { path: "/weather", icon: "🌤️", label: "พยากรณ์อากาศ" },
    { path: "/ai", icon: "🤖", label: "AI ให้คำแนะนำ" },
    { path: "/settings", icon: "⚙️", label: "ตั้งค่าระบบ" },
    { path: "/reports", icon: "📈", label: "รายงาน" },
    { path: "/history", icon: "📝", label: "ประวัติ" }
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-green-50 to-blue-50">
      {/* Mobile Header */}
      <header className="md:hidden bg-gradient-to-r from-emerald-600 to-green-600 text-white p-4 safe-top shadow-lg">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="text-2xl bg-white bg-opacity-20 p-2 rounded-xl">🌱</div>
            <div>
              <h1 className="text-lg font-bold">AquaSense AI</h1>
              <p className="text-xs opacity-90">ระบบรดน้ำอัตโนมัติ</p>
            </div>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-2xl hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors btn-mobile"
          >
            {isMobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </header>

      {/* Sidebar */}
      <aside className={`
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0 transition-transform duration-300 ease-in-out
        md:w-80 w-full bg-white/90 backdrop-blur-lg border-r border-green-200
        fixed md:relative inset-y-0 left-0 z-50 md:z-auto
        flex flex-col safe-top safe-bottom shadow-xl md:shadow-none
      `}>
        
        {/* Mobile Header in Sidebar */}
        <div className="md:hidden flex justify-between items-center p-4 border-b border-green-200 bg-white">
          <div className="flex items-center gap-3">
            <div className="text-2xl text-emerald-600">🌱</div>
            <div>
              <h1 className="text-lg font-bold text-emerald-800">AquaSense AI</h1>
              <p className="text-xs text-emerald-600">ระบบรดน้ำอัตโนมัติ</p>
            </div>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 text-emerald-800 hover:bg-emerald-100 rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>
        
        {/* Sidebar Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {/* Desktop Logo */}
            <div className="hidden md:block text-center mb-8">
              <div className="bg-gradient-to-r from-emerald-500 to-green-500 text-white p-4 rounded-2xl shadow-lg">
                <div className="text-3xl mb-2">🌱</div>
                <h1 className="text-xl font-bold">AquaSense AI</h1>
                <p className="text-sm opacity-90 mt-1">ระบบรดน้ำอัตโนมัติ</p>
              </div>
            </div>
            
            {/* Navigation */}
            <nav className="space-y-2 mb-8">
              {navItems.map((item, index) => (
                <motion.div
                  key={item.path}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link 
                    to={item.path} 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-4 px-4 py-4 rounded-xl transition-all duration-200 btn-mobile group ${
                      location.pathname === item.path 
                        ? "bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg" 
                        : "text-emerald-700 hover:bg-emerald-50 hover:shadow-md border border-transparent hover:border-emerald-200"
                    }`}
                  >
                    <span className="text-xl transition-transform group-hover:scale-110">{item.icon}</span>
                    <span className="font-medium text-mobile-base flex-1">{item.label}</span>
                    {location.pathname === item.path && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="w-2 h-2 bg-white rounded-full"
                      />
                    )}
                  </Link>
                </motion.div>
              ))}
            </nav>

            {/* Quick Stats */}
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-4 border border-emerald-200">
              <h3 className="font-semibold text-emerald-800 mb-3 text-sm flex items-center gap-2">
                <span>📊</span>
                สถานะระบบ
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-emerald-700">เซนเซอร์:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    systemStatus.sensor ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {systemStatus.sensor ? '✅ พร้อมใช้งาน' : '❌ ผิดปกติ'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-emerald-700">ESP32:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    systemStatus.esp32 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {systemStatus.esp32 ? '✅ เชื่อมต่อแล้ว' : '⚠️ กำลังเชื่อมต่อ'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-emerald-700">ฐานข้อมูล:</span>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    ✅ ออนไลน์
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-emerald-200 bg-white">
          <div className="text-center text-xs text-emerald-600">
            <p>AquaSense AI v1.0</p>
            <p className="mt-1">ระบบรดน้ำอัจฉริยะ</p>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40 safe-top"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-100 safe-top safe-bottom overflow-x-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Routes>
              <Route path="/" element={<AquaSenseDashboard />} />
              <Route path="/plants" element={<PlantManager />} />
              <Route path="/weather" element={<WeatherForecast />} />
              <Route path="/ai" element={<WateringAI />} />
              <Route path="/settings" element={<SystemSettings />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/history" element={<WateringHistory />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

function App() {
  const [lineStatus, setLineStatus] = useState(false);

  useEffect(() => {
    const lineNotifyRef = ref(db, "lineNotify");
    
    const unsubscribe = onValue(lineNotifyRef, (snapshot) => {
      const data = snapshot.val();
      if (data && data.message) {
        setLineStatus(true);
        toast.success(`📢 ${data.message}`, {
          duration: 5000,
          position: 'top-center',
        });
        
        setTimeout(() => setLineStatus(false), 5000);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <ThemeProvider>
      <ErrorBoundary>
        <Router>
          <div className="App">
            <Toaster 
              position="top-center"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#0b7a57',
                  color: '#fff',
                  fontSize: '14px',
                  borderRadius: '12px',
                  padding: '12px 16px',
                },
                success: {
                  style: {
                    background: '#10b981',
                  },
                },
                error: {
                  style: {
                    background: '#ef4444',
                  },
                },
                loading: {
                  style: {
                    background: '#6b7280',
                  },
                },
              }}
            />
            <Navigation />
          </div>
        </Router>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;
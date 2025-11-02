// ✅ src/contexts/ThemeContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('aquasense-dark-mode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('aquasense-dark-mode', JSON.stringify(isDarkMode));
    
    // เพิ่ม/ลบ class จาก body
    if (isDarkMode) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  const theme = {
    isDarkMode,
    toggleTheme,
    colors: isDarkMode ? darkColors : lightColors
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

// สีสำหรับ Light Mode
const lightColors = {
  primary: '#0b7a57',
  secondary: '#1976d2',
  background: '#ffffff',
  surface: '#f8f9fa',
  text: '#212529',
  textSecondary: '#6c757d',
  border: '#dee2e6',
  error: '#dc3545',
  warning: '#ffc107',
  success: '#28a745'
};

// สีสำหรับ Dark Mode
const darkColors = {
  primary: '#4caf50',
  secondary: '#2196f3',
  background: '#121212',
  surface: '#1e1e1e',
  text: '#e0e0e0',
  textSecondary: '#a0a0a0',
  border: '#333333',
  error: '#f44336',
  warning: '#ff9800',
  success: '#4caf50'
};
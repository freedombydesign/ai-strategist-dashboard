// Empty module to replace h1-check.js
// This completely neutralizes h1-check.js at the webpack level

module.exports = {
  default: {
    detectStore: () => Promise.resolve({ success: true, detected: false, blocked: true })
  },
  detectStore: () => Promise.resolve({ success: true, detected: false, blocked: true })
};

// For CommonJS compatibility
if (typeof window !== 'undefined') {
  window.detectStore = () => Promise.resolve({ success: true, detected: false, blocked: true });
  window.a = {
    default: {
      detectStore: () => Promise.resolve({ success: true, detected: false, blocked: true })
    }
  };
}
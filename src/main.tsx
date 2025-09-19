import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { BUILD_INFO } from './build-info'

// Build fingerprinting for cache debugging
console.info("🚀 BUILD INFO:", BUILD_INFO);
console.info("📦 Expected function: admin-invite (NOT send-invite)");

createRoot(document.getElementById("root")!).render(<App />);

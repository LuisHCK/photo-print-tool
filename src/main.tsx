import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './print.css'
import App from './App.tsx'
import './i18n'
import { initAnalytics } from '@/lib/analytics'

initAnalytics()

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <App />
    </StrictMode>
)

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import { App } from './App'
import { ErrorBoundary } from './components/ErrorBoundary'
import '@fontsource/schibsted-grotesk/400.css'
import '@fontsource/schibsted-grotesk/500.css'
import '@fontsource/schibsted-grotesk/700.css'
import './styles/tokens.css'
import './styles/base.css'
import './styles/app.css'

// Cuando se publica una versión nueva, se activa y la página se recarga una vez:
// así nunca conviven la versión vieja y la nueva en la misma pestaña.
if (import.meta.env.PROD) registerSW({ immediate: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <ErrorBoundary where="app">
        <App />
      </ErrorBoundary>
    </HashRouter>
  </StrictMode>,
)

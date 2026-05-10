import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import LandingPage from './LandingPage';

// Lazy load App to prevent it from crashing the Landing Page
const App = React.lazy(() => import('./App'));

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; message: string }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, message: '' };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error.message };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif', color: '#1e293b' }}>
          <div style={{ fontSize: 48 }}>⚠️</div>
          <h2 style={{ fontWeight: 900, marginBottom: 8 }}>Algo deu errado</h2>
          <p style={{ color: '#64748b', marginBottom: 24 }}>{this.state.message}</p>
          <button onClick={() => window.location.reload()} style={{ padding: '12px 28px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 16, fontWeight: 700, cursor: 'pointer' }}>
            Recarregar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <HelmetProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/dashboard" element={
              <Suspense fallback={
                <div className="min-h-screen flex items-center justify-center bg-slate-50">
                  <div className="text-center space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20 mx-auto animate-pulse">
                      <span className="text-white font-black italic text-lg">F</span>
                    </div>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Carregando FinAi...</p>
                  </div>
                </div>
              }>
                <App />
              </Suspense>
            } />
          </Routes>
        </BrowserRouter>
      </HelmetProvider>
    </ErrorBoundary>
  </React.StrictMode>
);

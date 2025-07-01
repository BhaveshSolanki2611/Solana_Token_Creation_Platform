import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { WalletProvider } from './contexts/WalletContext';

// Components
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import NotFound from './components/common/NotFound';

// Pages
import Home from './pages/Home';
import CreateToken from './pages/CreateToken';
import TokenDashboard from './pages/TokenDashboard';
import TokenDetails from './pages/TokenDetails';

// Create a theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#9945FF', // Solana purple
    },
    secondary: {
      main: '#14F195', // Solana green
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 600,
    },
    h3: {
      fontWeight: 600,
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <WalletProvider>
        <Router>
          <div className="App">
            <Navbar />
            <main style={{ minHeight: 'calc(100vh - 128px)', padding: '20px 0' }}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/create-token" element={<CreateToken />} />
                <Route path="/dashboard" element={<TokenDashboard />} />
                <Route path="/token/:address" element={<TokenDetails />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </WalletProvider>
    </ThemeProvider>
  );
}

export default App;
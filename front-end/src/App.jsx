import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import AppRoutes from './routes/routes';
import StoreProvider from './store/StoreProvider';

export default function App() {
  return (
    <div>
      <StoreProvider>
        <BrowserRouter>
          <ThemeProvider>
            <AuthProvider>
              <AppRoutes />
            </AuthProvider>
          </ThemeProvider>
        </BrowserRouter>
      </StoreProvider>
    </div>
  );
}

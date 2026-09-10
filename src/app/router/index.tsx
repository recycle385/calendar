import { Route, Routes } from 'react-router-dom';
import { LoginPage } from '../pages/auth/LoginPage';
import { OAuthCallbackPage } from '../pages/auth/OAuthCallbackPage';
import { SignupPage } from '../pages/auth/SignupPage';
import { HomePage } from '../pages/home/HomePage';

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<OAuthCallbackPage />} />
      <Route path="/signup" element={<SignupPage />} />
    </Routes>
  );
}

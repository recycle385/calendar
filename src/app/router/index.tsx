import { Route, Routes } from 'react-router-dom';
import { LoginPage } from '../pages/auth/LoginPage';
import { OAuthCallbackPage } from '../pages/auth/OAuthCallbackPage';
import { SignupPage } from '../pages/auth/SignupPage';
import { HomePage } from '../pages/home/HomePage';
import { CalendarCreatePage } from '../pages/calendar/CalendarCreatePage';
import { CalendarDetailPage } from '../pages/calendar/CalendarDetailPage';
import { CalendarJoinPage } from '../pages/calendar/CalendarJoinPage';
import { CalendarListPage } from '../pages/calendar/CalendarListPage';

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<OAuthCallbackPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/calendars" element={<CalendarListPage />} />
      <Route path="/calendars/new" element={<CalendarCreatePage />} />
      <Route path="/c/:slug/join" element={<CalendarJoinPage />} />
      <Route path="/c/:slug" element={<CalendarDetailPage />} />
    </Routes>
  );
}

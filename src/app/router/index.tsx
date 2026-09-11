import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import { LoginPage } from '../pages/auth/LoginPage';
import { OAuthCallbackPage } from '../pages/auth/OAuthCallbackPage';
import { SignupPage } from '../pages/auth/SignupPage';
import { HomePage } from '../pages/home/HomePage';
import { CalendarCreatePage } from '../pages/calendar/CalendarCreatePage';
import { CalendarDetailPage } from '../pages/calendar/CalendarDetailPage';
import { CalendarJoinPage } from '../pages/calendar/CalendarJoinPage';
import { CalendarListPage } from '../pages/calendar/CalendarListPage';

export const LEGACY_CALENDAR_SHARE_ROUTE = '/calendar/:slug';

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<OAuthCallbackPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/calendars" element={<CalendarListPage />} />
      <Route path="/calendars/new" element={<CalendarCreatePage />} />
      <Route path={LEGACY_CALENDAR_SHARE_ROUTE} element={<LegacyCalendarShareRedirect />} />
      <Route path="/c/:slug/join" element={<CalendarJoinPage />} />
      <Route path="/c/:slug" element={<CalendarDetailPage />} />
    </Routes>
  );
}

export function getCalendarJoinPath(slug: string) {
  return `/c/${encodeURIComponent(slug)}/join`;
}

function LegacyCalendarShareRedirect() {
  const { slug } = useParams();
  return <Navigate to={slug ? getCalendarJoinPath(slug) : '/'} replace />;
}

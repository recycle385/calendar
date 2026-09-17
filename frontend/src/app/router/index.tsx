import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import { PRIVACY_ROUTE, TERMS_ROUTE } from '../../shared/constants/routes';
import { OAuthCallbackPage } from '../pages/auth/callback/OAuthCallbackPage';
import { LoginPage } from '../pages/auth/login/LoginPage';
import { SignupPage } from '../pages/auth/signup/SignupPage';
import { HomePage } from '../pages/home/HomePage';
import { CalendarCreatePage } from '../pages/calendar/create/CalendarCreatePage';
import { CalendarDetailPage } from '../pages/calendar/detail/CalendarDetailPage';
import { CalendarJoinPage } from '../pages/calendar/join/CalendarJoinPage';
import { CalendarListPage } from '../pages/calendar/list/CalendarListPage';
import { LegalPage } from '../pages/legal/LegalPage';
import { privacyDocument, termsDocument } from '../pages/legal/legalDocuments';

export const LEGACY_CALENDAR_SHARE_ROUTE = '/calendar/:slug';

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<OAuthCallbackPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path={TERMS_ROUTE} element={<LegalPage document={termsDocument} />} />
      <Route path={PRIVACY_ROUTE} element={<LegalPage document={privacyDocument} />} />
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

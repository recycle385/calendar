import { Footer } from '../../../shared/ui/Footer';
import { Header } from '../../../shared/ui/Header';
import { useAuth } from '../../providers/AuthProvider';
import { CtaSection } from './components/CtaSection';
import { FaqSection } from './components/FaqSection';
import { FeatureGrid } from './components/FeatureGrid';
import { HeroSection } from './components/HeroSection';
import { MyCalendarsSection } from './components/MyCalendarsSection';
import { StepsSection } from './components/StepsSection';
import { UseCasesSection } from './components/UseCasesSection';
import { ValueSection } from './components/ValueSection';

export function HomePage() {
  const { logout, status, user } = useAuth();

  return (
    <>
      <Header isAuthenticated={status === 'authenticated'} displayName={user?.nickname} onLogout={logout} />
      <main>
        <HeroSection isAuthenticated={status === 'authenticated'} />
        <MyCalendarsSection />
        <FeatureGrid />
        <StepsSection />
        <UseCasesSection />
        <ValueSection />
        <FaqSection />
        <CtaSection isAuthenticated={status === 'authenticated'} />
      </main>
      <Footer />
    </>
  );
}

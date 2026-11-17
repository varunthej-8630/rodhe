import React, { useEffect, Suspense, lazy } from 'react';
import { ShopProvider, useShop } from './context/ShopContext';
import { Navbar } from './components/Navbar';
import { ScrollIntroExperience } from './components/ScrollIntroExperience';
import { HeroSection } from './components/HeroSection';
import { CraftMarquee } from './components/CraftMarquee';
import { ShopByCraftSection } from './components/ShopByCraftSection';
import { ShopByColourSection } from './components/ShopByColourSection';
import { ProductGrid } from './components/ProductGrid';
import { FindYourPieceSection } from './components/FindYourPieceSection';
import { CustomerReviewsSection } from './components/CustomerReviewsSection';
import { EditorialLookbookSection } from './components/EditorialLookbookSection';
import { CartDrawer } from './components/CartDrawer';
import { WishlistDrawer } from './components/WishlistDrawer';
import { SearchModal } from './components/SearchModal';
import { CookieConsentBanner } from './components/CookieConsentBanner';
import { Toast } from './components/Toast';
import { Footer } from './components/Footer';
import { applyRouteSeoMeta, getPageMeta } from './services/seoService';
import { trackPageView } from './services/analyticsService';
import { parseRouteFromLocation } from './utils/router';

// Code-split secondary pages, checkout/account modals, and administrative views for faster initial LCP
const CollectionPage = lazy(() => import('./components/CollectionPage').then((m) => ({ default: m.CollectionPage })));
const ProductDetailPage = lazy(() => import('./components/ProductDetailPage').then((m) => ({ default: m.ProductDetailPage })));
const AuthModal = lazy(() => import('./components/AuthModal').then((m) => ({ default: m.AuthModal })));
const CheckoutModal = lazy(() => import('./components/CheckoutModal').then((m) => ({ default: m.CheckoutModal })));
const TrackOrderModal = lazy(() => import('./components/TrackOrderModal').then((m) => ({ default: m.TrackOrderModal })));
const ProductQuickViewModal = lazy(() => import('./components/ProductQuickViewModal').then((m) => ({ default: m.ProductQuickViewModal })));
const BrandStoryPage = lazy(() => import('./components/BrandStoryPage').then((m) => ({ default: m.BrandStoryPage })));
const ContactConciergePage = lazy(() => import('./components/ContactConciergePage').then((m) => ({ default: m.ContactConciergePage })));
const LegalPolicyPage = lazy(() => import('./components/LegalPolicyPage').then((m) => ({ default: m.LegalPolicyPage })));
const NotFoundPage = lazy(() => import('./components/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));
const AdminPortal = lazy(() => import('./components/admin/AdminPortal').then((m) => ({ default: m.AdminPortal })));

const SuspenseFallback = () => (
  <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4B3024', fontFamily: 'var(--font-serif)', fontSize: '1.2rem' }}>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
      <div style={{ width: '36px', height: '36px', border: '2px solid rgba(184, 141, 74, 0.2)', borderTopColor: '#B88D4A', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <span>Loading RODHE...</span>
    </div>
  </div>
);

const MainLayout = () => {
  const {
    currentPage,
    selectedProductId,
    selectedCraft,
    navigateTo,
    setSelectedCraft,
    isTrackOrderOpen,
    setIsTrackOrderOpen,
    isAuthOpen,
    isCheckoutOpen,
    quickViewProduct,
    pendingUpiOrder
  } = useShop();

  // Browser Back / Forward & manual hash navigation sync (state-only: never mutates history stack)
  useEffect(() => {
    const syncRouteFromUrl = () => {
      try {
        const route = parseRouteFromLocation(window.location);
        if (route.craft && typeof setSelectedCraft === 'function') {
          setSelectedCraft(route.craft);
        }
        navigateTo(route.page, route.productId, { syncOnly: true });
      } catch {}
    };

    window.addEventListener('popstate', syncRouteFromUrl);
    window.addEventListener('hashchange', syncRouteFromUrl);
    return () => {
      window.removeEventListener('popstate', syncRouteFromUrl);
      window.removeEventListener('hashchange', syncRouteFromUrl);
    };
  }, [navigateTo, setSelectedCraft]);

  // Apply unique route SEO title, description, canonical, robots, and consented page_view tracking
  useEffect(() => {
    if (currentPage === 'product') return; // ProductDetailPage sets product-specific SEO & JSON-LD
    applyRouteSeoMeta({
      currentPage,
      selectedCraft,
      policyTab: currentPage === 'policies' ? selectedProductId : null
    });
    const meta = getPageMeta({
      currentPage,
      selectedCraft,
      policyTab: currentPage === 'policies' ? selectedProductId : null
    });
    if (currentPage !== 'admin') {
      trackPageView(meta.title, meta.canonical);
    }
  }, [currentPage, selectedCraft, selectedProductId]);

  // Scroll to top on page change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage, selectedProductId]);

  // Private Client CRM Workspace
  if (currentPage === 'admin') {
    return (
      <div className="rodhe-admin-app" style={{ minHeight: '100vh', backgroundColor: '#1A1412' }}>
        <Suspense fallback={<SuspenseFallback />}>
          <AdminPortal onNavigateToStorefront={(target = 'home') => navigateTo(target)} />
        </Suspense>
        <Toast />
      </div>
    );
  }

  return (
    <div className="rodhe-app" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Scroll-Driven Brand Introduction Experience (Active on Home unless modal or pending UPI resume) */}
      {currentPage === 'home' && !isCheckoutOpen && !isTrackOrderOpen && !isAuthOpen && !pendingUpiOrder && <ScrollIntroExperience />}

      {/* Main Real Website Content */}
      <div id="rodhe-real-site" style={{ position: 'relative', width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        {/* Main Luxury Header */}
        <Navbar />

        {/* Dynamic View Router */}
        <main style={{ flexGrow: 1 }}>
          {currentPage === 'home' && (
            <>
              <HeroSection />
              <CraftMarquee />
              <ShopByColourSection />
              <ShopByCraftSection />
              <ProductGrid />
              <FindYourPieceSection />
              <CustomerReviewsSection />
              <EditorialLookbookSection />
            </>
          )}

          {(currentPage === 'shop' || currentPage === 'collections') && (
            <Suspense fallback={<SuspenseFallback />}>
              <CollectionPage />
            </Suspense>
          )}
          {currentPage === 'product' && (
            <Suspense fallback={<SuspenseFallback />}>
              <ProductDetailPage key={selectedProductId || 'product'} productId={selectedProductId} />
            </Suspense>
          )}
          {currentPage === 'story' && (
            <Suspense fallback={<SuspenseFallback />}>
              <BrandStoryPage />
            </Suspense>
          )}
          {currentPage === 'contact' && (
            <Suspense fallback={<SuspenseFallback />}>
              <ContactConciergePage />
            </Suspense>
          )}
          {currentPage === 'policies' && (
            <Suspense fallback={<SuspenseFallback />}>
              <LegalPolicyPage initialTab={selectedProductId || 'shipping'} />
            </Suspense>
          )}
          {!['home', 'shop', 'collections', 'product', 'story', 'contact', 'policies'].includes(currentPage) && (
            <Suspense fallback={<SuspenseFallback />}>
              <NotFoundPage />
            </Suspense>
          )}
        </main>

        {/* Modals, Consent Banner & Slide-Over Drawers */}
        <CartDrawer />
        <WishlistDrawer />
        <SearchModal />
        <Suspense fallback={null}>
          {isAuthOpen && <AuthModal />}
          {isCheckoutOpen && <CheckoutModal />}
          {isTrackOrderOpen && <TrackOrderModal isOpen={isTrackOrderOpen} onClose={() => setIsTrackOrderOpen(false)} />}
          {quickViewProduct && <ProductQuickViewModal />}
        </Suspense>
        <CookieConsentBanner />
        <Toast />

        {/* Complete Trust Footer */}
        <Footer />
      </div>
    </div>
  );
};

export function App() {
  return (
    <ShopProvider>
      <MainLayout />
    </ShopProvider>
  );
}

export default App;

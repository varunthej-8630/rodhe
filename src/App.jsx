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
import { CollectionPage } from './components/CollectionPage';
import { ProductDetailPage } from './components/ProductDetailPage';
import { CartDrawer } from './components/CartDrawer';
import { WishlistDrawer } from './components/WishlistDrawer';
import { SearchModal } from './components/SearchModal';
import { AuthModal } from './components/AuthModal';
import { CheckoutModal } from './components/CheckoutModal';
import { TrackOrderModal } from './components/TrackOrderModal';
import { ProductQuickViewModal } from './components/ProductQuickViewModal';
import { Toast } from './components/Toast';
import { Footer } from './components/Footer';

// Code-split non-critical and administrative views to optimize initial bundle size & LCP
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
  const { currentPage, selectedProductId, navigateTo, setSelectedCraft, isTrackOrderOpen, setIsTrackOrderOpen } = useShop();

  // URL route sync: checks query parameters (?product=..., ?page=...) and hash routes
  useEffect(() => {
    const syncRouteFromUrl = () => {
      try {
        const path = window.location.pathname.toLowerCase();
        const hash = window.location.hash.toLowerCase();
        const search = window.location.search;
        const searchParams = new URLSearchParams(search);

        const productQuery = searchParams.get('product');
        const pageQuery = searchParams.get('page');
        const craftQuery = searchParams.get('craft');

        if (productQuery) {
          navigateTo('product', productQuery);
          return;
        }

        if (pageQuery) {
          if (['shipping-delivery', 'returns-exchanges', 'privacy-policy', 'terms-of-service'].includes(pageQuery)) {
            navigateTo('policies', pageQuery);
          } else if (pageQuery === 'shop' || pageQuery === 'collections') {
            if (craftQuery && typeof setSelectedCraft === 'function') {
              setSelectedCraft(craftQuery);
            }
            navigateTo('shop');
          } else if (['story', 'contact', 'home'].includes(pageQuery)) {
            navigateTo(pageQuery);
          }
          return;
        }

        if (path.includes('/admin') || hash.includes('admin')) {
          navigateTo('admin');
        } else if (hash.includes('shop') || hash.includes('collection')) {
          navigateTo('shop');
        } else if (hash.includes('story') || hash.includes('craft')) {
          navigateTo('story');
        } else if (hash.includes('contact') || hash.includes('concierge')) {
          navigateTo('contact');
        } else if (hash.includes('policy') || hash.includes('privacy') || hash.includes('terms') || hash.includes('shipping') || hash.includes('returns')) {
          navigateTo('policies');
        } else if (hash.includes('product')) {
          const match = window.location.hash.match(/product\/([a-zA-Z0-9_-]+)/i);
          if (match && match[1]) {
            navigateTo('product', match[1]);
          } else {
            navigateTo('shop');
          }
        }
      } catch (e) {}
    };

    syncRouteFromUrl();
    window.addEventListener('hashchange', syncRouteFromUrl);
    window.addEventListener('popstate', syncRouteFromUrl);
    return () => {
      window.removeEventListener('hashchange', syncRouteFromUrl);
      window.removeEventListener('popstate', syncRouteFromUrl);
    };
  }, [navigateTo, setSelectedCraft]);

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
      {/* Scroll-Driven Brand Introduction Experience (Active on Home) */}
      {currentPage === 'home' && <ScrollIntroExperience />}

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

          {currentPage === 'shop' && <CollectionPage />}
          {currentPage === 'collections' && <CollectionPage />}
          {currentPage === 'product' && <ProductDetailPage key={selectedProductId || 'product'} productId={selectedProductId} />}
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
              <LegalPolicyPage />
            </Suspense>
          )}
          {!['home', 'shop', 'collections', 'product', 'story', 'contact', 'policies'].includes(currentPage) && (
            <Suspense fallback={<SuspenseFallback />}>
              <NotFoundPage />
            </Suspense>
          )}
        </main>

        {/* Modals & Slide-Over Drawers */}
        <CartDrawer />
        <WishlistDrawer />
        <SearchModal />
        <AuthModal />
        <CheckoutModal />
        <TrackOrderModal isOpen={isTrackOrderOpen} onClose={() => setIsTrackOrderOpen(false)} />
        <ProductQuickViewModal />
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

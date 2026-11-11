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
    quickViewProduct
  } = useShop();

  // URL route sync: checks query parameters (?product=..., ?page=...), paths, and hash routes
  useEffect(() => {
    const syncRouteFromUrl = () => {
      try {
        const rawPath = window.location.pathname || '/';
        const path = rawPath.length > 1 ? rawPath.replace(/\/+$/, '').toLowerCase() : '/';
        const hash = window.location.hash.toLowerCase();
        const searchParams = new URLSearchParams(window.location.search);

        const productQuery = searchParams.get('product');
        const idQuery = searchParams.get('id');
        const pageQuery = searchParams.get('page');
        const craftQuery = searchParams.get('craft');
        const tabQuery = searchParams.get('tab');

        if (productQuery) {
          navigateTo('product', productQuery);
          return;
        }

        if (pageQuery) {
          const normalizedPage = pageQuery.toLowerCase();
          const policyTabMap = {
            'shipping-delivery': 'shipping',
            'returns-exchanges': 'returns',
            'privacy-policy': 'privacy',
            'terms-of-service': 'terms',
            shipping: 'shipping',
            returns: 'returns',
            privacy: 'privacy',
            terms: 'terms',
            care: 'care'
          };
          if (normalizedPage === 'product' && (idQuery || productQuery)) {
            navigateTo('product', idQuery || productQuery);
          } else if (
            ['policies', 'shipping-delivery', 'returns-exchanges', 'privacy-policy', 'terms-of-service'].includes(normalizedPage)
          ) {
            const resolvedTab =
              normalizedPage === 'policies'
                ? policyTabMap[(tabQuery || 'shipping').toLowerCase()] || 'shipping'
                : policyTabMap[normalizedPage];
            navigateTo('policies', resolvedTab);
          } else if (normalizedPage === 'shop' || normalizedPage === 'collections') {
            if (craftQuery && typeof setSelectedCraft === 'function') {
              const normalizedCraft = craftQuery.toLowerCase() === 'indigo' ? 'tie-dye' : craftQuery;
              setSelectedCraft(normalizedCraft);
            }
            navigateTo('shop');
          } else if (['story', 'contact', 'home'].includes(normalizedPage)) {
            navigateTo(normalizedPage);
          } else {
            navigateTo('not-found');
          }
          return;
        }

        if (path === '/admin' || hash.includes('admin')) {
          navigateTo('admin');
        } else if (path === '/shop' || path === '/collections' || hash.includes('shop') || hash.includes('collection')) {
          navigateTo('shop');
        } else if (path === '/story' || hash.includes('story') || hash.includes('craft')) {
          navigateTo('story');
        } else if (path === '/contact' || hash.includes('contact') || hash.includes('concierge')) {
          navigateTo('contact');
        } else if (hash.includes('privacy')) {
          navigateTo('policies', 'privacy');
        } else if (hash.includes('terms')) {
          navigateTo('policies', 'terms');
        } else if (hash.includes('shipping')) {
          navigateTo('policies', 'shipping');
        } else if (hash.includes('returns') || hash.includes('exchange')) {
          navigateTo('policies', 'returns');
        } else if (hash.includes('care')) {
          navigateTo('policies', 'care');
        } else if (path === '/policies' || hash.includes('policy')) {
          navigateTo('policies', 'shipping');
        } else if (hash.includes('product')) {
          const match = window.location.hash.match(/product\/([a-zA-Z0-9_-]+)/i);
          if (match && match[1]) {
            navigateTo('product', match[1]);
          } else {
            navigateTo('shop');
          }
        } else if (path !== '/' && path !== '/index.html') {
          navigateTo('not-found');
        } else if (hash && hash !== '#' && hash !== '#/' && hash !== '#home') {
          navigateTo('not-found');
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

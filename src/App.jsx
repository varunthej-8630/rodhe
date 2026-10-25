import React, { useEffect } from 'react';
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
import { BrandStoryPage } from './components/BrandStoryPage';
import { ContactConciergePage } from './components/ContactConciergePage';
import { AdminPortal } from './components/admin/AdminPortal';
import { CartDrawer } from './components/CartDrawer';
import { WishlistDrawer } from './components/WishlistDrawer';
import { SearchModal } from './components/SearchModal';
import { AuthModal } from './components/AuthModal';
import { CheckoutModal } from './components/CheckoutModal';
import { ProductQuickViewModal } from './components/ProductQuickViewModal';
import { Toast } from './components/Toast';
import { Footer } from './components/Footer';

const MainLayout = () => {
  const { currentPage, selectedProductId, navigateTo } = useShop();

  // URL route sync: check for #admin, #shop, #collections, #product, etc. on mount and hashchange
  useEffect(() => {
    const syncRouteFromUrl = () => {
      try {
        const path = window.location.pathname.toLowerCase();
        const hash = window.location.hash.toLowerCase();

        if (path.includes('/admin') || hash.includes('admin')) {
          navigateTo('admin');
        } else if (hash.includes('shop') || hash.includes('collection')) {
          navigateTo('shop');
        } else if (hash.includes('story') || hash.includes('craft')) {
          navigateTo('story');
        } else if (hash.includes('contact') || hash.includes('concierge')) {
          navigateTo('contact');
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
    return () => window.removeEventListener('hashchange', syncRouteFromUrl);
  }, [navigateTo]);

  // Scroll to top on page change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage, selectedProductId]);

  // Private Client CRM Workspace
  if (currentPage === 'admin') {
    return (
      <div className="rodhe-admin-app" style={{ minHeight: '100vh', backgroundColor: '#1A1412' }}>
        <AdminPortal onNavigateToStorefront={(target = 'home') => navigateTo(target)} />
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
          {currentPage === 'product' && <ProductDetailPage productId={selectedProductId} />}
          {currentPage === 'story' && <BrandStoryPage />}
          {currentPage === 'contact' && <ContactConciergePage />}
        </main>

        {/* Modals & Slide-Over Drawers */}
        <CartDrawer />
        <WishlistDrawer />
        <SearchModal />
        <AuthModal />
        <CheckoutModal />
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

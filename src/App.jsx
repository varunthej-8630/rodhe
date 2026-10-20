import React, { useEffect } from 'react';
import { ShopProvider, useShop } from './context/ShopContext';
import { Navbar } from './components/Navbar';
import { IntroOverlay } from './components/IntroOverlay';
import { HeroSection } from './components/HeroSection';
import { NatureStorySection } from './components/NatureStorySection';
import { ShopByCraftSection } from './components/ShopByCraftSection';
import { ShopByColourSection } from './components/ShopByColourSection';
import { ProductGrid } from './components/ProductGrid';
import { PackagingSection } from './components/PackagingSection';
import { CustomerReviewsSection } from './components/CustomerReviewsSection';
import { EditorialLookbookSection } from './components/EditorialLookbookSection';
import { CollectionPage } from './components/CollectionPage';
import { ProductDetailPage } from './components/ProductDetailPage';
import { BrandStoryPage } from './components/BrandStoryPage';
import { ContactConciergePage } from './components/ContactConciergePage';
import { CartDrawer } from './components/CartDrawer';
import { WishlistDrawer } from './components/WishlistDrawer';
import { SearchModal } from './components/SearchModal';
import { AuthModal } from './components/AuthModal';
import { CheckoutModal } from './components/CheckoutModal';
import { ProductQuickViewModal } from './components/ProductQuickViewModal';
import { Toast } from './components/Toast';
import { Footer } from './components/Footer';

const MainLayout = () => {
  const { currentPage, selectedProductId } = useShop();

  // Scroll to top on page change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage, selectedProductId]);

  return (
    <div className="rodhe-app" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Cinematic Logo Reveal Opening Experience */}
      <IntroOverlay />

      {/* Main Luxury Header */}
      <Navbar />

      {/* Dynamic View Router */}
      <main style={{ flexGrow: 1 }}>
        {currentPage === 'home' && (
          <>
            <HeroSection />
            <NatureStorySection />
            <ShopByCraftSection />
            <ProductGrid />
            <ShopByColourSection />
            <PackagingSection />
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

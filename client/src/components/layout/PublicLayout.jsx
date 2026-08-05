import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import WhatsAppButton from '../common/WhatsAppButton';
import PageLoader from '../common/PageLoader';

export default function PublicLayout() {
  return (
    <>
      <Header />
      <main className="site-main">
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}

import type { ReactNode } from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { ConversionBanner } from './ConversionBanner';

export const Layout = ({ children, hideCta = false }: { children: ReactNode; hideCta?: boolean }) => (
  <div className="flex min-h-screen flex-col bg-white text-ink">
    <Navbar />
    <main className="flex-1">{children}</main>
    {!hideCta && <ConversionBanner />}
    <Footer />
  </div>
);

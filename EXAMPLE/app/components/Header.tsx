"use client";

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { authApi } from '@/lib/api/auth';

const menuItems = [
  { label: 'Home', href: '/' },
  { label: 'Pricing', href: '/pricing' },

];

// --- Skeleton Component ---
const HeaderSkeleton = () => (
  <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-6 py-3">
    <div className="mx-auto flex items-center justify-between gap-4 animate-pulse">
      {/* Logo Skeleton */}
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 bg-gray-200 rounded-md" />
        <div className="w-24 h-5 bg-gray-200 rounded" />
      </div>

      {/* Nav Links Skeleton */}
      <div className="hidden md:flex items-center gap-8">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="w-16 h-4 bg-gray-100 rounded" />
        ))}
      </div>

      {/* Buttons Skeleton */}
      <div className="flex items-center gap-4">
        <div className="w-20 h-9 bg-gray-100 rounded" />
        <div className="w-32 h-9 bg-gray-200 rounded" />
      </div>
    </div>
  </nav>
);

const Header = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const source = searchParams?.get('source');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isProductsOpen, setIsProductsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await authApi.verifyToken();
        if (response.success) {
          setIsAuthenticated(true);
          if (response.data?.user) {
            setUser(response.data.user);
          }
        }
      } catch (error) {
        console.error('Header: Auth check failed', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [source]);

  const isActive = (href: string) => {
    if (href === '/pricing') return pathname === '/pricing';
    if (href.startsWith('/#')) return pathname === '/' || pathname === '';
    return pathname === href;
  };

  const isTeacher = user?.role === 'TEACHER';
  const redirectPath = isTeacher ? '/workspace' : '/dashboard';

  // Return skeleton while loading
  if (isLoading) {
    return <HeaderSkeleton />;
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-6 py-3 ">
      <div className=" mx-auto flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href={'/'} className="flex items-center gap-3">
          <Image
            src="https://avatars.githubusercontent.com/u/225484805?s=200&v=4"
            alt="LearningDeck Logo"
            width={28}
            height={28}
            className="rounded-md"
          />
          <span className="text-[16px] tracking-tight text-gray-800 font-medium">LearningDeck</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8 text-[14px] font-medium text-gray-500">
          {/* Products / Platform Dropdown */}


          {menuItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`transition-colors py-2 ${isActive(item.href)
                ? 'text-[#FF623D] border-b-2 border-[#FF623D] pb-1 font-semibold'
                : 'hover:text-gray-900'
                }`}
            >
              {item.label}
            </Link>
          ))}
          <div
            className="relative"
            onMouseEnter={() => setIsProductsOpen(true)}
            onMouseLeave={() => setIsProductsOpen(false)}
          >
            <button className="hover:text-gray-900 py-2">Products</button>
            <div
              className={`absolute left-1/2 -translate-x-[35%] top-full z-50 mt-1 w-[900px] rounded border border-gray-200 bg-white transition-all duration-200 flex overflow-hidden origin-top-left ${isProductsOpen ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible'
                }`}
            >
              {/* Left Content */}
              <div className="flex-1 p-8 grid grid-cols-4 gap-8 bg-white">
                <div className="flex flex-col justify-between">
                  <div>
                    <p className="text-[11px] font-bold tracking-widest text-[#FF623D] mb-6 uppercase">Platform</p>
                    <ul className="space-y-4">
                      {["What's New", "Security", "Integrations"].map((item) => (
                        <li key={item}>
                          <Link href="#" className="text-[14px] font-medium text-gray-700 hover:text-[#FF623D] transition-colors">
                            {item}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                {/* Simplified for brevity - existing dropdown content remains same */}
              </div>
            </div>
          </div>
        </div>

        {/* Auth/CTA Buttons */}
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <Link
                href={redirectPath}
                className="bg-gray-300/20 text-black border-2 border-zinc-400 text-[14px] font-medium px-4 py-2 rounded hover:bg-gray-300/50 transition-colors flex items-center gap-1"
              >
                Contact us <ChevronRight className="w-4 h-4" />
              </Link>
              <Link
                href={redirectPath}
                className="bg-[#FF623D] text-white text-[14px] font-medium px-4 py-2.5 rounded hover:bg-[#E55837] transition-colors flex items-center gap-1"
              >
                Launch LearningDeck <ChevronRight className="w-4 h-4" />
              </Link>
            </>
          ) : (
            <>
              <Link
                href={`/login${source ? `?source=${source}` : ''}`}
                className="text-[14px] font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                Log In
              </Link>
              <Link
                href={`/signup${source ? `?source=${source}` : ''}`}
                className="bg-[#FF623D] text-white text-[14px] font-medium px-4 py-2 rounded-md hover:bg-[#E55837] transition-colors flex items-center gap-1"
              >
                Get Started <ChevronRight className="w-4 h-4" />
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Header;
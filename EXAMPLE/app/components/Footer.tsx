import Link from 'next/link';

const Footer = () => {
  return (
    // Added 'relative' and 'overflow-hidden' to contain the watermark
    <footer className="relative overflow-hidden py-12 px-6 border-t border-gray-200 bg-[#F8F9FA]">
      
      {/* Watermark Logo */}
      <img
        src="https://avatars.githubusercontent.com/u/225484805?s=200&v=4"
        alt=""
        aria-hidden="true"
        className="absolute -bottom-10 -right-10 w-96 h-96 opacity-[0.09] grayscale pointer-events-none select-none z-0"
      />

      {/* Main Content - Added 'relative z-10' to stay above the watermark */}
      <div className="relative z-10 max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
        <div className="max-w-xs">
          <div className="flex items-center gap-2 mb-4">
            <img
              src="https://avatars.githubusercontent.com/u/225484805?s=200&v=4"
              alt="LearningDeck Logo"
              className="w-6 h-6 rounded-md grayscale opacity-80"
            />
            <span className="text-[16px] text-gray-700 font-medium">LearningDeck</span>
          </div>
          <p className="text-gray-500 text-[14px] leading-relaxed">
            Standardizing the future of digital education and examination management across the globe.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-12 text-[14px]">
          <div className="space-y-3">
            <p className="text-gray-900 font-medium">Product</p>
            <ul className="space-y-2 text-gray-500">
              <li><Link href="/#features" className="hover:text-blue-600 transition-colors">Features</Link></li>
              <li><Link href="/pricing" className="hover:text-blue-600 transition-colors">Pricing</Link></li>
              <li><Link href="/#enterprise" className="hover:text-blue-600 transition-colors">Enterprise</Link></li>
            </ul>
          </div>
          <div className="space-y-3">
            <p className="text-gray-900 font-medium">Support</p>
            <ul className="space-y-2 text-gray-500">
              <li><Link href="#" className="hover:text-blue-600 transition-colors">Help Center</Link></li>
              <li><Link href="#" className="hover:text-blue-600 transition-colors">API Docs</Link></li>
              <li><Link href="#" className="hover:text-blue-600 transition-colors">Status</Link></li>
            </ul>
          </div>
          <div className="space-y-3">
            <p className="text-gray-900 font-medium">Company</p>
            <ul className="space-y-2 text-gray-500">
              <li><Link href="#" className="hover:text-blue-600 transition-colors">About Us</Link></li>
              <li><Link href="#" className="hover:text-blue-600 transition-colors">Privacy</Link></li>
              <li><Link href="#" className="hover:text-blue-600 transition-colors">Terms</Link></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto mt-12 pt-6 border-t border-gray-200 flex items-center justify-between text-[13px] text-gray-500">
        <span>© 2026 LearningDeck incooperation with <Link href="#" className="hover:text-blue-600 transition-colors">Arcixil Labs</Link>. All rights reserved.</span>
      </div>
    </footer>
  );
};

export default Footer;
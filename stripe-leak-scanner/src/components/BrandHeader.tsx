import Link from 'next/link';

export function BrandHeader() {
  return (
    <header className="sticky top-0 z-50 h-[60px] bg-[#0a0a0a] border-b border-[#222222] flex items-center px-4 md:px-8">
      <div className="max-w-7xl w-full mx-auto flex items-center justify-between">
        {/* Left Side */}
        <div className="flex items-baseline gap-2">
          <Link href="/" className="text-white font-bold text-lg hover:text-white/90 transition-colors">
            API Sprint
          </Link>
          <span className="text-[#a0a0a0] text-sm">
            Revenue Tools
          </span>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-6">
          <Link href="/" className="text-[#a0a0a0] text-sm hover:text-white transition-colors hidden sm:inline-block">
            ← Back to Home
          </Link>
          <Link
            href="https://calendly.com/atmospherix8/revenue-recovery-call"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#FF6B6B] text-white px-5 py-2 rounded-[8px] text-sm font-semibold hover:bg-[#FF5252] transition-all transform hover:scale-[1.02]"
          >
            Book a Call
          </Link>
        </div>
      </div>
    </header>
  );
}

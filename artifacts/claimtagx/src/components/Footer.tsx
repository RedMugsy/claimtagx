import { Link } from 'wouter';
import { Linkedin, Twitter, Instagram, Youtube } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#05080f] pt-20 pb-10 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8 lg:gap-12 mb-16">
          {/* Brand Column */}
          <div className="col-span-1 md:col-span-1 lg:col-span-1">
            <Link href="/" className="flex items-center gap-1 mb-4 inline-block">
              <span className="font-sans font-extrabold text-2xl tracking-tight text-white">Claim</span>
              <span className="font-sans font-extrabold text-2xl tracking-tight text-lime">TagX</span>
            </Link>
            <p className="text-slate text-sm leading-relaxed max-w-xs">
              Replace paper claim tickets with cryptographically signed digital tags.
            </p>
          </div>

          {/* Links Columns */}
          <div className="col-span-1">
            <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">Product</h4>
            <ul className="flex flex-col gap-3">
              <li><a href="/#features" className="text-slate hover:text-lime transition-colors text-sm">Features</a></li>
              <li><Link href="/price" className="text-slate hover:text-lime transition-colors text-sm">Pricing</Link></li>
              <li><a href="/#industries" className="text-slate hover:text-lime transition-colors text-sm">Industries</a></li>
              <li><a href="/#how" className="text-slate hover:text-lime transition-colors text-sm">How it works</a></li>
            </ul>
          </div>

          <div className="col-span-1">
            <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">Company</h4>
            <ul className="flex flex-col gap-3">
              <li><a href="mailto:info@claimtagx.com" className="text-slate hover:text-lime transition-colors text-sm">Contact</a></li>
              <li><a href="https://linkedin.com/company/claimtagx" target="_blank" rel="noopener noreferrer" className="text-slate hover:text-lime transition-colors text-sm">LinkedIn</a></li>
              <li><a href="https://twitter.com/claimtagx" target="_blank" rel="noopener noreferrer" className="text-slate hover:text-lime transition-colors text-sm">X (Twitter)</a></li>
              <li><a href="https://instagram.com/claimtagx" target="_blank" rel="noopener noreferrer" className="text-slate hover:text-lime transition-colors text-sm">Instagram</a></li>
            </ul>
          </div>

          <div className="col-span-1">
            <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">Legal</h4>
            <ul className="flex flex-col gap-3">
              <li><Link href="/privacy" className="text-slate hover:text-lime transition-colors text-sm">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-slate hover:text-lime transition-colors text-sm">Terms of Use</Link></li>
              <li><Link href="/refund" className="text-slate hover:text-lime transition-colors text-sm">Refund Policy</Link></li>
              <li><Link href="/cookies" className="text-slate hover:text-lime transition-colors text-sm">Cookie Policy</Link></li>
              <li><Link href="/gdpr" className="text-slate hover:text-lime transition-colors text-sm">GDPR</Link></li>
              <li><Link href="/dpa" className="text-slate hover:text-lime transition-colors text-sm">Data Processing</Link></li>
              <li><Link href="/aup" className="text-slate hover:text-lime transition-colors text-sm">Acceptable Use</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate text-sm">
            © {currentYear} ClaimTagX. All rights reserved.
          </p>
          <div className="flex gap-4">
            <a href="https://linkedin.com/company/claimtagx" target="_blank" rel="noopener noreferrer" className="text-slate hover:text-white transition-colors">
              <Linkedin size={20} />
            </a>
            <a href="https://twitter.com/claimtagx" target="_blank" rel="noopener noreferrer" className="text-slate hover:text-white transition-colors">
              <Twitter size={20} />
            </a>
            <a href="https://instagram.com/claimtagx" target="_blank" rel="noopener noreferrer" className="text-slate hover:text-white transition-colors">
              <Instagram size={20} />
            </a>
            <a href="#" target="_blank" rel="noopener noreferrer" className="text-slate hover:text-white transition-colors">
              <Youtube size={20} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

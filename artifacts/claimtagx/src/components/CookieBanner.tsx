import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('claimtagx-cookie-consent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('claimtagx-cookie-consent', 'accepted');
    setIsVisible(false);
  };

  const rejectCookies = () => {
    localStorage.setItem('claimtagx-cookie-consent', 'rejected');
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4"
        >
          <div className="max-w-7xl mx-auto">
            <div className="bg-steel border border-white/10 rounded-xl p-4 md:p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4 md:gap-8">
              <p className="text-sm text-slate flex-1">
                We use cookies to improve your experience. By continuing, you agree to our{' '}
                <Link href="/cookies" className="text-white hover:text-lime underline underline-offset-4">
                  Cookie Policy
                </Link>.
              </p>
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <button
                  onClick={acceptCookies}
                  className="bg-lime text-obsidian px-5 py-2 rounded-lg font-semibold text-sm hover:bg-lime-hover transition-colors flex-1 md:flex-none whitespace-nowrap"
                >
                  Accept
                </button>
                <Link
                  href="/cookies"
                  className="border border-white/15 text-white bg-transparent px-5 py-2 rounded-lg font-semibold text-sm hover:border-lime/50 hover:text-lime transition-all flex-1 md:flex-none whitespace-nowrap text-center"
                  onClick={() => setIsVisible(false)}
                >
                  Manage preferences
                </Link>
                <button
                  onClick={rejectCookies}
                  className="text-slate hover:text-white text-sm font-medium px-2 py-2 w-full md:w-auto text-center"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

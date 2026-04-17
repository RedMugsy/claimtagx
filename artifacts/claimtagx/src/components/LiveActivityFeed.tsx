import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, X } from 'lucide-react';

const mockNotifications = [
  { id: 1, text: "Ticket #4839 verified" },
  { id: 2, text: "Item released: Lexus SUV" },
  { id: 3, text: "New claim: Ticket #4840" },
  { id: 4, text: "Photo attached to #4841" },
  { id: 5, text: "Handler 'Alex' signed in" },
];

export default function LiveActivityFeed() {
  const [currentNotif, setCurrentNotif] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!isVisible) return;
    
    const interval = setInterval(() => {
      const randomIdx = Math.floor(Math.random() * mockNotifications.length);
      setCurrentNotif(randomIdx);
      
      setTimeout(() => {
        setCurrentNotif(null);
      }, 4000);
      
    }, 12000);

    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 pointer-events-none">
      <AnimatePresence>
        {currentNotif !== null && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="bg-steel border border-white/10 rounded-lg shadow-2xl p-4 flex items-center gap-3 pointer-events-auto"
          >
            <div className="bg-lime/20 rounded-full p-1.5 flex-shrink-0 animate-pulse">
              <CheckCircle2 className="w-4 h-4 text-lime" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Live Activity</p>
              <p className="text-xs text-slate">{mockNotifications[currentNotif].text}</p>
            </div>
            <button 
              onClick={() => setIsVisible(false)}
              className="ml-4 text-slate hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

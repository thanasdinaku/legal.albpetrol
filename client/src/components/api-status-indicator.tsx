import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface ApiStatusIndicatorProps {
  children: React.ReactNode;
}

export function ApiStatusIndicator({ children }: ApiStatusIndicatorProps) {
  const [isSlowApi, setIsSlowApi] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Monitor API performance
    let slowRequestCount = 0;
    const originalFetch = window.fetch;

    window.fetch = async (...args) => {
      const startTime = Date.now();
      
      try {
        const response = await originalFetch(...args);
        const duration = Date.now() - startTime;
        
        // If request takes longer than 3 seconds, consider it slow
        if (duration > 3000) {
          slowRequestCount++;
          
          if (slowRequestCount >= 2 && !isSlowApi) {
            setIsSlowApi(true);
            toast({
              title: "Performancë e ngadaltë",
              description: "Sistemi është duke punuar më ngadalë. Ju lutemi prisni...",
              variant: "default",
            });
          }
        } else {
          // Reset slow count if we get a fast response
          if (slowRequestCount > 0) {
            slowRequestCount = Math.max(0, slowRequestCount - 1);
          }
          
          if (isSlowApi && slowRequestCount === 0) {
            setIsSlowApi(false);
            toast({
              title: "Performancë e përmirësuar",
              description: "Sistemi është përmirësuar dhe punon normalisht.",
              variant: "default",
            });
          }
        }
        
        return response;
      } catch (error) {
        throw error;
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [isSlowApi, toast]);

  return (
    <>
      {isSlowApi && (
        <div className="fixed top-0 left-0 right-0 bg-yellow-100 border-b border-yellow-300 px-4 py-2 text-center text-sm text-yellow-800 z-50">
          <i className="fas fa-clock mr-2"></i>
          Sistemi është duke punuar më ngadalë se zakonisht. Ju lutemi prisni...
        </div>
      )}
      <div className={isSlowApi ? 'mt-10' : ''}>
        {children}
      </div>
    </>
  );
}
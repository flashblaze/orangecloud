import { useEffect, useState } from 'react';
import { useNavigation } from 'react-router';

const NavigationProgress = () => {
  const navigation = useNavigation();
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const isNavigating = navigation.state === 'loading' || navigation.state === 'submitting';

  useEffect(() => {
    if (isNavigating) {
      setIsVisible(true);
      setProgress(0);

      // Simulate progress animation
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90; // Stop at 90% until navigation completes
          }
          return prev + Math.random() * 30;
        });
      }, 200);

      return () => clearInterval(interval);
    }

    // Complete the progress bar
    setProgress(100);

    // Hide after a short delay
    const timeout = setTimeout(() => {
      setIsVisible(false);
      setProgress(0);
    }, 200);

    return () => clearTimeout(timeout);
  }, [isNavigating]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-0 right-0 left-0 z-50 h-1">
      <div
        className="h-full bg-gradient-to-r from-primary-500 to-primary-600 shadow-sm transition-all duration-300 ease-out"
        style={{
          width: `${Math.min(progress, 100)}%`,
          transition: isNavigating ? 'width 0.3s ease-out' : 'width 0.2s ease-in',
        }}
      />
      <div
        className="absolute top-0 right-0 h-full w-24 bg-gradient-to-l from-transparent to-primary-400/20"
        style={{
          transform: `translateX(${progress >= 100 ? '100%' : '0'})`,
          transition: 'transform 0.3s ease-out',
        }}
      />
    </div>
  );
};

export default NavigationProgress;

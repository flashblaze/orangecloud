import { NavigationProgress as MantineNavigationProgress, nprogress } from '@mantine/nprogress';
import { useEffect } from 'react';
import { useNavigation } from 'react-router';

const NavigationProgress = () => {
  const navigation = useNavigation();

  const isNavigating = navigation.state === 'loading' || navigation.state === 'submitting';

  useEffect(() => {
    if (isNavigating) {
      nprogress.start();
    } else {
      nprogress.complete();
    }
  }, [isNavigating]);

  return <MantineNavigationProgress />;
};

export default NavigationProgress;

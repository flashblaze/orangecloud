import { useMutation } from '@tanstack/react-query';

import { createClient } from '~/utils/client';

const useCheckConfig = ({ apiUrl }: { apiUrl: string }) => {
  return useMutation({
    mutationFn: async () => {
      const client = createClient(undefined, false, apiUrl);
      const response = await client.config.check.$get();

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to validate configuration');
      }

      const result = await response.json();
      return result.data;
    },
  });
};

export default useCheckConfig;

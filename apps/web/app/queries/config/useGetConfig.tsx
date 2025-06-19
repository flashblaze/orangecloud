import { useQuery } from '@tanstack/react-query';

import { createClient } from '~/utils/client';

type UseGetConfigProps = {
  apiUrl: string;
};

const useGetConfig = ({ apiUrl }: UseGetConfigProps) => {
  const client = createClient(undefined, false, apiUrl);

  return useQuery({
    queryKey: ['config'],
    queryFn: async () => {
      const response = await client.config.$get();

      if (!response.ok) {
        const errorData = (await response.json()) as { message?: string };
        throw new Error(errorData.message || 'Failed to fetch config');
      }

      return await response.json();
    },
  });
};

export default useGetConfig;

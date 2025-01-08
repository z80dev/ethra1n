import { useState } from 'react';
import { execHaloCmdWeb } from '@arx-research/libhalo/api/web';

export interface GetPkeysCommand {
  name: 'get_pkeys';
}

export interface GetPkeysResponse {
  publicKeys: {
    1: string;
    2: string;
    3?: string;
  };
  compressedPublicKeys: {
    1: string;
    2: string;
    3?: string;
  };
  etherAddresses: {
    1: string;
    2: string;
    3?: string;
  };
}

export interface UseGetPkeysReturn {
  execute: () => Promise<GetPkeysResponse>;
  result: GetPkeysResponse | null;
  error: Error | null;
  pending: boolean;
}

export const useGetPkeys = (): UseGetPkeysReturn => {
  const [result, setResult] = useState<GetPkeysResponse | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [pending, setPending] = useState<boolean>(false);

  const execute = async (): Promise<GetPkeysResponse> => {
    setPending(true);
    setError(null);
    setResult(null);

    try {
      const command: GetPkeysCommand = {
        name: 'get_pkeys'
      };

      const response = await execHaloCmdWeb(command) as GetPkeysResponse;
      setResult(response);
      return response;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setPending(false);
    }
  };

  return {
    execute,
    result,
    error,
    pending,
  };
};

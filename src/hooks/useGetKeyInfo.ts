import { useState } from 'react';
import { execHaloCmdWeb } from '@arx-research/libhalo/api/web';

export interface GetKeyInfoCommand {
  name: 'get_key_info';
  keyNo: number;
}

export interface KeyState {
  isPasswordProtected: boolean;
}

export interface GetKeyInfoResponse {
  keyState: KeyState;
  publicKey: string;
  attestSig: string;
}

export interface UseGetKeyInfoReturn {
  execute: () => Promise<GetKeyInfoResponse>;
  result: GetKeyInfoResponse | null;
  error: Error | null;
  pending: boolean;
}

export const useGetKeyInfo = (keyNo: number): UseGetKeyInfoReturn => {
  const [result, setResult] = useState<GetKeyInfoResponse | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [pending, setPending] = useState<boolean>(false);

  const execute = async (): Promise<GetKeyInfoResponse> => {
    setPending(true);
    setError(null);
    setResult(null);

    try {
      const command: GetKeyInfoCommand = {
        name: 'get_key_info',
        keyNo
      };

      const response = await execHaloCmdWeb(command) as GetKeyInfoResponse;
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

import { useState } from 'react';
import { execHaloCmdWeb } from '@arx-research/libhalo/api/web';

// Base types for different signing modes
export interface BaseSignCommand {
  name: 'sign';
  keyNo: number;
  password?: string;
  publicKeyHex?: string;
  legacySignCommand?: boolean;
}

export interface MessageSignCommand extends BaseSignCommand {
  message: string;
  format?: 'hex' | 'text';
  digest?: never;
  typedData?: never;
}

export interface DigestSignCommand extends BaseSignCommand {
  digest: string;
  message?: never;
  typedData?: never;
}

export interface TypedDataDomain {
  name?: string;
  version?: string;
  chainId?: number;
  verifyingContract?: string;
}

export interface TypedDataSignCommand extends BaseSignCommand {
  typedData: {
    domain: TypedDataDomain;
    types: Record<string, Array<{ name: string; type: string }>>;
    value?: any;
  };
  message?: never;
  digest?: never;
}

export type SignCommand = MessageSignCommand | DigestSignCommand | TypedDataSignCommand;

// Response types
export interface SignatureFormat {
  r: string;
  s: string;
  v: number;
}

export interface SignatureResponse {
  raw: SignatureFormat;
  der: string;
  ether: string;
}

export interface SignInputResponse {
  keyNo: number;
  digest: string;
  message?: string;
  typedData?: TypedDataSignCommand['typedData'];
  primaryType?: string;
  domainHash?: string;
}

export interface SignResponse {
  input: SignInputResponse;
  signature: SignatureResponse;
  publicKey: string;
  etherAddress: string;
}

export interface UseSignReturn {
  execute: () => Promise<SignResponse>;
  result: SignResponse | null;
  error: Error | null;
  pending: boolean;
}

export type SignError =
  | 'ERROR_CODE_INVALID_KEY_NO'
  | 'ERROR_CODE_KEY_NOT_INITIALIZED'
  | 'ERROR_CODE_INVALID_LENGTH'
  | 'ERROR_CODE_INVALID_DATA'
  | 'ERROR_CODE_WRONG_PWD';

export const useSign = (params: SignCommand): UseSignReturn => {
  const [result, setResult] = useState<SignResponse | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [pending, setPending] = useState<boolean>(false);

  const execute = async (): Promise<SignResponse> => {
    setPending(true);
    setError(null);
    setResult(null);

    try {
      const response = await execHaloCmdWeb(params) as SignResponse;
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


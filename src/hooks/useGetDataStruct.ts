import { useState } from 'react';
import { execHaloCmdWeb } from '@arx-research/libhalo/api/web';

// Object type definitions
type ObjectType =
  | 'publicKey'
  | 'compressedPublicKey'
  | 'publicKeyAttest'
  | 'keySlotFlags'
  | 'keySlotFailedAuthCtr'
  | 'latchValue'
  | 'latchAttest'
  | 'graffiti'
  | 'firmwareVersion';

interface GetDataStructCommand {
  name: 'get_data_struct';
  spec: string;
}

type DataError = {
    error: string;
}

// Define what type of value each ObjectType returns
type ObjectTypeReturnValue = {
  publicKey: string | DataError;
  compressedPublicKey: string;
  publicKeyAttest: string;
  keySlotFlags: object;
  keySlotFailedAuthCtr: number;
  latchValue: string;
  latchAttest: string;
  graffiti: string;
  firmwareVersion: string;
};

// Create a template literal type for valid keys
type DataStructKey = `${ObjectType}:${number}`;

// Map the response data to use our specific key format and return types
type DataStructResponseData = {
  [K in DataStructKey]?: ObjectTypeReturnValue[K extends `${infer T}:${number}` ? T extends ObjectType ? T : never : never] | null;
};

interface GetDataStructResponse {
  isPartial: boolean;
  data: DataStructResponseData;
}

interface UseGetDataStructReturn {
  execute: () => Promise<GetDataStructResponse>;
  result: GetDataStructResponse | null;
  error: Error | null;
  pending: boolean;
}

type DataStructSpec = Array<{
  type: ObjectType;
  id: number;
}>;
const formatSpec = (specs: DataStructSpec): string => {
  return specs.map(spec => `${spec.type}:${spec.id}`).join(',');
};

export const useGetDataStruct = (initialSpecs: DataStructSpec): UseGetDataStructReturn => {
  const [result, setResult] = useState<GetDataStructResponse | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [pending, setPending] = useState<boolean>(false);

  const getRemainingSpecs = (
    specs: DataStructSpec,
    response: GetDataStructResponse
  ): DataStructSpec => {
    return specs.filter(spec => {
      const key = `${spec.type}:${spec.id}`;
      return !(key in response.data);
    });
  };

  const mergeResults = (
    existingResult: GetDataStructResponse | null,
    newResult: GetDataStructResponse
  ): GetDataStructResponse => {
    if (!existingResult) return newResult;

    return {
      isPartial: newResult.isPartial,
      data: {
        ...existingResult.data,
        ...newResult.data
      }
    };
  };

  const execute = async (): Promise<GetDataStructResponse> => {
    setPending(true);
    setError(null);
    setResult(null);

    let currentSpecs = [...initialSpecs];
    let currentResult: GetDataStructResponse | null = null;

    try {
      while (currentSpecs.length > 0) {
        const command: GetDataStructCommand = {
          name: 'get_data_struct',
          spec: formatSpec(currentSpecs)
        };

        const response = await execHaloCmdWeb(command) as GetDataStructResponse;
        currentResult = mergeResults(currentResult, response);

        if (!response.isPartial) {
          break;
        }

        currentSpecs = getRemainingSpecs(currentSpecs, response);
      }

      if (!currentResult) {
        throw new Error('No data received from any requests');
      }

      setResult(currentResult);
      return currentResult;

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

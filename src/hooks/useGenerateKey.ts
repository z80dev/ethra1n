import { useState } from 'react';
import { execHaloCmdWeb } from '@arx-research/libhalo/api/web';

// Types for each command's response
interface GenKeyResponse {
  needsConfirmPK: boolean;
  publicKey?: string;
  rootPublicKey?: string;
  rootAttestSig?: string;
}

interface GenKeyConfirmResponse {
  rootPublicKey: string;
  rootAttestSig: string;
}

interface GenKeyFinalizeResponse {
  publicKey: string;
  attestSig: string;
}

// Combined type for all possible states
interface GenerateKeyState {
  step: 'initial' | 'confirming' | 'finalizing' | 'completed' | 'error';
  publicKey?: string;
  rootPublicKey?: string;
  rootAttestSig?: string;
  attestSig?: string;
  error?: Error;
}

interface UseGenerateKeyReturn {
  state: GenerateKeyState;
  generate: (keyNo: number, entropy: string, password?: string) => Promise<void>;
  isLoading: boolean;
}

export const useGenerateKey = (): UseGenerateKeyReturn => {
  const [state, setState] = useState<GenerateKeyState>({ step: 'initial' });
  const [isLoading, setIsLoading] = useState(false);

  const generate = async (keyNo: number, entropy: string, password?: string): Promise<void> => {
    setIsLoading(true);
    setState({ step: 'initial' });

    try {
      // Step 1: Initial key generation
      const genKeyCmd = {
        name: 'gen_key' as const,
        keyNo,
        entropy,
      };

      const genKeyResponse = await execHaloCmdWeb(genKeyCmd) as GenKeyResponse;

      if (genKeyResponse.needsConfirmPK) {
        if (!genKeyResponse.publicKey) {
          throw new Error('Expected publicKey in response when needsConfirmPK is true');
        }

        setState({
          step: 'confirming',
          publicKey: genKeyResponse.publicKey
        });

        // Step 2: Confirm the public key
        const confirmCmd = {
          name: 'gen_key_confirm' as const,
          keyNo,
          publicKey: genKeyResponse.publicKey
        };

        const confirmResponse = await execHaloCmdWeb(confirmCmd) as GenKeyConfirmResponse;

        setState({
          step: 'finalizing',
          publicKey: genKeyResponse.publicKey,
          rootPublicKey: confirmResponse.rootPublicKey,
          rootAttestSig: confirmResponse.rootAttestSig
        });
      } else {
        if (!genKeyResponse.rootPublicKey || !genKeyResponse.rootAttestSig) {
          throw new Error('Expected rootPublicKey and rootAttestSig in response when needsConfirmPK is false');
        }

        setState({
          step: 'finalizing',
          rootPublicKey: genKeyResponse.rootPublicKey,
          rootAttestSig: genKeyResponse.rootAttestSig
        });
      }

      // Step 3: Finalize the key generation
      const finalizeCmd = {
        name: 'gen_key_finalize' as const,
        keyNo,
        ...(password ? { password } : {})
      };

      const finalizeResponse = await execHaloCmdWeb(finalizeCmd) as GenKeyFinalizeResponse;

      setState({
        step: 'completed',
        publicKey: finalizeResponse.publicKey,
        attestSig: finalizeResponse.attestSig,
        rootPublicKey: state.rootPublicKey,
        rootAttestSig: state.rootAttestSig
      });

    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setState({
        step: 'error',
        error
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    state,
    generate,
    isLoading
  };
};

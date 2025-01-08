import { useGenerateKey, } from '../hooks';

export function KeyGeneration() {
  const { state, generate, isLoading } = useGenerateKey();

  const handleGenerateKey = async () => {
    try {
      // 32 bytes of entropy in hex
      const entropy = "3c825af7d2e1b02b6a00c257ebe883260b4aa6302c9878d412046d10141b261d";
      //await generate(5, entropy, "optional-password");
      await generate(5, entropy);
    } catch (error) {
      console.error('Key generation failed:', error);
    }
  };

  return (
    <div>
      <button
        onClick={handleGenerateKey}
        disabled={isLoading || state.step === 'completed'}
      >
        Generate Key
      </button>

      {isLoading && <div>Loading...</div>}

      <div>Current step: {state.step}</div>

      {state.step === 'completed' && (
        <div>
          <div>Public Key: {state.publicKey}</div>
          <div>Attestation Signature: {state.attestSig}</div>
        </div>
      )}

      {state.step === 'error' && (
        <div>Error: {state.error?.message}</div>
      )}
    </div>
  );
}

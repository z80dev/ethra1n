import { toAccount } from 'viem/accounts';
import { Account, Hex, keccak256, serializeTransaction, SerializeTransactionFn, SignableMessage, SignTransactionParameters, SignTransactionReturnType, TransactionSerializable, TypedData, TypedDataDefinition } from 'viem';
import { sign } from '../commands';
import { signTransaction } from './signTransaction';

import { PasswordPrompt } from '../components/PasswordPrompt';
import { createRoot } from 'react-dom/client'
import { GetKeyInfoResponse } from '../hooks/useGetKeyInfo';
import { getKeyInfo } from '../commands';
import { computeAddress } from 'ethers';
import { useState, useEffect } from 'react';

// We need to match the libhalo type structure
type HaloTypedDataParameter = {
  name: string;
  type: string;
}

type AddressString = `0x${string}`;

function promptForPassword(): Promise<string | undefined> {
  return new Promise((resolve) => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)

    const cleanup = () => {
      root.unmount()
      container.remove()
    }

    const handleSubmit = (password: string | undefined) => {
      cleanup()
      resolve(password)
    }

    const handleClose = () => {
      cleanup()
      resolve(undefined)
    }

    root.render(
      <PasswordPrompt
        isOpen={true}
        onSubmit={handleSubmit}
        onClose={handleClose}
      />
    )
  })
}

export async function slotNumberToAccount(slotNumber: number, address?: AddressString) {
  let fetchedAddress = address;
  if (!address) {
    const keyInfo: GetKeyInfoResponse = await getKeyInfo(slotNumber);
    if (keyInfo.publicKey) {
      fetchedAddress = computeAddress('0x' + keyInfo.publicKey) as AddressString;
    }
  }
  const signMessage = async ({ message }: { message: SignableMessage }): Promise<Hex> => {
    const messageString = typeof message === 'string' ? message : JSON.stringify(message);
    const password = await promptForPassword();
    // strip leading 0x
    const params = {
      name: 'sign' as const,
      keyNo: slotNumber,
      password,
      message: messageString,
      format: 'text' as const
    }
    const result = await sign(params);
    return result.signature.ether as Hex;
  }
  const signTypedData = async <
    const typedData extends TypedData | Record<string, unknown>,
    primaryType extends keyof typedData | 'EIP712Domain' = keyof typedData,
  >(
    parameters: TypedDataDefinition<typedData, primaryType>,
  ): Promise<Hex> => {
    const { domain, types, primaryType, message } = parameters;

    // Convert types to HaLo format
    const haloTypes: Record<string, HaloTypedDataParameter[]> = Object.entries(types || {}).reduce(
      (acc, [key, value]) => ({
        ...acc,
        [key]: (Array.isArray(value) ? value : []).map(param => ({
          name: String(param.name),
          type: String(param.type)
        }))
      }),
      {}
    );

    // remove EIP712Domain from types
    delete haloTypes.EIP712Domain;

    const password = await promptForPassword();

    const params = {
      name: 'sign' as const,
      keyNo: slotNumber,
      password,
      typedData: {
        domain: domain || {},
        types: haloTypes,
        value: primaryType === 'EIP712Domain' ? domain : message
      }
    };

    const result = await sign(params);
    return result.signature.ether as Hex;
  }

  const account = {
    address: fetchedAddress,
    signMessage,
    signTypedData,
    async signTransaction(transaction, { serializer } = {}) {
      const password = await promptForPassword();
      return signTransaction({ slotNumber, password, transaction, serializer });
    },
  };

  return toAccount(account)
}

type SlotAccountState = {
  account: Account | null;
  isConnecting: boolean;
  error: Error | null;
  isConnected: boolean;
};

export function useSlotAccount(slotNumber: number | null, address?: AddressString) {
    const [state, setState] = useState<SlotAccountState>({
    account: null,
    isConnecting: false,
    error: null,
    isConnected: false,
  });

  useEffect(() => {
    let mounted = true;

    async function connect() {
      if (!slotNumber) {
        setState(prev => ({
          ...prev,
          account: null,
          isConnected: false,
          isConnecting: false,
          error: null,
        }));
        return;
      }

      setState(prev => ({
        ...prev,
        isConnecting: true,
        error: null,
      }));

      try {
        const account = await slotNumberToAccount(slotNumber, address);

        if (mounted) {
          setState({
            account,
            isConnecting: false,
            error: null,
            isConnected: true,
          });
        }
      } catch (err) {
        if (mounted) {
          setState({
            account: null,
            isConnecting: false,
            error: err instanceof Error ? err : new Error('Failed to connect account'),
            isConnected: false,
          });
        }
      }
    }

    connect();

    return () => {
      mounted = false;
    };
  }, [slotNumber, address]);

  return state;
}

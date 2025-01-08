import type {
    Hex,
    Signature,
  TransactionSerializable,
  TransactionSerialized,
} from 'viem'
import {
  type Keccak256ErrorType,
  keccak256,
} from 'viem'
import type { GetTransactionType } from 'viem'
import {
  type SerializeTransactionFn,
  serializeTransaction,
} from 'viem'
import { sign } from '../commands'

export type ErrorType<name extends string = 'Error'> = Error & { name: name }

export type SignTransactionParameters<
  serializer extends
    SerializeTransactionFn<TransactionSerializable> = SerializeTransactionFn<TransactionSerializable>,
  transaction extends Parameters<serializer>[0] = Parameters<serializer>[0],
> = {
  slotNumber: number
  password?: string
  transaction: transaction
  serializer?: serializer | undefined
}

export type SignTransactionReturnType<
  serializer extends
    SerializeTransactionFn<TransactionSerializable> = SerializeTransactionFn<TransactionSerializable>,
  transaction extends Parameters<serializer>[0] = Parameters<serializer>[0],
> = TransactionSerialized<GetTransactionType<transaction>>

export type SignTransactionErrorType =
  | Keccak256ErrorType
  | ErrorType

export async function signTransaction<
  serializer extends
    SerializeTransactionFn<TransactionSerializable> = SerializeTransactionFn<TransactionSerializable>,
  transaction extends Parameters<serializer>[0] = Parameters<serializer>[0],
>(
  parameters: SignTransactionParameters<serializer, transaction>,
): Promise<SignTransactionReturnType<serializer, transaction>> {
  const {
    slotNumber,
    password,
    transaction,
    serializer = serializeTransaction,
  } = parameters

  const signableTransaction = (() => {
    // For EIP-4844 Transactions, we want to sign the transaction payload body (tx_payload_body) without the sidecars (ie. without the network wrapper).
    // See: https://github.com/ethereum/EIPs/blob/e00f4daa66bd56e2dbd5f1d36d09fd613811a48b/EIPS/eip-4844.md#networking
    if (transaction.type === 'eip4844')
      return {
        ...transaction,
        sidecars: false,
      }
    return transaction
  })()

  const { signature } = await sign({
    name: 'sign' as const,
    keyNo: slotNumber,
    password,
    digest: keccak256(serializer(signableTransaction)).slice(2),
  })

  const sig: Signature = {
    r: '0x' + signature.raw.r as Hex,
    s: '0x' + signature.raw.s as Hex,
    v: BigInt(signature.raw.v),
    yParity: signature.raw.v === 27 ? 0 : 1,
  }

  return serializer(transaction, sig) as SignTransactionReturnType<
    serializer,
    transaction
  >
}

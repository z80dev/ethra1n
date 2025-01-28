import { SlotsKeyInfo } from './components/SlotsKeyInfo';
import { useSlotAccount } from './account/burnerAccount.tsx';
import SlotSelector from './components/SlotSelector.tsx';
import { useState } from 'react';
import { createWalletClient, http, parseEther } from 'viem'
import { base, ink, Chain } from 'viem/chains'

function App() {
    const [selectedSlot, setSelectedSlot] = useState(0);
    const [recipient, setRecipient] = useState('');
    const [amount, setAmount] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isSending, setIsSending] = useState(false);
    const [network, setNetwork] = useState<Chain>(ink);

    const { account, isConnected } = useSlotAccount(selectedSlot);
    const address = isConnected ? account?.address : undefined;

    const client = createWalletClient({
        chain: network,
        transport: http()
    });

    const isValidAmount = () => {
        try {
            if (!amount) return false;
            parseEther(amount);
        } catch {
            return false;
        }
    };

    const handleSendTransaction = async () => {
        if (!account || !isValidAmount() || !recipient) return;

        setIsSending(true);
        setError(null);

        try {
            const hash = await client.sendTransaction({
                account,
                to: recipient as `0x${string}`,
                value: parseEther(amount),
                type: 'eip1559',
            });

            console.log('Transaction successful:', hash);
        } catch (err) {
            console.error('Transaction failed:', err);
            setError(err instanceof Error ? err.message : 'Failed to send transaction');
        } finally {
            setIsSending(false);
        }
    };

    const slots = isConnected
        ? [{ slotId: selectedSlot, address: address }]
        : (error ? [{ slotId: selectedSlot, address: JSON.stringify(error) }] : []);

    const switchToInk = () => {
        setNetwork(ink);
    }

    const switchToBase = () => {
        setNetwork(base);
    }

    return (
        <div className="p-4 max-w-md mx-auto">
            <SlotSelector
                selectedSlot={selectedSlot}
                onSelectSlot={setSelectedSlot}
            />

            <SlotsKeyInfo slots={slots} />

            <div className="mt-4 space-y-4">
                <div>
                    <h2 className="text-lg font-semibold">Send Transaction</h2>
                    <p className="text-sm text-gray-500">
                        Send ETH to another address
                    </p>
                    <p>
                        Network: {network.name}
                    </p>
                    <button
                        onClick={switchToInk}
                        disabled={network === ink}
                        className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
                    >
                        Switch to Ink
                    </button>
                    <button
                        onClick={switchToBase}
                        disabled={network === base}
                        className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
                    >
                        Switch to Base
                    </button>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Recipient Address
                    </label>
                    <input
                        type="text"
                        value={recipient}
                        onChange={(e) => setRecipient(e.target.value)}
                        className="w-full p-2 border rounded"
                        placeholder="0x..."
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Amount (ETH)
                    </label>
                    <input
                        type="text"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full p-2 border rounded"
                        placeholder="0.00"
                    />
                    {!isValidAmount() && amount && (
                        <p className="text-red-500 text-sm mt-1">Invalid ETH amount</p>
                    )}
                </div>

                <button
                    onClick={handleSendTransaction}
                    disabled={!isValidAmount() || !recipient || !account || isSending}
                    className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    {isSending ? 'Sending...' : 'Send Transaction'}
                </button>

                {error && (
                    <div className="text-red-500 text-sm mt-2">
                        Error: {error}
                    </div>
                )}

                {address && (
                    <div className="mt-4 p-3 bg-gray-100 rounded">
                        <p className="text-sm break-all">
                            Connected Address: {address}
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default App

import { SlotsKeyInfo } from './components/SlotsKeyInfo';
import { useSlotAccount } from './account/burnerAccount.tsx';
import SlotSelector from './components/SlotSelector.tsx';
import { useState } from 'react';
import { createWalletClient, http, parseEther } from 'viem'
import { base } from 'viem/chains'
import { useEffect } from 'react';

function App() {
    const [selectedSlot, setSelectedSlot] = useState(0);
    const { account, isConnected, error } = useSlotAccount(selectedSlot);
    const address = isConnected ? account?.address : undefined;
    const slots = isConnected
        ? [{ slotId: selectedSlot, address: address }]
        : (error ? [{ slotId: selectedSlot, address: JSON.stringify(error) }] : []);

    const client = createWalletClient({
        chain: base,
        transport: http()
    })

    useEffect(() => {
        if (!account) {
            return;
        }
        async function run() {
            console.log('Account:', account)
            const hash = await client.sendTransaction({
                // safe, we checked account is truthy
                account: account!,
                to: '0x07a145DbBc7e425d0F1B3B9982F955E97abad7a2',
                value: parseEther('0.0001'),
                type: 'eip1559',
            })

            console.log('Transaction signature:', hash)
        }

        run().catch(console.error);

    }, [account]);

    return (
        <div className="p-4">
            <SlotSelector
                selectedSlot={selectedSlot}
                onSelectSlot={setSelectedSlot}
            />
            <SlotsKeyInfo slots={slots} />

            <div className="mt-4">
                <p className="text-sm text-gray-600">
                    {address ?
                        `Connected Address: ${address}` :
                        'No address connected'
                    }
                </p>
            </div>

        </div>
    )
}

export default App

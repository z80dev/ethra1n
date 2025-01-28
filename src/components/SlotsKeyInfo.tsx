import { computeAddress } from 'ethers';

type SlotInfo = {
  slotId: number;
  publicKey?: string | null;
  address?: string | null;
};

type SlotsKeyInfoProps = {
  slots: SlotInfo[];
  onRefresh?: () => void;
};

export const SlotsKeyInfo = ({ slots, onRefresh }: SlotsKeyInfoProps) => {
  return (
    <div className="p-4 bg-white rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Key Slot Information</h2>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
          >
            Refresh
          </button>
        )}
      </div>

      <div className="space-y-6">
        {slots.map(({ slotId, publicKey, address: paramAddress }) => {
          const address = paramAddress ?? computeAddress('0x' + publicKey) ?? "N/A";

          return (
            <div
              key={slotId}
              className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
            >
              <h3 className="text-lg font-medium text-gray-800 mb-3">
                Slot {slotId}
              </h3>

              {address ? (
                <div className="space-y-2">
                  <div>
                    <div className="text-sm font-medium text-gray-500 mb-1">
                      Ethereum Address
                    </div>
                    <div className="font-mono text-sm text-gray-700 break-all">
                      {address}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-500">
                  No key in this slot
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SlotsKeyInfo;

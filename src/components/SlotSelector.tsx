const SlotSelector = ({ selectedSlot, onSelectSlot }) => {
  return (
    <div className="mb-4">
      <label htmlFor="slot-select" className="block text-sm font-medium text-gray-700 mb-2">
        Select Key Slot
      </label>
      <select
        id="slot-select"
        value={selectedSlot}
        onChange={(e) => onSelectSlot(Number(e.target.value))}
        className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <option value={0}>Select a slot...</option>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((slot) => (
          <option key={slot} value={slot}>
            Slot {slot}
          </option>
        ))}
      </select>
    </div>
  );
};

export default SlotSelector;

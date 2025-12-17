import React from 'react';

const ToggleSwitch = ({ id, checked, onChange, label }) => {
  return (
    <div className="flex items-center">
      <span className="mr-3 font-medium">{label}</span>
      <div 
        className={`w-14 h-7 flex items-center rounded-full p-1 cursor-pointer ${checked ? 'bg-green-500' : 'bg-gray-300'}`}
        onClick={() => onChange(!checked)}
      >
        <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform ${checked ? 'translate-x-7' : ''}`}></div>
      </div>
    </div>
  );
};

export default ToggleSwitch;
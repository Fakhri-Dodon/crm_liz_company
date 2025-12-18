import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

const Toast = ({ message, type = 'success', onClose }) => {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setVisible(false);
            if (onClose) onClose();
        }, 3000);

        return () => clearTimeout(timer);
    }, [onClose]);

    if (!visible) return null;

    const bgColor = type === 'success' ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200';
    const textColor = type === 'success' ? 'text-green-800' : 'text-red-800';
    const Icon = type === 'success' ? CheckCircle : XCircle;

    return (
        <div className="fixed top-6 right-6 z-50 animate-slide-in">
            <div className={`${bgColor} border rounded-lg shadow-lg p-4 min-w-[300px] max-w-md`}>
                <div className="flex items-start">
                    <Icon className={`w-5 h-5 ${textColor} mr-3 mt-0.5 flex-shrink-0`} />
                    <div className="flex-1">
                        <p className={`text-sm font-medium ${textColor}`}>{message}</p>
                    </div>
                    <button
                        onClick={() => {
                            setVisible(false);
                            if (onClose) onClose();
                        }}
                        className="ml-4 text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Toast;
const NotificationModal = ({ isOpen, onClose, type, title, message }) => {
  if (!isOpen) return null;

  const iconColors = {
    success: { bg: "bg-green-100", text: "text-green-600", icon: "✓" },
    error: { bg: "bg-red-100", text: "text-red-600", icon: "!" },
    warning: { bg: "bg-yellow-100", text: "text-yellow-600", icon: "⚠" },
    info: { bg: "bg-blue-100", text: "text-blue-600", icon: "i" }
  };

  const config = iconColors[type] || iconColors.info;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose}></div>
      
      <div className="flex min-h-full items-center justify-center p-4 text-center">
        <div className="relative transform overflow-hidden rounded-lg bg-white shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-md">
          <div className="bg-white px-6 py-5">
            <div className="flex items-center">
              <div className={`flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${config.bg}`}>
                <span className={`text-lg font-bold ${config.text}`}>{config.icon}</span>
              </div>
              
              <div className="ml-4 text-left">
                <h3 className="text-lg font-semibold text-gray-900">
                  {title}
                </h3>
                <div className="mt-1">
                  <p className="text-sm text-gray-500">{message}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex w-full justify-center rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;
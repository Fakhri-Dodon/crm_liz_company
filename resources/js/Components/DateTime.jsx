import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next"; // 1. Import hook

export default function DateTime() {
  const [now, setNow] = useState(new Date());
  const { i18n } = useTranslation(); // 2. Ambil i18n untuk cek bahasa aktif

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const currentLocale = i18n.language === 'id' ? 'id-ID' : 'en-US';

  return (
    <div className="text-sm text-black text-left">
      <p className="font-medium">
        {now.toLocaleDateString(currentLocale, {
          weekday: "long",
          day: "2-digit",
          month: "long",
          year: "numeric",
        })}
      </p>
      <p className="text-gray-600">
        {now.toLocaleTimeString(currentLocale, {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: i18n.language !== 'id',
        })}
      </p>
    </div>
  );
}
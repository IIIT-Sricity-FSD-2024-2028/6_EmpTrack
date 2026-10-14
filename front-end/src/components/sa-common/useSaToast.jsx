import { useCallback, useEffect, useState } from 'react';
import './toast.css';

/**
 * The original #toast-container (sa-common showToast): hidden until shown,
 * then visible for 3.5s.
 * const [toast, showToast] = useSaToast(); showToast('Saved'); showToast('Oops', 'error'); render {toast}
 */
export default function useSaToast() {
  const [current, setCurrent] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!current) return undefined;
    const timer = setTimeout(() => setVisible(false), 3500);
    return () => clearTimeout(timer);
  }, [current]);

  const showToast = useCallback((message, type = 'success') => {
    setCurrent({ message, type, id: Date.now() });
    setVisible(true);
  }, []);

  const toast = (
    <div id="toast-container" className={current ? `${current.type === 'error' ? 'error' : 'success'}${visible ? ' show' : ''}` : ''} role="status">
      {current?.message}
    </div>
  );
  return [toast, showToast];
}

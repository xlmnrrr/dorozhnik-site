if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      reg.update();
      setInterval(() => {
        if (navigator.onLine) reg.update().catch(() => {});
      }, 30 * 60 * 1000);
    } catch (e) {
      console.warn('SW:', e);
    }
  });
}
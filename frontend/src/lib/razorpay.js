/**
 * Razorpay Checkout Loader
 * Dynamically loads the Razorpay checkout script
 */

export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') { resolve(false); return; }
    if (window.Razorpay)              { resolve(true);  return; }

    const script    = document.createElement('script');
    script.src      = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async    = true;
    script.onload   = () => resolve(true);
    script.onerror  = () => resolve(false);
    document.body.appendChild(script);
  });
};

/**
 * Open Razorpay checkout modal
 */
export const openRazorpayCheckout = async (options) => {
  const loaded = await loadRazorpayScript();
  if (!loaded) throw new Error('Razorpay failed to load');
  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay({
      ...options,
      theme:  { color: '#3a52ff' },
      modal:  {
        ondismiss: () => reject(new Error('Payment cancelled')),
      },
      handler: (response) => resolve(response),
    });
    rzp.open();
  });
};

// LocalStorage based store for Standalone Android App

const getStore = (key: string, defaultValue: any) => {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const val = window.localStorage.getItem(key);
    if (val) {
      return JSON.parse(val);
    }
  } catch (err) {
    console.error("Storage get error:", err);
  }
  return defaultValue;
};

const setStore = (key: string, value: any) => {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.error("Storage set error:", err);
      throw err; // rethrow so calling code knows it failed
    }
  }
};

export const store = {
  getMenus: () => getStore('appcafe_menus', []),
  setMenus: (menus: any) => setStore('appcafe_menus', menus),
  
  getOrders: () => getStore('appcafe_orders', []),
  setOrders: (orders: any) => setStore('appcafe_orders', orders),
  
  getExpenses: () => getStore('appcafe_expenses', []),
  setExpenses: (expenses: any) => setStore('appcafe_expenses', expenses),
  
  getCafeSettings: () => getStore('appcafe_settings', {
    cafeName: 'Balkon Sisi Sawah',
    cafeSubtitle: 'Cafe & Resto',
    logoUrl: null,
    qrisUrl: null,
  }),
  setCafeSettings: (settings: any) => setStore('appcafe_settings', settings),

  getPrinterSettings: () => getStore('appcafe_printer', {
    printerName: null, // Bluetooth Mac Address or Name
    autoPrint: true
  }),
  setPrinterSettings: (settings: any) => setStore('appcafe_printer', settings),
};

export const getBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

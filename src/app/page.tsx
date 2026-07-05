"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { store } from "@/lib/store";

type Menu = {
  id: string;
  name: string;
  price: number;
  category: string;
  imageUrl?: string;
};

type CartItem = Menu & {
  quantity: number;
};

type CafeSettings = {
  cafeName: string;
  cafeSubtitle: string;
  logoUrl: string | null;
  qrisUrl: string | null;
};

export default function KioskPage() {
  const router = useRouter();
  const [menus, setMenus] = useState<Menu[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCheckout, setIsCheckout] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [printData, setPrintData] = useState<any>(null);
  const [cafeSettings, setCafeSettings] = useState<CafeSettings>({
    cafeName: 'Balkon Sisi Sawah',
    cafeSubtitle: 'Cafe & Resto',
    logoUrl: null,
    qrisUrl: null,
  });
  const [showQris, setShowQris] = useState(false);
  const [mobileTab, setMobileTab] = useState<'menu' | 'cart'>('menu');

  useEffect(() => {
    // Load from local store instead of API
    const localMenus = store.getMenus();
    if (localMenus) setMenus(localMenus);
    
    const localCafe = store.getCafeSettings();
    if (localCafe) setCafeSettings(localCafe);
    
    // Bersihkan data pesanan lama yang membengkak (berisi imageUrl base64)
    try {
      const existingOrders = store.getOrders();
      if (Array.isArray(existingOrders) && existingOrders.length > 0) {
        const cleanedOrders = existingOrders.slice(0, 200).map((order: any) => ({
          ...order,
          items: Array.isArray(order.items) ? order.items.map((item: any) => {
            const { imageUrl, ...rest } = item;
            return rest;
          }) : []
        }));
        store.setOrders(cleanedOrders);
      }
    } catch (e) {
      // Jika masih error quota, hapus semua pesanan lama
      console.error("Cleanup failed, clearing orders:", e);
      store.setOrders([]);
    }
  }, []);

  // Effect untuk otomatis trigger print saat printData tersedia
  useEffect(() => {
    if (printData) {
      const printReceipt = async () => {
        try {
          const { ThermalPrinter } = await import('@delicity/capacitor-thermal-printer');
          const printer = store.getPrinterSettings();
          if (printer && printer.printerName) {
            const pId = (printer as any).printerId || printer.printerName;
            await ThermalPrinter.connectPrinter({ printerId: pId, setAsDefault: true });
            
            const items: any[] = [
              { type: 'text', value: `${cafeSettings.cafeName}\n`, style: { align: 'center', bold: true } },
              { type: 'text', value: `${cafeSettings.cafeSubtitle}\n\n`, style: { align: 'center' } },
              { type: 'text', value: `Order: ${printData.id}\n` },
              { type: 'text', value: `Tgl: ${new Date(printData.date).toLocaleDateString()} ${printData.time}\n` },
              { type: 'text', value: `Pemesan: ${printData.customerName}\n` },
              { type: 'text', value: `Bayar: ${printData.paymentMethod}\n` },
              { type: 'text', value: `--------------------------------\n` },
            ];

            printData.items.forEach((item: any) => {
              items.push({ type: 'text', value: `${item.name}\n` });
              items.push({ type: 'text', value: `${item.quantity} x Rp ${item.price.toLocaleString('id-ID')} = Rp ${(item.quantity * item.price).toLocaleString('id-ID')}\n` });
            });

            items.push({ type: 'text', value: `--------------------------------\n` });
            items.push({ type: 'text', value: `Total: Rp ${printData.total.toLocaleString('id-ID')}\n`, style: { bold: true } });
            items.push({ type: 'text', value: `\nTerima Kasih!\n\n\n\n\n`, style: { align: 'center' } });
            items.push({ type: 'cut' });

            await ThermalPrinter.printText({ items });
          } else {
             console.log("No printer configured");
          }
        } catch (err: any) {
          console.error("Print failed:", err);
          alert("Gagal mencetak struk: " + (err.message || "Unknown error"));
        } finally {
          alert(`Pesanan berhasil! Nomor order: ${printData.id}`);
          setPrintData(null);
        }
      };
      printReceipt();
    }
  }, [printData]);

  // Fungsi tambah ke keranjang
  const addToCart = (menu: Menu) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === menu.id);
      if (existing) {
        return prev.map((item) =>
          item.id === menu.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...menu, quantity: 1 }];
    });
  };

  // Fungsi kurang dari keranjang
  const removeFromCart = (id: string) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === id);
      if (existing && existing.quantity > 1) {
        return prev.map((item) =>
          item.id === id ? { ...item, quantity: item.quantity - 1 } : item
        );
      }
      return prev.filter((item) => item.id !== id);
    });
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handlePayment = async (method: "CASH" | "QRIS") => {
    if (!customerName.trim()) {
      alert("Mohon masukkan nama pemesan terlebih dahulu!");
      return;
    }
    
    try {
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      // Strip imageUrl dari items agar tidak membebani localStorage
      const lightItems = cart.map(({ imageUrl, ...rest }) => ({
        name: rest.name,
        price: rest.price,
        quantity: rest.quantity,
        category: rest.category,
      }));
      
      const newOrder = {
        id: `#ORD-${Math.floor(Math.random()*1000)}`,
        customerName: customerName,
        total: total,
        paymentMethod: method,
        status: "Selesai",
        items: lightItems,
        time: timeStr,
        date: now.toISOString()
      };
      
      const prevOrders = store.getOrders();
      const safeOrders = Array.isArray(prevOrders) ? prevOrders : [];
      // Batasi maksimal 200 pesanan tersimpan agar localStorage tidak penuh
      const trimmedOrders = [newOrder, ...safeOrders].slice(0, 200);
      store.setOrders(trimmedOrders);
      
      // Simpan data untuk di-print
      setPrintData({
        id: newOrder.id,
        customerName,
        total,
        paymentMethod: method,
        items: [...cart],
        time: newOrder.time,
        date: newOrder.date
      });

      setCart([]);
      setIsCheckout(false);
      setCustomerName("");
      setMobileTab('menu'); // Go back to menu on mobile after order
    } catch (err: any) {
      console.error(err);
      alert(`Gagal memproses pesanan: ${err?.message || err}`);
    }
  };

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  return (
    <>
      <div className="kiosk-container">
        <header className="header">
          <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
            {cafeSettings.logoUrl && (
              <img src={cafeSettings.logoUrl} alt="Logo" style={{ width: "36px", height: "36px", borderRadius: "10px", objectFit: "cover" }} />
            )}
            <div>
              <h1>{cafeSettings.cafeName}</h1>
              <div style={{ fontSize: "0.7rem", color: "var(--color-text-secondary)", fontWeight: 400, marginTop: "1px", letterSpacing: "2px", textTransform: "uppercase" }}>{cafeSettings.cafeSubtitle}</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <div style={{ background: "var(--color-gold-dim)", color: "var(--color-gold)", padding: "0.35rem 1rem", borderRadius: "50px", fontSize: "0.8rem", fontWeight: 600, border: "1px solid rgba(201,169,110,0.2)" }}>☕ Kasir</div>
            <button
              onClick={() => router.push('/admin/login')}
              style={{
                width: "34px", height: "34px", borderRadius: "50%",
                background: "rgba(255,255,255,0.06)", border: "1px solid var(--color-border)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "var(--color-text-dim)", fontSize: "1.1rem",
                cursor: "pointer", transition: "all 0.2s",
                fontFamily: "'Outfit', sans-serif"
              }}
              title="Menu Admin"
            >
              ⚙️
            </button>
          </div>
        </header>

      <main className="main-content">
        {/* Bagian Menu */}
        <section className="menu-section" style={{ display: mobileTab === 'menu' ? undefined : undefined }}>
          <div className="menu-grid">
            {menus.map((menu) => (
              <div key={menu.id} className="menu-card" onClick={() => addToCart(menu)}>
                {menu.imageUrl ? (
                  <div style={{ height: "160px", width: "100%", backgroundImage: `url(${menu.imageUrl})`, backgroundSize: "cover", backgroundRepeat: "no-repeat", backgroundPosition: "center", backgroundColor: "#2A2A2C" }}></div>
                ) : (
                  <div className="menu-img-placeholder">
                    {menu.name.charAt(0)}
                  </div>
                )}
                <div className="menu-info">
                  <div className="menu-title">{menu.name}</div>
                  <div style={{ display: "inline-block", fontSize: "0.65rem", color: "var(--color-text-dim)", background: "rgba(255,255,255,0.05)", padding: "0.15rem 0.5rem", borderRadius: "50px", fontWeight: 500, marginTop: "0.2rem", letterSpacing: "0.5px", textTransform: "uppercase" }}>{menu.category}</div>
                  <div className="menu-price">Rp {menu.price.toLocaleString('id-ID')}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Bagian Keranjang */}
        <section className={`cart-section ${mobileTab === 'cart' ? 'cart-open' : ''}`}>
          <div className="cart-header">
            <span>Pesanan</span>
            <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
              {cartCount > 0 && <span style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--color-gold)", background: "var(--color-gold-dim)", padding: "0.25rem 0.7rem", borderRadius: "50px" }}>{cartCount} item</span>}
              {/* Close button for mobile */}
              <button
                className="cart-close-btn"
                onClick={() => setMobileTab('menu')}
                style={{ display: "none", background: "rgba(255,255,255,0.06)", border: "1px solid var(--color-border)", borderRadius: "50%", width: "32px", height: "32px", color: "var(--color-text-secondary)", cursor: "pointer", fontSize: "1.1rem", alignItems: "center", justifyContent: "center" }}
              >
                ✕
              </button>
            </div>
          </div>
          
          <div className="cart-items">
            {cart.length === 0 ? (
              <div style={{ textAlign: "center", color: "var(--color-text-dim)", marginTop: "3rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.6rem" }}>
                <div style={{ width: "60px", height: "60px", borderRadius: "50%", background: "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", border: "1px solid var(--color-border)" }}>🛒</div>
                <div style={{ fontSize: "0.9rem", fontWeight: 600, marginTop: "0.4rem", color: "var(--color-text-secondary)" }}>Belum ada pesanan</div>
                <div style={{ fontSize: "0.75rem", lineHeight: 1.6, maxWidth: "200px" }}>Sentuh menu untuk menambahkan pesanan</div>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="cart-item animate-fade-in">
                  <div className="cart-item-info">
                    <h4>{item.name}</h4>
                    <div className="cart-item-price">Rp {(item.price * item.quantity).toLocaleString('id-ID')}</div>
                  </div>
                  <div className="qty-controls">
                    <button className="btn-qty" onClick={() => removeFromCart(item.id)}>-</button>
                    <span style={{ fontWeight: 600, minWidth: "1.2rem", textAlign: "center" }}>{item.quantity}</span>
                    <button className="btn-qty" onClick={() => addToCart(item)}>+</button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="cart-footer">
            <div className="cart-total">
              <span>Total</span>
              <span>Rp {total.toLocaleString('id-ID')}</span>
            </div>
            <button 
              className="btn-checkout" 
              onClick={() => setIsCheckout(true)}
              disabled={cart.length === 0}
            >
              CHECKOUT
            </button>
          </div>
        </section>
      </main>

      {/* Mobile Tab Bar */}
      <div className="mobile-tab-bar">
        <button className={mobileTab === 'menu' ? 'active' : ''} onClick={() => setMobileTab('menu')}>
          <span className="tab-icon">🍽️</span>
          <span>Menu</span>
        </button>
        <button className={mobileTab === 'cart' ? 'active' : ''} onClick={() => setMobileTab('cart')}>
          <span className="tab-icon">🛒</span>
          <span>Keranjang</span>
          {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
        </button>
      </div>

      {/* Modal Checkout */}
      {isCheckout && (
        <div className="modal-overlay" onClick={() => { setIsCheckout(false); setShowQris(false); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            {!showQris ? (
              <>
                <h2 style={{ marginBottom: "0.5rem", fontSize: "1.3rem", fontWeight: 700, color: "var(--color-text-primary)" }}>Pembayaran</h2>
                <div style={{ fontSize: "0.8rem", color: "var(--color-text-dim)", marginBottom: "1.5rem" }}>Lengkapi data di bawah ini</div>
                
                <div style={{ marginBottom: "1.2rem", textAlign: "left" }}>
                  <label style={{ display: "block", marginBottom: "0.4rem", fontWeight: 600, fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>Nama Pemesan / Nomor Meja</label>
                  <input 
                    type="text" 
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Misal: Bpk. Budi (Meja 4)"
                    style={{ width: "100%", padding: "0.8rem 1rem", borderRadius: "12px", border: "1px solid var(--color-border-light)", fontSize: "1rem", fontFamily: "'Outfit', sans-serif", outline: "none", background: "rgba(255,255,255,0.04)", color: "var(--color-text-primary)" }}
                    required
                  />
                </div>

                <div style={{ background: "var(--color-gold-dim)", borderRadius: "12px", padding: "0.8rem 1.2rem", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", border: "1px solid rgba(201,169,110,0.15)" }}>
                  <span style={{ fontWeight: 500, color: "var(--color-text-secondary)", fontSize: "0.85rem" }}>Total Bayar</span>
                  <span style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--color-gold)" }}>Rp {total.toLocaleString('id-ID')}</span>
                </div>
                
                <div style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--color-text-dim)", textAlign: "left", marginBottom: "0.6rem", textTransform: "uppercase", letterSpacing: "1px" }}>Metode Pembayaran</div>
                <div className="payment-methods">
                  <button className="btn-payment" onClick={() => handlePayment("CASH")}>
                    <span style={{ fontSize: "1.8rem" }}>💵</span>
                    <span>Tunai</span>
                  </button>
                  <button className="btn-payment" onClick={() => {
                    if (!customerName.trim()) {
                      alert("Mohon masukkan nama pemesan terlebih dahulu!");
                      return;
                    }
                    if (cafeSettings.qrisUrl) {
                      setShowQris(true);
                    } else {
                      handlePayment("QRIS");
                    }
                  }}>
                    <span style={{ fontSize: "1.8rem" }}>📱</span>
                    <span>QRIS</span>
                  </button>
                </div>
                
                <button 
                  onClick={() => setIsCheckout(false)}
                  style={{ marginTop: "1.2rem", padding: "0.6rem 1.5rem", background: "rgba(255,255,255,0.05)", border: "1px solid var(--color-border-light)", borderRadius: "8px", color: "var(--color-text-dim)", cursor: "pointer", fontWeight: 600, fontFamily: "'Outfit', sans-serif", fontSize: "0.85rem" }}
                >
                  Batal
                </button>
              </>
            ) : (
              <>
                <h2 style={{ marginBottom: "0.5rem", fontSize: "1.3rem", fontWeight: 700, color: "var(--color-text-primary)" }}>Scan QRIS</h2>
                <div style={{ fontSize: "0.8rem", color: "var(--color-text-dim)", marginBottom: "1rem" }}>Scan kode QR di bawah untuk membayar</div>
                
                <div style={{ background: "white", borderRadius: "16px", padding: "1rem", display: "inline-block", marginBottom: "1rem" }}>
                  <img src={cafeSettings.qrisUrl!} alt="QRIS" style={{ width: "200px", height: "200px", objectFit: "contain" }} />
                </div>

                <div style={{ background: "var(--color-gold-dim)", borderRadius: "12px", padding: "0.7rem 1.2rem", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", border: "1px solid rgba(201,169,110,0.15)" }}>
                  <span style={{ fontWeight: 500, color: "var(--color-text-secondary)", fontSize: "0.8rem" }}>Total</span>
                  <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--color-gold)" }}>Rp {total.toLocaleString('id-ID')}</span>
                </div>

                <div style={{ display: "flex", gap: "0.6rem", justifyContent: "center", flexWrap: "wrap" }}>
                  <button 
                    onClick={() => { setShowQris(false); handlePayment("QRIS"); }}
                    style={{ padding: "0.8rem 1.5rem", background: "linear-gradient(135deg, var(--color-gold), var(--color-gold-light))", border: "none", borderRadius: "12px", color: "#111", cursor: "pointer", fontWeight: 700, fontFamily: "'Outfit', sans-serif", fontSize: "0.95rem", letterSpacing: "0.5px" }}
                  >
                    ✅ Sudah Dibayar
                  </button>
                  <button 
                    onClick={() => setShowQris(false)}
                    style={{ padding: "0.8rem 1.2rem", background: "rgba(255,255,255,0.05)", border: "1px solid var(--color-border-light)", borderRadius: "12px", color: "var(--color-text-dim)", cursor: "pointer", fontWeight: 600, fontFamily: "'Outfit', sans-serif", fontSize: "0.85rem" }}
                  >
                    Kembali
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      </div>

      {/* Komponen Struk Khusus Printer */}
      {printData && (
        <div className="printable-receipt">
          <div className="receipt-header">
            <h2>Balkon Sisi Sawah</h2>
            <p>Cafe & Resto</p>
          </div>
          
          <div className="receipt-info">
            <p>Order: <strong>{printData.id}</strong></p>
            <p>Tgl: {printData.date} {printData.time}</p>
            <p>Pemesan: {printData.customerName}</p>
            <p>Bayar: {printData.paymentMethod}</p>
          </div>

          <table className="receipt-table">
            <thead>
              <tr>
                <th>Item</th>
                <th style={{ textAlign: "right" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {printData.items.map((item: any) => (
                <tr key={item.id}>
                  <td>
                    {item.name}<br/>
                    {item.quantity} x {item.price.toLocaleString('id-ID')}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {(item.quantity * item.price).toLocaleString('id-ID')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="receipt-totals">
            <p>Total: <strong>Rp {printData.total.toLocaleString('id-ID')}</strong></p>
          </div>

          <div className="receipt-footer">
            <p>Terima Kasih Atas</p>
            <p>Kunjungan Anda!</p>
          </div>
        </div>
      )}
    </>
  );
}

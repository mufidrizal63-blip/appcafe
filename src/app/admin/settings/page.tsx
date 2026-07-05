"use client";

import { useState, useEffect, useRef } from "react";
import { store, getBase64 } from "@/lib/store";

type PrinterInfo = {
  name: string;
  status: string;
  port: string;
  id?: string;
};

type PrinterSettings = {
  printerName: string | null;
  autoPrint: boolean;
  updatedAt: string;
};

type CafeSettings = {
  cafeName: string;
  cafeSubtitle: string;
  logoUrl: string | null;
  qrisUrl: string | null;
};

export default function SettingsPage() {
  // Printer state
  const [printers, setPrinters] = useState<PrinterInfo[]>([]);
  const [activePrinter, setActivePrinter] = useState<PrinterSettings | null>(null);
  const [selectedPrinter, setSelectedPrinter] = useState<string>("");
  const [autoPrint, setAutoPrint] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  // Cafe state
  const [cafeName, setCafeName] = useState("Balkon Sisi Sawah");
  const [cafeSubtitle, setCafeSubtitle] = useState("Cafe & Resto");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [qrisUrl, setQrisUrl] = useState<string | null>(null);
  const [savingCafe, setSavingCafe] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingQris, setUploadingQris] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const qrisInputRef = useRef<HTMLInputElement>(null);

  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    fetchPrinters();
    fetchCafeSettings();
  }, []);

  const showMessage = (text: string, type: "success" | "error") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  // --- Printer Functions ---
  const fetchPrinters = async () => {
    setLoading(true);
    try {
      const { ThermalPrinter } = await import('@delicity/capacitor-thermal-printer');
      await ThermalPrinter.requestPermissions();
      const { printers } = await ThermalPrinter.discoverPrinters({ timeoutMs: 5000 });
      setPrinters(printers.map(p => ({ 
        name: p.name || p.id, 
        status: 'Ready', 
        port: p.adapter,
        id: p.id 
      })));
      
      const printer = store.getPrinterSettings();
      if (printer) {
        setActivePrinter(printer);
        setSelectedPrinter(printer.printerName || "");
        setAutoPrint(printer.autoPrint !== false);
      }
    } catch (err: any) {
      console.error(err);
      showMessage("Gagal memuat daftar printer: " + (err.message || "Unknown error"), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSavePrinter = async () => {
    if (!selectedPrinter) {
      showMessage("Pilih printer terlebih dahulu", "error");
      return;
    }
    setSaving(true);
    try {
      const selectedP = printers.find(p => p.name === selectedPrinter);
      const settings = { 
        printerName: selectedPrinter, 
        printerId: selectedP?.id || selectedPrinter,
        autoPrint 
      };
      store.setPrinterSettings(settings);
      setActivePrinter(settings as any);
      showMessage("Setting printer berhasil disimpan!", "success");
    } catch {
      showMessage("Gagal menyimpan setting", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleTestPrint = async () => {
    if (!activePrinter?.printerName) {
      showMessage("Simpan setting printer terlebih dahulu", "error");
      return;
    }
    setTesting(true);
    try {
      const { ThermalPrinter } = await import('@delicity/capacitor-thermal-printer');
      const pId = (activePrinter as any).printerId || activePrinter.printerName;
      await ThermalPrinter.connectPrinter({ printerId: pId, setAsDefault: true });
      await ThermalPrinter.printText({
        items: [
          { type: 'text', value: 'Balkon Sisi Sawah\n', style: { align: 'center', bold: true } },
          { type: 'text', value: 'Test Print Berhasil!\n\n\n\n\n', style: { align: 'center' } },
          { type: 'cut' },
        ],
      });
      showMessage("Test print berhasil dikirim ke printer!", "success");
    } catch (err: any) {
      console.error(err);
      alert("Error: " + (err.message || JSON.stringify(err)));
      showMessage("Gagal mengirim test print", "error");
    } finally {
      setTesting(false);
    }
  };

  // --- Cafe Functions ---
  const fetchCafeSettings = async () => {
    try {
      const settings = store.getCafeSettings();
      if (settings) {
        setCafeName(settings.cafeName || "Balkon Sisi Sawah");
        setCafeSubtitle(settings.cafeSubtitle || "Cafe & Resto");
        setLogoUrl(settings.logoUrl || null);
        setQrisUrl(settings.qrisUrl || null);
      }
    } catch {
      console.error("Gagal memuat cafe settings");
    }
  };

  const handleUploadImage = async (
    file: File,
    setUrl: (url: string) => void,
    setUploading: (v: boolean) => void
  ) => {
    setUploading(true);
    try {
      const base64 = await getBase64(file);
      setUrl(base64);
      showMessage("Gambar berhasil diupload!", "success");
    } catch (error: any) {
      alert("Upload error: " + error.message);
      showMessage("Gagal mengupload gambar", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleSaveCafe = async () => {
    setSavingCafe(true);
    try {
      store.setCafeSettings({ cafeName, cafeSubtitle, logoUrl, qrisUrl });
      showMessage("Pengaturan cafe berhasil disimpan!", "success");
    } catch {
      showMessage("Gagal menyimpan pengaturan", "error");
    } finally {
      setSavingCafe(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.8rem", color: "hsl(110, 50%, 40%)" }}>
          Pengaturan
        </h1>
        <p style={{ color: "#64748b", marginTop: "0.2rem" }}>
          Konfigurasi cafe, printer, dan pembayaran.
        </p>
      </div>

      {/* Notifikasi */}
      {message && (
        <div className={`settings-alert ${message.type}`}>
          <span>{message.type === "success" ? "✅" : "❌"}</span>
          {message.text}
        </div>
      )}

      <div className="settings-grid">

        {/* Card: Pengaturan Cafe */}
        <div className="settings-card">
          <div className="settings-card-header">
            <span className="settings-icon">🏪</span>
            <h2>Profil Cafe</h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
            {/* Logo */}
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.9rem" }}>Logo Cafe</label>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div
                  style={{
                    width: "80px", height: "80px", borderRadius: "16px",
                    border: "2px dashed #cbd5e1", display: "flex", alignItems: "center", justifyContent: "center",
                    overflow: "hidden", background: "#f8fafc", cursor: "pointer", flexShrink: 0
                  }}
                  onClick={() => logoInputRef.current?.click()}
                >
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <span style={{ fontSize: "2rem", opacity: 0.3 }}>🖼️</span>
                  )}
                </div>
                <div>
                  <button
                    className="btn-settings-secondary"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={uploadingLogo}
                    style={{ fontSize: "0.85rem", padding: "0.5rem 1rem" }}
                  >
                    {uploadingLogo ? "Mengupload..." : "Upload Logo"}
                  </button>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUploadImage(file, setLogoUrl, setUploadingLogo);
                      e.target.value = '';
                    }}
                  />
                  <p style={{ color: "#94a3b8", fontSize: "0.75rem", marginTop: "0.3rem" }}>PNG, JPG (maks 2MB)</p>
                </div>
              </div>
            </div>

            {/* Nama Cafe */}
            <div>
              <label style={{ display: "block", marginBottom: "0.4rem", fontWeight: 600, fontSize: "0.9rem" }}>Nama Cafe</label>
              <input
                type="text"
                value={cafeName}
                onChange={(e) => setCafeName(e.target.value)}
                placeholder="Nama Cafe"
                style={{
                  width: "100%", padding: "0.8rem 1rem", borderRadius: "8px",
                  border: "1px solid #e2e8f0", fontSize: "1rem", fontFamily: "'Outfit', sans-serif"
                }}
              />
            </div>

            {/* Subtitle */}
            <div>
              <label style={{ display: "block", marginBottom: "0.4rem", fontWeight: 600, fontSize: "0.9rem" }}>Subtitle</label>
              <input
                type="text"
                value={cafeSubtitle}
                onChange={(e) => setCafeSubtitle(e.target.value)}
                placeholder="Tagline / deskripsi singkat"
                style={{
                  width: "100%", padding: "0.8rem 1rem", borderRadius: "8px",
                  border: "1px solid #e2e8f0", fontSize: "1rem", fontFamily: "'Outfit', sans-serif"
                }}
              />
            </div>

            <button
              className="btn-settings-primary"
              onClick={handleSaveCafe}
              disabled={savingCafe}
              style={{ marginTop: "0.5rem" }}
            >
              {savingCafe ? "Menyimpan..." : "💾 Simpan Profil Cafe"}
            </button>
          </div>
        </div>

        {/* Card: QRIS */}
        <div className="settings-card">
          <div className="settings-card-header">
            <span className="settings-icon">📱</span>
            <h2>Kode QRIS</h2>
          </div>

          <p style={{ color: "#64748b", fontSize: "0.85rem", marginBottom: "1rem" }}>
            Upload kode QRIS Anda. Gambar ini akan ditampilkan saat pelanggan memilih pembayaran QRIS.
          </p>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
            <div
              style={{
                width: "220px", height: "220px", borderRadius: "16px",
                border: "2px dashed #cbd5e1", display: "flex", alignItems: "center", justifyContent: "center",
                overflow: "hidden", background: "#f8fafc", cursor: "pointer"
              }}
              onClick={() => qrisInputRef.current?.click()}
            >
              {qrisUrl ? (
                <img src={qrisUrl} alt="QRIS" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
              ) : (
                <div style={{ textAlign: "center", color: "#94a3b8" }}>
                  <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>📱</div>
                  <div style={{ fontSize: "0.85rem" }}>Klik untuk upload QRIS</div>
                </div>
              )}
            </div>

            <input
              ref={qrisInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUploadImage(file, setQrisUrl, setUploadingQris);
                e.target.value = '';
              }}
            />

            <div style={{ display: "flex", gap: "0.8rem" }}>
              <button
                className="btn-settings-secondary"
                onClick={() => qrisInputRef.current?.click()}
                disabled={uploadingQris}
              >
                {uploadingQris ? "Mengupload..." : "📤 Upload QRIS"}
              </button>
              {qrisUrl && (
                <button
                  className="btn-settings-secondary"
                  onClick={() => { setQrisUrl(null); showMessage("QRIS dihapus. Klik Simpan Profil untuk menyimpan perubahan.", "success"); }}
                  style={{ color: "#ef4444" }}
                >
                  🗑️ Hapus
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Card: Pilih Printer */}
        <div className="settings-card">
          <div className="settings-card-header">
            <span className="settings-icon">🖨️</span>
            <h2>Printer Aktif</h2>
          </div>

          {loading ? (
            <div className="settings-loading">
              <div className="spinner"></div>
              <span>Memuat daftar printer...</span>
            </div>
          ) : printers.length === 0 ? (
            <div className="settings-empty">
              <p>Tidak ada printer terdeteksi di sistem.</p>
              <button className="btn-settings-secondary" onClick={fetchPrinters}>
                Refresh
              </button>
            </div>
          ) : (
            <>
              <div className="printer-list">
                {printers.map((printer) => (
                  <label
                    key={printer.name}
                    className={`printer-option ${selectedPrinter === printer.name ? "selected" : ""}`}
                  >
                    <input
                      type="radio"
                      name="printer"
                      value={printer.name}
                      checked={selectedPrinter === printer.name}
                      onChange={(e) => setSelectedPrinter(e.target.value)}
                    />
                    <div className="printer-option-info">
                      <div className="printer-option-name">{printer.name}</div>
                      <div className="printer-option-detail">
                        Port: {printer.port} &bull;{" "}
                        <span
                          className={`printer-status-dot ${printer.status === "Normal" ? "online" : "offline"}`}
                        ></span>
                        {printer.status}
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              <div className="settings-toggle-row">
                <div>
                  <strong>Auto-Print Struk</strong>
                  <p style={{ color: "#64748b", fontSize: "0.85rem", marginTop: "0.2rem" }}>
                    Otomatis cetak struk setelah checkout
                  </p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={autoPrint}
                    onChange={(e) => setAutoPrint(e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="settings-actions">
                <button
                  className="btn-settings-primary"
                  onClick={handleSavePrinter}
                  disabled={saving || !selectedPrinter}
                >
                  {saving ? "Menyimpan..." : "💾 Simpan Setting"}
                </button>
                <button
                  className="btn-settings-secondary"
                  onClick={fetchPrinters}
                >
                  🔄 Refresh Printer
                </button>
              </div>
            </>
          )}
        </div>

        {/* Card: Status & Test Print */}
        <div className="settings-card">
          <div className="settings-card-header">
            <span className="settings-icon">📋</span>
            <h2>Status & Test Print</h2>
          </div>

          <div className="status-info-grid">
            <div className="status-row">
              <span className="status-label">Printer Terpilih</span>
              <span className="status-value">
                {activePrinter?.printerName || (
                  <span style={{ color: "#ef4444" }}>Belum diatur</span>
                )}
              </span>
            </div>
            <div className="status-row">
              <span className="status-label">Auto-Print</span>
              <span className="status-value">
                {activePrinter ? (
                  activePrinter.autoPrint ? (
                    <span style={{ color: "hsl(110, 50%, 40%)" }}>✅ Aktif</span>
                  ) : (
                    <span style={{ color: "#f59e0b" }}>⏸️ Nonaktif</span>
                  )
                ) : (
                  <span style={{ color: "#94a3b8" }}>-</span>
                )}
              </span>
            </div>
          </div>

          <div style={{ marginTop: "1.5rem" }}>
            <button
              className="btn-test-print"
              onClick={handleTestPrint}
              disabled={testing || !activePrinter?.printerName}
            >
              {testing ? (
                <>
                  <div className="spinner small"></div> Mencetak...
                </>
              ) : (
                "🖨️ Test Print"
              )}
            </button>
            <p style={{ color: "#64748b", fontSize: "0.8rem", marginTop: "0.8rem", textAlign: "center" }}>
              Pastikan printer menyala dan terhubung via Bluetooth
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

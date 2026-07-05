"use client";

import { useState } from "react";
import { Package, Plus, AlertTriangle, CheckCircle, Pencil, Trash2 } from "lucide-react";

type Stock = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  minQuantity: number;
};

const initialStocks: Stock[] = [
  { id: "1", name: "Beras Pandan Wangi", quantity: 2.5, unit: "Kg", minQuantity: 5.0 },
  { id: "2", name: "Ayam Potong", quantity: 12, unit: "Ekor", minQuantity: 5 },
  { id: "3", name: "Minyak Goreng", quantity: 1.5, unit: "Liter", minQuantity: 2.0 },
  { id: "4", name: "Gula Aren", quantity: 5, unit: "Kg", minQuantity: 2.0 },
];

export default function StockPage() {
  const [stocks, setStocks] = useState<Stock[]>(initialStocks);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  const [newStock, setNewStock] = useState<Stock>({ id: "", name: "", quantity: 0, unit: "Kg", minQuantity: 0 });
  const [editingStock, setEditingStock] = useState<Stock>({ id: "", name: "", quantity: 0, unit: "Kg", minQuantity: 0 });

  const handleAddStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStock.name) return;
    
    setStocks([...stocks, { ...newStock, id: Date.now().toString() }]);
    setIsModalOpen(false);
    setNewStock({ id: "", name: "", quantity: 0, unit: "Kg", minQuantity: 0 });
  };

  const handleUpdateStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStock.name) return;

    setStocks(stocks.map(s => s.id === editingStock.id ? editingStock : s));
    setIsEditModalOpen(false);
  };

  const handleDeleteStock = (id: string) => {
    if (!confirm("Hapus item stok ini?")) return;
    setStocks(stocks.filter(s => s.id !== id));
  };

  const getStockStatus = (qty: number, minQty: number) => {
    if (qty <= minQty / 2) return { label: "Kritis", bg: "#fee2e2", color: "#b91c1c", icon: <AlertTriangle size={14} /> };
    if (qty <= minQty) return { label: "Hampir Habis", bg: "#fef3c7", color: "#92400e", icon: <AlertTriangle size={14} /> };
    return { label: "Aman", bg: "#dcfce7", color: "#166534", icon: <CheckCircle size={14} /> };
  };

  const getProgressPercent = (qty: number, minQty: number) => {
    const maxDisplay = minQty * 3;
    return Math.min(100, (qty / maxDisplay) * 100);
  };

  const getProgressColor = (qty: number, minQty: number) => {
    if (qty <= minQty / 2) return "#ef4444";
    if (qty <= minQty) return "#f59e0b";
    return "var(--admin-primary)";
  };

  const criticalCount = stocks.filter(s => s.quantity <= s.minQuantity).length;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.8rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", color: "var(--admin-text)", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem", margin: 0 }}>
            <Package size={24} color="var(--admin-primary)" /> Stok Bahan Baku
          </h1>
          <p style={{ color: "#64748b", marginTop: "0.3rem", fontSize: "0.85rem" }}>{stocks.length} item terdaftar</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          style={{ padding: "0.7rem 1.2rem", borderRadius: "10px", background: "var(--admin-primary)", color: "white", border: "none", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.9rem" }}
        >
          <Plus size={18} /> Tambah Stok
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem", marginBottom: "1.5rem" }}>
        <div style={{ background: criticalCount > 0 ? "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)" : "var(--admin-card)", borderRadius: "14px", padding: "1.2rem", border: criticalCount > 0 ? "none" : "1px solid var(--admin-border)", boxShadow: "var(--shadow-md)" }}>
          <div style={{ fontSize: "0.8rem", fontWeight: 500, color: criticalCount > 0 ? "rgba(255,255,255,0.8)" : "#64748b", display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <AlertTriangle size={14} /> Stok Rendah
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: 700, color: criticalCount > 0 ? "white" : "var(--admin-text)", marginTop: "0.4rem" }}>{criticalCount} Item</div>
        </div>
        <div style={{ background: "var(--admin-card)", borderRadius: "14px", padding: "1.2rem", border: "1px solid var(--admin-border)", boxShadow: "var(--shadow-md)" }}>
          <div style={{ fontSize: "0.8rem", fontWeight: 500, color: "#64748b", display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <Package size={14} /> Total Item
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--admin-text)", marginTop: "0.4rem" }}>{stocks.length} Item</div>
        </div>
      </div>

      {/* Card-based Stock List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
        {stocks.length === 0 ? (
          <div style={{ background: "var(--admin-card)", borderRadius: "16px", padding: "3rem 1.5rem", textAlign: "center", border: "1px solid var(--admin-border)", boxShadow: "var(--shadow-md)" }}>
            <Package size={48} color="#cbd5e1" style={{ marginBottom: "1rem" }} />
            <p style={{ color: "#64748b", fontSize: "0.95rem" }}>Belum ada data stok. Tambahkan item pertama!</p>
          </div>
        ) : (
          stocks.map((stock) => {
            const status = getStockStatus(stock.quantity, stock.minQuantity);
            const progress = getProgressPercent(stock.quantity, stock.minQuantity);
            const progressColor = getProgressColor(stock.quantity, stock.minQuantity);
            return (
              <div key={stock.id} style={{ background: "var(--admin-card)", borderRadius: "14px", padding: "1.1rem", border: "1px solid var(--admin-border)", boxShadow: "var(--shadow-sm)" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.8rem" }}>
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 600, fontSize: "0.95rem", color: "var(--admin-text)" }}>{stock.name}</span>
                      <span style={{ fontSize: "0.7rem", padding: "0.1rem 0.5rem", borderRadius: "50px", background: status.bg, color: status.color, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "0.2rem" }}>
                        {status.icon} {status.label}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "0.3rem", marginTop: "0.5rem" }}>
                      <span style={{ fontSize: "1.3rem", fontWeight: 700, color: progressColor }}>{stock.quantity}</span>
                      <span style={{ fontSize: "0.85rem", color: "#64748b" }}>{stock.unit}</span>
                      <span style={{ fontSize: "0.75rem", color: "#94a3b8", marginLeft: "0.3rem" }}>/ min. {stock.minQuantity} {stock.unit}</span>
                    </div>
                    {/* Progress Bar */}
                    <div style={{ marginTop: "0.5rem", width: "100%", height: "6px", borderRadius: "3px", background: "#f1f5f9" }}>
                      <div style={{ width: `${progress}%`, height: "100%", borderRadius: "3px", background: progressColor, transition: "width 0.3s ease" }} />
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: "0.4rem", flexShrink: 0 }}>
                    <button onClick={() => { setEditingStock(stock); setIsEditModalOpen(true); }} style={{ width: "36px", height: "36px", borderRadius: "10px", border: "1px solid var(--admin-border)", background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => handleDeleteStock(stock.id)} style={{ width: "36px", height: "36px", borderRadius: "10px", border: "1px solid #fecaca", background: "#fef2f2", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#dc2626" }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Tambah Stok */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ textAlign: "left", maxWidth: "500px" }}>
            <h2 style={{ marginBottom: "1.5rem", fontSize: "1.2rem", fontWeight: 700 }}>Tambah Stok Baru</h2>
            <form onSubmit={handleAddStock} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.85rem", color: "#475569" }}>Nama Bahan</label>
                <input 
                  type="text" 
                  value={newStock.name}
                  onChange={(e) => setNewStock({...newStock, name: e.target.value})}
                  placeholder="Misal: Tomat"
                  style={{ width: "100%", padding: "0.8rem 1rem", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.95rem", outline: "none" }}
                  required
                />
              </div>
              <div style={{ display: "flex", gap: "0.8rem" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.85rem", color: "#475569" }}>Jumlah Awal</label>
                  <input 
                    type="number" 
                    step="0.1"
                    value={newStock.quantity || ""}
                    onChange={(e) => setNewStock({...newStock, quantity: parseFloat(e.target.value) || 0})}
                    placeholder="0"
                    style={{ width: "100%", padding: "0.8rem 1rem", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.95rem", outline: "none" }}
                    required
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.85rem", color: "#475569" }}>Satuan</label>
                  <select 
                    value={newStock.unit}
                    onChange={(e) => setNewStock({...newStock, unit: e.target.value})}
                    style={{ width: "100%", padding: "0.8rem 1rem", borderRadius: "10px", border: "1px solid #cbd5e1", background: "white", fontSize: "0.95rem", outline: "none" }}
                  >
                    <option value="Kg">Kg</option>
                    <option value="Liter">Liter</option>
                    <option value="Ekor">Ekor</option>
                    <option value="Pcs">Pcs</option>
                    <option value="Ikat">Ikat</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.85rem", color: "#475569" }}>Batas Peringatan Minimum</label>
                <input 
                  type="number" 
                  step="0.1"
                  value={newStock.minQuantity || ""}
                  onChange={(e) => setNewStock({...newStock, minQuantity: parseFloat(e.target.value) || 0})}
                  placeholder="0"
                  style={{ width: "100%", padding: "0.8rem 1rem", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.95rem", outline: "none" }}
                  required
                />
              </div>
              <div style={{ display: "flex", gap: "0.8rem", marginTop: "1rem" }}>
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  style={{ flex: 1, padding: "0.8rem", borderRadius: "10px", border: "1px solid #cbd5e1", background: "white", cursor: "pointer", fontWeight: 600, fontSize: "0.9rem" }}
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  style={{ flex: 1, padding: "0.8rem", borderRadius: "10px", border: "none", background: "var(--admin-primary)", color: "white", cursor: "pointer", fontWeight: 600, fontSize: "0.9rem" }}
                >
                  Simpan Stok
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Update Stok */}
      {isEditModalOpen && (
        <div className="modal-overlay" onClick={() => setIsEditModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ textAlign: "left", maxWidth: "500px" }}>
            <h2 style={{ marginBottom: "1.5rem", fontSize: "1.2rem", fontWeight: 700 }}>Update Stok Bahan</h2>
            <form onSubmit={handleUpdateStock} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.85rem", color: "#475569" }}>Nama Bahan</label>
                <input 
                  type="text" 
                  value={editingStock.name}
                  onChange={(e) => setEditingStock({...editingStock, name: e.target.value})}
                  style={{ width: "100%", padding: "0.8rem 1rem", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.95rem", outline: "none" }}
                  required
                />
              </div>
              <div style={{ display: "flex", gap: "0.8rem" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.85rem", color: "#475569" }}>Sisa Stok Saat Ini</label>
                  <input 
                    type="number" 
                    step="0.1"
                    value={editingStock.quantity || ""}
                    onChange={(e) => setEditingStock({...editingStock, quantity: parseFloat(e.target.value) || 0})}
                    style={{ width: "100%", padding: "0.8rem 1rem", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.95rem", outline: "none" }}
                    required
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.85rem", color: "#475569" }}>Satuan</label>
                  <select 
                    value={editingStock.unit}
                    onChange={(e) => setEditingStock({...editingStock, unit: e.target.value})}
                    style={{ width: "100%", padding: "0.8rem 1rem", borderRadius: "10px", border: "1px solid #cbd5e1", background: "white", fontSize: "0.95rem", outline: "none" }}
                  >
                    <option value="Kg">Kg</option>
                    <option value="Liter">Liter</option>
                    <option value="Ekor">Ekor</option>
                    <option value="Pcs">Pcs</option>
                    <option value="Ikat">Ikat</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.85rem", color: "#475569" }}>Batas Peringatan Minimum</label>
                <input 
                  type="number" 
                  step="0.1"
                  value={editingStock.minQuantity || ""}
                  onChange={(e) => setEditingStock({...editingStock, minQuantity: parseFloat(e.target.value) || 0})}
                  style={{ width: "100%", padding: "0.8rem 1rem", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.95rem", outline: "none" }}
                  required
                />
              </div>
              <div style={{ display: "flex", gap: "0.8rem", marginTop: "1rem" }}>
                <button 
                  type="button" 
                  onClick={() => setIsEditModalOpen(false)}
                  style={{ flex: 1, padding: "0.8rem", borderRadius: "10px", border: "1px solid #cbd5e1", background: "white", cursor: "pointer", fontWeight: 600, fontSize: "0.9rem" }}
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  style={{ flex: 1, padding: "0.8rem", borderRadius: "10px", border: "none", background: "#3b82f6", color: "white", cursor: "pointer", fontWeight: 600, fontSize: "0.9rem" }}
                >
                  Update Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

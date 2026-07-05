"use client";

import { useState, useEffect } from "react";
import { store } from "@/lib/store";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { Wallet, TrendingUp, TrendingDown, DollarSign, Plus, RefreshCcw, Download, ArrowUpCircle, ArrowDownCircle } from "lucide-react";

type Order = {
  id: string;
  time: string;
  total: number;
  paymentMethod: string;
  status: string;
  date: string;
};

export default function FinancePage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [totalSales, setTotalSales] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ desc: "", amount: 0 });

  const fetchData = () => {
    try {
      const localOrders = store.getOrders();
      if (localOrders) {
        setOrders(localOrders);
        const sales = localOrders.reduce((sum: number, order: Order) => sum + order.total, 0);
        setTotalSales(sales);
      }
      
      const localExpenses = store.getExpenses() || [];
      setExpenses(localExpenses);
      const exp = localExpenses.reduce((sum: number, e: any) => sum + e.amount, 0);
      setTotalExpense(exp);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseForm.desc || expenseForm.amount <= 0) return;
    
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const newExpense = {
      id: `#EXP-${Math.floor(Math.random()*1000)}`,
      desc: expenseForm.desc,
      amount: expenseForm.amount,
      time: timeStr,
      date: now.toISOString()
    };
    
    const prevExpenses = Array.isArray(expenses) ? expenses : [];
    const updatedExpenses = [newExpense, ...prevExpenses];
    store.setExpenses(updatedExpenses);
    
    setIsExpenseModalOpen(false);
    setExpenseForm({ desc: "", amount: 0 });
    fetchData();
  };

  const handleDownload = async () => {
    try {
      let csv = "Tanggal,Keterangan,Tipe,Jumlah\n";
      const allTx = [...orders, ...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      allTx.forEach(tx => {
        const dateStr = new Date(tx.date).toLocaleDateString('id-ID');
        const isExpense = !!tx.desc;
        const tipe = isExpense ? "Pengeluaran" : "Pemasukan";
        const keterangan = isExpense ? tx.desc : `Pesanan ${tx.id || '-'}`;
        const jumlah = isExpense ? tx.amount : tx.total;
        csv += `${dateStr} ${tx.time},"${keterangan}",${tipe},${jumlah}\n`;
      });
      csv += `\nTotal Pemasukan,,,${totalSales}\n`;
      csv += `Total Pengeluaran,,,${totalExpense}\n`;
      csv += `Saldo Bersih,,,${totalSales - totalExpense}\n`;
      
      const fileName = `Laporan_Keuangan_${new Date().getTime()}.csv`;
      
      const result = await Filesystem.writeFile({
        path: fileName,
        data: csv,
        directory: Directory.Cache,
        encoding: Encoding.UTF8
      });
      
      await Share.share({
        title: 'Laporan Keuangan',
        text: 'Laporan Keuangan Balkon Sisi Sawah',
        url: result.uri,
        dialogTitle: 'Simpan atau Bagikan Laporan'
      });
    } catch (err) {
      console.error("Download Error", err);
      alert("Gagal mendownload laporan. Pastikan aplikasi memiliki izin penyimpanan.");
    }
  };

  const netProfit = totalSales - totalExpense;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.8rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", color: "var(--admin-text)", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem", margin: 0 }}>
            <Wallet size={24} color="var(--admin-primary)" /> Laporan Keuangan
          </h1>
          <p style={{ color: "#64748b", marginTop: "0.3rem", fontSize: "0.85rem" }}>Ringkasan pendapatan & pengeluaran</p>
        </div>
        <button
          onClick={() => setIsExpenseModalOpen(true)}
          style={{ padding: "0.7rem 1.2rem", borderRadius: "10px", background: "var(--admin-primary)", color: "white", border: "none", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.9rem" }}
        >
          <Plus size={18} /> Catat Pengeluaran
        </button>
      </div>
      
      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.8rem", marginBottom: "1.5rem" }}>
        <div className="stat-card gradient-green">
          <h3><TrendingUp size={16} /> Pemasukan</h3>
          <div className="value" style={{ fontSize: "1.3rem" }}>Rp {totalSales.toLocaleString('id-ID')}</div>
        </div>
        <div style={{ background: "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)", borderRadius: "14px", padding: "1.2rem", color: "white", boxShadow: "var(--shadow-md)" }}>
          <div style={{ fontSize: "0.8rem", fontWeight: 500, opacity: 0.8, display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <TrendingDown size={16} /> Pengeluaran
          </div>
          <div style={{ fontSize: "1.3rem", fontWeight: 700, marginTop: "0.5rem" }}>Rp {totalExpense.toLocaleString('id-ID')}</div>
        </div>
        <div className="stat-card gradient-blue">
          <h3><DollarSign size={16} /> Saldo Bersih</h3>
          <div className="value" style={{ fontSize: "1.3rem" }}>Rp {netProfit.toLocaleString('id-ID')}</div>
        </div>
      </div>

      {/* Transaction List */}
      <div style={{ background: "var(--admin-card)", borderRadius: "16px", border: "1px solid var(--admin-border)", boxShadow: "var(--shadow-md)", overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.2rem 1.2rem 0.8rem", flexWrap: "wrap", gap: "0.5rem" }}>
          <h2 style={{ fontSize: "1.1rem", margin: 0 }}>Riwayat Transaksi</h2>
          <div style={{ display: "flex", gap: "0.4rem" }}>
            <button 
              onClick={handleDownload}
              style={{ padding: "0.4rem 0.8rem", border: "1px solid var(--admin-border)", borderRadius: "8px", background: "white", cursor: "pointer", color: "var(--admin-primary)", fontWeight: 500, fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "0.3rem" }}
            >
              <Download size={14} /> CSV
            </button>
            <button 
              onClick={() => fetchData()}
              style={{ padding: "0.4rem 0.8rem", border: "1px solid var(--admin-border)", borderRadius: "8px", background: "white", cursor: "pointer", color: "var(--admin-primary)", fontWeight: 500, fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "0.3rem" }}
            >
              <RefreshCcw size={14} /> Refresh
            </button>
          </div>
        </div>
        
        {orders.length === 0 && expenses.length === 0 ? (
          <div style={{ padding: "3rem 1.5rem", textAlign: "center", color: "#64748b" }}>
            <Wallet size={48} color="#cbd5e1" style={{ marginBottom: "1rem" }} />
            <p>Belum ada transaksi hari ini.</p>
          </div>
        ) : (
          <div style={{ padding: "0 0.8rem 0.8rem" }}>
            {[...orders, ...expenses]
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((tx: any, idx: number) => {
                const isExpense = !!tx.desc;
                const now = new Date(tx.date || new Date());
                const day = now.getDate().toString().padStart(2, '0');
                const month = (now.getMonth() + 1).toString().padStart(2, '0');
                const dateStr = `${day}/${month}`;
                
                return (
                  <div key={tx.id || idx} style={{ display: "flex", alignItems: "center", gap: "0.8rem", padding: "0.8rem 0.4rem", borderBottom: "1px solid #f1f5f9" }}>
                    {/* Icon */}
                    <div style={{ width: "38px", height: "38px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: isExpense ? "#fef2f2" : "#ecfdf5" }}>
                      {isExpense ? <ArrowDownCircle size={20} color="#ef4444" /> : <ArrowUpCircle size={20} color="#10b981" />}
                    </div>
                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--admin-text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {isExpense ? tx.desc : `Pesanan ${tx.id || '-'}`}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "0.1rem" }}>
                        {dateStr} • {tx.time || '-'} {!isExpense && tx.paymentMethod ? `• ${tx.paymentMethod}` : ''}
                      </div>
                    </div>
                    {/* Amount */}
                    <div style={{ fontWeight: 700, fontSize: "0.9rem", color: isExpense ? "#ef4444" : "#10b981", flexShrink: 0 }}>
                      {isExpense ? '-' : '+'}Rp {(tx.total || tx.amount || 0).toLocaleString('id-ID')}
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Expense Modal */}
      {isExpenseModalOpen && (
        <div className="modal-overlay" onClick={() => setIsExpenseModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ textAlign: "left", maxWidth: "400px" }}>
            <h2 style={{ marginBottom: "1.5rem", fontSize: "1.2rem", fontWeight: 700 }}>Catat Pengeluaran</h2>
            <form onSubmit={handleAddExpense} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.85rem", color: "#475569" }}>Keterangan</label>
                <input 
                  type="text" 
                  value={expenseForm.desc}
                  onChange={(e) => setExpenseForm({...expenseForm, desc: e.target.value})}
                  placeholder="Contoh: Beli gula 2kg"
                  style={{ width: "100%", padding: "0.8rem 1rem", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.95rem", outline: "none" }}
                  required
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.85rem", color: "#475569" }}>Jumlah (Rp)</label>
                <input 
                  type="number" 
                  value={expenseForm.amount || ""}
                  onChange={(e) => setExpenseForm({...expenseForm, amount: parseInt(e.target.value) || 0})}
                  placeholder="0"
                  style={{ width: "100%", padding: "0.8rem 1rem", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.95rem", outline: "none" }}
                  required
                />
              </div>
              <div style={{ display: "flex", gap: "0.8rem", marginTop: "1rem" }}>
                <button 
                  type="button" 
                  onClick={() => setIsExpenseModalOpen(false)}
                  style={{ flex: 1, padding: "0.8rem", borderRadius: "10px", border: "1px solid #cbd5e1", background: "white", cursor: "pointer", fontWeight: 600, fontSize: "0.9rem" }}
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  style={{ flex: 1, padding: "0.8rem", borderRadius: "10px", border: "none", background: "var(--admin-primary)", color: "white", cursor: "pointer", fontWeight: 600, fontSize: "0.9rem" }}
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";

import { store } from "@/lib/store";
import { TrendingUp, ShoppingBag, Star, RefreshCcw, Activity } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

type Order = {
  id: string;
  time: string;
  customerName?: string;
  total: number;
  paymentMethod: string;
  status: string;
  items: any[];
};

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [totalSales, setTotalSales] = useState(0);
  const [chartData, setChartData] = useState<any[]>([]);

  const fetchOrders = () => {
    try {
      const localOrders = store.getOrders();
      if (localOrders) {
        setOrders(localOrders);
        const sales = localOrders.reduce((sum: number, order: Order) => sum + order.total, 0);
        setTotalSales(sales);
        
        // Generate chart data (grouped by hour for today's orders)
        const hourlyData: Record<string, number> = {};
        // Initialize hours from 08:00 to 22:00
        for (let i = 8; i <= 22; i++) {
            hourlyData[`${i.toString().padStart(2, '0')}:00`] = 0;
        }
        
        localOrders.forEach((order: Order) => {
            if (order.time) {
                const hour = order.time.split(':')[0] + ":00";
                if (hourlyData[hour] !== undefined) {
                    hourlyData[hour] += order.total;
                } else {
                    hourlyData[hour] = order.total;
                }
            }
        });
        
        const cData = Object.keys(hourlyData).map(time => ({
            time,
            sales: hourlyData[time]
        }));
        
        setChartData(cData);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "1.8rem", color: "var(--admin-text)", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Activity size={28} color="var(--admin-primary)" /> Dashboard Overview
          </h1>
          <p style={{ color: "#64748b", marginTop: "0.2rem" }}>Ringkasan performa bisnis Anda hari ini.</p>
        </div>
      </div>
      
      <div className="dashboard-grid">
        <div className="stat-card gradient-green">
          <h3><TrendingUp size={18} /> Total Penjualan</h3>
          <div className="value">Rp {totalSales.toLocaleString('id-ID')}</div>
          <p style={{ fontSize: "0.85rem", marginTop: "0.5rem" }}>Pendapatan kotor hari ini</p>
        </div>
        <div className="stat-card gradient-blue">
          <h3><ShoppingBag size={18} /> Pesanan Selesai</h3>
          <div className="value">{orders.length}</div>
          <p style={{ fontSize: "0.85rem", marginTop: "0.5rem" }}>Total transaksi sukses</p>
        </div>
        <div className="stat-card gradient-orange">
          <h3><Star size={18} /> Menu Terlaris</h3>
          <div className="value" style={{ fontSize: "1.2rem", marginTop: "0.8rem" }}>Berdasarkan Laporan</div>
          <p style={{ fontSize: "0.85rem", marginTop: "0.5rem" }}>Cek halaman keuangan</p>
        </div>
      </div>

      <div className="chart-container">
        <div className="chart-header">
            <h2>Grafik Penjualan Hari Ini</h2>
        </div>
        <div style={{ height: "300px", width: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--admin-primary)" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="var(--admin-primary)" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(value) => `Rp${value/1000}k`} />
                    <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-md)' }}
                        formatter={(value: any) => [`Rp ${Number(value).toLocaleString('id-ID')}`, 'Penjualan']}
                        labelStyle={{ color: '#64748b', marginBottom: '4px' }}
                    />
                    <Area type="monotone" dataKey="sales" stroke="var(--admin-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                </AreaChart>
            </ResponsiveContainer>
        </div>
      </div>

      <div style={{ background: "var(--admin-card)", padding: "1.5rem", borderRadius: "16px", border: "1px solid var(--admin-border)", marginTop: "2rem", boxShadow: "var(--shadow-md)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.2rem", margin: 0 }}>Pesanan Terbaru</h2>
          <button 
            onClick={() => fetchOrders()}
            style={{ padding: "0.5rem 1rem", border: "1px solid var(--admin-border)", borderRadius: "8px", background: "white", cursor: "pointer", color: "var(--admin-primary)", fontWeight: 500, display: "flex", alignItems: "center", gap: "0.4rem", transition: "all 0.2s" }}
            onMouseOver={(e) => e.currentTarget.style.background = "#f8fafc"}
            onMouseOut={(e) => e.currentTarget.style.background = "white"}
          >
            <RefreshCcw size={16} /> Refresh
          </button>
        </div>
        
        {orders.length === 0 ? (
          <div style={{ padding: "3rem 2rem", textAlign: "center", color: "#64748b", background: "#f8fafc", borderRadius: "8px" }}>
            <ShoppingBag size={48} opacity={0.2} style={{ marginBottom: "1rem" }} />
            <br />
            Belum ada pesanan hari ini.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID Pesanan</th>
                  <th>Waktu</th>
                  <th>Pelanggan</th>
                  <th>Total Harga</th>
                  <th>Pembayaran</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice().reverse().map((order) => (
                  <tr key={order.id}>
                    <td style={{ fontWeight: 600, color: "var(--admin-primary)" }}>{order.id}</td>
                    <td>{order.time}</td>
                    <td>{order.customerName || "-"}</td>
                    <td style={{ fontWeight: 600 }}>Rp {order.total.toLocaleString('id-ID')}</td>
                    <td>
                      <span className="status-badge" style={{ background: order.paymentMethod === 'QRIS' ? "#e0f2fe" : "#f1f5f9", color: order.paymentMethod === 'QRIS' ? "#0369a1" : "#475569" }}>
                        {order.paymentMethod}
                      </span>
                    </td>
                    <td><span className="status-badge status-success">{order.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

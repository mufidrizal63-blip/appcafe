"use client";

import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, UtensilsCrossed, Wallet, Package, Settings, ArrowLeft } from "lucide-react";
import "./admin.css";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/admin/login";

  if (isLoginPage) {
    return <>{children}</>;
  }

  const navItems = [
    { href: "/admin", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
    { href: "/admin/menu", label: "Menu", icon: <UtensilsCrossed size={18} /> },
    { href: "/admin/finance", label: "Keuangan", icon: <Wallet size={18} /> },
    { href: "/admin/stock", label: "Stok Bahan", icon: <Package size={18} /> },
    { href: "/admin/settings", label: "Pengaturan", icon: <Settings size={18} /> },
  ];

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-logo">
          <h2>Balkon Admin</h2>
        </div>
        <nav className="admin-nav">
          {navItems.map((item) => (
            <button
              key={item.href}
              className={`nav-item ${pathname === item.href ? 'nav-active' : ''}`}
              onClick={() => router.push(item.href)}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
          <button
            className="nav-item nav-back"
            onClick={() => router.push('/')}
          >
            <ArrowLeft size={18} />
            <span>Kembali</span>
          </button>
        </nav>
      </aside>
      <main className="admin-content">
        {children}
      </main>
    </div>
  );
}

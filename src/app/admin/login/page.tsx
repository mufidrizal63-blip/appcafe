"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "admin123") {
      // Set cookie untuk autentikasi (berlaku 1 hari)
      document.cookie = "admin_auth=true; path=/; max-age=86400";
      router.push("/admin");
    } else {
      setError(true);
      setPassword("");
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", backgroundColor: "#f8fafc" }}>
      <div style={{ background: "white", padding: "3rem", borderRadius: "16px", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)", width: "100%", maxWidth: "400px", textAlign: "center" }}>
        <h1 style={{ color: "hsl(110, 50%, 40%)", marginBottom: "0.5rem" }}>Balkon Sisi Sawah</h1>
        <h2 style={{ fontSize: "1.2rem", color: "#64748b", marginBottom: "2rem" }}>Login Kasir / Admin</h2>
        
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div>
            <input 
              type="password" 
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(false);
              }}
              placeholder="Masukkan Password"
              style={{ 
                width: "100%", 
                padding: "1rem", 
                borderRadius: "8px", 
                border: error ? "2px solid #ef4444" : "1px solid #cbd5e1",
                fontSize: "1rem",
                textAlign: "center",
                outline: "none"
              }}
              autoFocus
            />
            {error && <p style={{ color: "#ef4444", fontSize: "0.85rem", marginTop: "0.5rem" }}>Password salah, silakan coba lagi.</p>}
          </div>
          
          <button 
            type="submit" 
            style={{ 
              width: "100%", 
              padding: "1rem", 
              borderRadius: "8px", 
              border: "none", 
              background: "hsl(110, 50%, 40%)", 
              color: "white", 
              fontSize: "1rem", 
              fontWeight: 600, 
              cursor: "pointer",
              transition: "background 0.2s"
            }}
          >
            Masuk
          </button>
        </form>
      </div>
    </div>
  );
}

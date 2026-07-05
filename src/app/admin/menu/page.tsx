"use client";

import { useState, useEffect, useRef } from "react";
import { store, getBase64 } from "@/lib/store";
import { Plus, Pencil, Trash2, Image, UtensilsCrossed } from "lucide-react";

type Menu = {
  id: string;
  name: string;
  price: number;
  category: string;
  imageUrl?: string;
};

export default function MenuManagementPage() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState<Menu>({ id: "", name: "", price: 0, category: "Makanan" });
  const [uploading, setUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMenus = async () => {
    try {
      const menus = store.getMenus();
      setMenus(menus);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMenus();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const base64 = await getBase64(file);
      setFormData({ ...formData, imageUrl: base64 });
    } catch (err) {
      alert("Gagal mengupload gambar");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || formData.price <= 0) return;

    try {
      let currentMenus = store.getMenus();
      if (isEditMode) {
        currentMenus = currentMenus.map((m: Menu) => m.id === formData.id ? formData : m);
      } else {
        const newMenu = { ...formData, id: Date.now().toString() };
        currentMenus.push(newMenu);
      }
      store.setMenus(currentMenus);
      setIsModalOpen(false);
      fetchMenus();
    } catch (err) {
      alert("Gagal menyimpan menu");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus menu ini?")) return;
    try {
      const currentMenus = store.getMenus();
      store.setMenus(currentMenus.filter((m: Menu) => m.id !== id));
      fetchMenus();
    } catch (err) {
      alert("Gagal menghapus menu");
    }
  };

  const openAddModal = () => {
    setFormData({ id: "", name: "", price: 0, category: "Makanan", imageUrl: "" });
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const openEditModal = (menu: Menu) => {
    setFormData(menu);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const getCategoryColor = (cat: string) => {
    switch(cat) {
      case "Makanan": return { bg: "#dcfce7", color: "#166534" };
      case "Minuman": return { bg: "#dbeafe", color: "#1e40af" };
      case "Snack": return { bg: "#fef3c7", color: "#92400e" };
      default: return { bg: "#f3f4f6", color: "#4b5563" };
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.8rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", color: "var(--admin-text)", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem", margin: 0 }}>
            <UtensilsCrossed size={24} color="var(--admin-primary)" /> Manajemen Menu
          </h1>
          <p style={{ color: "#64748b", marginTop: "0.3rem", fontSize: "0.85rem" }}>{menus.length} menu terdaftar</p>
        </div>
        <button 
          onClick={openAddModal}
          style={{ padding: "0.7rem 1.2rem", borderRadius: "10px", background: "var(--admin-primary)", color: "white", border: "none", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.9rem" }}
        >
          <Plus size={18} /> Tambah Menu
        </button>
      </div>

      {/* Card-based Menu List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
        {menus.length === 0 ? (
          <div style={{ background: "var(--admin-card)", borderRadius: "16px", padding: "3rem 1.5rem", textAlign: "center", border: "1px solid var(--admin-border)", boxShadow: "var(--shadow-md)" }}>
            <UtensilsCrossed size={48} color="#cbd5e1" style={{ marginBottom: "1rem" }} />
            <p style={{ color: "#64748b", fontSize: "0.95rem" }}>Belum ada menu. Tambahkan menu pertama Anda!</p>
          </div>
        ) : (
          menus.map((menu) => {
            const catColor = getCategoryColor(menu.category);
            return (
              <div key={menu.id} style={{ background: "var(--admin-card)", borderRadius: "14px", padding: "1rem", border: "1px solid var(--admin-border)", boxShadow: "var(--shadow-sm)", display: "flex", alignItems: "center", gap: "1rem", transition: "box-shadow 0.2s" }}>
                {/* Thumbnail */}
                {menu.imageUrl ? (
                  <img src={menu.imageUrl} alt={menu.name} style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "12px", flexShrink: 0 }} />
                ) : (
                  <div style={{ width: "60px", height: "60px", background: "#f1f5f9", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", flexShrink: 0 }}>
                    <Image size={24} />
                  </div>
                )}

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: "0.95rem", color: "var(--admin-text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{menu.name}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.3rem", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "0.75rem", padding: "0.15rem 0.5rem", borderRadius: "50px", background: catColor.bg, color: catColor.color, fontWeight: 500 }}>{menu.category}</span>
                    <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--admin-primary)" }}>Rp {menu.price.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: "0.4rem", flexShrink: 0 }}>
                  <button onClick={() => openEditModal(menu)} style={{ width: "36px", height: "36px", borderRadius: "10px", border: "1px solid var(--admin-border)", background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>
                    <Pencil size={16} />
                  </button>
                  <button onClick={() => handleDelete(menu.id)} style={{ width: "36px", height: "36px", borderRadius: "10px", border: "1px solid #fecaca", background: "#fef2f2", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#dc2626" }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ textAlign: "left", maxWidth: "500px" }}>
            <h2 style={{ marginBottom: "1.5rem", fontSize: "1.2rem", fontWeight: 700 }}>{isEditMode ? "Edit Menu" : "Tambah Menu Baru"}</h2>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              
              {/* Image Upload Area */}
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.85rem", color: "#475569" }}>Foto Menu</label>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  {formData.imageUrl ? (
                    <img src={formData.imageUrl} alt="Preview" style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "12px", border: "1px solid var(--admin-border)" }} />
                  ) : (
                    <div style={{ width: "80px", height: "80px", background: "#f8fafc", borderRadius: "12px", border: "2px dashed #cbd5e1", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>
                      <Image size={28} />
                    </div>
                  )}
                  
                  <div>
                    <input 
                      type="file" 
                      accept="image/*" 
                      ref={fileInputRef} 
                      onChange={handleImageUpload} 
                      style={{ display: "none" }} 
                    />
                    <button 
                      type="button" 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      style={{ padding: "0.5rem 1rem", border: "1px solid var(--admin-border)", borderRadius: "8px", background: "white", cursor: uploading ? "wait" : "pointer", fontSize: "0.85rem", fontWeight: 500 }}
                    >
                      {uploading ? "Mengupload..." : "Pilih Gambar"}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.85rem", color: "#475569" }}>Nama Menu</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Misal: Nasi Goreng Spesial"
                  style={{ width: "100%", padding: "0.8rem 1rem", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.95rem", outline: "none" }}
                  required
                />
              </div>
              <div style={{ display: "flex", gap: "0.8rem" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.85rem", color: "#475569" }}>Harga (Rp)</label>
                  <input 
                    type="number" 
                    value={formData.price || ""}
                    onChange={(e) => setFormData({...formData, price: parseInt(e.target.value) || 0})}
                    placeholder="0"
                    style={{ width: "100%", padding: "0.8rem 1rem", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.95rem", outline: "none" }}
                    required
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.85rem", color: "#475569" }}>Kategori</label>
                  <select 
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    style={{ width: "100%", padding: "0.8rem 1rem", borderRadius: "10px", border: "1px solid #cbd5e1", background: "white", fontSize: "0.95rem", outline: "none" }}
                  >
                    <option value="Makanan">Makanan</option>
                    <option value="Minuman">Minuman</option>
                    <option value="Snack">Snack</option>
                  </select>
                </div>
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
                  disabled={uploading}
                  style={{ flex: 1, padding: "0.8rem", borderRadius: "10px", border: "none", background: "var(--admin-primary)", color: "white", cursor: uploading ? "wait" : "pointer", fontWeight: 600, fontSize: "0.9rem" }}
                >
                  Simpan Menu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

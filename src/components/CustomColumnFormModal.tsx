"use client";

import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";

interface CustomColumn {
  id: string;
  name: string;
  key: string;
  type: string;
  options: string[] | null;
  required: boolean;
  order: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  editingColumn: CustomColumn | null;
  onSuccess: () => void;
  orderDefault: number;
}

export default function CustomColumnFormModal({ isOpen, onClose, editingColumn, onSuccess, orderDefault }: Props) {
  const [formData, setFormData] = useState({
    name: "",
    key: "",
    type: "text",
    options: "",
    required: false,
    order: orderDefault,
  });
  
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (editingColumn) {
        setFormData({
          name: editingColumn.name,
          key: editingColumn.key,
          type: editingColumn.type,
          options: Array.isArray(editingColumn.options) ? editingColumn.options.join(", ") : "",
          required: editingColumn.required,
          order: editingColumn.order,
        });
      } else {
        setFormData({
          name: "",
          key: "",
          type: "text",
          options: "",
          required: false,
          order: orderDefault,
        });
      }
    }
  }, [isOpen, editingColumn, orderDefault]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    
    if (name === "name" && !editingColumn) {
       const autoKey = value.replace(/[\s_\-]/g, '').toLowerCase();
       setFormData(prev => ({ ...prev, name: value, key: autoKey }));
    } else {
       setFormData((prev) => ({ ...prev, [name]: val }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.key) {
      alert("Nama Label dan Unique Key wajib diisi!");
      return;
    }

    setIsSaving(true);
    try {
      const payload: any = {
        ...formData,
        key: formData.key.replace(/[\s_\-]/g, '').toLowerCase(),
        order: Number(formData.order) || 0,
      };

      if (formData.type === "select" && formData.options) {
        payload.options = formData.options.split(",").map((s: string) => s.trim()).filter(Boolean);
      } else {
        payload.options = null;
      }

      let url = "/api/custom-columns";
      let method = "POST";

      if (editingColumn) {
        url = `/api/custom-columns/${editingColumn.id}`;
        method = "PUT";
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Gagal menyimpan kolom");

      onSuccess();
      onClose();
    } catch (error) {
      alert("Terjadi kesalahan saat menyimpan");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full animate-in fade-in zoom-in-95 duration-200 border border-gray-100 overflow-hidden">
         <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-900">{editingColumn ? 'Edit Kolom' : 'Tambah Kolom Baru'}</h3>
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18}/></button>
         </div>
         
         <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Nama/Label Kolom UI</label>
              <input 
                type="text" 
                name="name" 
                value={formData.name} 
                onChange={handleChange}
                placeholder="Contoh: Lokasi Detail"
                className="block w-full rounded-xl border-gray-300 bg-gray-50 focus:bg-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border transition-colors outline-none text-gray-900 placeholder:text-gray-400" 
              />
            </div>

            <div>
               <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Database Key <span className="text-gray-400 lowercase">(tanpa spasi/unik)</span></label>
               <input 
                  type="text" 
                  name="key" 
                  value={formData.key} 
                  onChange={handleChange}
                  disabled={!!editingColumn}
                  placeholder="lokasidetail"
                  className="block w-full rounded-xl border-gray-300 bg-gray-100 focus:bg-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border disabled:text-gray-500 transition-colors outline-none font-mono text-sm text-gray-900 placeholder:text-gray-400" 
               />
            </div>

            <div className="grid grid-cols-1">
               <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Tipe Data</label>
                  <select 
                     name="type" 
                     value={formData.type} 
                     onChange={handleChange}
                     className="block w-full rounded-xl border-gray-300 bg-gray-50 focus:bg-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border transition-colors outline-none cursor-pointer text-gray-900"
                  >
                     <option value="text">Teks Pendek</option>
                     <option value="number">Angka</option>
                     <option value="date">Tanggal</option>
                     <option value="boolean">Ya/Tidak (Checkbox)</option>
                     <option value="select">Dropdown Pilihan</option>
                  </select>
               </div>
               <div className="hidden">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Urutan (Order UI)</label>
                  <input 
                     type="number" 
                     name="order" 
                     value={formData.order} 
                     onChange={handleChange}
                     className="hidden" 
                  />
               </div>
            </div>

            {formData.type === "select" && (
              <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Daftar Pilihan</label>
                  <input 
                     type="text" 
                     name="options" 
                     value={formData.options} 
                     onChange={handleChange}
                     placeholder="Ex: Pilihan A, Pilihan B"
                     className="block w-full rounded-xl border-gray-300 bg-gray-50 focus:bg-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border outline-none text-gray-900 placeholder:text-gray-400" 
                  />
                  <p className="text-[11px] text-indigo-500 font-medium mt-1">Pisahkan tiap opsi dengan tanda koma (,)</p>
              </div>
            )}

            <div className="flex items-center mt-2 p-3 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer" onClick={() => setFormData(p => ({...p, required: !p.required}))}>
               <input
                  id="required"
                  name="required"
                  type="checkbox"
                  checked={formData.required}
                  readOnly
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
               />
               <label htmlFor="required" className="ml-3 block text-sm font-semibold text-gray-800 cursor-pointer select-none">
                  Wajib Diisi (Required)
               </label>
            </div>

            <div className="mt-8 flex justify-end gap-3 pt-2">
               <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 focus:outline-none transition-colors shadow-sm cursor-pointer"
               >
                  Batal
               </button>
               <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 border border-transparent rounded-xl shadow-sm shadow-indigo-600/30 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
               >
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : "Simpan"}
               </button>
            </div>
         </form>
      </div>
    </div>
  );
}

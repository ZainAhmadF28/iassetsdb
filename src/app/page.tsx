"use client";

import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { format } from "date-fns";
import {
  Menu, Search, Home, Maximize, LogOut,
  Edit, Trash2, X, DownloadCloud, Loader2, AlertTriangle
} from "lucide-react";


interface Asset {
  id: string;
  nomorAset: string;
  namaAset: string;
  kodeKelas: string | null;
  kelasAsetSmbr: string | null;
  kategoriSig: string | null;
  kondisi: string;
  qty: number;
  satuan: string | null;
  site: string | null;
  latitude: number | null;
  longitude: number | null;
  tanggalUpdate: string | null;
  keterangan: string | null;
  fotoUrl: string | null;
  qrCodeUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function Dashboard() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalRecord, setTotalRecord] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{isOpen: boolean; id: string; nama: string}>({ isOpen: false, id: "", nama: "" });
  const [isDeleting, setIsDeleting] = useState(false);
  
  // EDIT STATE
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editAsset, setEditAsset] = useState<Partial<Asset>>({});
  const [isSaving, setIsSaving] = useState(false);

  const fetchAssets = async (currentPage: number, currentSearch: string, isNewSearch: boolean) => {
    try {
      if (isNewSearch) setLoading(true);
      else setFetchingMore(true);

      const { data } = await axios.get(`/api/assets?page=${currentPage}&limit=50&search=${currentSearch}`);

      if (isNewSearch) {
        setAssets(data.data);
      } else {
        setAssets(prev => [...prev, ...data.data]);
      }
      setHasMore(data.hasMore);
      setTotalRecord(data.total);
    } catch (error) {
      console.error("Gagal load data", error);
    } finally {
      setLoading(false);
      setFetchingMore(false);
    }
  };

  // Efek berjalan setiap pencarian berubah (debounce 500ms agar server tidak berat)
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchAssets(1, search, true);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Efek berjalan khusus jika Halaman bertambah dari Infinite Scroll
  useEffect(() => {
    if (page > 1) {
      fetchAssets(page, search, false);
    }
  }, [page]);

  // Fungsi Deteksi Scroll mentok bawah
  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 200) {
      if (hasMore && !loading && !fetchingMore) {
        setPage(prev => prev + 1);
      }
    }
  };

  // Fitur Export Excel — memanggil API server-side (ExcelJS, styled, QR code)
  const handleExportExcel = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const response = await axios.get(`/api/export?search=${encodeURIComponent(search)}`, {
        responseType: "blob",
      });
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Data_Aset_${format(new Date(), "yyyyMMdd")}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Gagal export", error);
    } finally {
      setIsExporting(false);
    }
  };

  // Fungsi pembantu untuk membuat URL file nembak ke Backend API
  const getFileUrl = (url: string | null) => {
    if (!url) return undefined;
    if (url.startsWith("http")) return url;
    // Ganti base URL ini sesuai dengan URL dan port backend API Anda (tempat file /uploads/... berada)
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://10.143.172.190:3000";
    return `${backendUrl}${url}`;
  };

  const getKondisiBadge = (kondisi: string) => {
    switch (kondisi) {
      case "BAIK": return <span className="px-2 py-1 text-xs font-bold bg-green-100 text-green-700 rounded">Baik</span>;
      case "RUSAK": return <span className="px-2 py-1 text-xs font-bold bg-orange-100 text-orange-700 rounded">Rusak</span>;
      case "RUSAK_BERAT": return <span className="px-2 py-1 text-xs font-bold bg-red-100 text-red-700 rounded">Rusak Berat</span>;
      case "HILANG": return <span className="px-2 py-1 text-xs font-bold bg-gray-200 text-gray-700 rounded">Hilang</span>;
      default: return <span className="px-2 py-1 text-xs font-bold bg-gray-100 text-gray-500 rounded">Blm Dicek</span>;
    }
  };

  const handleDelete = (id: string, nama: string) => {
    setDeleteConfirm({ isOpen: true, id, nama });
  };

  const executeDelete = async () => {
    const { id } = deleteConfirm;
    setIsDeleting(true);
    try {
      await axios.delete(`/api/assets/${id}`);
      setAssets((prev) => prev.filter((asset) => asset.id !== id));
      setTotalRecord((prev) => prev - 1);
      setDeleteConfirm({ isOpen: false, id: "", nama: "" });
    } catch (error) {
      console.error("Gagal menghapus data", error);
      alert("Gagal menghapus aset. Silakan coba lagi.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = (id: string) => {
    const assetToEdit = assets.find(a => a.id === id);
    if (!assetToEdit) return;
    setEditAsset({ ...assetToEdit });
    setEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editAsset.id) return;
    setIsSaving(true);
    try {
      const response = await axios.put(`/api/assets/${editAsset.id}`, {
        namaAset: editAsset.namaAset,
        kondisi: editAsset.kondisi,
        qty: editAsset.qty,
        satuan: editAsset.satuan,
        site: editAsset.site,
        keterangan: editAsset.keterangan,
      });
      // Update local state without re-fetching
      setAssets(prev => prev.map(a => a.id === editAsset.id ? { ...a, ...response.data.data } : a));
      setEditModalOpen(false);
    } catch (error) {
      console.error("Gagal update data", error);
      alert("Gagal update aset. Silakan coba lagi.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-slate-50 font-sans text-sm flex flex-col transition-colors duration-300">
      {/* HEADER */}
      <header className="mx-4 mt-4 bg-white/70 backdrop-blur-lg border border-gray-200/60 p-4 shrink-0 rounded-2xl shadow-sm flex items-center justify-between z-10 transition-all duration-300">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsSidebarOpen(true)} 
            className="p-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl transition-all duration-300 hover:shadow-md hover:scale-105 active:scale-95"
          >
            <Menu size={20} />
          </button>
          <div>
            <h1 className="font-bold text-xl text-gray-800 tracking-tight flex items-center gap-2">
              Admin Panel <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] uppercase rounded-full tracking-widest font-bold">Aset</span>
            </h1>
            <p className="text-xs text-gray-500 mt-0.5 font-medium">PT. SEMEN BATURAJA TBK</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 mr-4 text-xs font-semibold text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            {totalRecord} Data Ditemukan
          </div>
        </div>
      </header>

      {/* SEARCH BAR (MODERN) */}
      <div className="px-4 py-4 shrink-0 z-10 w-full max-w-2xl mx-auto transition-all duration-300">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="text-gray-400 group-focus-within:text-green-500 transition-colors duration-300" size={18} />
          </div>
          <input
            type="text"
            placeholder="Cari nama atau nomor aset..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white border border-gray-200/80 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 shadow-sm transition-all duration-300 hover:shadow-md"
          />
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <main
        className="px-4 pb-4 overflow-y-auto overflow-x-auto flex-1 relative custom-scrollbar"
        onScroll={handleScroll}
      >
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 min-w-max w-full overflow-hidden transition-all duration-300">
          <table className="w-full whitespace-nowrap text-left border-collapse min-w-full">
            <thead className="sticky top-0 z-10 backdrop-blur-md bg-white/90">
              <tr className="text-gray-500 text-[11px] font-bold uppercase tracking-wider border-b border-gray-100">
                <th className="p-4 pl-6">ID</th>
                <th className="p-4">Nomor Aset</th>
                <th className="p-4">Nama Aset</th>
                <th className="p-4">Kode Kelas</th>
                <th className="p-4">Kelas SMBR</th>
                <th className="p-4">Kategori SIG</th>
                <th className="p-4">Kondisi</th>
                <th className="p-4">Qty</th>
                <th className="p-4">Satuan</th>
                <th className="p-4">Site</th>
                <th className="p-4">Latitude</th>
                <th className="p-4">Longitude</th>
                <th className="p-4">Tgl Update</th>
                <th className="p-4">Keterangan</th>
                <th className="p-4 text-center">Foto</th>
                <th className="p-4 text-center">QR Code</th>
                <th className="p-4 text-center pr-6">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-gray-600 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={17} className="p-12 text-center">
                    <div className="flex flex-col items-center gap-3 text-gray-400">
                      <Loader2 className="animate-spin text-green-500" size={32} />
                      <span className="font-medium animate-pulse">Memuat data aset...</span>
                    </div>
                  </td>
                </tr>
              ) : assets.length === 0 ? (
                <tr>
                  <td colSpan={17} className="p-12 text-center text-gray-400 flex-col items-center justify-center">
                    <Search className="mx-auto text-gray-300 mb-3" size={48} />
                    <span className="font-medium">Tidak ada data aset ditemukan</span>
                  </td>
                </tr>
              ) : (
                assets.map((asset, idx) => (
                  <tr 
                    key={asset.id} 
                    className="hover:bg-green-50/50 border-b border-gray-50/50 transition-all duration-200 group"
                  >
                    <td className="p-4 pl-6 text-gray-500 font-mono text-[11px] truncate max-w-[100px]" title={asset.id}>{asset.id}</td>
                    <td className="p-4 font-semibold text-gray-800">{asset.nomorAset}</td>
                    <td className="p-4 text-gray-700 font-medium">{asset.namaAset}</td>
                    <td className="p-4 text-gray-500">{asset.kodeKelas || '-'}</td>
                    <td className="p-4 text-gray-500">{asset.kelasAsetSmbr || '-'}</td>
                    <td className="p-4"><span className="text-[10px] font-bold text-green-700 bg-green-100/50 px-2 py-1 rounded-md uppercase">{asset.kategoriSig || 'PERLENGKAPAN'}</span></td>
                    <td className="p-4">{getKondisiBadge(asset.kondisi)}</td>
                    <td className="p-4 font-bold text-gray-700">{asset.qty}</td>
                    <td className="p-4 text-gray-500">{asset.satuan || '-'}</td>
                    <td className="p-4 text-gray-500">{asset.site || '-'}</td>
                    <td className="p-4 text-gray-500">{asset.latitude || '-'}</td>
                    <td className="p-4 text-gray-500">{asset.longitude || '-'}</td>
                    <td className="p-4 text-gray-500">{asset.tanggalUpdate ? format(new Date(asset.tanggalUpdate), "dd/MM/yy, HH.mm") : '-'}</td>
                    <td className="p-4 truncate max-w-[150px] text-gray-500" title={asset.keterangan || ""}>{asset.keterangan || '-'}</td>
                    
                    {/* Kolom Foto */}
                    <td className="p-4 text-center">
                      {asset.fotoUrl ? (
                        <button
                          onClick={() => setZoomedImage(getFileUrl(asset.fotoUrl) as string)}
                          title="Lihat Foto"
                          className="flex justify-center w-full focus:outline-none"
                        >
                          <img
                            src={getFileUrl(asset.fotoUrl)}
                            alt="Foto Aset"
                            className="w-10 h-10 object-cover rounded-xl shadow-sm border border-gray-100 mx-auto hover:scale-125 hover:shadow-lg transition-all duration-300 cursor-pointer opacity-90 group-hover:opacity-100"
                            onError={(e) => { 
                              (e.target as HTMLImageElement).style.display = 'none';
                              (e.target as HTMLImageElement).parentElement!.innerText = 'Error'; 
                            }}
                          />
                        </button>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                    
                    {/* Kolom QR Code */}
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => setZoomedImage(`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${asset.id}`)}
                        title="Perbesar QR Code"
                        className="flex justify-center w-full focus:outline-none"
                      >
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${asset.id}`}
                          alt={`QR Code ${asset.id}`}
                          className="w-10 h-10 object-contain mx-auto hover:scale-125 hover:shadow-lg transition-all duration-300 shadow-sm bg-white rounded-lg p-1 opacity-90 group-hover:opacity-100"
                        />
                      </button>
                    </td>
                    <td className="p-4 pr-6">
                      <div className="flex items-center justify-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity duration-300">
                        <button 
                          onClick={() => handleEdit(asset.id)}
                          className="p-2 bg-gray-50 text-gray-600 hover:text-green-600 hover:bg-green-100 rounded-xl transition-all duration-300 hover:scale-110" 
                          title="Edit"
                        >
                          <Edit size={14} />
                        </button>
                        <button 
                          onClick={() => handleDelete(asset.id, asset.namaAset)}
                          className="p-2 bg-gray-50 text-gray-600 hover:text-red-600 hover:bg-red-100 rounded-xl transition-all duration-300 hover:scale-110" 
                          title="Hapus"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {fetchingMore && (
            <div className="flex justify-center p-6 border-t border-gray-50">
              <Loader2 className="animate-spin text-green-500" size={24} />
            </div>
          )}
        </div>
      </main>

      {/* FLOATING ACTION BUTTON */}
      <button
        onClick={handleExportExcel}
        disabled={isExporting}
        title="Export Data ke Excel"
        className={`fixed bottom-8 right-8 p-4 ${isExporting ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'} text-white rounded-2xl shadow-xl shadow-green-600/20 transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 active:scale-95 z-40 group`}
      >
        {isExporting ? (
          <Loader2 className="animate-spin" size={24} />
        ) : (
          <div className="flex items-center gap-2">
            <DownloadCloud size={24} className="group-hover:animate-bounce" />
          </div>
        )}
      </button>

      {/* SIDEBAR MEMAKAI EFFECT GLASS DAN LEBIH MODERN */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 flex transition-opacity duration-300">
          {/* OVERLAY */}
          <div 
            className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsSidebarOpen(false)}
          ></div>
          
          {/* SIDEBAR PANEL */}
          <div className="relative w-80 h-full bg-white shadow-2xl flex flex-col transform transition-transform duration-300 text-gray-800 border-r border-gray-100 animate-in slide-in-from-left">
            <div className="p-6 flex items-center justify-between border-b border-gray-100">
              <h2 className="font-bold text-lg flex items-center gap-3 text-gray-800">
                <div className="p-2 bg-green-100 text-green-700 rounded-xl">
                  <Menu size={18} />
                </div>
                Navigasi
              </h2>
              <button 
                onClick={() => setIsSidebarOpen(false)} 
                className="p-2 bg-gray-50 text-gray-500 rounded-full hover:bg-red-50 hover:text-red-500 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="p-4 flex-1 space-y-2 overflow-y-auto">
              <div className="p-4 rounded-2xl bg-green-50 text-green-800 shadow-sm border border-green-100 flex justify-between items-center cursor-pointer transition-all hover:scale-[1.02]">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-xl shadow-sm text-green-600"><Home size={18} /></div>
                  <span className="font-bold">📦 Data Aset <br /><span className="text-[11px] text-green-600/70 font-medium">Manajemen Lengkap</span></span>
                </div>
                <span className="text-green-600 font-bold bg-white w-6 h-6 flex items-center justify-center rounded-full shadow-sm">✓</span>
              </div>
              
              <div className="p-4 rounded-2xl text-gray-600 hover:bg-gray-50 hover:text-gray-900 flex justify-between items-center cursor-pointer border border-transparent hover:border-gray-100 transition-all hover:scale-[1.02]">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-xl text-gray-500"><Home size={18} /></div>
                  <span className="font-bold">👥 Users <br /><span className="text-[11px] text-gray-400 font-medium">Hak Akses & Role</span></span>
                </div>
              </div>
              
              <div className="p-4 rounded-2xl text-gray-600 hover:bg-gray-50 hover:text-gray-900 flex justify-between items-center cursor-pointer border border-transparent hover:border-gray-100 transition-all hover:scale-[1.02]">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-xl text-gray-500"><Home size={18} /></div>
                  <span className="font-bold">📈 Log Aktivitas <br /><span className="text-[11px] text-gray-400 font-medium">History Perubahan</span></span>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-100">
              <button className="flex items-center justify-center gap-2 p-4 w-full bg-red-50 text-red-600 hover:bg-red-500 hover:text-white rounded-2xl font-bold transition-all duration-300 hover:shadow-lg hover:shadow-red-500/20 active:scale-95 group">
                <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" /> Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ZOOM PANEL */}
      {zoomedImage && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 transition-all duration-300"
          onClick={() => setZoomedImage(null)}
        >
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md"></div>
          <div className="relative max-w-4xl w-full flex justify-center animate-in zoom-in duration-300" onClick={(e) => e.stopPropagation()}>
            <button 
              className="absolute -top-14 right-0 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-3 rounded-full transition-all duration-300 hover:scale-110 z-10"
              onClick={() => setZoomedImage(null)}
              title="Tutup (Esc)"
            >
              <X size={24} />
            </button>
            <div className="bg-white p-3 rounded-3xl shadow-2xl relative overflow-hidden border border-gray-100">
              <img 
                src={zoomedImage} 
                alt="Zoomed" 
                className="max-h-[80vh] max-w-[90vw] object-contain rounded-2xl bg-gray-50"
              />
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM DELETE CONFIRMATION MODAL */}
      {deleteConfirm.isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 transition-all duration-300">
          <div 
            className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
            onClick={() => !isDeleting && setDeleteConfirm({ isOpen: false, id: "", nama: "" })}
          ></div>
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-300 border border-gray-100 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-5 shadow-inner">
              <AlertTriangle size={32} className={`${isDeleting ? "animate-pulse" : ""}`} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Konfirmasi Hapus</h3>
            <p className="text-gray-500 mb-8 text-sm leading-relaxed">
              Apakah Anda yakin ingin menghapus data aset <br/>
              <strong className="text-gray-700 font-bold">"{deleteConfirm.nama}"</strong>?<br/>
              <span className="text-xs text-red-400 mt-2 block">Tindakan ini tidak dapat dibatalkan.</span>
            </p>
            <div className="flex gap-3 w-full">
              <button 
                onClick={() => setDeleteConfirm({ isOpen: false, id: "", nama: "" })}
                disabled={isDeleting}
                className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl transition-all duration-300 active:scale-95 disabled:opacity-50"
              >
                Batal
              </button>
              <button 
                onClick={executeDelete}
                disabled={isDeleting}
                className="flex-1 py-3 px-4 bg-red-500 hover:bg-red-600 text-white font-bold rounded-2xl transition-all duration-300 active:scale-95 shadow-lg shadow-red-500/30 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isDeleting ? <Loader2 className="animate-spin" size={18} /> : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FORM EDIT MODAL */}
      {editModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 transition-all duration-300">
          <div 
            className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
            onClick={() => !isSaving && setEditModalOpen(false)}
          ></div>
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg p-7 animate-in slide-in-from-bottom-5 duration-300 border border-gray-100 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <div className="p-2 bg-green-100 text-green-700 rounded-xl"><Edit size={18} /></div>
                Edit Data Aset
              </h3>
              <button 
                onClick={() => !isSaving && setEditModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                disabled={isSaving}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex flex-col gap-4 overflow-y-auto max-h-[60vh] custom-scrollbar px-1 pb-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Nama Aset</label>
                <input 
                  type="text" 
                  value={editAsset.namaAset || ""} 
                  onChange={(e) => setEditAsset({...editAsset, namaAset: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 font-medium focus:text-gray-900 focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-500/10 outline-none transition-all shadow-sm"
                  disabled={isSaving}
                />
              </div>
              
              <div className="flex gap-4">
                <div className="flex flex-col gap-1 flex-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Qty</label>
                  <input 
                    type="number" 
                    value={editAsset.qty || 0} 
                    onChange={(e) => setEditAsset({...editAsset, qty: parseInt(e.target.value, 10)})}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 font-medium focus:text-gray-900 focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-500/10 outline-none transition-all shadow-sm"
                    disabled={isSaving}
                  />
                </div>
                <div className="flex flex-col gap-1 flex-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Satuan</label>
                  <input 
                    type="text" 
                    value={editAsset.satuan || ""} 
                    onChange={(e) => setEditAsset({...editAsset, satuan: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 font-medium focus:text-gray-900 focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-500/10 outline-none transition-all shadow-sm"
                    disabled={isSaving}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Kondisi</label>
                <select 
                  value={editAsset.kondisi || "BAIK"} 
                  onChange={(e) => setEditAsset({...editAsset, kondisi: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 font-medium focus:text-gray-900 focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-500/10 outline-none transition-all shadow-sm"
                  disabled={isSaving}
                >
                  <option value="BAIK">Baik</option>
                  <option value="RUSAK">Rusak</option>
                  <option value="RUSAK_BERAT">Rusak Berat</option>
                  <option value="HILANG">Hilang</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Site / Lokasi</label>
                <input 
                  type="text" 
                  value={editAsset.site || ""} 
                  onChange={(e) => setEditAsset({...editAsset, site: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 font-medium focus:text-gray-900 focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-500/10 outline-none transition-all shadow-sm"
                  disabled={isSaving}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Keterangan</label>
                <textarea 
                  value={editAsset.keterangan || ""} 
                  onChange={(e) => setEditAsset({...editAsset, keterangan: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 font-medium focus:text-gray-900 focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-500/10 outline-none transition-all resize-none h-24 shadow-sm"
                  disabled={isSaving}
                />
              </div>
            </div>

            <div className="flex gap-3 w-full mt-6 pt-4 border-t border-gray-100">
              <button 
                onClick={() => setEditModalOpen(false)}
                disabled={isSaving}
                className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl transition-all duration-300 active:scale-95 disabled:opacity-50"
              >
                Batal
              </button>
              <button 
                onClick={handleSaveEdit}
                disabled={isSaving}
                className="flex-1 py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-2xl transition-all duration-300 active:scale-95 shadow-lg shadow-green-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="animate-spin" size={18} /> : "Simpan Perubahan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
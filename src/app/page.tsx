"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { format } from "date-fns";
import {
  Menu, Search, Home, Maximize,
  Edit, Trash2, X, DownloadCloud, Loader2, AlertTriangle, Plus
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import UserNav from "@/components/UserNav";


interface Asset {
  id: string;
  nomorAset: string;
  namaAset: string;
  kodeKelas: string | null;
  kelasAsetSmbr: string | null;
  kategoriSig: string | null;
  jenis: string | null;
  merk: string | null;
  type: string | null;
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
  const [isImporting, setIsImporting] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{isOpen: boolean; id: string; nama: string}>({ isOpen: false, id: "", nama: "" });
  const [isDeleting, setIsDeleting] = useState(false);
  
  // ADD STATE
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newAsset, setNewAsset] = useState<Partial<Asset>>({});
  const [isAdding, setIsAdding] = useState(false);

  // EDIT STATE
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editAsset, setEditAsset] = useState<Partial<Asset>>({});
  const [editOriginalId, setEditOriginalId] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  // FILTER STATE
  const [filterKondisi, setFilterKondisi] = useState<string>("");
  const [filterKategori, setFilterKategori] = useState<string>("");
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);

  const fetchAssets = async (currentPage: number, currentSearch: string, isNewSearch: boolean, kondisi: string = "", kategori: string = "") => {
    try {
      if (isNewSearch) setLoading(true);
      else setFetchingMore(true);

      let url = `/api/assets?page=${currentPage}&limit=50&search=${currentSearch}`;
      if (kondisi) url += `&kondisi=${kondisi}`;
      if (kategori) url += `&kategori=${kategori}`;

      const { data } = await axios.get(url);

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

  // Efek berjalan setiap pencarian atau filter berubah (debounce 500ms agar server tidak berat)
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchAssets(1, search, true, filterKondisi, filterKategori);
    }, 500);
    return () => clearTimeout(timer);
  }, [search, filterKondisi, filterKategori]);

  // Efek berjalan khusus jika Halaman bertambah dari Infinite Scroll
  useEffect(() => {
    if (page > 1) {
      fetchAssets(page, search, false, filterKondisi, filterKategori);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setIsImporting(true);
    try {
      const response = await axios.post("/api/assets/import", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      alert(`Import Berhasil! \nSukses: ${response.data.successCount} \nGagal: ${response.data.failCount}`);
      // Refresh data
      setPage(1);
      fetchAssets(1, search, true, filterKondisi, filterKategori);
    } catch (error) {
      console.error("Gagal import excel", error);
      alert("Gagal mengimpor file Excel.");
    } finally {
      setIsImporting(false);
      e.target.value = ""; // Reset input
    }
  };

  // Fungsi pembantu untuk membuat URL file nembak ke Backend API
  const getFileUrl = (url: string | null) => {
    if (!url) return undefined;
    if (url.startsWith("http")) return url;
    // Ambil dari environment variable
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://10.10.101.113:3001";
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
    setEditOriginalId(id);
    setEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editOriginalId) return;
    setIsSaving(true);
    try {
      const response = await axios.put(`/api/assets/${editOriginalId}`, {
        id: editAsset.id, // we might have updated the id
        nomorAset: editAsset.nomorAset,
        namaAset: editAsset.namaAset,
        kelasAsetSmbr: editAsset.kelasAsetSmbr,
        kategoriSig: editAsset.kategoriSig,
        jenis: editAsset.jenis,
        merk: editAsset.merk,
        type: editAsset.type,
        kondisi: editAsset.kondisi,
        qty: editAsset.qty,
        satuan: editAsset.satuan,
        latitude: editAsset.latitude,
        longitude: editAsset.longitude,
        site: editAsset.site,
        keterangan: editAsset.keterangan,
      });
      // Update local state without re-fetching
      setAssets(prev => prev.map(a => a.id === editOriginalId ? { ...a, ...response.data.data } : a));
      setEditModalOpen(false);
    } catch (error) {
      console.error("Gagal update data", error);
      alert("Gagal update aset. Silakan coba lagi.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddAsset = async () => {
    console.log("handleAddAsset called", newAsset);
    if (!newAsset.id || !newAsset.nomorAset || !newAsset.namaAset) {
      alert("ID Aset, Nomor Aset, dan Nama Aset wajib diisi!");
      return;
    }
    setIsAdding(true);
    try {
      const response = await axios.post("/api/assets", newAsset);
      setAssets((prev) => [response.data.data, ...prev]);
      setTotalRecord((prev) => prev + 1);
      setAddModalOpen(false);
      setNewAsset({});
    } catch (error) {
      console.error("Gagal menambah data", error);
      alert("Gagal menambah aset. Mungkin ID sudah digunakan atau terjadi error lain.");
    } finally {
      setIsAdding(false);
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
            <div className="flex items-center gap-2">
              <img src="/icon.png" alt="Admin Panel" className="h-8 w-auto" />
              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] uppercase rounded-full tracking-widest font-bold">Asett</span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5 font-medium">PT. SEMEN BATURAJA TBK</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Import Aset Button via Hidden File Input */}
          <label className="cursor-pointer px-5 py-3.5 rounded-2xl bg-white border border-gray-200/80 text-gray-700 hover:text-gray-900 font-semibold shadow-sm hover:shadow-md transition-all duration-300 whitespace-nowrap flex items-center gap-2">
            {!isImporting ? <DownloadCloud size={18} className="rotate-180" /> : <Loader2 size={18} className="animate-spin" />}
            <span>{isImporting ? "Mengimpor..." : "Import Excel"}</span>
            <input 
              type="file" 
              accept=".xlsx, .xls" 
              onChange={handleImportExcel} 
              className="hidden" 
              disabled={isImporting} 
            />
          </label>

          {/* Tambah Aset Button */}
          <button
            onClick={() => {
              console.log("Tambah Aset button clicked", addModalOpen);
              setAddModalOpen(true);
            }}
            className="px-5 py-3.5 rounded-2xl bg-green-600 text-white hover:bg-green-700 font-semibold shadow-sm shadow-green-600/30 hover:shadow-md transition-all duration-300 whitespace-nowrap flex items-center gap-2"
          >
            <Plus size={18} />
            <span>Tambah Aset</span>
          </button>
          <div className="hidden md:flex items-center gap-2 mr-4 text-xs font-semibold text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            {totalRecord} Data Ditemukan
          </div>
          <UserNav />
        </div>
      </header>

      {/* SEARCH BAR + FILTER BUTTON */}
      <div className="px-4 py-4 shrink-0 z-40 w-full max-w-6xl mx-auto flex gap-3 items-center">
        {/* Filter Toggle Button */}
        <button
          onClick={() => setFilterPanelOpen(!filterPanelOpen)}
          className="px-5 py-3.5 rounded-2xl bg-white border border-gray-200/80 text-gray-700 hover:text-gray-900 font-semibold shadow-sm hover:shadow-md transition-all duration-300 whitespace-nowrap flex items-center gap-2"
        >
          <span>Filter</span>
          <span className={`transition-transform duration-300 ${filterPanelOpen ? "rotate-180" : ""}`}>▼</span>
        </button>

        {/* Search Bar */}
        <div className="relative group flex-1 max-w-2xl">
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

{/* FILTER MODAL */}
      {filterPanelOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 transition-all duration-300">
          <div 
            className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
            onClick={() => setFilterPanelOpen(false)}
          ></div>
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-7 animate-in slide-in-from-bottom-5 duration-300 border border-gray-100 flex flex-col max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 pb-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800">Filter Aset</h2>
              <button 
                onClick={() => setFilterPanelOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Kategori Section */}
            <div className="mb-8">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Kategori</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilterKategori("")}
                  className={`px-4 py-2 rounded-full font-semibold text-sm transition-all duration-300 ${
                    filterKategori === "" 
                      ? "bg-green-600 text-white shadow-lg shadow-green-600/30" 
                      : "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200"
                  }`}
                >
                  Semua
                </button>
                <button
                  onClick={() => setFilterKategori("BANGUNAN")}
                  className={`px-4 py-2 rounded-full font-semibold text-sm transition-all duration-300 ${
                    filterKategori === "BANGUNAN" 
                      ? "bg-green-600 text-white shadow-lg shadow-green-600/30" 
                      : "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200"
                  }`}
                >
                  Bangunan
                </button>
                <button
                  onClick={() => setFilterKategori("INFRASTRUKTUR")}
                  className={`px-4 py-2 rounded-full font-semibold text-sm transition-all duration-300 ${
                    filterKategori === "INFRASTRUKTUR" 
                      ? "bg-green-600 text-white shadow-lg shadow-green-600/30" 
                      : "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200"
                  }`}
                >
                  Infrastruktur
                </button>
                <button
                  onClick={() => setFilterKategori("KENDARAAN & ALAT BERAT")}
                  className={`px-4 py-2 rounded-full font-semibold text-sm transition-all duration-300 ${
                    filterKategori === "KENDARAAN & ALAT BERAT" 
                      ? "bg-green-600 text-white shadow-lg shadow-green-600/30" 
                      : "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200"
                  }`}
                >
                  Kendaraan & Alat Berat
                </button>
                <button
                  onClick={() => setFilterKategori("PERLENGKAPAN")}
                  className={`px-4 py-2 rounded-full font-semibold text-sm transition-all duration-300 ${
                    filterKategori === "PERLENGKAPAN" 
                      ? "bg-green-600 text-white shadow-lg shadow-green-600/30" 
                      : "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200"
                  }`}
                >
                  Perlengkapan
                </button>
                <button
                  onClick={() => setFilterKategori("TANAH")}
                  className={`px-4 py-2 rounded-full font-semibold text-sm transition-all duration-300 ${
                    filterKategori === "TANAH" 
                      ? "bg-green-600 text-white shadow-lg shadow-green-600/30" 
                      : "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200"
                  }`}
                >
                  Tanah
                </button>
              </div>
            </div>

            {/* Kondisi Section */}
            <div className="mb-8">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Kondisi</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilterKondisi("")}
                  className={`px-4 py-2 rounded-full font-semibold text-sm transition-all duration-300 ${
                    filterKondisi === "" 
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30" 
                      : "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200"
                  }`}
                >
                  Semua Kondisi
                </button>
                <button
                  onClick={() => setFilterKondisi("BAIK")}
                  className={`px-4 py-2 rounded-full font-semibold text-sm transition-all duration-300 ${
                    filterKondisi === "BAIK" 
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30" 
                      : "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200"
                  }`}
                >
                  Baik
                </button>
                <button
                  onClick={() => setFilterKondisi("RUSAK")}
                  className={`px-4 py-2 rounded-full font-semibold text-sm transition-all duration-300 ${
                    filterKondisi === "RUSAK" 
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30" 
                      : "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200"
                  }`}
                >
                  Rusak
                </button>
                <button
                  onClick={() => setFilterKondisi("RUSAK_BERAT")}
                  className={`px-4 py-2 rounded-full font-semibold text-sm transition-all duration-300 ${
                    filterKondisi === "RUSAK_BERAT" 
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30" 
                      : "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200"
                  }`}
                >
                  Rusak Berat
                </button>
                <button
                  onClick={() => setFilterKondisi("HILANG")}
                  className={`px-4 py-2 rounded-full font-semibold text-sm transition-all duration-300 ${
                    filterKondisi === "HILANG" 
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30" 
                      : "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200"
                  }`}
                >
                  Hilang
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
              <button 
                onClick={() => {
                  setFilterKondisi("");
                  setFilterKategori("");
                }}
                className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl transition-all duration-300"
              >
                Reset
              </button>
              <button 
                onClick={() => setFilterPanelOpen(false)}
                className="flex-1 py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-2xl transition-all duration-300 shadow-lg shadow-green-600/30"
              >
                Terapkan Filter
              </button>
            </div>
          </div>
        </div>
      )}

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
                <th className="p-4">Jenis</th>
                <th className="p-4">Merk</th>
                <th className="p-4">Type</th>
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
                  <td colSpan={20} className="p-12 text-center">
                    <div className="flex flex-col items-center gap-3 text-gray-400">
                      <Loader2 className="animate-spin text-green-500" size={32} />
                      <span className="font-medium animate-pulse">Memuat data aset...</span>
                    </div>
                  </td>
                </tr>
              ) : assets.length === 0 ? (
                <tr>
                  <td colSpan={20} className="p-12 text-center text-gray-400 flex-col items-center justify-center">
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
                    <td className="p-4"><span className="text-[10px] font-bold text-green-700 bg-green-100/50 px-2 py-1 rounded-md uppercase">{asset.kategoriSig || '-'}</span></td>
                    <td className="p-4 text-gray-700">{asset.jenis || '-'}</td>
                    <td className="p-4 text-gray-700">{asset.merk || '-'}</td>
                    <td className="p-4 text-gray-700">{asset.type || '-'}</td>
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

      {/* SIDEBAR COMPONENT */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} currentPage="assets" />

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
      {/* FORM ADD MODAL */}
      {addModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 transition-all duration-300">
          <div 
            className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
            onClick={() => !isAdding && setAddModalOpen(false)}
          ></div>
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg p-7 animate-in slide-in-from-bottom-5 duration-300 border border-gray-100 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <div className="p-2 bg-green-100 text-green-700 rounded-xl"><Plus size={18} /></div>
                Tambah Data Aset
              </h3>
              <button 
                onClick={() => !isAdding && setAddModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                disabled={isAdding}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex flex-col gap-4 overflow-y-auto max-h-[60vh] custom-scrollbar px-1 pb-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">ID Aset (Wajib manual)</label>
                <input
                  type="text"
                  value={newAsset.id || ""}
                  onChange={(e) => setNewAsset({...newAsset, id: e.target.value})}
                  placeholder="Masukkan ID Aset secara manual..."
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 font-medium focus:text-gray-900 focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-500/10 outline-none transition-all shadow-sm"
                  disabled={isAdding}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Nomor Aset</label>
                <input
                  type="text"
                  value={newAsset.nomorAset || ""}
                  onChange={(e) => setNewAsset({...newAsset, nomorAset: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 font-medium focus:text-gray-900 focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-500/10 outline-none transition-all shadow-sm"
                  disabled={isAdding}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Nama Aset</label>
                <input
                  type="text"
                  value={newAsset.namaAset || ""}
                  onChange={(e) => setNewAsset({...newAsset, namaAset: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 font-medium focus:text-gray-900 focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-500/10 outline-none transition-all shadow-sm"
                  disabled={isAdding}
                />
              </div>

              <div className="flex gap-4">
                <div className="flex flex-col gap-1 flex-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Kelas SMBR</label>
                  <input
                    type="text"
                    value={newAsset.kelasAsetSmbr || ""}
                    onChange={(e) => setNewAsset({...newAsset, kelasAsetSmbr: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 font-medium focus:text-gray-900 focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-500/10 outline-none transition-all shadow-sm"
                    disabled={isAdding}
                  />
                </div>
                <div className="flex flex-col gap-1 flex-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Kategori (SIG)</label>
                  <select
                    value={newAsset.kategoriSig || ""}
                    onChange={(e) => setNewAsset({...newAsset, kategoriSig: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 font-medium focus:text-gray-900 focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-500/10 outline-none transition-all shadow-sm"
                    disabled={isAdding}
                  >
                    <option value="">-- Pilih Kategori --</option>
                    <option value="BANGUNAN">Bangunan</option>
                    <option value="INFRASTRUKTUR">Infrastruktur</option>
                    <option value="KENDARAAN & ALAT BERAT">Kendaraan & Alat Berat</option>
                    <option value="PERLENGKAPAN">Perlengkapan</option>
                    <option value="TANAH">Tanah</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex flex-col gap-1 flex-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Jenis</label>
                  <input
                    type="text"
                    value={newAsset.jenis || ""}
                    onChange={(e) => setNewAsset({...newAsset, jenis: e.target.value})}
                    placeholder="Jenis aset"
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 font-medium focus:text-gray-900 focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-500/10 outline-none transition-all shadow-sm"
                    disabled={isAdding}
                  />
                </div>
                <div className="flex flex-col gap-1 flex-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Merk</label>
                  <input
                    type="text"
                    value={newAsset.merk || ""}
                    onChange={(e) => setNewAsset({...newAsset, merk: e.target.value})}
                    placeholder="Merk aset"
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 font-medium focus:text-gray-900 focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-500/10 outline-none transition-all shadow-sm"
                    disabled={isAdding}
                  />
                </div>
                <div className="flex flex-col gap-1 flex-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Type / Tipe</label>
                  <input
                    type="text"
                    value={newAsset.type || ""}
                    onChange={(e) => setNewAsset({...newAsset, type: e.target.value})}
                    placeholder="Type aset"
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 font-medium focus:text-gray-900 focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-500/10 outline-none transition-all shadow-sm"
                    disabled={isAdding}
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex flex-col gap-1 flex-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Qty</label>
                  <input
                    type="number"
                    value={newAsset.qty || 1}
                    onChange={(e) => setNewAsset({...newAsset, qty: parseInt(e.target.value, 10)})}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 font-medium focus:text-gray-900 focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-500/10 outline-none transition-all shadow-sm"
                    disabled={isAdding}
                  />
                </div>
                <div className="flex flex-col gap-1 flex-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Satuan</label>
                  <input
                    type="text"
                    value={newAsset.satuan || ""}
                    onChange={(e) => setNewAsset({...newAsset, satuan: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 font-medium focus:text-gray-900 focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-500/10 outline-none transition-all shadow-sm"
                    disabled={isAdding}
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex flex-col gap-1 flex-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={newAsset.latitude || ""}
                    onChange={(e) => setNewAsset({...newAsset, latitude: parseFloat(e.target.value) || null})}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 font-medium focus:text-gray-900 focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-500/10 outline-none transition-all shadow-sm"
                    disabled={isAdding}
                  />
                </div>
                <div className="flex flex-col gap-1 flex-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={newAsset.longitude || ""}
                    onChange={(e) => setNewAsset({...newAsset, longitude: parseFloat(e.target.value) || null})}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 font-medium focus:text-gray-900 focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-500/10 outline-none transition-all shadow-sm"
                    disabled={isAdding}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Kondisi</label>
                <select
                  value={newAsset.kondisi || "BAIK"}
                  onChange={(e) => setNewAsset({...newAsset, kondisi: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 font-medium focus:text-gray-900 focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-500/10 outline-none transition-all shadow-sm"
                  disabled={isAdding}
                >
                  <option value="BAIK">Baik</option>
                  <option value="RUSAK">Rusak</option>
                  <option value="RUSAK_BERAT">Rusak Berat</option>
                  <option value="HILANG">Hilang</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Site</label>
                <input
                  type="text"
                  value={newAsset.site || ""}
                  onChange={(e) => setNewAsset({...newAsset, site: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 font-medium focus:text-gray-900 focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-500/10 outline-none transition-all shadow-sm"
                  disabled={isAdding}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Keterangan / Catatan</label>
                <textarea
                  value={newAsset.keterangan || ""}
                  onChange={(e) => setNewAsset({...newAsset, keterangan: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 font-medium focus:text-gray-900 focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-500/10 outline-none transition-all resize-none h-24 shadow-sm"
                  disabled={isAdding}
                />
              </div>
            </div>

            <div className="flex gap-3 w-full mt-6 pt-4 border-t border-gray-100">
              <button 
                onClick={() => setAddModalOpen(false)}
                disabled={isAdding}
                className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl transition-all duration-300 active:scale-95 disabled:opacity-50"
              >
                Batal
              </button>
              <button 
                onClick={handleAddAsset}
                disabled={isAdding}
                className="flex-1 py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-2xl transition-all duration-300 active:scale-95 shadow-lg shadow-green-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isAdding ? <Loader2 className="animate-spin" size={18} /> : "Tambah"}
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
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">ID Aset</label>
                <input
                  type="text"
                  value={editAsset.id || ""}
                  onChange={(e) => setEditAsset({...editAsset, id: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 font-medium focus:text-gray-900 focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-500/10 outline-none transition-all shadow-sm"
                  disabled={isSaving}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Nomor Aset</label>
                <input
                  type="text"
                  value={editAsset.nomorAset || ""}
                  onChange={(e) => setEditAsset({...editAsset, nomorAset: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 font-medium focus:text-gray-900 focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-500/10 outline-none transition-all shadow-sm"
                  disabled={isSaving}
                />
              </div>

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
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Kelas SMBR</label>
                  <input
                    type="text"
                    value={editAsset.kelasAsetSmbr || ""}
                    onChange={(e) => setEditAsset({...editAsset, kelasAsetSmbr: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 font-medium focus:text-gray-900 focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-500/10 outline-none transition-all shadow-sm"
                    disabled={isSaving}
                  />
                </div>
                <div className="flex flex-col gap-1 flex-1">
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
              </div>

              <div className="flex gap-4">
                <div className="flex flex-col gap-1 flex-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Jenis</label>
                  <input
                    type="text"
                    value={editAsset.jenis || ""}
                    onChange={(e) => setEditAsset({...editAsset, jenis: e.target.value})}
                    placeholder="Jenis aset"
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 font-medium focus:text-gray-900 focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-500/10 outline-none transition-all shadow-sm"
                    disabled={isSaving}
                  />
                </div>
                <div className="flex flex-col gap-1 flex-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Merk</label>
                  <input
                    type="text"
                    value={editAsset.merk || ""}
                    onChange={(e) => setEditAsset({...editAsset, merk: e.target.value})}
                    placeholder="Merk aset"
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 font-medium focus:text-gray-900 focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-500/10 outline-none transition-all shadow-sm"
                    disabled={isSaving}
                  />
                </div>
                <div className="flex flex-col gap-1 flex-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Type / Tipe</label>
                  <input
                    type="text"
                    value={editAsset.type || ""}
                    onChange={(e) => setEditAsset({...editAsset, type: e.target.value})}
                    placeholder="Type aset"
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 font-medium focus:text-gray-900 focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-500/10 outline-none transition-all shadow-sm"
                    disabled={isSaving}
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex flex-col gap-1 flex-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Qty</label>
                  <input
                    type="number"
                    value={editAsset.qty || 1}
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
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Site</label>
                <input
                  type="text"
                  value={editAsset.site || ""}
                  onChange={(e) => setEditAsset({...editAsset, site: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 font-medium focus:text-gray-900 focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-500/10 outline-none transition-all shadow-sm"
                  disabled={isSaving}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Keterangan / Catatan</label>
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
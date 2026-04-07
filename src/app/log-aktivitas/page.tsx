"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { format } from "date-fns";
import {
  Menu, Search, X, Loader2, ChevronDown
} from "lucide-react";
import Sidebar from "@/components/Sidebar";

interface AssetLog {
  id: string;
  assetId: string;
  userId: string | null;
  action: string;
  oldValue: string | null;
  newValue: string | null;
  catatan: string | null;
  createdAt: string;
  asset: {
    id: string;
    namaAset: string;
    nomorAset: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export default function LogAktivitasPage() {
  const [logs, setLogs] = useState<AssetLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalRecord, setTotalRecord] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  const fetchLogs = async (currentPage: number, currentSearch: string, isNewSearch: boolean) => {
    try {
      if (isNewSearch) setLoading(true);
      else setFetchingMore(true);

      const { data } = await axios.get(
        `/api/logs?page=${currentPage}&limit=50&search=${currentSearch}`
      );

      if (isNewSearch) {
        setLogs(data.data);
      } else {
        setLogs(prev => [...prev, ...data.data]);
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

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchLogs(1, search, true);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (page > 1) {
      fetchLogs(page, search, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleLoadMore = () => {
    setPage(prev => prev + 1);
  };

  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 200) {
      if (hasMore && !loading && !fetchingMore) {
        setPage(prev => prev + 1);
      }
    }
  };

  const getActionBadgeColor = (action: string) => {
    switch (action.toUpperCase()) {
      case "CREATE":
        return "bg-green-100 text-green-700";
      case "UPDATE":
        return "bg-blue-100 text-blue-700";
      case "DELETE":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
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
              Admin Panel <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] uppercase rounded-full tracking-widest font-bold">Log</span>
            </h1>
            <p className="text-xs text-gray-500 mt-0.5 font-medium">PT. SEMEN BATURAJA TBK</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 mr-4 text-xs font-semibold text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
            {totalRecord} Log Ditemukan
          </div>
        </div>
      </header>

      {/* SEARCH BAR */}
      <div className="px-4 py-4 shrink-0 z-10 w-full max-w-6xl mx-auto flex gap-3 items-center">
        <div className="relative group flex-1">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="text-gray-400 group-focus-within:text-purple-500 transition-colors duration-300" size={18} />
          </div>
          <input
            type="text"
            placeholder="Cari aset, user, atau catatan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white border border-gray-200/80 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-400 shadow-sm transition-all duration-300 hover:shadow-md"
          />
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <main className="px-4 pb-4 overflow-y-auto overflow-x-auto flex-1 relative custom-scrollbar" onScroll={handleScroll}>
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 min-w-max w-full overflow-hidden transition-all duration-300">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 backdrop-blur-md bg-white/90">
              <tr className="text-gray-500 text-[11px] font-bold uppercase tracking-wider border-b border-gray-100">
                <th className="p-4 pl-6">Waktu</th>
                <th className="p-4">Action</th>
                <th className="p-4">Aset</th>
                <th className="p-4">User</th>
                <th className="p-4">Catatan</th>
                <th className="p-4 text-center pr-6">Detail</th>
              </tr>
            </thead>
            <tbody className="text-gray-600 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center">
                    <div className="flex flex-col items-center gap-3 text-gray-400">
                      <Loader2 className="animate-spin text-purple-500" size={32} />
                      <span className="font-medium animate-pulse">Memuat data log...</span>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-gray-400 flex-col items-center justify-center">
                    <Search className="mx-auto text-gray-300 mb-3" size={48} />
                    <span className="font-medium">Tidak ada log ditemukan</span>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr 
                    key={log.id} 
                    className="hover:bg-purple-50/50 border-b border-gray-50/50 transition-all duration-200 group cursor-pointer"
                    onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                  >
                    <td className="p-4 pl-6 text-gray-500 text-xs whitespace-nowrap">{format(new Date(log.createdAt), "dd/MM/yyyy HH:mm")}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 text-[11px] font-bold rounded-full whitespace-nowrap ${getActionBadgeColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 font-semibold text-gray-800">{log.asset?.namaAset}</td>
                    <td className="p-4 text-gray-600">{log.user?.name || "Sistem"}</td>
                    <td className="p-4 text-gray-600 truncate max-w-[200px]">{log.catatan || "-"}</td>
                    <td className="p-4 text-center pr-6">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedLog(expandedLog === log.id ? null : log.id);
                        }}
                        className="p-2 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors opacity-0 group-hover:opacity-100"
                        title="Lihat Detail"
                      >
                        <ChevronDown size={16} className={`transition-transform ${expandedLog === log.id ? "rotate-180" : ""}`} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* EXPANDABLE DETAIL ROW */}
          {expandedLog && logs.find(l => l.id === expandedLog) && (
            <div className="border-t border-gray-100 bg-gray-50 p-6">
              <div className="grid grid-cols-2 gap-6">
                {logs.find(l => l.id === expandedLog)?.user && (
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">User</p>
                    <p className="text-sm text-gray-800 font-medium">
                      {logs.find(l => l.id === expandedLog)?.user?.name}
                    </p>
                    <p className="text-xs text-gray-500 font-mono">
                      {logs.find(l => l.id === expandedLog)?.user?.email}
                    </p>
                  </div>
                )}

                {logs.find(l => l.id === expandedLog)?.oldValue && (
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Nilai Lama</p>
                    <p className="text-sm text-gray-800 bg-white p-3 rounded-lg font-mono break-all">
                      {logs.find(l => l.id === expandedLog)?.oldValue}
                    </p>
                  </div>
                )}

                {logs.find(l => l.id === expandedLog)?.newValue && (
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Nilai Baru</p>
                    <p className="text-sm text-gray-800 bg-white p-3 rounded-lg font-mono break-all">
                      {logs.find(l => l.id === expandedLog)?.newValue}
                    </p>
                  </div>
                )}

                {logs.find(l => l.id === expandedLog)?.catatan && (
                  <div className="col-span-2">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Catatan Lengkap</p>
                    <p className="text-sm text-gray-800 bg-white p-3 rounded-lg">
                      {logs.find(l => l.id === expandedLog)?.catatan}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* SIDEBAR COMPONENT */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} currentPage="log-aktivitas" />
    </div>
  );
}

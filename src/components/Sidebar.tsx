import Link from "next/link";
import { X, Menu, Package, Users, Activity } from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentPage: "assets" | "users" | "log-aktivitas";
}

export default function Sidebar({ isOpen, onClose, currentPage }: SidebarProps) {
  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex transition-opacity duration-300">
          {/* OVERLAY */}
          <div 
            className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" 
            onClick={onClose}
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
                onClick={onClose} 
                className="p-2 bg-gray-50 text-gray-500 rounded-full hover:bg-red-50 hover:text-red-500 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="p-4 flex-1 space-y-2 overflow-y-auto">
              {/* Data Aset */}
              <Link
                href="/"
                onClick={onClose}
                className={`block p-4 rounded-2xl transition-all hover:scale-[1.02] ${
                  currentPage === "assets"
                    ? "bg-green-50 text-green-800 shadow-sm border border-green-100"
                    : "text-gray-600 hover:bg-gray-50 border border-transparent hover:border-gray-100"
                }`}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${
                      currentPage === "assets"
                        ? "bg-white shadow-sm text-green-600"
                        : "bg-gray-100 text-gray-500"
                    }`}>
                      <Package size={18} />
                    </div>
                    <span className="font-bold">
                      Data Aset 
                      <br />
                      <span className={`text-[11px] font-medium ${
                        currentPage === "assets"
                          ? "text-green-600/70"
                          : "text-gray-400"
                      }`}>
                        Manajemen Lengkap
                      </span>
                    </span>
                  </div>
                  {currentPage === "assets" && (
                    <span className="text-green-600 font-bold bg-white w-6 h-6 flex items-center justify-center rounded-full shadow-sm">✓</span>
                  )}
                </div>
              </Link>
              
              {/* Users */}
              <Link
                href="/users"
                onClick={onClose}
                className={`block p-4 rounded-2xl transition-all hover:scale-[1.02] ${
                  currentPage === "users"
                    ? "bg-blue-50 text-blue-800 shadow-sm border border-blue-100"
                    : "text-gray-600 hover:bg-gray-50 border border-transparent hover:border-gray-100"
                }`}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${
                      currentPage === "users"
                        ? "bg-white shadow-sm text-blue-600"
                        : "bg-gray-100 text-gray-500"
                    }`}>
                      <Users size={18} />
                    </div>
                    <span className="font-bold">
                      Users 
                      <br />
                      <span className={`text-[11px] font-medium ${
                        currentPage === "users"
                          ? "text-blue-600/70"
                          : "text-gray-400"
                      }`}>
                        Hak Akses & Role
                      </span>
                    </span>
                  </div>
                  {currentPage === "users" && (
                    <span className="text-blue-600 font-bold bg-white w-6 h-6 flex items-center justify-center rounded-full shadow-sm">✓</span>
                  )}
                </div>
              </Link>
              
              {/* Log Aktivitas */}
              <Link
                href="/log-aktivitas"
                onClick={onClose}
                className={`block p-4 rounded-2xl transition-all hover:scale-[1.02] ${
                  currentPage === "log-aktivitas"
                    ? "bg-purple-50 text-purple-800 shadow-sm border border-purple-100"
                    : "text-gray-600 hover:bg-gray-50 border border-transparent hover:border-gray-100"
                }`}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${
                      currentPage === "log-aktivitas"
                        ? "bg-white shadow-sm text-purple-600"
                        : "bg-gray-100 text-gray-500"
                    }`}>
                      <Activity size={18} />
                    </div>
                    <span className="font-bold">
                      Log Aktivitas 
                      <br />
                      <span className={`text-[11px] font-medium ${
                        currentPage === "log-aktivitas"
                          ? "text-purple-600/70"
                          : "text-gray-400"
                      }`}>
                        History Perubahan
                      </span>
                    </span>
                  </div>
                  {currentPage === "log-aktivitas" && (
                    <span className="text-purple-600 font-bold bg-white w-6 h-6 flex items-center justify-center rounded-full shadow-sm">✓</span>
                  )}
                </div>
              </Link>
            </div>
            
            <div className="p-6 border-t border-gray-100"></div>
          </div>
        </div>
      )}
    </>
  );
}

import Link from "next/link";
import { X, Menu, Package, Users, Activity, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentPage: "assets" | "users" | "log-aktivitas";
}

export default function Sidebar({ isOpen, onClose, currentPage }: SidebarProps) {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      onClose();
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

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

            {/* FOOTER - User Info & Logout */}
            <div className="p-6 border-t border-gray-100 space-y-4">
              {/* User Info */}
              <div className="bg-white rounded-2xl border border-gray-100 p-4"> 
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-sm">
                    {user?.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-800 truncate">{user?.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  </div>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 hover:bg-red-100 font-semibold rounded-2xl transition-all border border-red-100 hover:border-red-200"
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

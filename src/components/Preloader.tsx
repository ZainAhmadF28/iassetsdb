"use client";

import React, { useEffect, useRef } from "react";

export default function Preloader() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Create animated spinner style
    const style = document.createElement("style");
    style.textContent = `
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      
      .preloader-spinner {
        animation: spin 2s linear infinite;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 bg-white flex flex-col items-center justify-center z-50"
    >
      {/* Logo */}
      <div className="mb-8">
        <img
          src="/logoSMBR.png"
          alt="Logo"
          className="w-40 h-40 object-contain"
        />
      </div>

      {/* Spinner */}
      <div className="w-16 h-16 mb-6">
        <div className="preloader-spinner w-full h-full">
          <svg
            className="w-full h-full"
            viewBox="0 0 50 50"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              cx="25"
              cy="25"
              r="20"
              stroke="#e5e7eb"
              strokeWidth="2"
            />
            <circle
              cx="25"
              cy="25"
              r="20"
              stroke="#135d3a"
              strokeWidth="2"
              strokeDasharray="31.4 62.8"
            />
          </svg>
        </div>
      </div>

      {/* Loading text */}
      <h2 className="text-xl font-bold text-gray-900 mb-2">
        Memuat...
      </h2>
      <p className="text-sm text-gray-500">
        Mohon tunggu sebentar
      </p>
    </div>
  );
}

import React from "react";

export default function AuthLayout({ icon: Icon, title, subtitle, footer, children }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10 relative overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse at top, #3a1a00 0%, #1a0e00 40%, #0d0d0d 100%)',
      }}
    >
      {/* Flame glow top */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 rounded-full blur-3xl opacity-30"
        style={{ background: 'radial-gradient(ellipse, #f97316 0%, #dc2626 60%, transparent 100%)' }} />

      {/* Checkered stripe bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-5 opacity-60"
        style={{
          backgroundImage: 'repeating-linear-gradient(90deg, #f59e0b 0px, #f59e0b 20px, #111 20px, #111 40px)',
        }}
      />
      <div className="absolute bottom-5 left-0 right-0 h-3 opacity-40"
        style={{
          backgroundImage: 'repeating-linear-gradient(90deg, #111 0px, #111 20px, #f59e0b 20px, #f59e0b 40px)',
        }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-block mb-3">
            <div className="relative">
              {/* Pit Stop logo text */}
              <p className="font-display text-xs tracking-[0.3em] uppercase text-amber-400/80 mb-1">Welcome to</p>
              <h1 className="font-display text-5xl font-normal tracking-wider text-white drop-shadow-lg"
                style={{ fontFamily: "'Bebas Neue', sans-serif", textShadow: '0 0 30px rgba(249,115,22,0.5), 0 2px 4px rgba(0,0,0,0.8)' }}>
                THE PIT STOP
              </h1>
              <div className="h-0.5 w-full mt-1"
                style={{ background: 'linear-gradient(90deg, transparent, #f59e0b, #f97316, #f59e0b, transparent)' }} />
            </div>
          </div>
          <p className="text-sm font-medium tracking-widest uppercase"
            style={{ color: '#f59e0b', fontFamily: "'Barlow Condensed', sans-serif" }}>
            {title}
          </p>
          {subtitle && <p className="text-white/50 mt-1 text-sm">{subtitle}</p>}
        </div>

        {/* Card */}
        <div className="rounded-2xl border p-8"
          style={{
            background: 'rgba(20, 10, 0, 0.85)',
            borderColor: 'rgba(245, 158, 11, 0.25)',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 0 40px rgba(249,115,22,0.1), 0 20px 60px rgba(0,0,0,0.6)',
          }}>
          {children}
        </div>

        {footer && (
          <p className="text-center text-sm text-white/50 mt-6">{footer}</p>
        )}
      </div>
    </div>
  );
}
// @ts-nocheck
import React from "react";
import { restaurantConfig } from "@/config/restaurantConfig";

export default function AuthLayout({
  icon: Icon,
  title,
  subtitle,
  footer,
  children,
}) {
  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse at top, #3a1a00 0%, #1a0e00 40%, #080604 100%)",
      }}
    >
      {/* Flame glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-48 w-96 -translate-x-1/2 rounded-full opacity-30 blur-3xl"
        style={{
          background:
            "radial-gradient(ellipse, #ff5a00 0%, #dc2626 60%, transparent 100%)",
        }}
      />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-md flex-col">
        {/* Restaurant branding */}
<div className="mb-7 text-center">
  <div className="relative left-1/2 w-screen max-w-[520px] -translate-x-1/2 overflow-hidden">
    <img
      src={restaurantConfig.authHeroImage}
      alt={`${restaurantConfig.restaurantName} branding`}
      className="block h-auto w-full"
    />
  </div>

          <div
            className="mx-auto mb-4 h-0.5 w-4/5"
            style={{
              background:
                "linear-gradient(90deg, transparent, #f59e0b, #ff5a00, #f59e0b, transparent)",
            }}
          />

          <div className="flex items-center justify-center gap-2">
            {Icon && <Icon className="h-5 w-5 text-amber-400" />}

            <p
              className="text-sm font-medium uppercase tracking-widest"
              style={{
                color: "#f59e0b",
                fontFamily: "'Barlow Condensed', sans-serif",
              }}
            >
              {title}
            </p>
          </div>

          {subtitle && (
            <p className="mt-1 text-sm text-white/55">{subtitle}</p>
          )}
        </div>

        {/* Form card */}
        <div
          className="rounded-2xl border p-6 sm:p-8"
          style={{
            background: "rgba(20, 10, 0, 0.92)",
            borderColor: "rgba(245, 158, 11, 0.35)",
            boxShadow:
              "0 0 40px rgba(249,115,22,0.12), 0 20px 60px rgba(0,0,0,0.6)",
          }}
        >
          {children}
        </div>

        {footer && (
          <p className="mt-6 text-center text-sm text-white/55">{footer}</p>
        )}

        {/* Restaurant-specific footer artwork */}
        <div className="mt-3 w-full overflow-hidden">
          <img
            src={restaurantConfig.registerFooterImage}
            alt=""
            aria-hidden="true"
            className="block h-24 w-full object-cover"
            style={{ objectPosition: "center 58%" }}
          />
        </div>
      </div>
    </div>
  );
}

import { restaurantConfig } from '@/config/restaurantConfig';
import React from "react";
import { Link } from "react-router-dom";

export default function Register() {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "#080604" }}
    >
      {/* Top bar links */}
      <div className="flex justify-between px-5 pt-4 absolute top-0 left-0 right-0 z-20">
        <Link
          to="/employee-login"
          className="text-xs font-semibold tracking-widest uppercase px-4 py-2 rounded-full border border-amber-500/40 text-amber-400/80 hover:text-amber-300 hover:border-amber-400 transition-all"
          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
        >
          Employee Sign In
        </Link>
        <Link
          to="/admin-login"
          className="text-xs font-semibold tracking-widest uppercase px-4 py-2 rounded-full border border-amber-500/40 text-amber-400/80 hover:text-amber-300 hover:border-amber-400 transition-all"
          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
        >
          Admin Login
        </Link>
      </div>

      {/* Full-width hero image */}
      <img
  src={restaurantConfig.signupHeroImage}
  alt={`${restaurantConfig.restaurantName} Sign Up`}
        className="w-full block"
        style={{ display: "block" }}
      />

      {/* Below-image section */}
      <div
        className="flex flex-col items-center px-5 py-8 gap-6"
        style={{ background: "#080604" }}
      >
        {/* Sign Up Button */}
        <Link
          to="/signup"
          className="w-full max-w-sm flex items-center justify-center h-16 rounded-2xl font-black tracking-widest uppercase no-underline"
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "1.8rem",
            background: "linear-gradient(135deg, #f59e0b 0%, #f97316 50%, #dc2626 100%)",
            color: "#000",
            boxShadow: "0 6px 30px rgba(249,115,22,0.5), 0 2px 8px rgba(0,0,0,0.5)",
            letterSpacing: "0.1em",
          }}
        >
          SIGN UP NOW
        </Link>

        {/* Benefits Section */}
        <div className="w-full max-w-sm">
          <p
            className="text-center text-amber-400 font-black tracking-widest uppercase mb-4 text-sm"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            MEMBER BENEFITS
          </p>
          <div className="flex flex-col gap-3">
            {[
              { icon: "⭐", title: "Earn Points Every Visit", desc: "Rack up points with every purchase" },
              { icon: "🎂", title: "Birthday Rewards", desc: "Get a special treat on your birthday" },
              { icon: "🔥", title: "Exclusive Offers", desc: "Members-only deals and early access" },
              { icon: "📍", title: "Location Updates", desc: "Be first to know where we're parked" },
              { icon: "🎁", title: "Free Item Redemptions", desc: "Redeem points for food & drinks" },
            ].map((b) => (
              <div
                key={b.title}
                className="flex items-center gap-4 px-4 py-3 rounded-xl"
                style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.15)" }}
              >
                <span className="text-2xl">{b.icon}</span>
                <div>
                  <p className="text-amber-400 font-bold text-sm leading-tight"
                    style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>
                    {b.title}
                  </p>
                  <p className="text-white/50 text-xs">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-white/40 text-sm text-center">
          Already have an account?{" "}
          <Link to="/login" className="text-amber-400 hover:underline font-semibold">
            Member Log In
          </Link>
        </p>
        <p className="text-white/25 text-xs text-center -mt-3">
          Employees & admins use the links at the top of the page.
        </p>


      </div>

     {/* Charcoal Charm BBQ Footer */}
<div className="relative mt-2 w-full overflow-hidden bg-[#080604]">
  {/* Floating embers */}
  <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
    {[
      { left: "8%", delay: "0s", duration: "5s", size: "3px" },
      { left: "19%", delay: "1.2s", duration: "6s", size: "2px" },
      { left: "34%", delay: "2.4s", duration: "5.5s", size: "3px" },
      { left: "52%", delay: "0.8s", duration: "6.5s", size: "2px" },
      { left: "68%", delay: "3s", duration: "5.2s", size: "3px" },
      { left: "82%", delay: "1.8s", duration: "6.2s", size: "2px" },
      { left: "93%", delay: "3.8s", duration: "5.8s", size: "3px" },
    ].map((ember, index) => (
      <span
        key={index}
        className="absolute bottom-10 rounded-full bg-orange-500"
        style={{
          left: ember.left,
          width: ember.size,
          height: ember.size,
          animation: `charcoalEmber ${ember.duration} linear ${ember.delay} infinite`,
          boxShadow:
            "0 0 6px rgba(249,115,22,0.95), 0 0 12px rgba(245,158,11,0.65)",
        }}
      />
    ))}
  </div>

  <img
    src={restaurantConfig.registerFooterImage}
    alt=""
    aria-hidden="true"
    className="relative z-0 block h-28 w-full object-cover"
style={{ objectPosition: "center 58%" }}
  />

  <style>
    {`
      @keyframes charcoalEmber {
        0% {
          transform: translateY(8px) translateX(0) scale(0.7);
          opacity: 0;
        }

        15% {
          opacity: 0.9;
        }

        55% {
          transform: translateY(-35px) translateX(6px) scale(1);
          opacity: 0.75;
        }

        100% {
  transform: translateY(-55px) translateX(-5px) scale(0.4);
  opacity: 0;
}
      }

      @media (prefers-reduced-motion: reduce) {
        [style*="charcoalEmber"] {
          animation: none !important;
          opacity: 0;
        }
      }
    `}
  </style>
</div>
    </div>
  );
}
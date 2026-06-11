import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { user, login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      if (user.role === "Supplier") {
        navigate("/tender-portal", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(username, password);
      if (user.role === "Supplier") {
        navigate("/tender-portal", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      setError(err.message || "ავტორიზაცია ვერ მოხერხდა");
    } finally {
      setLoading(false);
    }
  };

  const demos = [
    { u: "admin",   r: "გენ. მენეჯერი", p: "admin123" },
    { u: "metro",   r: "მომწოდებელი",   p: "pass123"  },
    { u: "greenf",   r: "მომწოდებელი",   p: "pass123"  },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;900&family=Inter:wght@400;500;600;700&display=swap');
        .login-root { font-family: 'Inter', sans-serif; }
        .font-outfit { font-family: 'Outfit', sans-serif; }
        @keyframes rotateBlob {
          0% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(180deg) scale(1.15); }
          100% { transform: rotate(360deg) scale(1); }
        }
        .anim-blob-1 { animation: rotateBlob 20s infinite alternate ease-in-out; }
        .anim-blob-2 { animation: rotateBlob 25s infinite alternate-reverse ease-in-out; }
        @keyframes pulseGlow {
          0%, 100% { filter: drop-shadow(0 0 15px rgba(181, 104, 42, 0.2)); }
          50% { filter: drop-shadow(0 0 25px rgba(181, 104, 42, 0.45)); }
        }
        .pulse-glow { animation: pulseGlow 4s infinite ease-in-out; }
      `}</style>

      <div className="login-root relative flex min-h-screen items-center justify-center overflow-hidden bg-[#07080a] px-4 py-12">
        {/* Animated Background Blobs */}
        <div className="anim-blob-1 absolute -left-[10%] -top-[10%] h-[55vw] w-[55vw] rounded-full bg-brand-600/10 blur-[130px] pointer-events-none" />
        <div className="anim-blob-2 absolute -right-[10%] -bottom-[10%] h-[55vw] w-[55vw] rounded-full bg-brand-700/8 blur-[130px] pointer-events-none" />
        <div className="absolute left-[35%] top-[25%] h-[35vw] w-[35vw] rounded-full bg-amber-500/5 blur-[110px] pointer-events-none" />

        <div className="w-full max-w-[430px] z-10 animate-slide-up">
          <div className="backdrop-blur-xl bg-[#13141a]/70 border border-white/5 rounded-3xl p-8 lg:p-10 shadow-2xl">
            {/* Header / Logo */}
            <div className="flex flex-col items-center text-center mb-8">
              <div className="pulse-glow flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lg shadow-brand-500/25 mb-4">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <h1 className="text-3xl font-black text-white tracking-tight leading-none mb-1.5 font-outfit">eTender</h1>
              <p className="text-[10px] font-bold text-brand-400 tracking-[0.18em] uppercase">შესყიდვების პლატფორმა</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 rounded-xl bg-red-950/30 border border-red-900/40 p-3.5 text-xs text-red-400 animate-slide-up flex items-center gap-2">
                <svg className="shrink-0 text-red-500" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold uppercase tracking-wider text-neutral-400">მომხმარებელი</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                    </svg>
                  </span>
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="სახელი"
                    className="w-full pl-10 pr-4 py-3 bg-[#090a0f]/60 border border-neutral-800 rounded-xl text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all duration-200"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-bold uppercase tracking-wider text-neutral-400">პაროლი</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 bg-[#090a0f]/60 border border-neutral-800 rounded-xl text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all duration-200"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-brand-600 to-brand-750 hover:from-brand-500 hover:to-brand-650 text-white rounded-xl font-bold text-sm tracking-wide shadow-lg shadow-brand-600/15 active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:pointer-events-none"
              >
                {loading ? (
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                ) : (
                  <>
                    <span>შესვლა</span>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                    </svg>
                  </>
                )}
              </button>
            </form> 
          </div>
        </div>
      </div>
    </>
  );
}

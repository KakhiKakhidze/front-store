import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(username, password);
      // Redirect based on role
      if (user.role === "Supplier") {
        navigate("/tender-portal", { replace: true });
      } else {
        navigate("/", { replace: true });
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
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');
        .login-root { font-family: 'DM Sans', sans-serif; }
        .login-serif { font-family: 'DM Serif Display', serif; }
        .float-label { position: relative; }
        .float-label input { padding: 22px 16px 8px; height: 58px; background: transparent;
          border: 1.5px solid #d4d0ca; border-radius: 6px; width: 100%; font-size: 15px;
          color: #1a1614; outline: none; transition: border-color .2s; font-family: 'DM Sans', sans-serif; }
        .float-label input:focus { border-color: #b5682a; }
        .float-label label { position: absolute; left: 16px; top: 50%; transform: translateY(-50%);
          font-size: 14px; color: #9e9790; pointer-events: none; transition: all .18s ease;
          font-family: 'DM Sans', sans-serif; }
        .float-label input:focus ~ label,
        .float-label input:not(:placeholder-shown) ~ label {
          top: 12px; transform: none; font-size: 10px; letter-spacing: .06em;
          text-transform: uppercase; color: #b5682a; font-weight: 500; }
        .demo-chip { border: 1px solid #e8e4df; background: #faf9f7; border-radius: 6px;
          padding: 7px 12px; cursor: pointer; transition: all .15s; text-align: left; }
        .demo-chip:hover { border-color: #b5682a; background: #fdf6ee; }
        .submit-btn { width: 100%; height: 52px; background: #1a1614; color: #faf9f7;
          border: none; border-radius: 6px; font-size: 14px; font-weight: 500;
          letter-spacing: .04em; cursor: pointer; transition: background .15s;
          font-family: 'DM Sans', sans-serif; display: flex; align-items: center;
          justify-content: center; gap: 8px; }
        .submit-btn:hover { background: #2d2522; }
        .submit-btn:disabled { opacity: .5; cursor: not-allowed; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin .7s linear infinite; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:none; } }
        .fade-up { animation: fadeUp .35s ease-out both; }
      `}</style>

      <div className="flex h-full login-root" style={{ background: "#faf9f7" }}>

        {/* ── LEFT PANEL ── */}
        <div
          className="hidden lg:flex flex-col justify-between w-[420px] shrink-0 relative overflow-hidden"
          style={{ background: "#1a1614" }}
        >
          {/* Geometric background */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 420 900" fill="none" preserveAspectRatio="xMidYMid slice">
            <circle cx="420" cy="0" r="320" fill="#2d2522" />
            <circle cx="0"   cy="900" r="260" fill="#2d2522" />
            <circle cx="210" cy="450" r="180" fill="none" stroke="#3d3330" strokeWidth="1" />
            <circle cx="210" cy="450" r="280" fill="none" stroke="#2d2522" strokeWidth="1" />
            <line x1="0" y1="0" x2="420" y2="900" stroke="#2d2522" strokeWidth="1" />
            <line x1="420" y1="0" x2="0" y2="900" stroke="#2d2522" strokeWidth="1" />
            <rect x="60" y="200" width="300" height="500" rx="4" fill="none" stroke="#3d3330" strokeWidth="1" />
          </svg>

          <div className="relative z-10 p-10 pt-12">
            <div style={{ color: "#b5682a", fontSize: 11, fontWeight: 600, letterSpacing: ".14em", textTransform: "uppercase", marginBottom: 16 }}>
              შესყიდვების პლატფორმა
            </div>
            <div className="login-serif" style={{ fontSize: 42, lineHeight: 1.1, color: "#faf9f7", fontStyle: "italic" }}>
              eTender
            </div>
          </div>

          <div className="relative z-10 p-10 pb-12 space-y-10">
            <p className="login-serif" style={{ fontSize: 28, lineHeight: 1.35, color: "#faf9f7" }}>
              გამჭვირვალე<br />
              <span style={{ color: "#b5682a", fontStyle: "italic" }}>ტენდერები.</span><br />
              ეფექტური<br />შესყიდვები.
            </p>

            <div style={{ borderTop: "1px solid #3d3330", paddingTop: 28 }}>
              {[
                ["01", "ტენდერების მართვა"],
                ["02", "მომწოდებლების ბაზა"],
                ["03", "ანალიტიკა და ანგარიშები"],
              ].map(([n, t]) => (
                <div key={n} style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
                  <span style={{ fontSize: 10, color: "#b5682a", fontWeight: 600, letterSpacing: ".1em", width: 20 }}>{n}</span>
                  <span style={{ fontSize: 13, color: "#9e9790" }}>{t}</span>
                </div>
              ))}
            </div>

            <p style={{ fontSize: 11, color: "#4d4744", letterSpacing: ".05em" }}>© 2026 eTender</p>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="flex items-center justify-center flex-1 px-6 py-12">
          <div className="w-full max-w-[380px] fade-up">

            {/* Mobile logo */}
            <div className="mb-8 lg:hidden">
              <p className="login-serif" style={{ fontSize: 28, color: "#1a1614", fontStyle: "italic" }}>eTender</p>
              <p style={{ fontSize: 12, color: "#9e9790", marginTop: 2 }}>შესყიდვების პლატფორმა</p>
            </div>

            <div style={{ marginBottom: 36 }}>
              <p style={{ fontSize: 11, color: "#b5682a", fontWeight: 600, letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 10 }}>
                სისტემაში შესვლა
              </p>
              <p className="login-serif" style={{ fontSize: 30, color: "#1a1614", lineHeight: 1.2 }}>
                კეთილი იყოს<br />თქვენი დაბრუნება
              </p>
            </div>

            {error && (
              <div style={{ marginBottom: 20, padding: "11px 14px", background: "#fdf2f2",
                border: "1px solid #fad4d4", borderRadius: 6, fontSize: 13, color: "#c0392b" }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="float-label">
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder=" "
                  required
                  autoFocus
                  autoComplete="username"
                />
                <label>მომხმარებელი</label>
              </div>

              <div className="float-label">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder=" "
                  required
                  autoComplete="current-password"
                />
                <label>პაროლი</label>
              </div>

              <button type="submit" disabled={loading} className="submit-btn" style={{ marginTop: 6 }}>
                {loading
                  ? <svg className="spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity=".25"/><path d="M12 2a10 10 0 0 1 10 10" /></svg>
                  : <>
                      <span>შესვლა</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                    </>
                }
              </button>
            </form>

            {/* Demo accounts */}
            <div style={{ marginTop: 32, paddingTop: 24, borderTop: "1px solid #e8e4df" }}>
              <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".12em", textTransform: "uppercase",
                color: "#b8b2ab", marginBottom: 12 }}>სატესტო წვდომა</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {demos.map(({ u, r, p }) => (
                  <button key={u} type="button" className="demo-chip"
                    onClick={() => { setUsername(u); setPassword(p); }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: "#1a1614", fontFamily: "monospace" }}>{u}</p>
                    <p style={{ fontSize: 10, color: "#9e9790", marginTop: 1 }}>{r}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

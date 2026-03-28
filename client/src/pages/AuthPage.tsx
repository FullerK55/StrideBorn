import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

const AVATARS = ["⚔️", "🧙", "🏹", "🛡️", "💀", "🔮", "🗡️", "🪄"];

export default function AuthPage() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState("⚔️");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    if (mode === "login") {
      const { error } = await signIn(email, password);
      if (error) setError(error);
    } else {
      if (!username.trim()) { setError("Username is required."); setLoading(false); return; }
      const { error } = await signUp(email, password, username.trim(), avatar);
      if (error) setError(error);
      else setSuccess(true);
    }
    setLoading(false);
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", background: "#0a0a1a", border: "2px solid #3a3a6a",
    color: "#e0e0ff", fontFamily: "'VT323', monospace", fontSize: 18,
    padding: "10px 12px", outline: "none", boxSizing: "border-box",
    letterSpacing: 1,
  };

  const btnStyle: React.CSSProperties = {
    width: "100%", background: "rgba(102,255,136,0.08)", border: "2px solid #66ff88",
    color: "#66ff88", fontFamily: "'Press Start 2P', monospace", fontSize: 10,
    padding: "14px", cursor: "pointer", letterSpacing: 2, marginTop: 8,
    transition: "background 0.15s",
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#0a0a1a",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'VT323', monospace", padding: 16,
    }}>
      <div style={{
        width: "100%", maxWidth: 400,
        border: "2px solid #3a3a6a", background: "#0f0f2a",
        padding: 32,
      }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 14, color: "#FFD700", letterSpacing: 3, marginBottom: 6 }}>
            STRIDE BORN
          </div>
          <div style={{ fontSize: 16, color: "#6a6aaa", letterSpacing: 2 }}>
            {mode === "login" ? "SIGN IN TO CONTINUE" : "CREATE YOUR ACCOUNT"}
          </div>
        </div>

        {success ? (
          <div style={{ textAlign: "center", color: "#66ff88", fontSize: 16, lineHeight: 1.6 }}>
            Account created!<br />
            <span style={{ color: "#aaa", fontSize: 14 }}>Check your email to confirm, then sign in.</span>
            <br /><br />
            <button onClick={() => { setMode("login"); setSuccess(false); }} style={{ ...btnStyle, width: "auto", padding: "10px 20px" }}>
              GO TO LOGIN
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {mode === "signup" && (
              <>
                <div>
                  <div style={{ fontSize: 13, color: "#6a6aaa", marginBottom: 4, letterSpacing: 1 }}>USERNAME</div>
                  <input
                    style={inputStyle}
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    maxLength={16}
                    placeholder="Adventurer"
                    autoComplete="off"
                  />
                </div>
                <div>
                  <div style={{ fontSize: 13, color: "#6a6aaa", marginBottom: 6, letterSpacing: 1 }}>CHOOSE AVATAR</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {AVATARS.map(a => (
                      <button
                        key={a} type="button"
                        onClick={() => setAvatar(a)}
                        style={{
                          fontSize: 22, background: avatar === a ? "rgba(102,255,136,0.15)" : "transparent",
                          border: "2px solid " + (avatar === a ? "#66ff88" : "#3a3a6a"),
                          padding: "6px 10px", cursor: "pointer", borderRadius: 4,
                        }}
                      >{a}</button>
                    ))}
                  </div>
                </div>
              </>
            )}
            <div>
              <div style={{ fontSize: 13, color: "#6a6aaa", marginBottom: 4, letterSpacing: 1 }}>EMAIL</div>
              <input
                style={inputStyle} type="email"
                value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" required autoComplete="email"
              />
            </div>
            <div>
              <div style={{ fontSize: 13, color: "#6a6aaa", marginBottom: 4, letterSpacing: 1 }}>PASSWORD</div>
              <input
                style={inputStyle} type="password"
                value={password} onChange={e => setPassword(e.target.value)}
                placeholder="password" required
                minLength={6}
              />
            </div>
            {error && (
              <div style={{ color: "#FF4444", fontSize: 14, background: "rgba(255,68,68,0.08)", border: "1px solid rgba(255,68,68,0.3)", padding: "8px 12px" }}>
                {error}
              </div>
            )}
            <button type="submit" style={btnStyle} disabled={loading}>
              {loading ? "..." : mode === "login" ? "ENTER DUNGEON" : "CREATE HERO"}
            </button>
            <div style={{ textAlign: "center", marginTop: 4 }}>
              <button
                type="button"
                onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(null); }}
                style={{ background: "none", border: "none", color: "#6a6aaa", fontFamily: "'VT323', monospace", fontSize: 16, cursor: "pointer", letterSpacing: 1 }}
              >
                {mode === "login" ? "No account? Create one" : "Back to sign in"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

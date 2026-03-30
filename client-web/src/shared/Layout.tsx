import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AiChatWidget } from "./AiChatWidget";
import { clearToken, TOKEN_KEY, AUTH_EVENT, isAdmin } from "../services/authApi";
import { getNotifications, PublicNotification } from "../services/orderApi";

const THEME_KEY = "trustme_theme";

function useTheme() {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    localStorage.setItem(THEME_KEY, dark ? "dark" : "light");
  }, [dark]);

  return { dark, toggle: () => setDark((d) => !d) };
}

/**
 * Reads auth state reactively: listens to localStorage events
 * so the header updates immediately after login/logout.
 */
function useAuth() {
  const [loggedIn, setLoggedIn] = useState(() => !!localStorage.getItem(TOKEN_KEY));
  const [admin, setAdmin] = useState(isAdmin());

  useEffect(() => {
    const check = () => {
      setLoggedIn(!!localStorage.getItem(TOKEN_KEY));
      setAdmin(isAdmin());
    };

    const onStorage = (e: StorageEvent) => {
      if (e.key === TOKEN_KEY) check();
    };
    
    window.addEventListener("storage", onStorage);
    window.addEventListener(AUTH_EVENT, check);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(AUTH_EVENT, check);
    };
  }, []);

  return { loggedIn, admin, setLoggedIn };
}

type Props = { children: React.ReactNode };

export const Layout: React.FC<Props> = ({ children }) => {
  const navigate = useNavigate();
  const { loggedIn, admin, setLoggedIn } = useAuth();
  const { dark, toggle: toggleTheme } = useTheme();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Notification state
  const [notifications, setNotifications] = useState<PublicNotification[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [readIds, setReadIds] = useState<Set<number>>(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem("trustme_read_notifs") ?? "[]"));
    } catch { return new Set(); }
  });

  const loadNotifs = useCallback(() => {
    getNotifications().then(setNotifications).catch(() => {});
  }, []);

  useEffect(() => { loadNotifs(); }, [loadNotifs]);

  const unreadCount = notifications.filter((n) => !readIds.has(n.id)).length;

  const markAllRead = () => {
    const ids = new Set(notifications.map((n) => n.id));
    setReadIds(ids);
    localStorage.setItem("trustme_read_notifs", JSON.stringify([...ids]));
  };

  const handleLogout = () => {
    clearToken();
    setLoggedIn(false);
    navigate("/");
  };

  return (
    <div className="app-root">
      {/* ---- Header (obj-header-logo + obj-header-auth-btn) ---- */}
      <header className="app-header">
        <div className="logo">
          <Link to="/" id="obj-header-logo">trustme-shop</Link>
        </div>

        <nav className="nav-links">
          <Link to="/">Trang chủ</Link>
        </nav>

        <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            title={dark ? "Chuyển sang sáng" : "Chuyển sang tối"}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.4rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              borderRadius: '50%',
              transition: 'background 0.2s, color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--accent-soft)';
              e.currentTarget.style.color = 'var(--accent)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none';
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
          >
            {dark ? (
              /* Geometric sun: center circle + 8 tick marks */
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                <circle cx="10" cy="10" r="3.5" />
                <line x1="10" y1="1.5" x2="10" y2="3.2" />
                <line x1="10" y1="16.8" x2="10" y2="18.5" />
                <line x1="1.5" y1="10" x2="3.2" y2="10" />
                <line x1="16.8" y1="10" x2="18.5" y2="10" />
                <line x1="4.1" y1="4.1" x2="5.3" y2="5.3" />
                <line x1="14.7" y1="14.7" x2="15.9" y2="15.9" />
                <line x1="15.9" y1="4.1" x2="14.7" y2="5.3" />
                <line x1="5.3" y1="14.7" x2="4.1" y2="15.9" />
              </svg>
            ) : (
              /* Crescent via two overlapping circles (geometric, no emoji) */
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M14.5 10.5A6 6 0 0 1 8 4a6 6 0 1 0 6.5 6.5Z"
                  fill="currentColor"
                  opacity="0.85"
                />
              </svg>
            )}
          </button>

          {/* Notification Bell (always visible) */}
          <div style={{ position: 'relative' }}>
            <button
              className="ghost-button"
              onClick={() => { setShowNotifs(!showNotifs); if (!showNotifs) markAllRead(); }}
              style={{ padding: '0.4rem', border: 'none', display: 'flex', alignItems: 'center', position: 'relative' }}
              title="Thông báo"
            >
              {/* Geometric bell: flat-sided body + arc handle */}
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3.5C8.96 3.5 6.5 6 6.5 9v4.5L4.5 16h15l-2-2.5V9C17.5 6 15.04 3.5 12 3.5z" />
                <path d="M10.3 19.5a1.7 1.7 0 0 0 3.4 0" />
                <line x1="12" y1="2" x2="12" y2="3.5" />
              </svg>
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute', top: 0, right: 0,
                  background: '#ef4444', color: '#fff',
                  fontSize: 10, fontWeight: 700,
                  width: 16, height: 16, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{unreadCount}</span>
              )}
            </button>
            {showNotifs && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 100 }} onClick={() => setShowNotifs(false)} />
                <div style={{
                  position: 'absolute', right: 0, top: 'calc(100% + 8px)', zIndex: 110,
                  background: 'var(--bg-elevated, #fff)', border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-card-hover)',
                  width: 320, maxHeight: 360, overflowY: 'auto',
                  padding: 'var(--space-sm)',
                }}>
                  <div style={{ fontWeight: 700, fontSize: 'var(--font-sm)', marginBottom: 'var(--space-sm)', padding: '0 var(--space-xs)' }}>
                    Thông báo
                  </div>
                  {notifications.length === 0 && (
                    <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-xs)', textAlign: 'center', padding: 'var(--space-lg) 0' }}>
                      Không có thông báo
                    </p>
                  )}
                  {notifications.map((n) => (
                    <div key={n.id} style={{
                      padding: 'var(--space-sm)',
                      borderRadius: 'var(--radius-sm)',
                      background: readIds.has(n.id) ? 'transparent' : 'var(--accent-soft, #eef2ff)',
                      marginBottom: 'var(--space-xs)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', marginBottom: 2 }}>
                        <span style={{ fontSize: 14 }}>
                          {n.type === 'PROMO' ? '🎉' : n.type === 'DISCOUNT' ? '🏷️' : 'ℹ️'}
                        </span>
                        <span style={{ fontWeight: 600, fontSize: 'var(--font-sm)' }}>{n.title}</span>
                      </div>
                      <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                        {n.message}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {loggedIn ? (
            <>
              {/* Cart Icon */}
              <button
                className="ghost-button"
                onClick={() => navigate("/checkout")}
                style={{ padding: '0.4rem', border: 'none', display: 'flex', alignItems: 'center' }}
                title="Giỏ hàng"
              >
                {/* Tote bag: arc handle + tapered body */}
                <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                  <path d="M4 10h16l-1.2 11H5.2z" />
                </svg>
              </button>

              {/* Profile Icon With Dropdown */}
              <div style={{ position: 'relative' }}>
                <button
                  className="ghost-button"
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  style={{ 
                    padding: 0, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    borderRadius: '50%', 
                    width: '32px', 
                    height: '32px', 
                    background: showProfileMenu ? 'var(--accent)' : 'var(--skeleton-base)',
                    border: 'none',
                    color: showProfileMenu ? '#fff' : 'var(--text)',
                    transition: 'all 0.2s',
                    marginLeft: '0.5rem',
                  }}
                  title="Tài khoản"
                >
                  {/* Geometric person: circle head + U-shaped shoulders */}
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="8" r="3.5" />
                    <path d="M5 21c0-3.87 3.13-7 7-7s7 3.13 7 7" />
                  </svg>
                </button>

                {showProfileMenu && (
                  <>
                    <div 
                      style={{ position: 'fixed', inset: 0, zIndex: 100 }} 
                      onClick={() => setShowProfileMenu(false)} 
                    />
                    <div style={{ 
                      position: 'absolute', 
                      right: 0, 
                      top: 'calc(100% + 8px)', 
                      zIndex: 110, 
                      background: 'var(--bg-elevated)', 
                      border: '1px solid var(--border-subtle)', 
                      borderRadius: 'var(--radius-md)', 
                      boxShadow: 'var(--shadow-card-hover)', 
                      width: 220, 
                      display: 'flex', 
                      flexDirection: 'column', 
                      padding: 'var(--space-xs) 0',
                      animation: 'tooltip-in 0.2s ease-out'
                    }}>
                      <div style={{ padding: 'var(--space-xs) var(--space-lg)', borderBottom: '1px solid var(--border-subtle)', marginBottom: 'var(--space-2xs)' }}>
                        <div style={{ fontWeight: 600, fontSize: 'var(--font-sm)' }}>Tài khoản của tôi</div>
                      </div>
                      <button className="dropdown-item" onClick={() => { setShowProfileMenu(false); navigate("/profile"); }}>
                        Thông tin tài khoản
                      </button>
                      <button className="dropdown-item" onClick={() => { setShowProfileMenu(false); navigate("/orders"); }}>
                        Đơn hàng của tôi
                      </button>
                      
                      {admin && (
                        <button className="dropdown-item" onClick={() => { setShowProfileMenu(false); navigate("/admin"); }}>
                          Quản trị viên (Admin)
                        </button>
                      )}
                      
                      <div style={{ borderTop: '1px solid var(--border-subtle)', margin: 'var(--space-2xs) 0' }} />
                      
                      <button className="dropdown-item text-danger" onClick={() => { setShowProfileMenu(false); handleLogout(); }}>
                        Đăng xuất
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <button
              id="obj-header-auth-btn"
              className="primary-button"
              onClick={() => navigate("/auth/login")}
            >
              Đăng nhập
            </button>
          )}
        </div>
      </header>

      {/* ---- Page Content ---- */}
      <main className="app-main">{children}</main>

      {/* ---- Footer ---- */}
      <footer className="app-footer">
        <span>© {new Date().getFullYear()} trustme-shop</span>
      </footer>

      {/* ---- AI Chat Widget (fixed, appears on all pages) ---- */}
      <AiChatWidget />
    </div>
  );
};



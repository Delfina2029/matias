'use client';

import React, { useState } from 'react';
import { loginWithEmail, registerWithEmail, quickLogin } from '@/lib/auth';

const GALLERY_IMAGES = [
  {
    url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80',
    label: 'Cocinas modernas',
  },
  {
    url: 'https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=800&q=80',
    label: 'Diseño de interiores',
  },
  {
    url: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80',
    label: 'Muebles premium',
  },
  {
    url: 'https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=800&q=80',
    label: 'Proyectos personalizados',
  },
];

const ERROR_MESSAGES: Record<string, string> = {
  'auth/invalid-email': 'El formato de usuario o correo no es válido.',
  'auth/user-not-found': 'No existe una cuenta con ese usuario.',
  'auth/wrong-password': 'La contraseña es incorrecta.',
  'auth/invalid-credential': 'Email o contraseña incorrectos.',
  'auth/too-many-requests': 'Demasiados intentos. Intenta de nuevo más tarde.',
  'auth/email-already-in-use': 'Este email ya está registrado con otra cuenta.',
  'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
};

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setActiveImage((prev) => (prev + 1) % GALLERY_IMAGES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const userTarget = email.trim() || 'usuario';
      await loginWithEmail(userTarget, password);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? '';
      setError(ERROR_MESSAGES[code] ?? 'Ocurrió un error al ingresar.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (role: 'admin' | 'ventas' | 'usuario') => {
    setError('');
    setLoading(true);
    try {
      await quickLogin(role);
    } catch (err) {
      console.error(err);
      setError('Error al ingresar con acceso directo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.wrapper}>
      {/* ─── LEFT: Gallery ─── */}
      <div className="nidel-gallery">
        {/* Overlay gradient */}
        <div style={styles.galleryOverlay} />

        {/* Sliding images */}
        {GALLERY_IMAGES.map((img, i) => (
          <div
            key={i}
            style={{
              ...styles.galleryImage,
              backgroundImage: `url(${img.url})`,
              opacity: i === activeImage ? 1 : 0,
              transition: 'opacity 1.2s ease-in-out',
            }}
          />
        ))}

        {/* Brand info on top of image */}
        <div style={styles.galleryContent}>
          <div style={styles.logoRow}>
            <div style={styles.logoIcon}>N</div>
            <span style={styles.logoText}>Nidel Muebles</span>
          </div>
          <h1 style={styles.galleryTitle}>
            Diseñá los muebles<br />de tus sueños
          </h1>
          <p style={styles.gallerySubtitle}>
            Constructor de cocinas y muebles de melamina a medida.
          </p>

          {/* Dot indicators */}
          <div style={styles.dots}>
            {GALLERY_IMAGES.map((img, i) => (
              <button
                key={i}
                id={`gallery-dot-${i}`}
                onClick={() => setActiveImage(i)}
                style={{
                  ...styles.dot,
                  ...(i === activeImage ? styles.dotActive : {}),
                }}
                aria-label={img.label}
              />
            ))}
          </div>
          <p style={styles.imageLabel}>{GALLERY_IMAGES[activeImage].label}</p>
        </div>
      </div>

      {/* ─── RIGHT: Login form ─── */}
      <div className="nidel-form-panel">
        <div style={styles.formCard}>
          <div className="nidel-mobile-logo">
            <div style={styles.logoIcon}>N</div>
            <span style={styles.logoText}>Nidel Muebles</span>
          </div>

          <div style={styles.badgeContainer}>
            <span style={styles.systemBadge}>
              <span style={styles.badgeDot} />
              Sistema Nidel · Acceso Habilitado
            </span>
          </div>

          <h2 style={styles.formTitle}>Acceso al Diseñador</h2>
          <p style={styles.formSubtitle}>
            Ingresá tu correo o nombre para ingresar directamente
          </p>

          <form onSubmit={handleSubmit} style={styles.form} noValidate>
            {/* User/Email field */}
            <div style={styles.fieldGroup}>
              <label htmlFor="email" style={styles.label}>
                Tu Correo Electrónico o Nombre
              </label>
              <div style={styles.inputWrapper}>
                <svg style={styles.inputIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <input
                  id="email"
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@email.com o tu usuario"
                  style={styles.input}
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password field */}
            <div style={styles.fieldGroup}>
              <label htmlFor="password" style={styles.label}>
                Contraseña
              </label>
              <div style={styles.inputWrapper}>
                <svg style={styles.inputIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingresá tu contraseña"
                  style={styles.input}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  id="toggle-password"
                  onClick={() => setShowPassword((v) => !v)}
                  style={styles.eyeButton}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} width={18} height={18}>
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} width={18} height={18}>
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div style={styles.errorBox} role="alert">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={16} height={16} style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
              </div>
            )}

            {/* Submit button */}
            <button
              id="login-btn"
              type="submit"
              disabled={loading}
              style={{
                ...styles.submitBtn,
                ...(loading ? styles.submitBtnDisabled : {}),
              }}
            >
              {loading ? (
                <span style={styles.spinner} />
              ) : (
                'Ingresar al Sistema'
              )}
            </button>
          </form>

          {/* Quick access section */}
          <div style={styles.divider}>
            <span style={styles.dividerLine} />
            <span style={styles.dividerText}>O ACCESO RÁPIDO</span>
            <span style={styles.dividerLine} />
          </div>

          <div style={styles.quickButtonsGrid}>
            <button
              type="button"
              id="quick-login-usuario"
              disabled={loading}
              onClick={() => handleQuickLogin('usuario')}
              style={styles.quickUsuarioBtn}
            >
              <div style={styles.quickBtnIconWrapperGold}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={22} height={22}>
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={styles.quickBtnTitleGold}>Ingresar como Usuario</div>
                <div style={styles.quickBtnSubtitle}>Diseñador 3D & Cotizador (Acceso libre directo)</div>
              </div>
            </button>

            <button
              type="button"
              id="quick-login-admin"
              disabled={loading}
              onClick={() => handleQuickLogin('admin')}
              style={styles.quickAdminBtn}
            >
              <div style={styles.quickBtnIconWrapper}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={20} height={20}>
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={styles.quickBtnTitle}>Matías (Admin)</div>
                <div style={styles.quickBtnSubtitle}>Fábrica & Ventas</div>
              </div>
            </button>

            <button
              type="button"
              id="quick-login-ventas"
              disabled={loading}
              onClick={() => handleQuickLogin('ventas')}
              style={styles.quickVentasBtn}
            >
              <div style={styles.quickBtnIconWrapper}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={20} height={20}>
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={styles.quickBtnTitle}>Ventas</div>
                <div style={styles.quickBtnSubtitle}>Cotizador</div>
              </div>
            </button>
          </div>

          <p style={styles.footer}>
            © {new Date().getFullYear()} Nidel Muebles · Todos los derechos reservados
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .nidel-gallery {
          position: relative;
          flex: 1 1 55%;
          min-height: 100vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .nidel-form-panel {
          flex: 0 0 45%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 32px;
          background-color: #0f0f14;
          overflow-y: auto;
        }
        .nidel-mobile-logo {
          display: none;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
          justify-content: center;
        }
        @media (max-width: 860px) {
          .nidel-gallery { display: none !important; }
          .nidel-form-panel { flex: 0 0 100%; padding: 32px 20px; }
          .nidel-mobile-logo { display: flex !important; }
        }
      `}</style>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#0f0f14',
    fontFamily: "'Inter', sans-serif",
  },

  // Gallery (left panel)
  galleryOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(135deg, rgba(10,10,20,0.75) 0%, rgba(10,10,20,0.4) 60%, rgba(10,10,20,0.8) 100%)',
    zIndex: 1,
  },
  galleryImage: {
    position: 'absolute',
    inset: 0,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    zIndex: 0,
  },
  galleryContent: {
    position: 'relative',
    zIndex: 2,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    height: '100%',
    padding: '48px',
  },
  logoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: 'auto',
  },
  logoIcon: {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #c8a96e, #a07840)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '22px',
    fontWeight: '700',
    color: '#fff',
    boxShadow: '0 4px 20px rgba(200,169,110,0.4)',
  },
  logoText: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#fff',
    letterSpacing: '-0.3px',
  },
  galleryTitle: {
    fontSize: '40px',
    fontWeight: '800',
    color: '#fff',
    lineHeight: '1.2',
    marginBottom: '16px',
    letterSpacing: '-0.5px',
    textShadow: '0 2px 20px rgba(0,0,0,0.5)',
  },
  gallerySubtitle: {
    fontSize: '16px',
    color: 'rgba(255,255,255,0.75)',
    marginBottom: '32px',
    lineHeight: '1.6',
  },
  dots: {
    display: 'flex',
    gap: '8px',
    marginBottom: '12px',
  },
  dot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: 'rgba(255,255,255,0.35)',
    cursor: 'pointer',
    padding: 0,
    transition: 'all 0.3s ease',
  },
  dotActive: {
    width: '28px',
    borderRadius: '4px',
    backgroundColor: '#c8a96e',
  },
  imageLabel: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
  },

  // Form panel (right)
  formCard: {
    width: '100%',
    maxWidth: '430px',
  },
  badgeContainer: {
    marginBottom: '12px',
  },
  systemBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '4px 12px',
    borderRadius: '20px',
    backgroundColor: 'rgba(200, 169, 110, 0.12)',
    border: '1px solid rgba(200, 169, 110, 0.25)',
    color: '#c8a96e',
    fontSize: '12px',
    fontWeight: '600',
  },
  badgeDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#4ade80',
    boxShadow: '0 0 8px #4ade80',
  },
  formTitle: {
    fontSize: '26px',
    fontWeight: '700',
    color: '#f0ece4',
    marginBottom: '6px',
    letterSpacing: '-0.3px',
  },
  formSubtitle: {
    fontSize: '14px',
    color: '#8a8a9a',
    marginBottom: '26px',
    lineHeight: '1.5',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#b0aec8',
    letterSpacing: '0.3px',
    textTransform: 'uppercase',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '16px',
    width: '18px',
    height: '18px',
    color: '#6a6a8a',
    pointerEvents: 'none',
  },
  input: {
    width: '100%',
    padding: '13px 44px',
    backgroundColor: '#161626',
    border: '1px solid #2a2a44',
    borderRadius: '12px',
    color: '#f0ece4',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxSizing: 'border-box',
  },
  eyeButton: {
    position: 'absolute',
    right: '14px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#6a6a8a',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: 'rgba(220, 60, 60, 0.12)',
    border: '1px solid rgba(220, 60, 60, 0.3)',
    borderRadius: '10px',
    padding: '12px 16px',
    color: '#ff7a7a',
    fontSize: '13px',
  },
  submitBtn: {
    padding: '14px',
    background: 'linear-gradient(135deg, #c8a96e, #a07840)',
    border: 'none',
    borderRadius: '12px',
    color: '#fff',
    fontSize: '15px',
    fontWeight: '700',
    cursor: 'pointer',
    letterSpacing: '0.3px',
    transition: 'opacity 0.2s, transform 0.1s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '48px',
    boxShadow: '0 4px 18px rgba(200,169,110,0.3)',
    marginTop: '4px',
  },
  submitBtnDisabled: {
    opacity: 0.7,
    cursor: 'not-allowed',
  },
  spinner: {
    width: '20px',
    height: '20px',
    border: '3px solid rgba(255,255,255,0.3)',
    borderTopColor: '#fff',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    display: 'inline-block',
  },
  toggleBtn: {
    background: 'none',
    border: 'none',
    color: '#c8a96e',
    fontSize: '13px',
    cursor: 'pointer',
    marginTop: '4px',
    textAlign: 'center',
    fontWeight: '600',
    transition: 'color 0.2s',
    outline: 'none',
  },

  // Divider
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    margin: '22px 0 16px',
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    backgroundColor: 'rgba(200, 169, 110, 0.15)',
  },
  dividerText: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#6a6a8a',
    letterSpacing: '0.8px',
  },

  // Quick buttons
  quickButtonsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  quickUsuarioBtn: {
    gridColumn: '1 / -1',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '13px 16px',
    backgroundColor: 'rgba(200, 169, 110, 0.12)',
    border: '1px solid rgba(200, 169, 110, 0.45)',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 2px 14px rgba(200, 169, 110, 0.15)',
  },
  quickBtnIconWrapperGold: {
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #c8a96e, #a07840)',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    boxShadow: '0 2px 8px rgba(200, 169, 110, 0.3)',
  },
  quickBtnTitleGold: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#ffffff',
    lineHeight: '1.2',
  },
  quickAdminBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 14px',
    backgroundColor: '#161628',
    border: '1px solid rgba(200, 169, 110, 0.35)',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  quickVentasBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 14px',
    backgroundColor: '#161628',
    border: '1px solid #2a2a44',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  quickBtnIconWrapper: {
    width: '34px',
    height: '34px',
    borderRadius: '8px',
    backgroundColor: 'rgba(200, 169, 110, 0.15)',
    color: '#c8a96e',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  quickBtnTitle: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#f0ece4',
    lineHeight: '1.2',
  },
  quickBtnSubtitle: {
    fontSize: '11px',
    color: '#8a8a9a',
    lineHeight: '1.2',
    marginTop: '2px',
  },

  footer: {
    marginTop: '28px',
    textAlign: 'center',
    fontSize: '12px',
    color: '#4a4a6a',
  },
};

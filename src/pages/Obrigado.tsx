import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../scalius-landing.css';

const Obrigado = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Disparar pixel de Purchase se disponível
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'Purchase', {
        content_name: 'Assinatura Scalius',
        currency: 'BRL',
      });
    }
  }, []);

  return (
    <div className="scalius-landing-wrapper" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px' }}>
      {/* Logo */}
      <a href="/" style={{ marginBottom: '48px' }}>
        <img src="/scalius-logo-dark.png" alt="Scalius" style={{ height: '28px', objectFit: 'contain' }} />
      </a>

      {/* Card de sucesso */}
      <div style={{
        background: 'white',
        border: '1px solid rgba(255, 94, 0, 0.15)',
        borderRadius: '24px',
        padding: '48px 40px',
        maxWidth: '480px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 20px 60px -10px rgba(0,0,0,0.08)',
      }}>
        {/* Ícone de sucesso */}
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #22c55e, #16a34a)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px auto',
          boxShadow: '0 12px 24px -6px rgba(34, 197, 94, 0.4)',
        }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>

        {/* Título */}
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f1117', marginBottom: '12px', lineHeight: 1.2 }}>
          Pagamento confirmado!
        </h1>

        {/* Mensagem */}
        <p style={{ fontSize: '1rem', color: '#64748b', lineHeight: 1.6, marginBottom: '32px' }}>
          Recebemos o seu pagamento com sucesso. Nossa equipe entrará em contato em breve para ativar a sua loja no Scalius. 🚀
        </p>

        {/* Info box */}
        <div style={{
          background: 'rgba(255, 94, 0, 0.05)',
          border: '1px solid rgba(255, 94, 0, 0.15)',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '32px',
          textAlign: 'left',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5, margin: 0 }}>
              Você receberá uma confirmação por e-mail (caso tenha informado) e nossa equipe ativará sua loja em até <strong>24 horas úteis</strong>.
            </p>
          </div>
        </div>

        {/* Botão voltar */}
        <a
          href="/"
          className="btn btn-brand"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 28px', fontSize: '15px', textDecoration: 'none', width: '100%', justifyContent: 'center', boxSizing: 'border-box' }}
        >
          Voltar para o início
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M3 12h18M13 6l6 6-6 6" />
          </svg>
        </a>

        {/* WhatsApp fallback */}
        <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '20px' }}>
          Dúvidas?{' '}
          <a
            href="https://wa.me/5563984142775?text=Ol%C3%A1!%20Acabei%20de%20assinar%20o%20Scalius%20e%20gostaria%20de%20mais%20informa%C3%A7%C3%B5es."
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}
          >
            Fale com nossa equipe
          </a>
        </p>
      </div>

      {/* Footer simples */}
      <p style={{ marginTop: '32px', fontSize: '13px', color: '#94a3b8' }}>
        © {new Date().getFullYear()} Scalius. Todos os direitos reservados.
      </p>
    </div>
  );
};

export default Obrigado;

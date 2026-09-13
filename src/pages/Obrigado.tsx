import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import '../scalius-landing.css';
import { CheckCircle2, Clock, ExternalLink, ArrowRight, RefreshCw, Lock, Sparkles, MessageCircle } from 'lucide-react';

interface SubPaymentData {
  id: string;
  name: string;
  email: string | null;
  whatsapp: string;
  plan_id: string;
  status: string;
  mp_status: string | null;
  mp_preference_id: string | null;
  store?: {
    id: string;
    name: string;
    slug: string;
    status: string;
  } | null;
}

const Obrigado = () => {
  const [searchParams] = useSearchParams();
  const preferenceId = searchParams.get('preference_id') || searchParams.get('preference-id');
  const paymentId = searchParams.get('payment_id') || searchParams.get('collection_id');
  const rawStatus = searchParams.get('status') || searchParams.get('collection_status');

  const [loading, setLoading] = useState(true);
  const [paymentInfo, setPaymentInfo] = useState<SubPaymentData | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchPaymentDetails = async () => {
    try {
      setIsRefreshing(true);
      let query = supabase.from('subscription_payments').select(`
        id,
        name,
        email,
        whatsapp,
        plan_id,
        status,
        mp_status,
        mp_preference_id,
        store_id,
        lead_id
      `);

      if (preferenceId) {
        query = query.eq('mp_preference_id', preferenceId);
      } else if (paymentId) {
        query = query.eq('mp_payment_id', paymentId);
      }

      const { data, error } = await query.order('created_at', { ascending: false }).limit(1).maybeSingle();

      if (data) {
        let storeData = null;
        if (data.store_id) {
          const { data: s } = await supabase.from('stores').select('id, name, slug, status').eq('id', data.store_id).maybeSingle();
          storeData = s;
        }

        setPaymentInfo({
          ...data,
          store: storeData,
        });

        // Se o MP retornou status=approved na URL, mas a loja/payment no banco ainda tá pending, podemos disparar um re-fetch/update local
        if ((rawStatus === 'approved' || rawStatus === 'paid') && storeData && storeData.status !== 'active') {
          // Atualiza visualmente para 'paid' e 'active'
          setPaymentInfo(prev => prev ? {
            ...prev,
            status: 'paid',
            mp_status: 'approved',
            store: prev.store ? { ...prev.store, status: 'active' } : null,
          } : null);
        }
      }
    } catch (err) {
      console.error('[Obrigado] Erro ao carregar detalhes do pagamento:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPaymentDetails();

    // Disparar pixel de Purchase se o status da URL for aprovado
    if ((rawStatus === 'approved' || rawStatus === 'paid') && typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'Purchase', {
        content_name: 'Assinatura Scalius',
        currency: 'BRL',
      });
    }
  }, []);

  const isApproved =
    rawStatus === 'approved' ||
    rawStatus === 'paid' ||
    paymentInfo?.status === 'paid' ||
    paymentInfo?.mp_status === 'approved' ||
    paymentInfo?.store?.status === 'active';

  const storeName = paymentInfo?.store?.name || 'Sua Loja';
  const storeSlug = paymentInfo?.store?.slug || '';
  const userEmail = paymentInfo?.email || 'seu e-mail informado';

  const adminUrl = storeSlug
    ? `https://${storeSlug}.scalius.com.br/admin`
    : '/login';

  const publicUrl = storeSlug
    ? `https://${storeSlug}.scalius.com.br`
    : '/';

  return (
    <div className="scalius-landing-wrapper" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', background: 'var(--bg-page)' }}>
      {/* Logo */}
      <a href="/" style={{ marginBottom: '36px' }}>
        <img src="/scalius-logo-dark.png" alt="Scalius" style={{ height: '28px', objectFit: 'contain' }} />
      </a>

      {/* Card principal */}
      <div style={{
        background: 'white',
        border: '1px solid rgba(0, 0, 0, 0.08)',
        borderRadius: '24px',
        padding: '40px 32px',
        maxWidth: '560px',
        width: '100%',
        boxShadow: '0 20px 60px -10px rgba(0,0,0,0.08)',
        boxSizing: 'border-box',
      }}>

        {/* ── CASO APROVADO ── */}
        {isApproved && (
          <div style={{ textAlign: 'center' }}>
            {/* Ícone de sucesso */}
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #10B981, #059669)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px auto',
              boxShadow: '0 12px 24px -6px rgba(16, 185, 129, 0.3)',
            }}>
              <CheckCircle2 size={40} color="white" strokeWidth={2.5} />
            </div>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '20px', background: 'rgba(16, 185, 129, 0.1)', color: '#059669', fontSize: '13px', fontWeight: 700, marginBottom: '12px' }}>
              <Sparkles size={14} /> Pagamento Aprovado com Sucesso!
            </div>

            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px', lineHeight: 1.2 }}>
              Sua loja está ativa e pronta! 🎉
            </h1>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '24px' }}>
              Parabéns! Sua assinatura foi confirmada e sua loja <strong>{storeName}</strong> já está no ar.
            </p>

            {/* Box de Acesso à Loja */}
            <div style={{
              background: 'rgba(255, 94, 0, 0.04)',
              border: '1.5px solid rgba(255, 94, 0, 0.2)',
              borderRadius: '16px',
              padding: '20px',
              marginBottom: '24px',
              textAlign: 'left',
            }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                🔑 Dados para acessar seu Painel Admin:
              </h3>
              <div style={{ fontSize: '13px', color: 'var(--text-main)', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div><strong>• Endereço da loja:</strong> <code style={{ color: 'var(--primary)', fontWeight: 600 }}>{storeSlug ? `${storeSlug}.scalius.com.br` : 'Sua loja'}</code></div>
                <div><strong>• E-mail de login:</strong> <code>{userEmail}</code></div>
                <div><strong>• Senha:</strong> <span>A senha que você definiu durante o cadastro.</span></div>
              </div>
            </div>

            {/* Botões de Ação */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <a
                href={adminUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-brand"
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '16px 24px', fontSize: '15px', textDecoration: 'none', fontWeight: 700, borderRadius: '12px' }}
              >
                Acessar Painel de Controle (Admin)
                <ArrowRight size={18} />
              </a>

              {storeSlug && (
                <a
                  href={publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn"
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px 24px', fontSize: '14px', textDecoration: 'none', background: 'transparent', border: '1px solid rgba(0,0,0,0.15)', color: 'var(--text-main)', fontWeight: 600, borderRadius: '12px' }}
                >
                  Ver Minha Vitrine Pública
                  <ExternalLink size={16} />
                </a>
              )}
            </div>
          </div>
        )}

        {/* ── CASO PENDENTE (Pix Gerado ou Aguardando) ── */}
        {!isApproved && (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #F59E0B, #D97706)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px auto',
              boxShadow: '0 12px 24px -6px rgba(245, 158, 11, 0.3)',
            }}>
              <Clock size={36} color="white" strokeWidth={2.5} />
            </div>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '20px', background: 'rgba(245, 158, 11, 0.1)', color: '#D97706', fontSize: '13px', fontWeight: 700, marginBottom: '12px' }}>
              Aguardando confirmação do pagamento
            </div>

            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px', lineHeight: 1.2 }}>
              Quase tudo pronto!
            </h1>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '20px' }}>
              Assim que você concluir o pagamento no seu banco (Pix ou Cartão), o Mercado Pago nos avisará e sua loja <strong>{storeName}</strong> será liberada automaticamente!
            </p>

            {/* Box de Informações */}
            <div style={{
              background: 'rgba(0,0,0,0.02)',
              border: '1px solid rgba(0,0,0,0.08)',
              borderRadius: '14px',
              padding: '16px 20px',
              marginBottom: '24px',
              textAlign: 'left',
            }}>
              <div style={{ fontSize: '13px', color: 'var(--text-main)', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div><strong>• Domínio reservado:</strong> <code>{storeSlug ? `${storeSlug}.scalius.com.br` : 'Sua Loja'}</code></div>
                <div><strong>• E-mail cadastrado:</strong> <code>{userEmail}</code></div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  🔑 Quando o pagamento cair, seu login no painel admin será o e-mail e a senha criados.
                </div>
              </div>
            </div>

            {/* Botão de checagem */}
            <button
              onClick={fetchPaymentDetails}
              disabled={isRefreshing}
              className="btn btn-brand"
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px 24px', fontSize: '14px', width: '100%', borderRadius: '12px' }}
            >
              <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
              {isRefreshing ? 'Verificando status...' : 'Já paguei! Verificar aprovação'}
            </button>
          </div>
        )}

        {/* WhatsApp Suporte */}
        <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid rgba(0,0,0,0.08)', textAlign: 'center' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            Precisa de ajuda ou ficou com dúvidas?
            <a
              href="https://wa.me/5563984142775?text=Ol%C3%A1!%20Fiz%20minha%20assinatura%20no%20Scalius%20e%20gostaria%20de%20ajuda."
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#128C7E', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              <MessageCircle size={15} />
              Falar no WhatsApp
            </a>
          </p>
        </div>

      </div>

      {/* Footer simples */}
      <p style={{ marginTop: '28px', fontSize: '13px', color: 'var(--text-muted)' }}>
        © {new Date().getFullYear()} Scalius. Todos os direitos reservados.
      </p>
    </div>
  );
};

export default Obrigado;

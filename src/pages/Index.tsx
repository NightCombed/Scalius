import React, { useEffect, useRef, useState } from 'react';
import '../scalius-landing.css';
import { ContainerScroll } from '../components/ContainerScroll';
import { Rocket, Instagram, ArrowRight } from 'lucide-react';
import ShowcaseFlowPath from '../components/ShowcaseFlowPath';
import { supabase } from '@/integrations/supabase/client';
import { CatalogAnimation } from '../components/animations/CatalogAnimation';
import { PaymentAnimation } from '../components/animations/PaymentAnimation';
import { ShippingAnimation } from '../components/animations/ShippingAnimation';

const Index = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const showcaseContainerRef = useRef<HTMLDivElement>(null);
  const mobileScrollRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState(1);

  const handleTabChange = (newTab: number) => {
    setActiveTab(newTab);
  };

  const handleMobileScroll = () => {
    if (!mobileScrollRef.current) return;
    const container = mobileScrollRef.current;
    const scrollLeft = container.scrollLeft;
    const firstChild = container.firstElementChild as HTMLElement;
    const cardWidth = firstChild ? firstChild.offsetWidth + 16 : container.clientWidth * 0.8;
    const newIndex = Math.round(scrollLeft / cardWidth) + 1;
    const clampedIndex = Math.max(1, Math.min(3, newIndex));
    if (clampedIndex !== activeTab) {
      setActiveTab(clampedIndex);
    }
  };

  const scrollToCard = (step: number) => {
    setActiveTab(step);
    if (mobileScrollRef.current) {
      const card = mobileScrollRef.current.children[step - 1] as HTMLElement;
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  };
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [leadName, setLeadName] = useState('');
  const [leadWhatsApp, setLeadWhatsApp] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<{ name: string; url: string } | null>(null);
  const [formErrors, setFormErrors] = useState<{ name?: string; whatsapp?: string }>({});
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);

  const formatWhatsApp = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 2) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  };

  const handleWhatsAppChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLeadWhatsApp(formatWhatsApp(e.target.value));
  };

  const handleOpenModal = (e: React.MouseEvent, planName: string, whatsappUrl: string) => {
    e.preventDefault();
    setSelectedPlan({ name: planName, url: whatsappUrl });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setLeadName('');
    setLeadWhatsApp('');
    setLeadEmail('');
    setFormErrors({});
  };

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;

    const errors: { name?: string; whatsapp?: string } = {};
    if (!leadName.trim()) {
      errors.name = 'Nome completo é obrigatório.';
    }
    const cleanPhoneDigits = leadWhatsApp.replace(/\D/g, '');
    if (!leadWhatsApp.trim() || cleanPhoneDigits.length < 10) {
      errors.whatsapp = 'WhatsApp válido é obrigatório.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmittingLead(true);

    try {
      // 1. Salvar na base
      const utmSource = sessionStorage.getItem('utm_source');
      const utmMedium = sessionStorage.getItem('utm_medium');
      const utmCampaign = sessionStorage.getItem('utm_campaign');
      const utmContent = sessionStorage.getItem('utm_content');
      const fbclid = sessionStorage.getItem('fbclid');

      const { error } = await supabase.from('leads').insert({
        name: leadName.trim(),
        whatsapp: leadWhatsApp,
        email: leadEmail.trim() || null,
        plan_name: selectedPlan.name,
        utm_source: utmSource,
        utm_medium: utmMedium,
        utm_campaign: utmCampaign,
        utm_content: utmContent,
        fbclid: fbclid
      });

      if (error) {
        console.error('Erro ao salvar lead:', error);
      }

      // 2. Disparar pixel
      const nameParts = leadName.trim().split(/\s+/);
      const firstName = nameParts[0] || '';
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

      const phoneInput = document.getElementById('lead-whatsapp') as HTMLInputElement;
      const emailInput = document.getElementById('lead-email') as HTMLInputElement;

      const cleanPhone = '55' + phoneInput.value.replace(/\D/g, '');
      const emailValue = emailInput ? emailInput.value.trim().toLowerCase() : '';

      if (typeof window !== 'undefined' && window.fbq) {
        // Set user data for Advanced Matching without re-initializing the Pixel
        window.fbq('set', 'userData', {
          ph: cleanPhone,
          fn: firstName,
          ln: lastName,
          ...(emailValue ? { em: emailValue } : {})
        });

        // Track Lead event with standard parameters
        window.fbq('track', 'Lead', {
          content_name: 'Plano ' + selectedPlan.name
        });
      }

      // 3. Redirecionar após 300ms
      setTimeout(() => {
        let finalUrl = selectedPlan.url;
        try {
          const urlObj = new URL(finalUrl);
          
          if (utmSource) urlObj.searchParams.set('utm_source', utmSource);
          if (utmMedium) urlObj.searchParams.set('utm_medium', utmMedium);
          if (utmCampaign) urlObj.searchParams.set('utm_campaign', utmCampaign);
          if (utmContent) urlObj.searchParams.set('utm_content', utmContent);
          if (fbclid) urlObj.searchParams.set('fbclid', fbclid);
          
          finalUrl = urlObj.toString();
        } catch (e) {
          console.error('Erro ao injetar UTMs no link do WhatsApp:', e);
        }

        window.open(finalUrl, '_blank', 'noopener,noreferrer');
        handleCloseModal();
        setIsSubmittingLead(false);
      }, 300);

    } catch (err) {
      console.error('Erro inesperado no fluxo de lead:', err);
      setIsSubmittingLead(false);
    }
  };

  useEffect(() => {
    try {
      // Capturar e guardar parâmetros UTM e fbclid se presentes na URL
      const searchParams = new URLSearchParams(window.location.search);
      const uSource = searchParams.get('utm_source');
      const uMedium = searchParams.get('utm_medium');
      const uCampaign = searchParams.get('utm_campaign');
      const uContent = searchParams.get('utm_content');
      const fclid = searchParams.get('fbclid');

      if (uSource) sessionStorage.setItem('utm_source', uSource);
      if (uMedium) sessionStorage.setItem('utm_medium', uMedium);
      if (uCampaign) sessionStorage.setItem('utm_campaign', uCampaign);
      if (uContent) sessionStorage.setItem('utm_content', uContent);
      if (fclid) sessionStorage.setItem('fbclid', fclid);
    } catch (e) {
      console.error('Erro ao extrair parâmetros UTM e fbclid:', e);
    }
  }, []);

  useEffect(() => {
    try {
      // Reveal on scroll
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('active');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1 });
      document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));

      // Magnetic Buttons
      const magneticBtns = document.querySelectorAll('.btn');
      magneticBtns.forEach(btn => {
        const el = btn as HTMLElement;
        el.addEventListener('mousemove', (e: Event) => {
          const me = e as MouseEvent;
          const rect = el.getBoundingClientRect();
          const x = me.clientX - rect.left - rect.width / 2;
          const y = me.clientY - rect.top - rect.height / 2;
          el.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
        });
        el.addEventListener('mouseleave', () => { el.style.transform = 'translate(0px, 0px)'; });
      });

      // Bento Hover Glow
      const bentoItems = document.querySelectorAll('.bento-item');
      bentoItems.forEach(item => {
        const el = item as HTMLElement;
        el.addEventListener('mousemove', (e: Event) => {
          const me = e as MouseEvent;
          const rect = el.getBoundingClientRect();
          el.style.setProperty('--mouse-x', `${me.clientX - rect.left}px`);
          el.style.setProperty('--mouse-y', `${me.clientY - rect.top}px`);
        });
      });

      // Problem cards glow
      const syncPointer = (e: PointerEvent) => {
        document.querySelectorAll('.problem-card[data-glow]').forEach(card => {
          const el = card as HTMLElement;
          const rect = el.getBoundingClientRect();
          el.style.setProperty('--x', (e.clientX - rect.left).toFixed(2));
          el.style.setProperty('--xp', (e.clientX / window.innerWidth).toFixed(2));
          el.style.setProperty('--y', (e.clientY - rect.top).toFixed(2));
          el.style.setProperty('--yp', (e.clientY / window.innerHeight).toFixed(2));
        });
      };
      document.addEventListener('pointermove', syncPointer);

      // Rotating word in Hero
      const palavras = ['independente.', 'automatizada.', 'profissional.', 'inteligente.', 'escalável.'];
      const elemento = document.querySelector('.palavra-rotativa .palavra') as HTMLElement;
      let index = 0;
      let intervalId: ReturnType<typeof setInterval> | null = null;
      if (elemento) {
        intervalId = setInterval(() => {
          elemento.style.animation = 'slideOutUp 0.3s ease forwards';
          setTimeout(() => {
            index = (index + 1) % palavras.length;
            elemento.textContent = palavras[index];
            elemento.style.animation = 'slideInUp 0.3s ease forwards';
          }, 300);
        }, 3000);
      }

      // Tabs logic is now managed by React state

      // FAQ Accordion
      const faqQuestions = document.querySelectorAll('.faq-question');
      faqQuestions.forEach(question => {
        question.addEventListener('click', () => {
          const item = question.parentElement;
          const answer = question.nextElementSibling as HTMLElement;
          const isActive = item?.classList.contains('active');
          document.querySelectorAll('.faq-item').forEach(faq => {
            faq.classList.remove('active');
            const ans = faq.querySelector('.faq-answer') as HTMLElement;
            if (ans) ans.style.maxHeight = '';
          });
          if (!isActive && item && answer) {
            item.classList.add('active');
            answer.style.maxHeight = answer.scrollHeight + 'px';
          }
        });
      });

      return () => {
        document.removeEventListener('pointermove', syncPointer);
        if (intervalId) clearInterval(intervalId);
      };
    } catch (e) {
      console.error('Error executing landing scripts', e);
    }
  }, []);

  return (
    <div className="scalius-landing-wrapper" ref={containerRef}>

      {/* NAVBAR */}
      <div className="navbar-wrapper">
        <nav className="navbar">
          <a href="#" className="logo">
            <img src="/scalius-logo-dark.png" alt="Scalius" className="h-7 object-contain" />
          </a>
          <div className="nav-links">
            <a href="#recursos">Recursos</a>
            <a href="#como-funciona">Como Funciona</a>
            <a href="#precos">Planos</a>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <a href="#precos" className="btn btn-primary" style={{ padding: '10px 20px', fontSize: '13px', boxShadow: 'none' }}>Criar Loja</a>
          </div>
        </nav>
      </div>

      {/* HERO SECTION */}
      <section className="hero">
        <div className="container hero-container">
          {/* Esquerda: Textos e CTA */}
          <div className="hero-content reveal">
            <div className="hero-badge" style={{ border: '1px solid rgba(255, 94, 0, 0.15)' }}>
              <Rocket size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />
              Sua vitrine escalando
            </div>
            <h1>
              Venda mais com sua loja online completa e{' '}
              <span className="palavra-rotativa" style={{ display: 'inline-block' }}><span className="palavra">independente.</span></span>
            </h1>
            <p>Catálogo, Pix automático, frete inteligente e notificações em tempo real. Tudo em um só lugar, sem depender do WhatsApp.</p>

            <div className="hero-cta-group">
              <div className="hero-btns">
                <a href="#precos" className="btn btn-brand">
                  Começar Agora
                  <span className="btn-icon-circle">
                    <ArrowRight size={18} color="var(--primary)" />
                  </span>
                </a>
              </div>
            </div>

            {/* Integration logos com SVGs reais */}
            <div className="integration-logos-wrapper">
              <span className="integration-logos-label">INTEGRADO COM:</span>
              <div className="integration-logos">
                {/* Mercado Pago */}
                <div className="integration-card">
                  <img src="/svg/mercado-pago-wordmark.svg" alt="Mercado Pago" style={{ height: '20px', width: 'auto' }} />
                </div>
                {/* Melhor Envio */}
                <div className="integration-card">
                  <img src="/svg/melhor-envio.png" alt="Melhor Envio" style={{ height: '20px', width: 'auto' }} />
                </div>
                {/* AWS */}
                <div className="integration-card">
                  <img src="/svg/aws.png" alt="AWS" style={{ height: '20px', width: 'auto' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Direita: Composição Flutuante */}
          <div className="hero-visual reveal" style={{ transitionDelay: '0.2s' }}>
            <div className="composition-wrapper">
              <div className="screenshots-stack">
                <div className="stack-card card-back-left">
                  <div className="browser-frame">
                    <div className="browser-header">
                      <div className="dots"><span></span><span></span><span></span></div>
                      <div className="url-bar">scalius.com.br/admin</div>
                    </div>
                    <img src="/pedidos_print.png" alt="Gestão de Pedidos" className="stack-img" />
                  </div>
                </div>
                <div className="stack-card card-back-right">
                  <div className="browser-frame">
                    <div className="browser-header">
                      <div className="dots"><span></span><span></span><span></span></div>
                      <div className="url-bar">scalius.com.br/admin</div>
                    </div>
                    <img src="/produtos_print.png" alt="Gestão de Produtos" className="stack-img" />
                  </div>
                </div>
                <div className="stack-card card-main">
                  <div className="browser-frame">
                    <div className="browser-header">
                      <div className="dots"><span></span><span></span><span></span></div>
                      <div className="url-bar">scalius.com.br/admin</div>
                    </div>
                    <img src="/admin_print.png" alt="Scalius Dashboard" className="main-screenshot" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CONTAINER SCROLL - Vitrine no Celular */}
      <ContainerScroll
        titleComponent={
          <div className="flex w-full flex-col items-center text-center">
            <h2 className="hero-title-match">
              Uma vitrine que faz seus <br className="hidden md:block" />
              clientes <span>comprarem mais.</span>
            </h2>
            <p className="w-full max-w-xl text-center text-[#667085] text-sm md:text-base leading-relaxed">
              Com o Scalius, seus clientes navegam por categorias, veem fotos, selecionam variações e fecham a compra com conforto.
            </p>
          </div>
        }
      />

      {/* RECURSOS EXTRAS - BENTO GRID */}
      <section className="section" id="recursos-extras">
        <div className="container">
          <div className="bento-header bento-header-tight reveal">
            <h2>Detalhes que fazem gigante <br className="hidden md:block" />diferença.</h2>
            <p>O Scalius também brilha nos detalhes administrativos.</p>
          </div>
          <div className="bento-grid bento-grid-two">
            {/* Card 1 – Customização */}
            <div className="bento-item bento-feature reveal" style={{ transitionDelay: '0s' }}>
              <div className="bento-icon-wrapper modern-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="2" y1="12" x2="22" y2="12"></line>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                </svg>
              </div>
              <h3>Sua marca. Do jeito que você imaginou.</h3>
              <p>Personalize Banner de Capa, Avatar, cores e textos da loja — e veja as mudanças aplicadas em tempo real.</p>
              <ul className="feature-list">
                {['Logo e banner da loja', 'Paleta de cores personalizável', 'Mensagem e tagline da vitrine', 'Edições salvas instantaneamente'].map(item => (
                  <li key={item} className="feature-list-item">
                    {item === 'Paleta de cores personalizável' ? (
                      <span className="palette-sync-row">
                        <span className="palette-sync-swatch">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </span>
                        <span className="palette-sync-label">{item}</span>
                      </span>
                    ) : (
                      <>
                        <span className="feature-list-icon">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </span>
                        {item}
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* Card 2 – Mobile */}
            <div className="bento-item bento-feature reveal" style={{ transitionDelay: '0.15s' }}>
              <div className="bento-icon-wrapper modern-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                  <line x1="12" y1="18" x2="12.01" y2="18"></line>
                </svg>
              </div>
              <h3>Gerencie sua loja <br className="hidden md:block" /> também pela palma da sua mão.</h3>
              <p>Acompanhe pedidos, ajuste produtos e gerencie sua operação de qualquer lugar, sem depender de um computador.</p>
              <ul className="feature-list">
                {['Vitrine pensada para compra pelo celular', 'Painel acessível para ajustes rápidos', 'Pedidos e estoque sempre por perto', 'Checkout responsivo para o cliente finalizar com conforto'].map(item => (
                  <li key={item} className="feature-list-item">
                    <span className="feature-list-icon">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* PRODUCT SHOWCASE ZIG-ZAG */}
      <section className="section" id="recursos">
        <div className="container" ref={showcaseContainerRef} style={{ position: 'relative' }}>
          <div className="bento-header reveal">
            <h2>Um arsenal completo.</h2>
            <p>Abaixo detalhamos a artilharia pesada do Scalius para você focar apenas em faturar e escalar.</p>
          </div>

          {/* Row 1 */}
          <div className="showcase-row reveal">
            <div className="showcase-text">
              <div className="hero-badge" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>Catálogo Sem Limites</div>
              <h2>Seu estoque sempre certo. Nunca mais passe vergonha.</h2>
              <p>Vendeu a última blusa tamanho G? Ela some da vitrine automaticamente. Nosso motor de variações rastreia variantes personalizadas e bloqueia a venda do que você não tem em mãos.</p>
              <ul className="showcase-feature-list">
                {['Produtos e pedidos 100% ilimitados', 'Criação de Variações dinâmicas (Ex: Tamanho, Cor, Material)', 'Rastreio e controle de estoque independente por variação', 'Produto some ou aparece "Esgotado" automaticamente quando estoque zera', 'Aviso de produtos esgotados e em baixo estoque', 'Upload avançado de imagens por produto', 'Destaque de produtos específicos'].map(item => (
                  <li key={item}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg> {item}</li>
                ))}
              </ul>
            </div>
            <div className="showcase-image">
              <video
                src="/showcase-catalogo.mp4"
                autoPlay
                loop
                muted
                playsInline
                aria-label="Demonstração em vídeo do catálogo com variações"
              />
            </div>
          </div>

          {/* Row 2 */}
          <div className="showcase-row reveal">
            <div className="showcase-text">
              <div className="hero-badge" style={{ background: 'var(--success-light)', color: 'var(--success)' }}>Checkout de Alta Conversão</div>
              <h2>Como funciona o Pix com baixa Automática do Scalius?</h2>
              <p>1. Cliente fecha a compra na vitrine.<br />2. Sistema gera QR Code e Copia e Cola na hora.<br />3. Cliente paga e integração Mercado Pago aprova no mesmo instante.<br />4. Você é avisado e o status atualiza para "pago" sozinho.<br /><strong>Tudo isso sem você precisar dar um "bom dia".</strong></p>
              <ul className="showcase-feature-list">
                {['Integração Oficial Transparente com Mercado Pago', 'Aceita Pix nativo com verificação automática de baixa', 'Plano B garantido: Opção de Pix Manual (Cliente manda o comprovante e você atualiza o status manualmente no painel)', 'Mudança de Status instantânea'].map(item => (
                  <li key={item}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg> {item}</li>
                ))}
              </ul>
            </div>
            <div className="showcase-image">
              <img src="/showcase-pix.png" alt="Print do checkout com Pix automático" />
            </div>
          </div>

          {/* Row 3 */}
          <div className="showcase-row reveal">
            <div className="showcase-text">
              <div className="hero-badge" style={{ background: '#E0E7FF', color: '#4F46E5' }}>Central Logística</div>
              <h2>Cálculo de Frete Real e Etiqueta em 1 Clique</h2>
              <p>Integrado ao Melhor Envio (Envio Nacional). Cliente vê e paga o preço exato do frete no checkout, você gera a etiqueta completa em 1 clique, sem sair da plataforma.</p>
              <ul className="showcase-feature-list">
                {['Cálculo automático: Correios, Jadlog, Azul Cargo e etc', 'Lógica avançada de "Caixa Única" para múltiplos produtos', 'Geração de Etiqueta com 1 clique (Plano Pro)', 'Entrega local por KM, Taxa Fixa por bairro/região ou Motor de cálculo do Scalius (Simula apps de entrega)', 'Opção nativa de "Retirada na Loja Física"'].map(item => (
                  <li key={item}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg> {item}</li>
                ))}
              </ul>
            </div>
            <div className="showcase-image">
              <img src="/showcase-frete.png" alt="Print da logística com cálculo de frete e etiqueta" />
            </div>
          </div>

          {/* Row 4 */}
          <div className="showcase-row reveal">
            <div className="showcase-text">
              <div className="hero-badge" style={{ background: '#FEF3C7', color: '#D97706' }}>Retenção de Clientes</div>
              <h2>Sua loja tem memória. Cliente volta mais.</h2>
              <p>Uma loja de verdade tem Login e Senha. Cliente pode criar conta, acompanhar o pedido, e na próxima compra o endereço já está lá. Menos atrito. Mais recompra.</p>
              <ul className="showcase-feature-list">
                {[
                  'Login e cadastro direto na vitrine',
                  'Histórico visual de todos os pedidos já feitos',
                  'Link público de acompanhamento (sem precisar de login)',
                  'Cria conta após comprar — dados já preenchidos',
                  'Autopreenchimento de endereços em compras futuras'
                ].map(item => (
                  <li key={item}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg> {item}</li>
                ))}
              </ul>
            </div>
            <div className="showcase-image">
              <img src="/showcase-portal-b2c.png" alt="Print do portal B2C com histórico de compras" />
            </div>
          </div>

          {/* Row 5 */}
          <div className="showcase-row reveal">
            <div className="showcase-text">
              <div className="hero-badge" style={{ background: '#FCE7F3', color: '#DB2777' }}>Operação & Notificações</div>
              <h2>Centro de Comando e Alertas em Tempo Real</h2>
              <p>Som de alerta, aba piscando e email automático. Pedido novo entra, você sabe na hora. Mesmo estando longe do painel.</p>
              <ul className="showcase-feature-list">
                {[
                  'Som de Alerta',
                  'Aba do navegador pisca visualmente para não perder vendas',
                  'Emails automáticos de alerta para a loja (novo pedido, pagamento confirmado e cancelamento)',
                  'Emails automáticos para o cliente em cada etapa do pedido. (Plano Pro)',
                  'Ative ou desative cada notificação específica individualmente',
                  'Painel para alterar, cancelar e visualizar pedidos com extrema facilidade'
                ].map(item => (
                  <li key={item}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#DB2777" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg> {item}</li>
                ))}
              </ul>
            </div>
            <div className="showcase-image">
              <video
                src="/showcase-pulse.mp4"
                autoPlay
                loop
                muted
                playsInline
                aria-label="Demonstração em vídeo do centro de comando com alertas em tempo real"
              />
            </div>
          </div>

          <ShowcaseFlowPath containerRef={showcaseContainerRef} />
        </div>
      </section>

      {/* COMO FUNCIONA - TABS */}
      <section className="section" id="como-funciona" style={{ background: 'var(--bg-surface)' }}>
        <div className="container">
          <div className="bento-header reveal">
            <h2>Seu negócio rodando no piloto automático.</h2>
            <p>Veja como é simples iniciar e escalar suas vendas com o Scalius.</p>
          </div>

          {/* DESKTOP VERSION (lg:flex) */}
          <div className="hidden lg:block">
            <div className="tabs-wrapper process-wrapper reveal" data-step={activeTab} style={{ transitionDelay: '0.1s' }}>
              <div className="grid lg:grid-cols-2 gap-8 items-center w-full">
              <div className="flex flex-col relative w-full gap-[18px] lg:gap-[22px]">
                <div className="process-progress-head">
                  <span className="process-progress-label">
                    <span>Faturando</span>
                    <Rocket className="process-progress-rocket" aria-hidden="true" />
                  </span>
                </div>
                <div className="process-progress" aria-hidden="true">
                  <span className="process-progress-fill"></span>
                </div>

                <div className="tabs-list process-steps">
                  <button className={`tab-btn process-step ${activeTab === 1 ? 'active' : ''}`} data-tab="tab-1" data-step="1" aria-expanded={activeTab === 1} onClick={() => handleTabChange(1)}>
                    <span className="process-step-number">1</span>
                    <h3>Crie seu Catálogo.</h3>
                    <div className="process-step-body">
                      <p>Cadastre seus produtos e personalize sua loja com fotos, preços, variações e muito mais. Deixe sua vitrine com um visual único, profissional e a identidade do seu negócio.</p>
                    </div>
                  </button>
                  <button className={`tab-btn process-step ${activeTab === 2 ? 'active' : ''}`} data-tab="tab-2" data-step="2" aria-expanded={activeTab === 2} onClick={() => handleTabChange(2)}>
                    <span className="process-step-number">2</span>
                    <h3>Configure seus Pagamentos.</h3>
                    <div className="process-step-body">
                      <p>Ative o recebimento via Pix. Ao selecionar o Pix automático, todo o fluxo de checkout e aprovação acontece de forma automática, sem a sua intervenção.</p>
                    </div>
                  </button>
                  <button className={`tab-btn process-step ${activeTab === 3 ? 'active' : ''}`} data-tab="tab-3" data-step="3" aria-expanded={activeTab === 3} onClick={() => handleTabChange(3)}>
                    <span className="process-step-number">3</span>
                    <h3>Envie do seu jeito.</h3>
                    <div className="process-step-body">
                      <p>Ative e combine diferentes formas de entrega: retirada física, frete local por KM, região ou motor de cálculo que simula apps de entrega, e a praticidade do envio nacional.</p>
                    </div>
                  </button>
                </div>
              </div>

              <div className="w-full flex justify-center items-center">
                {activeTab === 1 && <CatalogAnimation />}
                {activeTab === 2 && <PaymentAnimation />}
                {activeTab === 3 && <ShippingAnimation />}
              </div>
            </div>
          </div>
        </div>

          {/* MOBILE VERSION (lg:hidden) - Horizontal Swipe Carousel */}
          <div className="lg:hidden w-full flex flex-col gap-4 mt-6 reveal">
            {/* Progress Bar */}
            <div className="w-full bg-orange-500/10 h-2 rounded-full overflow-hidden relative mx-1 mt-2">
              <div 
                className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${(activeTab / 3) * 100}%` }}
              />
            </div>

            {/* Swipeable Cards Container */}
            <div
              ref={mobileScrollRef}
              onScroll={handleMobileScroll}
              className="flex overflow-x-auto snap-x snap-mandatory gap-4 px-6 py-3 no-scrollbar scroll-smooth -mx-6"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {/* Card 1 */}
              <div className="w-[82vw] max-w-[320px] shrink-0 snap-center rounded-2xl bg-white border border-orange-500/15 shadow-sm overflow-hidden flex flex-col justify-between">
                <div className="bg-gradient-to-b from-gray-50 to-orange-50/20 overflow-hidden flex justify-center items-start h-[220px] relative border-b border-gray-100 pt-0">
                  <div className="scale-[0.75] origin-top w-full flex justify-center items-start -mt-4">
                    <CatalogAnimation />
                  </div>
                </div>
                <div className="p-5 flex flex-col gap-2 bg-white">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 font-bold text-[12px] flex items-center justify-center shrink-0">
                      1
                    </span>
                    <h3 className="text-[16px] font-bold text-gray-900 leading-snug">Crie seu Catálogo.</h3>
                  </div>
                  <p className="text-[13px] text-gray-600 leading-relaxed pl-8">
                    Cadastre seus produtos e personalize sua loja com fotos, preços, variações e muito mais. Deixe sua vitrine com um visual único e profissional.
                  </p>
                </div>
              </div>

              {/* Card 2 */}
              <div className="w-[82vw] max-w-[320px] shrink-0 snap-center rounded-2xl bg-white border border-orange-500/15 shadow-sm overflow-hidden flex flex-col justify-between">
                <div className="bg-gradient-to-b from-gray-50 to-orange-50/20 overflow-hidden flex justify-center items-start h-[220px] relative border-b border-gray-100 pt-0">
                  <div className="scale-[0.75] origin-top w-full flex justify-center items-start -mt-4">
                    <PaymentAnimation />
                  </div>
                </div>
                <div className="p-5 flex flex-col gap-2 bg-white">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 font-bold text-[12px] flex items-center justify-center shrink-0">
                      2
                    </span>
                    <h3 className="text-[16px] font-bold text-gray-900 leading-snug">Configure seus Pagamentos.</h3>
                  </div>
                  <p className="text-[13px] text-gray-600 leading-relaxed pl-8">
                    Ative o recebimento via Pix. Todo o fluxo de checkout e aprovação acontece de forma automática, sem a sua intervenção.
                  </p>
                </div>
              </div>

              {/* Card 3 */}
              <div className="w-[82vw] max-w-[320px] shrink-0 snap-center rounded-2xl bg-white border border-orange-500/15 shadow-sm overflow-hidden flex flex-col justify-between">
                <div className="bg-gradient-to-b from-gray-50 to-orange-50/20 overflow-hidden flex justify-center items-start h-[220px] relative border-b border-gray-100 pt-0">
                  <div className="scale-[0.75] origin-top w-full flex justify-center items-start -mt-4">
                    <ShippingAnimation />
                  </div>
                </div>
                <div className="p-5 flex flex-col gap-2 bg-white">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 font-bold text-[12px] flex items-center justify-center shrink-0">
                      3
                    </span>
                    <h3 className="text-[16px] font-bold text-gray-900 leading-snug">Envie do seu jeito.</h3>
                  </div>
                  <p className="text-[13px] text-gray-600 leading-relaxed pl-8">
                    Ative e combine diferentes formas de entrega: retirada física, frete local por KM ou região e a praticidade do envio nacional.
                  </p>
                </div>
              </div>
            </div>

            {/* Pagination Dots & Swipe Hint */}
            <div className="flex flex-col items-center gap-1.5 mt-1">
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3].map((step) => (
                  <button
                    key={step}
                    onClick={() => scrollToCard(step)}
                    aria-label={`Ir para passo ${step}`}
                    className={`transition-all duration-300 rounded-full ${
                      activeTab === step
                        ? 'w-7 h-2 bg-orange-500'
                        : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'
                    }`}
                  />
                ))}
              </div>
              <span className="text-[11px] text-gray-400 font-medium flex items-center gap-1">
                <span>Arraste para o lado</span>
                <svg className="w-3.5 h-3.5 animate-pulse text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="section" id="precos">
        <div className="container">
          <div className="bento-header reveal">
            <h2>Simples, justo e escalável.</h2>
            <p>Sem taxas abusivas por venda. Assine e tenha previsibilidade financeira.</p>
          </div>


          <div className="pricing-grid">
            {/* Básico */}
            <div className="pricing-card reveal">
              <div>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Básico</h3>
                <p style={{ color: 'var(--text-muted)', margin: '8px 0 32px 0', fontSize: '1rem' }}>Para quem está dando o primeiro passo digital com a loja.</p>
                <div className="price-container">
                  <div className="price">R$ 47<span>/mês</span></div>
                </div>
                <a href="#" onClick={(e) => handleOpenModal(e, 'Básico', 'https://wa.me/5563984142775?text=Olá!%20Quero%20assinar%20o%20plano%20Básico%20do%20Scalius.')} className="btn btn-brand" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', textAlign: 'center', marginTop: '20px', marginBottom: '24px' }}>Assinar Básico</a>
              </div>
              <ul className="pricing-features">
                {[
                  'Até 40 Produtos Cadastrados',
                  '1 Dispositivo Administrador Conectado',
                  'Pix Automático (Mercado Pago) e Pix Manual',
                  'Cálculo de Frete Nacional Automático e Exato (Correios, Jadlog, Azul Cargo e etc.)',
                  'Etiqueta Nacional Manual',
                  'Alertas em tempo real para a loja',
                  'Suporte Padrão via WhatsApp/E-mail',
                ].map(f => (
                  <li key={f}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg> {f}</li>
                ))}
              </ul>
            </div>

            {/* Profissional */}
            <div className="pricing-card pro reveal" style={{ transitionDelay: '0.1s' }}>
              <div className="price-badge">Mais Popular</div>
              <div>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Profissional</h3>
                <p style={{ color: 'var(--text-muted)', margin: '8px 0 32px 0', fontSize: '1rem' }}>Para quem quer máximo desempenho e profissionalismo.</p>
                <div className="price-container">
                  <div className="price">R$ 89<span>/mês</span></div>
                </div>
                <a href="#" onClick={(e) => handleOpenModal(e, 'Profissional', 'https://wa.me/5563984142775?text=Olá!%20Quero%20assinar%20o%20plano%20Profissional%20do%20Scalius.')} className="btn btn-brand" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', textAlign: 'center', marginTop: '20px', marginBottom: '24px' }}>Assinar Profissional</a>
              </div>
              <ul className="pricing-features">
                <li><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg> <strong style={{ color: 'var(--primary)' }}>Tudo do Básico, mais:</strong></li>
                {[
                  'Produtos, Pedidos e Estoque Ilimitados',
                  '2 Dispositivos Administradores Conectados',
                  'Suporte a Domínio 100% personalizado (ex: sualoja.com.br)',
                  'Portal do Cliente com Login, Histórico e Acompanhamento',
                  'Suporte Prioritário via WhatsApp/E-mail',
                ].map(f => (
                  <li key={f}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg> <strong>{f}</strong></li>
                ))}
              </ul>
            </div>

            {/* Pro */}
            <div className="pricing-card reveal" style={{ transitionDelay: '0.2s' }}>
              <div>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Pro</h3>
                <p style={{ color: 'var(--text-muted)', margin: '8px 0 32px 0', fontSize: '1rem' }}>Para quem quer escala e automação completa.</p>
                <div className="price-container">
                  <div className="price">R$ 159<span>/mês</span></div>
                </div>
                <a href="#" onClick={(e) => handleOpenModal(e, 'Pro', 'https://wa.me/5563984142775?text=Olá!%20Quero%20assinar%20o%20plano%20Pro%20do%20Scalius.')} className="btn btn-brand" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', textAlign: 'center', marginTop: '20px', marginBottom: '24px' }}>Assinar Pro</a>
              </div>
              <ul className="pricing-features">
                <li><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg> <strong>Tudo do Profissional, mais:</strong></li>
                {[
                  'Etiqueta Nacional em 1 Clique',
                  'E-mails Automáticos para o Cliente por etapa do pedido',
                  'Usuários Administradores Ilimitados',
                  'Métricas Avançadas',
                  'Suporte VIP / Atendimento prioritário dedicado',
                ].map(f => (
                  <li key={f}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg> <strong>{f}</strong></li>
                ))}
              </ul>
            </div>
          </div>
          

        </div>
      </section>

      <section className="section" id="faq">
        <div className="container">
          <div className="bento-header reveal">
            <h2>Perguntas Frequentes</h2>
            <p>Tudo que você precisa saber para dar o próximo passo.</p>
          </div>
          <div className="faq-container reveal" style={{ transitionDelay: '0.1s' }}>
            {[
              { 
                q: 'Preciso de CNPJ para começar a vender?', 
                a: 'Não! Você pode começar usando apenas o seu CPF. A ideia é eliminar a burocracia para que você coloque sua vitrine no ar hoje mesmo. Se a sua empresa crescer, você pode alterar para CNPJ depois, direto na sua conta do Mercado Pago.' 
              },
              { 
                q: 'Vocês cobram comissão por venda ou limitam a quantidade de pedidos?', 
                a: 'Diferente de aplicativos de delivery ou plataformas tradicionais, nós não cobramos nenhuma taxa sobre as suas vendas e seus pedidos são ilimitados! Você paga apenas a mensalidade fixa do seu plano. A única taxa que existe é a do próprio Mercado Pago para processar o Pix (0,99%). Todo o lucro do seu trabalho é 100% seu.' 
              },
              { 
                q: 'Como funciona o Pix Automático? Preciso conferir comprovante?', 
                a: 'Não precisa! Nosso Pix Automático, integrado oficialmente ao Mercado Pago, faz a verificação em tempo real. Assim que o cliente paga, o status do pedido muda para "Pago" sozinho no seu painel, acompanhado de um alerta sonoro. Adeus perda de tempo e risco de fraudes com comprovantes falsos no WhatsApp!' 
              },
              { 
                q: 'O cliente precisa baixar algum aplicativo para comprar da minha loja?', 
                a: 'Nenhum! Sua loja funciona como um site super leve, rápido e profissional que abre direto no navegador do celular do cliente. Ele acessa, escolhe os produtos, preenche os dados, seleciona a entrega e paga. Tudo na hora, sem atrito e sem instalar nada.' 
              },
              { 
                q: 'Eu não entendo muito de tecnologia, consigo configurar a loja sozinho?', 
                a: 'Com certeza. O Scalius foi desenhado para ser extremamente intuitivo, feito para quem precisa de praticidade. Em menos de 10 minutos você cadastra seus produtos, escolhe as cores da sua marca e conecta o seu Pix. E se precisar, nosso suporte no WhatsApp está sempre pronto para te ajudar.' 
              },
              { 
                q: 'E se eu vender um produto na loja física, como fica o site?', 
                a: 'É só acessar o painel pelo celular e dar baixa em segundos! O sistema gerencia seu estoque em tempo real. Se o produto acabar, ele automaticamente aparece como "Esgotado" na sua vitrine online, impedindo compras de itens sem estoque.' 
              },
              { 
                q: 'Como funcionam as opções de entrega?', 
                a: 'O Scalius te dá total controle logístico. Você pode configurar entrega própria (cobrando taxa por KM ou fixa por bairro), permitir "Retirada na Loja Física", ou usar a integração com o Melhor Envio para cotar automaticamente fretes via Correios e transportadoras, gerando a etiqueta com poucos cliques.' 
              },
            ].map(({ q, a }) => (
              <div key={q} className="faq-item">
                <button className="faq-question">{q}<span className="faq-icon">+</span></button>
                <div className="faq-answer"><div className="faq-answer-inner">{a}</div></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: '#0f1117', color: '#aaa', padding: '40px 24px', textAlign: 'center', fontSize: '14px' }}>
        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
          <a href="#">
            <img src="/scalius-logo.png" alt="Scalius" className="h-7 object-contain" />
          </a>
        </div>
        <p>© {new Date().getFullYear()} Scalius. Todos os direitos reservados.</p>
        <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <a href="/politica-de-privacidade" style={{ color: '#fff', textDecoration: 'none' }}>Política de Privacidade</a>
          <a href="/termos-de-servico" style={{ color: '#fff', textDecoration: 'none' }}>Termos de Serviço</a>
          <a href="https://www.instagram.com/scaliusbr/" target="_blank" rel="noopener noreferrer" style={{ color: '#fff', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Instagram size={16} />
            @scaliusbr
          </a>
        </div>
      </footer>

      {/* WHATSAPP FLOATING BUTTON */}
      <a
        href="https://wa.me/5563984142775?text=Olá!%20Gostaria%20de%20saber%20mais%20sobre%20o%20Scalius."
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 group cursor-pointer"
        aria-label="Fale conosco no WhatsApp"
      >
        <span className="bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 text-sm font-medium px-4 py-2 rounded-full shadow-lg border border-zinc-200/50 dark:border-zinc-800/50 opacity-0 scale-90 translate-x-4 pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:translate-x-0 transition-all duration-300 ease-out whitespace-nowrap">
          Fale Conosco
        </span>
        <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-[#128C7E] to-[#25D366] text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95">
          {/* Pulsing effect */}
          <span className="absolute inset-0 rounded-full bg-[#25D366]/30 animate-ping -z-10" />
          <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.455 5.703 1.458h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        </div>
      </a>

      {isModalOpen && (
        <div className="lead-modal-overlay" onClick={handleCloseModal}>
          <div className="lead-modal-container" onClick={(e) => e.stopPropagation()}>
            <button className="lead-modal-close" onClick={handleCloseModal} aria-label="Fechar">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            <div className="lead-modal-logo-wrapper">
              <img src="/scalius-logo-dark.png" alt="Scalius" className="lead-modal-logo" />
            </div>
            <div className="lead-modal-header">
              <div className="lead-modal-badge">
                Vamos <span className="highlight">começar</span>
              </div>
              <h2>Informe os dados abaixo para prosseguir.</h2>
              <p>Você será redirecionado para concluir seu atendimento no WhatsApp.</p>
            </div>
            <form onSubmit={handleLeadSubmit} className="lead-modal-form">
              <div className="form-group">
                <label htmlFor="lead-name">Nome Completo <span className="required">*</span></label>
                <input
                  type="text"
                  id="lead-name"
                  value={leadName}
                  onChange={(e) => setLeadName(e.target.value)}
                  placeholder="Seu nome completo"
                  className={formErrors.name ? 'input-error' : ''}
                  disabled={isSubmittingLead}
                />
                {formErrors.name && <span className="error-message">{formErrors.name}</span>}
              </div>
              
              <div className="form-group">
                <label htmlFor="lead-whatsapp">WhatsApp <span className="required">*</span></label>
                <input
                  type="text"
                  id="lead-whatsapp"
                  value={leadWhatsApp}
                  onChange={handleWhatsAppChange}
                  placeholder="(00) 00000-0000"
                  className={formErrors.whatsapp ? 'input-error' : ''}
                  maxLength={15}
                  disabled={isSubmittingLead}
                />
                {formErrors.whatsapp && <span className="error-message">{formErrors.whatsapp}</span>}
              </div>
              
              <div className="form-group">
                <label htmlFor="lead-email">E-mail <span className="optional">(Opcional)</span></label>
                <input
                  type="email"
                  id="lead-email"
                  value={leadEmail}
                  onChange={(e) => setLeadEmail(e.target.value)}
                  placeholder="seu.email@exemplo.com"
                  disabled={isSubmittingLead}
                />
              </div>
              
              <button type="submit" className="btn btn-brand btn-submit-lead" disabled={isSubmittingLead}>
                {isSubmittingLead ? 'Processando...' : 'Avançar para o WhatsApp'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Index;




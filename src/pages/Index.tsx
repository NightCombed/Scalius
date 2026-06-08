import React, { useEffect, useRef, useState } from 'react';
import '../scalius-landing.css';
import { ContainerScroll } from '../components/ContainerScroll';
import { Rocket, Flame } from 'lucide-react';

const Index = () => {
  const containerRef = useRef<HTMLDivElement>(null);

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

      // Tabs
      const tabBtns = document.querySelectorAll('.tab-btn');
      tabBtns.forEach(btn => {
        btn.setAttribute('aria-expanded', btn.classList.contains('active') ? 'true' : 'false');
        btn.addEventListener('click', () => {
          tabBtns.forEach(b => b.classList.remove('active'));
          tabBtns.forEach(b => b.setAttribute('aria-expanded', 'false'));
          btn.classList.add('active');
          btn.setAttribute('aria-expanded', 'true');
          const step = btn.getAttribute('data-step');
          const wrapper = btn.closest('.tabs-wrapper') as HTMLElement | null;
          if (step && wrapper) wrapper.dataset.step = step;
        });
      });

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
            <a href="#precos" className="btn btn-primary" style={{ padding: '10px 20px', fontSize: '13px' }}>Criar Loja</a>
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
              Acesso Beta: 50% OFF para os primeiros (Preço travado para sempre!)
            </div>
            <h1>
              Venda mais com sua loja online completa e{' '}
              <span className="palavra-rotativa" style={{ display: 'inline-block' }}><span className="palavra">independente.</span></span>
            </h1>
            <p>Catálogo, Pix automático, frete inteligente e notificações em tempo real. Tudo em um só lugar, sem depender do WhatsApp.</p>

            <div className="hero-cta-group">
              <div className="hero-btns">
                <a href="#precos" className="btn btn-brand">Criar minha loja grátis</a>
              </div>
              <div className="hero-cta-info">
                <span className="cta-trial-label">14 dias grátis. Sem cartão de crédito.</span>
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
              <div className="bento-icon-wrapper" style={{ color: 'var(--primary)', background: 'var(--primary-light)', border: '1px solid rgba(255,94,0,0.2)', marginBottom: '24px' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="2" y1="12" x2="22" y2="12"></line>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                </svg>
              </div>
              <h3>Sua marca. Do jeito que você imaginou.</h3>
              <p>Personalize Banner de Capa, Avatar, cores e textos da loja — e veja as mudanças aplicadas em tempo real.</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '24px 0 0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {['Logo e banner da loja', 'Paleta de cores personalizável', 'Mensagem e tagline da vitrine', 'Edições salvas instantaneamente'].map(item => (
                  <li key={item} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.92rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                    {item === 'Paleta de cores personalizável' ? (
                      <span className="palette-sync-row">
                        <span className="palette-sync-swatch">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </span>
                        <span className="palette-sync-label">{item}</span>
                      </span>
                    ) : (
                      <>
                        <span style={{ width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--primary)', backgroundColor: 'var(--primary-light)' }}>
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
              <div className="bento-icon-wrapper" style={{ color: 'var(--primary)', background: 'var(--primary-light)', border: '1px solid rgba(255,94,0,0.2)', marginBottom: '24px' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                  <line x1="12" y1="18" x2="12.01" y2="18"></line>
                </svg>
              </div>
              <h3>Gerencie sua loja <br className="hidden md:block" /> também pela palma da sua mão.</h3>
              <p>Acompanhe pedidos, ajuste produtos e gerencie sua operação de qualquer lugar, sem depender de um computador.</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '24px 0 0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {['Vitrine pensada para compra pelo celular', 'Painel acessível para ajustes rápidos', 'Pedidos e estoque sempre por perto', 'Checkout responsivo para o cliente finalizar com conforto'].map(item => (
                  <li key={item} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.92rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                    <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
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
      <section className="section" id="recursos" style={{ paddingTop: '44px' }}>
        <div className="container">
          <div className="bento-header reveal" style={{ marginBottom: '72px' }}>
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
        </div>
      </section>

      {/* COMO FUNCIONA - TABS */}
      <section className="section" id="como-funciona" style={{ background: 'var(--bg-surface)' }}>
        <div className="container">
          <div className="bento-header reveal">
            <h2>Seu negócio rodando no piloto automático.</h2>
            <p>Veja como é simples iniciar e escalar suas vendas com o Scalius.</p>
          </div>
          <div className="tabs-wrapper process-wrapper reveal" data-step="1" style={{ transitionDelay: '0.1s' }}>
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
              <button className="tab-btn process-step active" data-tab="tab-1" data-step="1" aria-expanded="true">
                <span className="process-step-number">1</span>
                <h3>Crie seu Catálogo.</h3>
                <div className="process-step-body">
                  <p>Cadastre seus produtos e personalize sua loja com fotos, preços, variações e muito mais. Deixe sua vitrine com um visual único, profissional e a identidade do seu negócio.</p>
                </div>
              </button>
              <button className="tab-btn process-step" data-tab="tab-2" data-step="2" aria-expanded="false">
                <span className="process-step-number">2</span>
                <h3>Configure seus Pagamentos.</h3>
                <div className="process-step-body">
                  <p>Ative o recebimento via Pix. Ao selecionar o Pix automático, todo o fluxo de checkout e aprovação acontece de forma automática, sem a sua intervenção.</p>
                </div>
              </button>
              <button className="tab-btn process-step" data-tab="tab-3" data-step="3" aria-expanded="false">
                <span className="process-step-number">3</span>
                <h3>Envie do seu jeito.</h3>
                <div className="process-step-body">
                  <p>Ative e combine diferentes formas de entrega: retirada física, frete local por KM, região ou motor de cálculo que simula apps de entrega, e a praticidade do envio nacional.</p>
                </div>
              </button>
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

          <div className="pricing-alert-banner reveal" style={{ transitionDelay: '0.05s' }}>
            <Flame size={20} className="alert-emoji" style={{ color: 'var(--primary)', flexShrink: 0 }} />
            <p>Assine agora durante o Beta e garanta <strong>50% de desconto com preço travado para sempre</strong>. Restam apenas <strong>7 vagas</strong> com este benefício exclusivo!</p>
          </div>
          <div className="pricing-grid">
            {/* Essencial */}
            <div className="pricing-card reveal">
              <div>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Essencial</h3>
                <p style={{ color: 'var(--text-muted)', margin: '8px 0 32px 0', fontSize: '1rem' }}>Para quem está dando o primeiro passo digital com a loja.</p>
                <div className="price-container">
                  <div className="price-row-header">
                    <span className="price-old">De R$ 89</span>
                    <span className="discount-tag">50% OFF</span>
                  </div>
                  <div className="price">R$ 44<span>/mês</span></div>
                  <p className="price-guarantee">Preço travado para sempre enquanto você for cliente.</p>
                </div>
              </div>
              <ul className="pricing-features">
                {[
                  'Produtos, Pedidos e Estoque Ilimitados',
                  'Pix Automático (Mercado Pago) e Pix Manual',
                  'Cálculo de Frete Nacional Automático e Exato (Correios, Jadlog, Azul Cargo e etc.)',
                  'Etiqueta Nacional Manual',
                  'Portal do Cliente com Login, Histórico e Acompanhamento',
                  'Alertas em tempo real para a loja',
                  '2 Dispositivos Administradores',
                  'Domínio no padrão Scalius (ex: sualoja.scalius.com.br)',
                ].map(f => (
                  <li key={f}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg> {f}</li>
                ))}
              </ul>
              <a href="https://wa.me/5563984142775?text=Olá!%20Quero%20assinar%20o%20plano%20Essencial%20do%20Scalius." target="_blank" rel="noopener noreferrer" className="btn" style={{ width: '100%', justifyContent: 'center', background: 'white', border: '1px solid var(--border-light)', color: 'var(--text-main)' }}>Assinar Essencial</a>
              <span style={{ display: 'block', textAlign: 'center', fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '12px', fontWeight: 500 }}>
                14 dias grátis
              </span>
            </div>

            {/* Pro */}
            <div className="pricing-card pro reveal" style={{ transitionDelay: '0.1s' }}>
              <div className="price-badge">Mais Popular</div>
              <div>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Pro</h3>
                <p style={{ color: 'var(--text-muted)', margin: '8px 0 32px 0', fontSize: '1rem' }}>Automação total para escalar sua operação B2B e B2C.</p>
                <div className="price-container">
                  <div className="price-row-header">
                    <span className="price-old">De R$ 159</span>
                    <span className="discount-tag">50% OFF</span>
                  </div>
                  <div className="price">R$ 79<span>/mês</span></div>
                  <p className="price-guarantee">Preço travado para sempre enquanto você for cliente.</p>
                </div>
              </div>
              <ul className="pricing-features">
                <li><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg> <strong style={{ color: 'var(--primary)' }}>Tudo do Essencial, mais:</strong></li>
                {[
                  'Etiqueta Nacional em 1 Clique',
                  'E-mails Automáticos para o Cliente por etapa do pedido',
                  'Usuários Administradores Ilimitados',
                  'Suporte a Domínio 100% personalizado (ex: sualoja.com.br)',
                  'Métricas Avançadas',
                  'Sem "Feito com Scalius" no rodapé do site',
                ].map(f => (
                  <li key={f}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg> <strong>{f}</strong></li>
                ))}
              </ul>
              <a href="https://wa.me/5563984142775?text=Olá!%20Quero%20assinar%20o%20plano%20Pro%20do%20Scalius." target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Assinar Pro</a>
              <span style={{ display: 'block', textAlign: 'center', fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '12px', fontWeight: 500 }}>
                14 dias grátis
              </span>
            </div>
          </div>
          
          <div className="pricing-disclaimer reveal" style={{ transitionDelay: '0.2s' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            <span>Preço beta válido apenas para os primeiros assinantes. Após o beta, novos clientes pagam o valor cheio.</span>
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
              { q: 'Preciso ter CNPJ para criar minha loja?', a: 'Não! Você pode começar a vender utilizando apenas o seu CPF. Caso seu negócio cresça, você pode alterar para um CNPJ a qualquer momento direto no painel da sua conta integrada do Mercado Pago.' },
              { q: 'Existe limite de vendas ou cobrança de taxa por pedido?', a: 'Nossa plataforma não cobra taxa por transação ou limite de pedidos! Você paga apenas o valor fixo da sua assinatura. A única taxa de transação é a cobrada pelo próprio gateway de pagamento (Mercado Pago), que é de apenas 0,99% por Pix.' },
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
        <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <a href="/politica-de-privacidade" style={{ color: '#fff', textDecoration: 'none' }}>Política de Privacidade</a>
          <a href="/termos-de-servico" style={{ color: '#fff', textDecoration: 'none' }}>Termos de Serviço</a>
        </div>
      </footer>

    </div>
  );
};

export default Index;




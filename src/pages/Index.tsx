import React, { useEffect, useRef, useState } from 'react';
import '../scalius-landing.css';
import { ContainerScroll } from '../components/ContainerScroll';
import { Rocket } from 'lucide-react';

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
            <a href="#problema">Vantagens</a>
            <a href="#recursos">Recursos</a>
            <a href="#como-funciona">Como Funciona</a>
            <a href="#precos">Planos</a>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <a href="#" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-muted)' }}>Login</a>
            <a href="#precos" className="btn btn-primary" style={{ padding: '10px 20px', fontSize: '13px' }}>Criar Loja</a>
          </div>
        </nav>
      </div>

      {/* HERO SECTION */}
      <section className="hero">
        <div className="container hero-container">
          {/* Esquerda: Textos e CTA */}
          <div className="hero-content reveal">
            <div className="hero-badge">✦ Plataforma escalável para pequenos e grandes negócios</div>
            <h1>
              Venda mais com sua loja online completa e{' '}
              <br />
              <span className="palavra-rotativa"><span className="palavra">independente.</span></span>
            </h1>
            <p>Catálogo, Pix automático, frete inteligente e notificações em tempo real. Tudo em um só lugar, sem depender do WhatsApp.</p>

            <div className="hero-btns">
              <a href="#precos" className="btn btn-brand">Criar minha loja grátis</a>
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
              <p>Vendeu a última blusa tamanho G? Ela some da vitrine automaticamente. Nosso motor de variantes rastreia tamanhos e cores e bloqueia a venda do que você não tem em mãos.</p>
              <ul className="showcase-feature-list">
                {['Produtos e pedidos 100% ilimitados', 'Criação de Variações dinâmicas (Tamanho, Cor, Material)', 'Rastreio e controle de estoque independente por variação', 'Carrinho nativo robusto e Categorias com filtros', 'Upload avançado de imagens por produto'].map(item => (
                  <li key={item}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg> {item}</li>
                ))}
              </ul>
            </div>
            <div className="showcase-image">
              <img src="/showcase-catalogo.png" alt="Print da vitrine com catálogo e variações" />
            </div>
          </div>

          {/* Row 2 */}
          <div className="showcase-row reveal">
            <div className="showcase-text">
              <div className="hero-badge" style={{ background: 'var(--success-light)', color: 'var(--success)' }}>Checkout de Alta Conversão</div>
              <h2>Como funciona o Pix Automático do Scalius?</h2>
              <p>1. Cliente fecha a compra na vitrine.<br />2. Sistema gera QR Code na hora.<br />3. Mercado Pago aprova em segundos.<br />4. Você escuta o PLIM e o status atualiza.<br /><strong>Tudo isso sem você dar UM "bom dia".</strong></p>
              <ul className="showcase-feature-list">
                {['Integração Oficial Transparente com Mercado Pago', 'Aceita Pix nativo com verificação automática de baixa', 'Opção de Pix Manual (Cliente digita sua chave estática)', 'Mudança de Status do Pedido no exato segundo pago'].map(item => (
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
              <p>Chega de ficar cotando PAC ou Sedex para clientes na mão. Sua vitrine já calcula o frete exato conectada na tecnologia do Melhor Envio (Correios e +).</p>
              <ul className="showcase-feature-list">
                {['Cálculo automático: Correios, Jadlog, Azul Cargo e etc', 'Lógica avançada de "Caixa Única" para múltiplos produtos', 'Geração de Etiqueta com 1 clique (Plano Pro)', 'Entrega local por KM (Dinâmico) ou Taxa Fixa (Bairro)', 'Opção nativa de "Retirada na Loja Física"'].map(item => (
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
              <h2>Portal B2C com Histórico de Compras</h2>
              <p>Uma loja de verdade possui Login e Senha. Aumente sua recompra dando aos clientes um perfil para acompanhar o status do pedido e os envios passados.</p>
              <ul className="showcase-feature-list">
                {['Fluxo de Autenticação Segura (Login / Cadastro)', 'Histórico visual de todos os pedidos já feitos pelo cliente', 'Link público de acompanhamento do andamento do pacote', 'Vinculação automática de pedidos anônimos à conta criada', 'Autopreenchimento de endereços em compras futuras'].map(item => (
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
              <h2>Centro de Comando "Pulse" e Alertas em Tempo Real</h2>
              <p>Você nunca mais vai perder um pedido novo. Nosso painel administrativo envia notificações como mágica, além de garantir o controle total sobre a loja.</p>
              <ul className="showcase-feature-list">
                {['Som de Alerta (Caixa Registradora) para novo pedido gerado', 'Aba do navegador pisca visualmente para não perder vendas', 'Emails automáticos para os clientes em cada mudança de status', 'Painel para alterar, cancelar e visualizar pedidos com extrema facilidade', 'Controle de múltiplos usuários (Dono, Gerente, Staff)'].map(item => (
                  <li key={item}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#DB2777" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg> {item}</li>
                ))}
              </ul>
            </div>
            <div className="showcase-image">
              <img src="/showcase-pulse.png" alt="Print do centro de comando com alertas em tempo real" />
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
                  <p>Ative e combine diferentes formas de entrega: retirada física, frete local por KM, região ou motor de cálculo que simula apps de entrega, e a praticidade do envio nacional via Melhor Envio, gerando etiquetas completas com apenas um clique. Notificações automáticas por e-mail avisam você e seu cliente sobre cada passo, se necessário.</p>
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
          <div className="pricing-grid">
            {/* Essencial */}
            <div className="pricing-card reveal">
              <div>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Essencial</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '32px', fontSize: '1rem' }}>Para quem está dando o primeiro passo digital com a loja.</p>
                <div className="price">R$ 89<span>/mês</span></div>
              </div>
              <ul className="pricing-features">
                {['Produtos e Pedidos Ilimitados', 'Pix Manual e Mercado Pago', 'Área do Cliente e Histórico', 'Etiqueta Melhor Envio (Manual)', '1 Usuário Administrador'].map(f => (
                  <li key={f}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg> {f}</li>
                ))}
              </ul>
              <a href="#" className="btn" style={{ width: '100%', justifyContent: 'center', background: 'white', border: '1px solid var(--border-light)', color: 'var(--text-main)' }}>Assinar Essencial</a>
            </div>

            {/* Pro */}
            <div className="pricing-card pro reveal" style={{ transitionDelay: '0.1s' }}>
              <div className="price-badge">O Poder Completo</div>
              <div>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Pro</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '32px', fontSize: '1rem' }}>Automação total para escalar sua operação B2B e B2C.</p>
                <div className="price">R$ 159<span>/mês</span></div>
              </div>
              <ul className="pricing-features">
                <li><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg> <strong style={{ color: 'var(--primary)' }}>Tudo do Essencial, mais:</strong></li>
                {['Etiqueta em 1-Clique', 'Múltiplos Usuários (Gerente/Staff)', 'E-mails Automáticos para Clientes', 'Sem "Powered by Scalius"'].map(f => (
                  <li key={f}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg> <strong>{f}</strong></li>
                ))}
              </ul>
              <a href="#" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Assinar Pro</a>
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
              { q: 'Preciso ter CNPJ para criar minha loja?', a: 'Não! Você pode começar a vender utilizando apenas o seu CPF. Caso seu negócio cresça, você pode alterar para um CNPJ a qualquer momento direto no painel da sua conta integrada do Mercado Pago.' },
              { q: 'Como funciona o pagamento via Pix?', a: 'A integração é nativa. Quando o cliente finaliza o pedido com Pix, o QR Code é gerado. Assim que ele paga, o sistema reconhece o pagamento automaticamente e muda o status do pedido, sem você precisar checar comprovantes.' },
              { q: 'Existe limite de vendas ou cobrança de taxa por pedido?', a: 'Nossa plataforma não cobra taxa por transação ou limite de pedidos! Você paga apenas o valor fixo da sua assinatura. As únicas taxas de transação são as cobradas pelo próprio gateway de pagamento (Mercado Pago).' },
              { q: 'Consigo usar meu próprio domínio (site)?', a: 'Sim, em planos suportados você poderá conectar seu próprio domínio (ex: www.sualoja.com.br) para dar ainda mais credibilidade ao seu negócio.' },
            ].map(({ q, a }) => (
              <div key={q} className="faq-item">
                <button className="faq-question">{q}<span className="faq-icon">+</span></button>
                <div className="faq-answer"><div className="faq-answer-inner">{a}</div></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="section" style={{ background: 'var(--bg-surface)', textAlign: 'center' }}>
        <div className="container">
          <div className="reveal">
            <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', marginBottom: '16px' }}>Pronto para automatizar sua loja?</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '32px', fontSize: '1.1rem' }}>Crie sua vitrine digital hoje e comece a vender sem depender do WhatsApp.</p>
            <a href="#precos" className="btn btn-brand" style={{ fontSize: '1rem', padding: '16px 32px' }}>Criar minha loja grátis</a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: '#0f1117', color: '#aaa', padding: '40px 24px', textAlign: 'center', fontSize: '14px' }}>
        <div style={{ marginBottom: '16px' }}>
          <a href="#" style={{ color: '#fff', fontWeight: 700, fontSize: '18px', textDecoration: 'none' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }}>
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
              <line x1="7" y1="7" x2="7.01" y2="7"></line>
            </svg>
            Scalius
          </a>
        </div>
        <p>© {new Date().getFullYear()} Scalius Vitrine. Todos os direitos reservados.</p>
        <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <a href="/politica-de-privacidade" style={{ color: '#fff', textDecoration: 'none' }}>Política de Privacidade</a>
          <a href="/termos-de-servico" style={{ color: '#fff', textDecoration: 'none' }}>Termos de Serviço</a>
        </div>
      </footer>

    </div>
  );
};

export default Index;




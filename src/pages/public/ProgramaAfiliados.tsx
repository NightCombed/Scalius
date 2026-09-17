import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Award, TrendingUp, DollarSign, Users, CheckCircle2, ArrowRight,
  Gift, Percent, Sparkles, ChevronDown, ShieldCheck, Zap, HelpCircle,
  Copy, Check, ArrowUpRight, BarChart3, Banknote, MessageCircle
} from "lucide-react";

export default function ProgramaAfiliados() {
  const navigate = useNavigate();
  const [storeCount, setStoreCount] = useState(10); // for earnings calculator
  const [selectedPlanPrice, setSelectedPlanPrice] = useState(89); // Plano Profissional (R$ 89,00) default

  // WhatsApp Affiliate Link
  const WHATSAPP_AFFILIATE_URL = "https://wa.me/5563984142775?text=" + encodeURIComponent("Olá! Quero me cadastrar como afiliado do Scalius e saber mais sobre o programa.");

  // Scalius Plan Options for Simulator
  const PLANS = [
    { id: "basico", name: "Básico", price: 47, label: "R$ 47,00/mês" },
    { id: "profissional", name: "Profissional", price: 89, label: "R$ 89,00/mês", popular: true },
    { id: "plus", name: "Plus", price: 159, label: "R$ 159,00/mês" },
  ];

  // Helper for formatting Brazilian Real currency (R$ XX,YY with comma for cents)
  const formatCurrency = (val: number) => {
    return val.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Calculate estimated monthly commission for calculator
  const getCommissionRate = (count: number) => {
    if (count >= 50) return 30.0;
    if (count >= 30) return 27.5;
    if (count >= 15) return 25.0;
    if (count >= 5) return 22.5;
    return 20.0;
  };

  const currentRate = getCommissionRate(storeCount);
  const estimatedMRR = storeCount * selectedPlanPrice;
  const estimatedMonthlyIncome = (estimatedMRR * currentRate) / 100;

  return (
    <div className="programa-afiliados-page min-h-screen bg-[#FAFAFA] text-[#1A1A1A] flex flex-col font-['Reddit_Sans',sans-serif]">
      <style>{`
        .programa-afiliados-page,
        .programa-afiliados-page h1,
        .programa-afiliados-page h2,
        .programa-afiliados-page h3,
        .programa-afiliados-page h4,
        .programa-afiliados-page h5,
        .programa-afiliados-page p,
        .programa-afiliados-page span,
        .programa-afiliados-page button,
        .programa-afiliados-page a,
        .programa-afiliados-page input,
        .programa-afiliados-page div,
        .programa-afiliados-page nav {
          font-family: "Reddit Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
        }
      `}</style>

      {/* ── Top Navigation Bar ── */}
      <header className="border-b border-gray-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2">
            <img src="/scalius-logo-dark.png" alt="Scalius" className="h-7 object-contain" />
            <span className="text-[11px] font-semibold tracking-wide uppercase px-2.5 py-0.5 rounded-full bg-[#FFF4EE] text-[#FF5E00] border border-[#FF5E00]/20">
              Parceiros V1
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#555555]">
            <a href="#como-funciona" className="hover:text-[#FF5E00] transition-colors">Como Funciona</a>
            <a href="#comissoes" className="hover:text-[#FF5E00] transition-colors">Comissões & Faixas</a>
            <a href="#calculadora" className="hover:text-[#FF5E00] transition-colors">Calculadora</a>
            <a href="#faq" className="hover:text-[#FF5E00] transition-colors">Perguntas Frequentes</a>
            <Link to="/central-afiliados" className="text-[#FF5E00] font-semibold hover:underline">Central de Divulgação</Link>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/login")}
              className="text-sm font-medium text-[#1A1A1A] hover:text-[#FF5E00] px-3 py-2 transition-colors cursor-pointer border-0 bg-transparent"
            >
              Entrar
            </button>
            <a
              href={WHATSAPP_AFFILIATE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#FF5E00] hover:bg-[#E65500] text-white font-semibold text-sm px-4 sm:px-5 py-2.5 rounded-full transition-all flex items-center gap-1.5 cursor-pointer border-0 no-underline"
            >
              Quero ser Afiliado
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* ── Hero Section ── */}
        <section className="relative overflow-hidden pt-16 pb-20 md:pt-24 md:pb-28 bg-gradient-to-b from-[#FFF4EE]/60 via-[#FAFAFA] to-[#FAFAFA] border-b border-gray-200/60">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-6">
            <span className="px-4 py-2 rounded-full text-sm font-semibold uppercase tracking-wider bg-[#FFF4EE] text-[#FF5E00] border border-[#FF5E00]/30 inline-flex items-center gap-2 shadow-xs">
              <Sparkles className="h-4 w-4" /> Programa Oficial de Afiliados Scalius
            </span>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold text-[#1A1A1A] leading-[1.15] max-w-4xl mx-auto tracking-tight">
              Ganhe de <span className="text-[#FF5E00]">20% a 30%</span> de Comissão Recorrente Mensal
            </h1>

            <p className="text-lg sm:text-xl text-[#444444] max-w-3xl mx-auto leading-relaxed">
              Indique o Scalius para lojistas e comerciantes. Seu cliente ganha <strong className="text-[#1A1A1A] font-semibold">10% de desconto</strong> no primeiro mês e você fatura renda passiva mensal durante <strong className="text-[#1A1A1A] font-semibold">12 meses</strong>.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href={WHATSAPP_AFFILIATE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto text-base sm:text-lg font-semibold px-8 py-4 bg-[#FF5E00] hover:bg-[#E65500] text-white rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer border-0 no-underline"
              >
                Quero me Cadastrar como Afiliado
                <ArrowRight className="h-5 w-5" />
              </a>
              <button
                onClick={() => navigate("/login")}
                className="w-full sm:w-auto text-base sm:text-lg font-medium px-7 py-4 border border-gray-300 bg-white text-[#1A1A1A] hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
              >
                Já sou parceiro (Acessar Painel)
              </button>
            </div>

            {/* Quick Badges */}
            <div className="pt-10 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
              <div className="rounded-2xl border border-gray-200/80 bg-white p-4 space-y-1.5 shadow-xs hover:shadow-sm transition-shadow">
                <span className="text-sm text-[#555555] font-medium flex items-center gap-1.5">
                  <TrendingUp className="h-4.5 w-4.5 text-emerald-600" /> Atuação Recorrente
                </span>
                <p className="font-bold text-base text-[#1A1A1A]">Comissão Recorrente Mensal</p>
              </div>
              <div className="rounded-2xl border border-gray-200/80 bg-white p-4 space-y-1.5 shadow-xs hover:shadow-sm transition-shadow">
                <span className="text-sm text-[#555555] font-medium flex items-center gap-1.5">
                  <Gift className="h-4.5 w-4.5 text-[#FF5E00]" /> Benefício para o Cliente
                </span>
                <p className="font-bold text-base text-[#1A1A1A]">10% OFF na 1ª mensalidade</p>
              </div>
              <div className="rounded-2xl border border-gray-200/80 bg-white p-4 space-y-1.5 shadow-xs hover:shadow-sm transition-shadow">
                <span className="text-sm text-[#555555] font-medium flex items-center gap-1.5">
                  <Banknote className="h-4.5 w-4.5 text-blue-600" /> Sem Mínimo de Saque
                </span>
                <p className="font-bold text-base text-[#1A1A1A]">Pagamentos diretos via PIX</p>
              </div>
              <div className="rounded-2xl border border-gray-200/80 bg-white p-4 space-y-1.5 shadow-xs hover:shadow-sm transition-shadow">
                <span className="text-sm text-[#555555] font-medium flex items-center gap-1.5">
                  <BarChart3 className="h-4.5 w-4.5 text-indigo-600" /> Painel Transparente
                </span>
                <p className="font-bold text-base text-[#1A1A1A]">Métricas em tempo real</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Como Funciona ── */}
        <section id="como-funciona" className="py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-sm font-semibold uppercase tracking-wider text-[#FF5E00] px-3.5 py-1.5 rounded-full bg-[#FFF4EE] border border-[#FF5E00]/20 inline-block">
              Passo a Passo
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1A1A1A]">Como funciona o Programa de Afiliados?</h2>
            <p className="text-[#555555] text-base sm:text-lg">
              Um processo simples e transparente para você rentabilizar suas indicações e audiência.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4 shadow-xs hover:border-[#FF5E00]/50 hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-xl bg-[#FFF4EE] text-[#FF5E00] font-bold text-xl flex items-center justify-center border border-[#FF5E00]/20">
                1
              </div>
              <h3 className="font-bold text-xl text-[#1A1A1A]">Pegue seu Link & Cupom</h3>
              <p className="text-base text-[#444444] leading-relaxed">
                Ao se cadastrar no Scalius, você recebe um link exclusivo (ex: <code className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-[#1A1A1A] font-semibold">?ref=SEUNOME</code>) e um cupom próprio.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4 shadow-xs hover:border-[#FF5E00]/50 hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-xl bg-[#FFF4EE] text-[#FF5E00] font-bold text-xl flex items-center justify-center border border-[#FF5E00]/20">
                2
              </div>
              <h3 className="font-bold text-xl text-[#1A1A1A]">Divulgue para Lojistas</h3>
              <p className="text-base text-[#444444] leading-relaxed">
                Compartilhe com comerciantes, amigos, clientes de consultoria ou em suas redes sociais e canal do YouTube.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4 shadow-xs hover:border-emerald-500/50 hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 font-bold text-xl flex items-center justify-center border border-emerald-200">
                3
              </div>
              <h3 className="font-bold text-xl text-[#1A1A1A]">Desconto com Cupom</h3>
              <p className="text-base text-[#444444] leading-relaxed">
                O lojista indicado que utilizar o seu <strong className="text-[#1A1A1A] font-semibold">cupom exclusivo</strong> recebe <strong className="text-[#1A1A1A] font-semibold">10% de desconto</strong> no 1º pagamento.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4 shadow-xs hover:border-emerald-500/50 hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 font-bold text-xl flex items-center justify-center border border-emerald-200">
                4
              </div>
              <h3 className="font-bold text-xl text-[#1A1A1A]">Receba Recorrência Mensal</h3>
              <p className="text-base text-[#444444] leading-relaxed">
                Você recebe de <strong className="text-[#FF5E00] font-semibold">20% a 30% de comissão</strong> por mês durante os <strong className="text-[#1A1A1A] font-semibold">primeiros 12 meses</strong> de cada cliente ativo.
              </p>
            </div>
          </div>

          {/* ── Box Informativo: Link vs Cupom ── */}
          <div className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-10 shadow-xs space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <span className="p-2.5 rounded-xl bg-[#FFF4EE] text-[#FF5E00]">
                <ShieldCheck className="h-7 w-7" />
              </span>
              <div>
                <h3 className="font-bold text-xl text-[#1A1A1A]">Entenda a diferença entre Link e Cupom</h3>
                <p className="text-sm sm:text-base text-[#555555]">Transparência total sobre atribuição de clientes e concessão de descontos</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-2xl border border-gray-200 bg-[#FAFAFA] p-5.5 space-y-2.5">
                <div className="font-bold text-lg text-[#1A1A1A] flex items-center gap-2">
                  <span className="text-xl">🔗</span> Link de Afiliado (?ref=CÓDIGO)
                </div>
                <p className="text-sm sm:text-base text-[#444444] leading-relaxed">
                  Serve para rastrear e vincular a loja ao seu perfil de afiliado, garantindo suas comissões recorrentes. Ao assinar apenas pelo link (sem aplicar cupom), o cliente paga o <strong>valor normal do plano</strong> (ex: R$ 89,00) e você recebe comissão sobre esse valor.
                </p>
              </div>

              <div className="rounded-2xl border border-[#FF5E00]/30 bg-[#FFF4EE]/40 p-5.5 space-y-2.5">
                <div className="font-bold text-lg text-[#FF5E00] flex items-center gap-2">
                  <span className="text-xl">🎟️</span> Cupom de Afiliado
                </div>
                <p className="text-sm sm:text-base text-[#444444] leading-relaxed">
                  Além de atribuir o cliente ao seu perfil, concede o benefício exclusivo de <strong>10% de desconto no primeiro pagamento</strong> (ex: o cliente paga R$ 80,10 no plano Profissional). A sua comissão continua sendo calculada sobre o <strong>valor original do plano (R$ 89,00)</strong>, sem reduzir os seus ganhos!
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-gray-50 p-5 border border-gray-200/80 text-sm sm:text-base text-[#444444] space-y-2">
              <p className="font-bold text-[#1A1A1A] text-base sm:text-lg">📌 Observações Importantes:</p>
              <ul className="list-disc pl-5 space-y-1.5 leading-relaxed">
                <li>O desconto do cupom é um incentivo comercial da Scalius e <strong>não reduz a sua comissão</strong>. A comissão é sempre calculada sobre o preço integral original do plano.</li>
                <li>Se o cliente utilizar Link + Cupom do mesmo parceiro, haverá <strong>uma única atribuição e comissão única</strong> (sem duplicidade).</li>
                <li>Cada cliente pode ser vinculado a apenas um afiliado.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* ── Faixas de Comissão Progressiva ── */}
        <section id="comissoes" className="py-16 md:py-24 bg-white border-y border-gray-200/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <span className="text-sm font-semibold uppercase tracking-wider text-[#FF5E00] px-3.5 py-1.5 rounded-full bg-[#FFF4EE] border border-[#FF5E00]/20 inline-block">
                Ganha Mais Quem Indica Mais
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1A1A1A]">Faixas de Comissão Progressiva</h2>
              <p className="text-[#555555] text-base sm:text-lg">
                Sua porcentagem de comissão aumenta automaticamente conforme o número de clientes ativos indicados.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
              <div className="rounded-2xl border border-gray-200 bg-[#FAFAFA] p-6 text-center space-y-3 shadow-xs">
                <span className="text-sm font-semibold text-gray-700 uppercase px-3 py-1 rounded-full bg-gray-200/80 inline-block">Nível 1</span>
                <div className="text-4xl font-bold text-[#1A1A1A]">20%</div>
                <p className="text-sm text-[#444444] font-semibold">1 a 4 clientes ativos</p>
                <span className="text-xs sm:text-sm text-[#555555] font-medium block pt-3 border-t border-gray-200">Comissão inicial padrão</span>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-[#FAFAFA] p-6 text-center space-y-3 shadow-xs">
                <span className="text-sm font-semibold text-indigo-700 uppercase px-3 py-1 rounded-full bg-indigo-100 inline-block">Nível 2</span>
                <div className="text-4xl font-bold text-indigo-600">22,5%</div>
                <p className="text-sm text-[#444444] font-semibold">5 a 14 clientes ativos</p>
                <span className="text-xs sm:text-sm text-[#555555] font-medium block pt-3 border-t border-gray-200">+2.5% de bônus</span>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-[#FAFAFA] p-6 text-center space-y-3 shadow-xs">
                <span className="text-sm font-semibold text-blue-700 uppercase px-3 py-1 rounded-full bg-blue-100 inline-block">Nível 3</span>
                <div className="text-4xl font-bold text-blue-600">25%</div>
                <p className="text-sm text-[#444444] font-semibold">15 a 29 clientes ativos</p>
                <span className="text-xs sm:text-sm text-[#555555] font-medium block pt-3 border-t border-gray-200">Alta recorrência</span>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-[#FAFAFA] p-6 text-center space-y-3 shadow-xs">
                <span className="text-sm font-semibold text-amber-800 uppercase px-3 py-1 rounded-full bg-amber-100 inline-block">Nível 4</span>
                <div className="text-4xl font-bold text-amber-600">27,5%</div>
                <p className="text-sm text-[#444444] font-semibold">30 a 49 clientes ativos</p>
                <span className="text-xs sm:text-sm text-[#555555] font-medium block pt-3 border-t border-gray-200">Parceiro Elite</span>
              </div>

              <div className="rounded-2xl border-2 border-[#FF5E00] bg-[#FFF4EE] p-6 text-center space-y-3 shadow-lg relative transform scale-105">
                <span className="text-sm font-bold text-white uppercase px-3 py-1 rounded-full bg-[#FF5E00] inline-block shadow-xs">Nível Máximo VIP</span>
                <div className="text-4xl font-bold text-[#FF5E00]">30%</div>
                <p className="text-sm text-[#1A1A1A] font-bold">50+ clientes ativos</p>
                <span className="text-xs sm:text-sm text-[#FF5E00] font-semibold block pt-3 border-t border-[#FF5E00]/20">Comissão Máxima VIP</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Calculadora de Ganhos Estimados ── */}
        <section id="calculadora" className="py-16 md:py-24 max-w-5xl mx-auto px-4 sm:px-6">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-12 shadow-xl space-y-8">
            <div className="text-center space-y-2">
              <span className="text-sm font-semibold uppercase tracking-wider text-[#FF5E00] px-3.5 py-1.5 rounded-full bg-[#FFF4EE] border border-[#FF5E00]/20 inline-block">
                Simulador de Renda Passiva
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1A1A1A]">Quanto você pode faturar por mês?</h2>
              <p className="text-[#555555] text-base sm:text-lg">
                Simule seus ganhos mensais recorrentes escolhendo o plano e a quantidade de lojas indicadas.
              </p>
            </div>

            <div className="space-y-8 max-w-2xl mx-auto">
              {/* Plan Selector */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-[#333333] uppercase tracking-wider block text-center">
                  Selecione o Plano de Assinatura Indicado:
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {PLANS.map((plan) => (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => setSelectedPlanPrice(plan.price)}
                      className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer relative ${
                        selectedPlanPrice === plan.price
                          ? "bg-[#FF5E00] text-white border-[#FF5E00] font-semibold"
                          : "bg-[#FAFAFA] text-[#1A1A1A] border-gray-200 hover:border-[#FF5E00]/40 font-medium"
                      }`}
                    >
                      {plan.popular && (
                        <span className={`absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] sm:text-xs font-bold uppercase px-2.5 py-0.5 rounded-full ${
                          selectedPlanPrice === plan.price
                            ? "bg-white text-[#FF5E00]"
                            : "bg-[#FF5E00] text-white"
                        }`}>
                          Mais Popular
                        </span>
                      )}
                      <div className="text-base font-bold">{plan.name}</div>
                      <div className="text-sm opacity-90">{plan.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Store Count Slider */}
              <div className="space-y-4 pt-2">
                <div className="flex justify-between items-center text-base font-bold text-[#1A1A1A]">
                  <span>Quantidade de Lojas Ativas Indicadas:</span>
                  <span className="text-2xl font-bold text-[#FF5E00] bg-[#FFF4EE] px-4 py-1.5 rounded-xl border border-[#FF5E00]/20">
                    {storeCount} {storeCount === 1 ? "loja" : "lojas"}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={storeCount}
                  onChange={(e) => setStoreCount(parseInt(e.target.value))}
                  className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#FF5E00]"
                />
                <div className="flex justify-between text-sm text-[#555555] font-semibold">
                  <span>1 loja</span>
                  <span>25 lojas</span>
                  <span>50 lojas</span>
                  <span>100 lojas</span>
                </div>
              </div>

              {/* Simulation Box Result */}
              <div className="rounded-2xl border-2 border-[#FF5E00]/30 bg-[#FFF4EE]/60 p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-2 gap-6 text-center">
                <div className="space-y-1">
                  <span className="text-sm text-[#555555] font-bold uppercase tracking-wider">Sua Taxa de Comissão</span>
                  <p className="text-3xl sm:text-4xl font-bold text-[#FF5E00] whitespace-nowrap">{currentRate}%</p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm text-[#555555] font-bold uppercase tracking-wider">Sua Renda Mensal como Afiliado</span>
                  <p className="text-3xl sm:text-4xl font-bold text-emerald-600 whitespace-nowrap">R$&nbsp;{formatCurrency(estimatedMonthlyIncome)}/mês</p>
                </div>
              </div>

              <div className="text-center pt-2">
                <a
                  href={WHATSAPP_AFFILIATE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto text-base sm:text-lg font-semibold px-10 py-4 bg-[#FF5E00] hover:bg-[#E65500] text-white rounded-full transition-all inline-flex items-center justify-center gap-2 cursor-pointer border-0 no-underline"
                >
                  Quero me Cadastrar como Afiliado
                  <ArrowRight className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ── Perguntas Frequentes (FAQ) ── */}
        <section id="faq" className="py-16 bg-[#FAFAFA] border-t border-gray-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-10">
            <div className="text-center space-y-2">
              <span className="text-sm font-semibold uppercase tracking-wider text-[#FF5E00] px-3.5 py-1.5 rounded-full bg-[#FFF4EE] border border-[#FF5E00]/20 inline-block">
                Tire suas Dúvidas
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1A1A1A]">Regras e Perguntas Frequentes</h2>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-2.5 shadow-xs">
                <h3 className="font-bold text-lg text-[#1A1A1A] flex items-center gap-2.5">
                  <HelpCircle className="h-5.5 w-5.5 text-[#FF5E00] shrink-0" />
                  Como funcionam os repasses de comissão?
                </h3>
                <p className="text-base text-[#444444] leading-relaxed pl-8">
                  Os repasses são realizados manualmente pela equipe do Scalius diretamente para a sua chave PIX cadastrada no painel. Não há valor mínimo para saque.
                </p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-2.5 shadow-xs">
                <h3 className="font-bold text-lg text-[#1A1A1A] flex items-center gap-2.5">
                  <HelpCircle className="h-5.5 w-5.5 text-[#FF5E00] shrink-0" />
                  Qual é a diferença de desconto entre o Link e o Cupom?
                </h3>
                <p className="text-base text-[#444444] leading-relaxed pl-8">
                  O desconto de <strong className="text-[#1A1A1A] font-semibold">10% no 1º pagamento</strong> é ativado quando o cliente utiliza o seu <strong className="text-[#1A1A1A] font-semibold">cupom de afiliado</strong> no checkout. Se o cliente assinar entrando apenas pelo seu link (sem aplicar cupom), ele paga o valor padrão do plano e a loja fica vinculada a você, gerando sua comissão normalmente sobre o preço integral do plano.
                </p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-2.5 shadow-xs">
                <h3 className="font-bold text-lg text-[#1A1A1A] flex items-center gap-2.5">
                  <HelpCircle className="h-5.5 w-5.5 text-[#FF5E00] shrink-0" />
                  Por quanto tempo recebo a comissão de cada loja indicada?
                </h3>
                <p className="text-base text-[#444444] leading-relaxed pl-8">
                  A comissão é recorrente mensal durante os <strong className="text-[#1A1A1A] font-semibold">primeiros 12 meses</strong> (1 ano) de assinatura ativa de cada cliente indicado.
                </p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-2.5 shadow-xs">
                <h3 className="font-bold text-lg text-[#1A1A1A] flex items-center gap-2.5">
                  <HelpCircle className="h-5.5 w-5.5 text-[#FF5E00] shrink-0" />
                  Posso me indicar a mim mesmo (autoindicação)?
                </h3>
                <p className="text-base text-[#444444] leading-relaxed pl-8">
                  Não. O sistema possui validação de e-mail e dados da conta. A autoindicação é bloqueada para garantir a integridade e transparência do programa.
                </p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-2.5 shadow-xs">
                <h3 className="font-bold text-lg text-[#1A1A1A] flex items-center gap-2.5">
                  <HelpCircle className="h-5.5 w-5.5 text-[#FF5E00] shrink-0" />
                  O que acontece se o cliente cancelar ou solicitar reembolso?
                </h3>
                <p className="text-base text-[#444444] leading-relaxed pl-8">
                  Caso a loja seja cancelada, a geração de novas comissões é interrompida. Em caso de estorno/reembolso, a comissão correspondente é atualizada para o status <strong className="text-rose-600 font-semibold">Revertida</strong>.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-200 bg-white py-8 text-sm text-[#555555]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/scalius-logo-dark.png" alt="Scalius" className="h-5 object-contain" />
            <span>© {new Date().getFullYear()} Scalius. Todos os direitos reservados.</span>
          </div>
          <div className="flex items-center gap-5">
            <Link to="/politica-de-privacidade" className="hover:text-[#FF5E00] transition-colors">Privacidade</Link>
            <Link to="/termos-de-servico" className="hover:text-[#FF5E00] transition-colors">Termos de Serviço</Link>
            <Link to="/central-afiliados" className="hover:text-[#FF5E00] text-[#FF5E00] font-semibold transition-colors">Central de Divulgação</Link>
            <Link to="/affiliate" className="hover:text-[#FF5E00] text-[#FF5E00] font-semibold transition-colors">Painel do Parceiro</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

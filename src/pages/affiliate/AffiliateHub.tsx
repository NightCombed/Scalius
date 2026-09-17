import React, { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sparkles, ArrowLeft, ArrowRight, ExternalLink, Copy, Check,
  Download, Eye, Image as ImageIcon, Store, Camera,
  TrendingUp, Users, DollarSign, Gift, Percent, ShieldCheck, HelpCircle,
  Search, ChevronDown, Smartphone, Monitor, Video, Mic,
  Compass, Flame, Zap, Award, BookOpen, Lightbulb, MessageSquare,
  Share2, BarChart3, CheckCircle2, AlertCircle, Info, RefreshCw, Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── Tipos e Estruturas de Dados ─────────────────────────────────────────────

interface ContentIdea {
  id: string;
  title: string;
  category: "curto" | "camera" | "demo" | "carrossel" | "stories" | "direto";
  formatBadge: string;
  timeEstimate: string;
  objective: string;
  hook: string;
  context: string;
  script: string[];
  whatToShow: string;
  possibleFormats: string[];
  suggestedCta: string;
  recommendedStoreSlug?: string;
  difficulty: "Iniciante" | "Intermediário" | "Rápido";
}

interface DemoStoreInfo {
  name: string;
  slug: string;
  niche: string;
  productsCount: number;
  description: string;
  highlights: string[];
  primaryColor: string;
  logoUrl?: string;
  bannerUrl?: string;
}

// ─── Dados Oficiais das 3 Lojas de Demonstração Reais ─────────────────────────

const REAL_DEMO_STORES: DemoStoreInfo[] = [
  {
    name: "Aurora Moda",
    slug: "auroramoda",
    niche: "Moda Feminina & Vestuário",
    productsCount: 10,
    description: "Loja com peças de vestuário, vestidos, blusas e conjuntos, explorando variações completas de cores (P, M, G, GG).",
    highlights: [
      "Variações de tamanho e cor com controle de estoque",
      "Galeria de fotos por produto",
      "Experiência perfeita de compra de roupas no celular",
    ],
    primaryColor: "border-pink-500 text-pink-600 bg-pink-50 dark:bg-pink-950/20",
    logoUrl: "https://jrmixsvdnejzfxvybmng.supabase.co/storage/v1/object/public/store-logos/280282d2-9c83-4ce4-bbde-bbf41476e809/logo-1782951944145.webp",
    bannerUrl: "https://jrmixsvdnejzfxvybmng.supabase.co/storage/v1/object/public/store-logos/280282d2-9c83-4ce4-bbde-bbf41476e809/banner-1782952694344.webp",
  },
  {
    name: "Floricultura das Flores",
    slug: "floricultura-das-flores",
    niche: "Floricultura, Buquês & Presentes",
    productsCount: 9,
    description: "Catálogo completo de arranjos florais, buquês e cestas especiais com opções de entrega local e retirada.",
    highlights: [
      "Cálculo de taxa de entrega e frete",
      "Checkout Pix com confirmação automática",
      "Fotos vibrantes e navegação intuitiva por categorias",
    ],
    primaryColor: "border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20",
    logoUrl: "https://jrmixsvdnejzfxvybmng.supabase.co/storage/v1/object/public/store-logos/92507e00-0d60-40de-ba57-0858f226fb5d/logo-1783142262774.webp",
    bannerUrl: "https://jrmixsvdnejzfxvybmng.supabase.co/storage/v1/object/public/store-logos/92507e00-0d60-40de-ba57-0858f226fb5d/banner-1783142360032.webp",
  },
  {
    name: "Elena Cosméticos",
    slug: "elena-cosmeticos",
    niche: "Cosméticos, Skincare & Beleza",
    productsCount: 6,
    description: "Curadoria de produtos de skincare, autocuidado e beleza com descrições ricas e produtos em destaque.",
    highlights: [
      "Portal do cliente com histórico de pedidos",
      "Visual sofisticado e responsivo",
      "Adição de múltiplos itens ao carrinho com facilidade",
    ],
    primaryColor: "border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-950/20",
    logoUrl: "https://jrmixsvdnejzfxvybmng.supabase.co/storage/v1/object/public/store-logos/c3ed52fa-69db-4ab1-b624-c30e35d42955/logo-1780528894085.jpg",
    bannerUrl: "https://jrmixsvdnejzfxvybmng.supabase.co/storage/v1/object/public/store-logos/c3ed52fa-69db-4ab1-b624-c30e35d42955/banner-1780592888785.jpg",
  },
];

// ─── Biblioteca Rica de Ideias de Conteúdo ───────────────────────────────────

const CONTENT_IDEAS: ContentIdea[] = [
  {
    id: "camera-com-prints-site",
    title: "Explicando o Scalius com Prints do Site (Green Screen)",
    category: "camera",
    formatBadge: "📸 Câmera + Prints de Fundo",
    timeEstimate: "30 a 45 seg",
    difficulty: "Rápido",
    objective: "Gravar um vídeo rápido e dinâmico falando para a câmera usando prints do site scalius.com.br ou das lojas demo como fundo visual (efeito tela verde).",
    hook: "Você não precisa gastar rios de dinheiro para ter uma vitrine online profissional em 2026. Olha isso aqui...",
    context: "Você não precisa de gravador de tela complexo nem edições demoradas: basta tirar prints de 2 ou 3 seções do nosso site (catálogo no celular, Pix automático, cálculo de frete) e usá-los como fundo ou sobreposição enquanto fala diretamente para a câmera.",
    script: [
      "Abra a câmera com o print da página inicial do Scalius atrás de você: 'Se você vende roupas, cosméticos ou produtos pelo Instagram, você precisa conhecer isso.'",
      "Mude para o print do catálogo no celular: 'Ela cria uma vitrine linda pro seu negócio em minutos com variações de cor e tamanho.'",
      "Mude para o print do checkout Pix: 'O cliente calcula o frete dos Correios e paga no Pix na hora com aprovação automática, sem você precisar conferir extrato.'",
      "Finalize apontando para a bio: 'O link para testar tá na minha bio com 10% de desconto no 1º mês usando meu cupom [CUPOM]!'",
    ],
    whatToShow: "Você falando para a câmera em primeiro plano com prints do site scalius.com.br ou das vitrines demo ao fundo (Green Screen / B-Roll).",
    possibleFormats: [
      "Efeito Tela Verde (Green Screen) nativo do Instagram Reels ou TikTok",
      "Sobreposição de imagem (Picture-in-Picture) no CapCut com você falando no canto",
      "Você segurando o celular e mostrando os prints na tela",
      "Vídeo selfie alternando entre seu rosto e os prints do site",
    ],
    suggestedCta: "Quer montar uma vitrine assim pro seu negócio? O link tá na minha bio com 10% OFF usando o cupom [CUPOM]!",
    recommendedStoreSlug: "auroramoda",
  },
  {
    id: "deixa-eu-te-mostrar",
    title: "Deixa eu te mostrar uma coisa",
    category: "camera",
    formatBadge: "🎙️ Apresentação + Demonstração",
    timeEstimate: "30 a 45 seg",
    difficulty: "Rápido",
    objective: "Despertar curiosidade imediata mostrando uma funcionalidade do Scalius de forma natural e envolvente.",
    hook: "Deixa eu te mostrar uma coisa que quase nenhum lojista pequeno sabe que existe...",
    context: "Você mostra como é simples ter uma vitrine online com catálogo organizado e Pix automático, contrastando com o esforço de atender tudo manualmente.",
    script: [
      "Comece falando diretamente para a câmera ou mostrando a tela do celular: 'Se você vende pelo Instagram ou WhatsApp, você precisa ver isso.'",
      "Apresente uma vitrine do Scalius funcionando: 'O cliente clica, escolhe tamanho/cor, calcula o frete e paga no Pix na hora.'",
      "Mostre o pedido caindo aprovado no painel sem precisar conferir comprovante bancário.",
      "Finalize convidando o lojista a conhecer a plataforma com seu cupom exclusivo.",
    ],
    whatToShow: "Você segurando o celular ou navegando na vitrine Aurora Moda ou Elena Cosméticos.",
    possibleFormats: [
      "Apresentando para a câmera segurando o celular",
      "Apresentação na câmera + cortes gravando a tela",
      "Gravação de tela com sua narração em voz",
    ],
    suggestedCta: "Quer montar uma vitrine assim pro seu negócio? O link tá na minha bio com 10% OFF usando o cupom [CUPOM]!",
    recommendedStoreSlug: "auroramoda",
  },
  {
    id: "se-eu-tivesse-uma-loja",
    title: "Se eu tivesse uma loja hoje...",
    category: "camera",
    formatBadge: "💡 Visão Prática & Consultoria",
    timeEstimate: "45 a 60 seg",
    difficulty: "Iniciante",
    requiresFace: false,
    objective: "Posicionar-se como conselheiro que entende de organização e eficiência em vendas.",
    hook: "Se eu abrisse uma loja de roupas ou cosméticos hoje, essa é a PRIMEIRA coisa que eu faria diferente da maioria.",
    context: "Explicar que depender apenas de Direct e conversas soltas no WhatsApp é exaustivo e faz perder vendas. Ter uma vitrine online estruturada muda o jogo desde o primeiro dia.",
    script: [
      "Fale para a câmera sobre como muitos lojistas perdem horas respondendo 'qual o valor?' e calculando frete na mão.",
      "Apresente sua recomendação: 'Eu colocaria uma vitrine Scalius direto no link da bio.'",
      "Mostre rapidamente como a vitrine facilita a vida do cliente e do lojista.",
      "Destaque: 'Você não precisa gastar rios de dinheiro nem contratar programador.'",
    ],
    whatToShow: "Você falando para a câmera + cortes mostrando a vitrine Floricultura das Flores ou Aurora Moda.",
    possibleFormats: [
      "Vídeo no estilo selfie / mesa de trabalho falando com autoridade",
      "Apresentação na câmera + tela dividida com a vitrine",
      "Post carrossel no feed com reflexões práticas",
    ],
    suggestedCta: "Quer modernizar sua loja hoje? Conheça o Scalius no link da minha bio. Cupom de 10% de desconto: [CUPOM]",
    recommendedStoreSlug: "floricultura-das-flores",
  },
  {
    id: "sua-loja-ainda-vende-assim",
    title: "Sua loja ainda vende assim?",
    category: "curto",
    formatBadge: "🎬 Comparação & Situação Real",
    timeEstimate: "30 a 45 seg",
    difficulty: "Rápido",
    requiresFace: false,
    objective: "Gerar identificação imediata com o cansaço do lojista ao responder perguntas repetitivas.",
    hook: "Se você ainda atende clientes desse jeito em 2026, você tá perdendo tempo e dinheiro todo santo dia.",
    context: "Contraste entre o atendimento manual caótico (perguntando preço, frete e tamanho) e a experiência de autoatendimento fluida do Scalius.",
    script: [
      "Apresente a situação: 'Cliente manda mensagem perguntando preço, você responde 2 horas depois, ele pergunta o frete, você vai calcular nos Correios, e aí o cliente sumiu.'",
      "Mostre o contraste: 'Agora olha como funciona com o Scalius.'",
      "Mostre o cliente escolhendo na vitrine, calculando frete e pagando no Pix em 30 segundos.",
      "Conclua: 'Menos mensagens repetitivas, mais vendas caindo prontas no seu painel.'",
    ],
    whatToShow: "Chat de mensagens vs. Gravação da tela da vitrine Aurora Moda ou Floricultura das Flores.",
    possibleFormats: [
      "Você encenando a situação para a câmera",
      "Apresentação na câmera intercalada com a tela da loja",
      "Gravação de tela lado a lado com narração",
      "Vídeo dinâmico com textos na tela e áudio em alta",
    ],
    suggestedCta: "Modernize suas vendas com o Scalius! Link na minha bio com cupom [CUPOM] para 10% OFF no 1º mês.",
    recommendedStoreSlug: "auroramoda",
  },
  {
    id: "tres-problemas-loja-pequena",
    title: "3 problemas que toda loja pequena enfrenta",
    category: "curto",
    formatBadge: "📋 Lista Educativa / Solução",
    timeEstimate: "40 a 50 seg",
    difficulty: "Iniciante",
    requiresFace: false,
    objective: "Ensinar de forma simples os 3 maiores gargalos operacionais e demonstrar como o Scalius resolve cada um.",
    hook: "Se você vende pela internet ou pelo WhatsApp, com certeza você já passou por pelo menos 1 desses 3 sufocos.",
    context: "1) Vender peça que já esgotou por falta de controle de estoque. 2) Perder tempo conferindo comprovante de Pix no extrato. 3) Demora para cotar frete dos Correios e Jadlog.",
    script: [
      "Apresente o problema 1: Estoque desorganizado (vender o que já acabou). Mostre o Scalius bloqueando o que esgotou.",
      "Apresente o problema 2: Conferência manual de Pix. Mostre o Pix com baixa automática via Mercado Pago.",
      "Apresente o problema 3: Cálculo manual de frete. Mostre a cotação instantânea no carrinho.",
      "Finalize: 'O Scalius resolve os 3 em uma única plataforma simples.'",
    ],
    whatToShow: "Trechos da vitrine Elena Cosméticos ou Floricultura demonstrando cada funcionalidade.",
    possibleFormats: [
      "Você na câmera enumerando os 3 pontos e mostrando o celular",
      "Apresentação com cortes rápidos de tela",
      "Carrossel educativo no Instagram / LinkedIn",
      "Gravação de tela narrada",
    ],
    suggestedCta: "Quer resolver esses 3 problemas na sua loja? Acesse o link da minha bio. Use o cupom [CUPOM] para 10% OFF!",
    recommendedStoreSlug: "elena-cosmeticos",
  },
  {
    id: "vou-montar-uma-loja-agora",
    title: "Vou criar uma loja online do zero em 5 minutos",
    category: "demo",
    formatBadge: "🛠️ Desafio Prático & Demonstração",
    timeEstimate: "45 a 60 seg",
    difficulty: "Iniciante",
    requiresFace: false,
    objective: "Desmistificar a criação de lojas online e provar que qualquer lojista consegue montar sua vitrine rapidamente.",
    hook: "Duvido você criar uma loja online completa antes do meu café esfriar. Vou criar uma aqui agora com você.",
    context: "O afiliado mostra na prática o processo simples de criar a loja, cadastrar um produto com variações e ver a vitrine pronta.",
    script: [
      "Inicie com energia: 'Muita gente acha que ter loja virtual precisa de programador e custa caro. Olha isso aqui.'",
      "Mostre o cadastro rápido escolhendo o subdomínio da loja.",
      "Cadastre um produto com foto, preço e variações (Ex: Tamanhos P, M, G).",
      "Abra a loja finalizada no celular e mostre que ela já está pronta para vender.",
    ],
    whatToShow: "Você apresentando na introdução + gravação de tela no painel /admin e na vitrine final.",
    possibleFormats: [
      "Apresentação na câmera no início e fim + tela acelerada no meio",
      "Tutorial comentado passo a passo",
      "Reels dinâmico com cronômetro na tela",
    ],
    suggestedCta: "Pare de adiar sua loja própria! O link com teste e desconto de 10% [CUPOM] está na minha bio.",
  },
  {
    id: "olha-como-ficou-essa-loja",
    title: "Olha como ficou essa vitrine online (Tour)",
    category: "demo",
    formatBadge: "✨ Tour Guiado & Showcase",
    timeEstimate: "30 a 45 seg",
    difficulty: "Rápido",
    requiresFace: false,
    objective: "Encantar os lojistas mostrando o design limpo, agradável e profissional das vitrines Scalius.",
    hook: "Olha a experiência dessa vitrine online que montamos para essa loja!",
    context: "Fazer um tour guiado pela loja demo, elogiando a organização das categorias, o visual no celular, as variações e o checkout transparente.",
    script: [
      "Abra a loja demo e mostre o banner, logo e disposição dos produtos.",
      "Destaque a facilidade de navegar entre categorias e abrir um produto.",
      "Selecione uma variação de cor/tamanho e adicione ao carrinho.",
      "Mostre o checkout limpo com cálculo de frete e Pix: 'Tudo roda direto no navegador, sem precisar baixar app.'",
    ],
    whatToShow: "Navegação suave na loja demo Floricultura das Flores, Aurora Moda ou Elena Cosméticos.",
    possibleFormats: [
      "Você na câmera segurando o celular e reagindo à loja",
      "Gravação de tela fluida no celular com áudio comentado",
      "Sequência de Stories com sticker de link",
    ],
    suggestedCta: "Quer uma vitrine linda assim com sua marca? Acesse pelo link na bio e use o código [CUPOM]!",
    recommendedStoreSlug: "floricultura-das-flores",
  },
  {
    id: "whatsapp-vs-loja-23h",
    title: "WhatsApp vs. Loja Própria: O teste do pedido às 23h",
    category: "curto",
    formatBadge: "🌙 Comparação / Venda 24h",
    timeEstimate: "35 a 45 seg",
    difficulty: "Rápido",
    requiresFace: false,
    objective: "Demonstrar a vantagem de ter um canal de vendas automático que funciona enquanto o lojista descansa.",
    hook: "O que acontece na sua loja quando um cliente quer comprar às 11 da noite?",
    context: "No WhatsApp sem loja, se o lojista dorme, a venda é perdida. No Scalius, o cliente acessa a vitrine, calcula frete e paga no Pix na hora.",
    script: [
      "Situação 1: Cliente manda mensagem tarde da noite: 'Tem esse vestido? Quanto fica pro CEP tal?'. Fica sem resposta e desiste.",
      "Situação 2: Cliente clica no link da bio, vê fotos, seleciona a peça, calcula o frete e fecha o Pix.",
      "Conclusão: 'Você acorda no dia seguinte com o pedido pago, só para despachar.'",
    ],
    whatToShow: "Comparação entre mensagem sem resposta vs. Notificação de novo pedido pago no Scalius.",
    possibleFormats: [
      "Você falando para a câmera sobre rotina e liberdade de vendas",
      "Tela dividida comparando os dois cenários",
      "Carrossel explicativo no Instagram",
    ],
    suggestedCta: "Deixe sua loja vendendo no piloto automático 24h. Acesse pelo link na bio e use o cupom [CUPOM]!",
    recommendedStoreSlug: "auroramoda",
  },
  {
    id: "teste-pix-automatico",
    title: "Comprei na loja e o Pix aprovou na hora",
    category: "demo",
    formatBadge: "⚡ Demonstração de Tecnologia",
    timeEstimate: "30 seg",
    difficulty: "Rápido",
    requiresFace: false,
    objective: "Destacar a agilidade do Pix com baixa automática e a segurança contra comprovantes falsos.",
    hook: "Sem mandar comprovante e sem esperar ninguém responder. Olha a velocidade desse checkout Pix.",
    context: "Demonstrar o checkout gerando o código Copia e Cola / QR Code e atualizando para 'Aprovado' em tempo real.",
    script: [
      "Mostre o checkout do Scalius gerando o QR Code Pix.",
      "Realize o pagamento e mostre a tela atualizando sozinha para 'Pagamento Confirmado'.",
      "Mostre o alerta no painel do administrador: 'O lojista não precisa conferir extrato bancário nem correr risco de golpe.'",
    ],
    whatToShow: "Checkout do Scalius atualizando status instantaneamente após o pagamento.",
    possibleFormats: [
      "Você testando e reagindo na câmera",
      "Gravação de tela rápida e objetiva",
      "Post comparando Pix manual vs. Pix automatizado",
    ],
    suggestedCta: "Automatize suas cobranças no Pix com o Scalius. Link na bio com cupom de 10% [CUPOM]!",
  },
  {
    id: "erros-vender-instagram",
    title: "5 erros que fazem sua loja perder vendas",
    category: "carrossel",
    formatBadge: "📊 Carrossel & Post Educativo",
    timeEstimate: "Slide 1 ao 6",
    difficulty: "Iniciante",
    requiresFace: false,
    objective: "Atrair lojistas ensinando boas práticas de conversão e link na bio.",
    hook: "Se você comete o erro nº 2 na sua loja do Instagram, você tá perdendo metade das suas vendas.",
    context: "Erros comuns: 1) 'Preço no Direct'. 2) Falta de catálogo na bio. 3) Vender sem controle de estoque. 4) Demora para cotar frete. 5) Não ter checkout com Pix automático.",
    script: [
      "Slide 1: Capa instigante sobre erros de vendas online.",
      "Slides 2 a 5: Apresentação de cada erro de forma prática e direta.",
      "Slide 6: Solução - 'Com o Scalius você organiza sua vitrine, automatiza frete e Pix em poucos cliques.'",
    ],
    whatToShow: "Cards visuais com prints exemplificando os erros e a vitrine Scalius como solução.",
    possibleFormats: [
      "Carrossel educativo para salvar no Instagram",
      "Vídeo no formato lista falando para a câmera",
      "Sequência de Stories diários",
    ],
    suggestedCta: "Gostou das dicas? Conheça o Scalius pelo link na minha bio e use o cupom [CUPOM] para 10% de desconto!",
  },
  {
    id: "indicacao-direta-whatsapp",
    title: "Indicação 1 a 1 para Lojistas (WhatsApp / Direct)",
    category: "direto",
    formatBadge: "💬 Mensagem Pessoal & Consultoria",
    timeEstimate: "1 a 1",
    difficulty: "Iniciante",
    requiresFace: false,
    objective: "Abordagem calorosa e consultiva para amigos comerciantes e clientes de consultoria.",
    hook: "Oi [Nome]! Vi as novidades lindas que você postou e lembrei de uma ferramenta que pode te ajudar muito a organizar pedidos.",
    context: "Conversa personalizada recomendando a vitrine Scalius para economizar tempo do lojista no dia a dia.",
    script: [
      "'Oi [Nome]! Tudo bem? Vi que você posta muitas peças no Instagram, mas deve dar um trabalho danado responder preço e calcular frete um por um no WhatsApp, né?'",
      "'Conheci uma plataforma brasileira chamada Scalius que cria uma vitrine online linda pro seu negócio, com catálogo, Pix automático e frete na hora.'",
      "'Dá uma olhada nessa loja de exemplo: [LINK_DEMO]. Se você gostar, tenho um cupom de 10% OFF pra você testar: [CUPOM]!'",
    ],
    whatToShow: "Enviar o link da loja demo que mais combina com o nicho da pessoa (Aurora Moda para roupas, Elena Cosméticos para beleza).",
    possibleFormats: [
      "Mensagem de texto personalizada no WhatsApp",
      "Áudio espontâneo de 40 segundos no WhatsApp",
      "Direct no Instagram elogiando os produtos do lojista",
    ],
    suggestedCta: "Link para conhecer: [LINK_AFILIADO] · Cupom com 10% OFF na 1ª mensalidade: [CUPOM]",
  },
];

// ─── Componente Principal ────────────────────────────────────────────────────

export default function AffiliateHub() {
  const navigate = useNavigate();
  const { affiliateProfile } = useAuth();

  // Estados
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [faqSearch, setFaqSearch] = useState<string>("");
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  // Valores Dinâmicos do Afiliado
  const affiliateCode = affiliateProfile?.code || "SEUCUPOM";
  const referralLink = affiliateProfile?.code
    ? `https://scalius.com.br/?ref=${affiliateProfile.code}`
    : "https://scalius.com.br/?ref=SEUNOME";
  const commissionRate = affiliateProfile?.commission_rate || 20;

  // Helper de Cópia
  const copyToClipboard = async (text: string, id: string, label = "Copiado com sucesso!") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItem(id);
      toast.success(label);
      setTimeout(() => setCopiedItem(null), 2000);
    } catch {
      toast.error("Erro ao copiar.");
    }
  };

  // Substituir tags dinâmicas no texto
  const hydrateText = (raw: string, storeSlug = "auroramoda") => {
    return raw
      .replace(/\[CUPOM\]/g, affiliateCode)
      .replace(/\[CÓDIGO\]/g, affiliateCode)
      .replace(/\[LINK_AFILIADO\]/g, referralLink)
      .replace(/\[LINK_DEMO\]/g, `https://${storeSlug}.scalius.com.br`);
  };

  // Filtragem de Ideias de Conteúdo
  const filteredIdeas = useMemo(() => {
    return CONTENT_IDEAS.filter((idea) => {
      if (selectedCategory === "all") return true;
      return idea.category === selectedCategory;
    });
  }, [selectedCategory]);

  // Lista de Perguntas e Respostas da FAQ Completa
  const FAQ_ITEMS = useMemo(() => [
    {
      q: "Como funciona meu link de afiliado?",
      a: "Seu link exclusivo (ex: https://scalius.com.br/?ref=SEUCODIGO) serve para identificar e rastrear lojistas que chegam ao Scalius por sua indicação. Quando alguém entra pelo seu link e assina um plano, o sistema vincula a conta dessa loja diretamente a você para gerar suas comissões.",
    },
    {
      q: "Para que serve meu cupom de afiliado?",
      a: "Seu cupom tem dupla função: ele atribui a indicação ao seu perfil e concede 10% de desconto exclusivo na primeira mensalidade para o novo cliente elegível. O cliente pode digitar o cupom manualmente no checkout.",
    },
    {
      q: "Qual é a diferença exata entre o Link e o Cupom?",
      a: "O Link identifica a indicação sem conceder desconto automático (o cliente paga o valor padrão do plano). O Cupom identifica a indicação e aplica 10% de desconto no 1º mês para o cliente. A sua comissão continua sendo calculada integralmente sobre o valor cheio original do plano nos dois casos!",
    },
    {
      q: "O cliente recebe desconto ao usar meu cupom?",
      a: "Sim! Ele ganha 10% de desconto no primeiro pagamento da assinatura da loja. Por exemplo, no plano Profissional de R$ 89,00, ele paga apenas R$ 80,10 no primeiro mês.",
    },
    {
      q: "Como minha comissão é calculada quando o cliente usa cupom de desconto?",
      a: "O desconto do cupom é um benefício comercial oferecido pelo Scalius e NÃO reduz os seus ganhos. A sua comissão de parceiro (de 20% a 30%) é calculada sempre sobre o preço original e integral do plano contratado.",
    },
    {
      q: "Por quanto tempo recebo comissões de cada cliente indicado?",
      a: "Você recebe comissão recorrente mensal por até 12 meses consecutivos por cada loja indicada, desde que a assinatura permaneça ativa e com os pagamentos em dia.",
    },
    {
      q: "O que acontece se um cliente cancelar a assinatura ou pedir reembolso?",
      a: "Se a loja cancelar a assinatura, novas comissões não serão mais geradas para as mensalidades seguintes. Em caso de estorno ou reembolso de um pagamento já realizado, a comissão correspondente é atualizada no painel para o status 'Revertida'.",
    },
    {
      q: "Onde vejo minhas indicações e o histórico de comissões?",
      a: "Todas as suas métricas estão disponíveis em tempo real no seu Painel do Parceiro em /affiliates. Lá você visualiza as lojas cadastradas, status (ativa, trial, pendente), saldo a receber, histórico de repasses e sua faixa atual.",
    },
    {
      q: "Posso criar meus próprios vídeos e materiais de divulgação?",
      a: "Com certeza! Você tem total liberdade para criar seus próprios roteiros, postagens, carrosséis, tutoriais e vídeos no seu estilo. As ideias da Central servem como inspiração para acelerar sua produção.",
    },
    {
      q: "Preciso obrigatoriamente aparecer nos vídeos?",
      a: "Não! Você escolhe o formato que melhor combina com você. Você pode aparecer diante da câmera, fazer demonstrações da tela, usar narração em voz ou criar posts e carrosséis. O programa não exige nenhum formato específico.",
    },
    {
      q: "Posso divulgar o Scalius nas redes sociais (Instagram, TikTok, YouTube, etc.)?",
      a: "Sim! Você pode colocar seu link na bio do Instagram e TikTok, nos Stories com sticker de link, na descrição de vídeos do YouTube, no Facebook, LinkedIn e em canais de conteúdo sobre comércio, moda e empreendedorismo.",
    },
    {
      q: "Posso divulgar de outras maneiras além das redes sociais?",
      a: "Sim! Você pode fazer indicações diretas 1 a 1 para amigos lojistas, comerciantes da sua cidade, grupos de WhatsApp/Telegram, prestar consultoria para lojistas ou incluir sua recomendação em cursos e palestras.",
    },
    {
      q: "Posso usar as lojas demo para gravar meus vídeos e demonstrações?",
      a: "Sim! As 3 lojas de demonstração (Aurora Moda, Floricultura das Flores e Elena Cosméticos) estão abertas justamente para você navegar, testar funcionalidades, tirar prints, gravar a tela do celular e mostrar o Scalius funcionando na prática.",
    },
    {
      q: "Posso tirar prints do site do Scalius e das lojas demo para usar nos meus vídeos?",
      a: "Sim, com certeza! Tirar prints da nossa página inicial (scalius.com.br) e das vitrines demo é uma das formas mais recomendadas e fáceis de produzir conteúdo. Você pode colocar esses prints como fundo (usando o efeito de tela verde / green screen no Instagram Reels, TikTok ou CapCut) enquanto fala diretamente para a câmera.",
    },
    {
      q: "Posso indicar pessoas conhecidas e clientes de consultoria?",
      a: "Sim! Indicar para pessoas conhecidas que já vendem pelo WhatsApp ou Instagram é uma das formas mais rápidas de conseguir seus primeiros clientes ativos.",
    },
    {
      q: "Posso indicar minha própria empresa (autoindicação)?",
      a: "Não. O sistema possui validação de e-mail e dados de conta. A autoindicação para a própria loja é bloqueada pelas regras de integridade do programa.",
    },
    {
      q: "Como recebo minhas comissões e repasses de pagamento?",
      a: "Os repasses são feitos diretamente para a chave PIX cadastrada no seu painel de afiliado em /affiliates. A equipe do Scalius realiza as transferências das comissões disponíveis sem exigência de valor mínimo de saque.",
    },
  ], []);

  const filteredFaq = useMemo(() => {
    if (!faqSearch.trim()) return FAQ_ITEMS;
    const term = faqSearch.toLowerCase();
    return FAQ_ITEMS.filter(
      (item) =>
        item.q.toLowerCase().includes(term) || item.a.toLowerCase().includes(term)
    );
  }, [FAQ_ITEMS, faqSearch]);

  return (
    <div className="central-afiliados-page min-h-screen bg-[#FAFAFA] text-[#1A1A1A] flex flex-col font-['Reddit_Sans',sans-serif]">
      {/* ── Global Font Force matching Index.tsx ── */}
      <style>{`
        .central-afiliados-page,
        .central-afiliados-page h1,
        .central-afiliados-page h2,
        .central-afiliados-page h3,
        .central-afiliados-page h4,
        .central-afiliados-page h5,
        .central-afiliados-page h6,
        .central-afiliados-page p,
        .central-afiliados-page span,
        .central-afiliados-page button,
        .central-afiliados-page a,
        .central-afiliados-page input,
        .central-afiliados-page div,
        .central-afiliados-page nav,
        .central-afiliados-page header,
        .central-afiliados-page footer,
        .central-afiliados-page section,
        .central-afiliados-page main,
        .central-afiliados-page ol,
        .central-afiliados-page ul,
        .central-afiliados-page li,
        .central-afiliados-page label,
        .central-afiliados-page strong,
        .central-afiliados-page em,
        .central-afiliados-page code,
        .central-afiliados-page [data-radix-collection-item],
        .central-afiliados-page [role="tab"],
        .central-afiliados-page [role="button"] {
          font-family: "Reddit Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
        }
      `}</style>

      {/* ── Top Navigation Bar ── */}
      <header className="border-b border-gray-200/80 bg-white/95 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <img src="/scalius-logo-dark.png" alt="Scalius" className="h-7 object-contain" />
            <span className="hidden sm:inline-block text-[11px] font-bold tracking-wide uppercase px-2.5 py-0.5 rounded-full bg-[#FFF4EE] text-[#FF5E00] border border-[#FF5E00]/20">
              Central do Afiliado
            </span>
          </Link>

          <div className="flex items-center gap-2.5 sm:gap-3">
            {affiliateProfile ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/affiliates")}
                className="gap-1.5 text-xs sm:text-sm font-semibold h-9 px-3.5 border-gray-300 bg-white hover:bg-gray-50"
              >
                <BarChart3 className="h-4 w-4 text-[#FF5E00]" />
                <span className="hidden sm:inline">Meu Painel</span>
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/login")}
                className="gap-1.5 text-xs sm:text-sm font-semibold h-9 px-3.5 border-gray-300 bg-white hover:bg-gray-50"
              >
                Entrar
              </Button>
            )}

            <Button
              size="sm"
              className="gap-1.5 text-xs sm:text-sm bg-[#FF5E00] hover:bg-[#E65500] text-white font-semibold h-9 px-4 rounded-full border-0 shadow-xs"
              onClick={() => navigate("/affiliates")}
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Painel</span>
            </Button>
          </div>
        </div>
      </header>

      {/* ── Main Content: Alternating Full-Width Sections ── */}
      <main className="flex-1 w-full flex flex-col">
        
        {/* ── 0. Hero Principal & Resumo do Afiliado (CLARO ⚪) ── */}
        <section className="w-full bg-[#FAFAFA] border-b border-gray-200/80 py-12 sm:py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider bg-[#FFF4EE] text-[#FF5E00] border border-[#FF5E00]/30 shadow-xs">
              <Sparkles className="h-4 w-4 text-[#FF5E00]" />
              Guia Prático de Divulgação
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#1A1A1A] leading-[1.15] max-w-4xl mx-auto">
              Entrei no programa de afiliados. <br className="hidden sm:block" />
              <span className="text-[#FF5E00]">E agora, como começo a divulgar?</span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-[#444444] max-w-3xl mx-auto leading-relaxed">
              Esta central foi criada para responder exatamente a essa pergunta. Aqui você encontra ideias de conteúdo, conceitos que pode adaptar para o seu estilo favorito, lojas demo reais para demonstração e materiais oficiais para apoiar suas divulgações.
            </p>

            {/* Card de Resumo Rápido dos Dados do Afiliado */}
            <div className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm space-y-6 text-left max-w-4xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3">
                  <span className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                    <ShieldCheck className="h-6 w-6" />
                  </span>
                  <div>
                    <h3 className="text-lg font-bold text-[#1A1A1A]">Seus Dados de Divulgação</h3>
                    <p className="text-sm text-[#555555]">
                      {affiliateProfile ? "Seus códigos oficiais para receber comissões recorrentes." : "Faça login para ver seu código e link reais."}
                    </p>
                  </div>
                </div>
                <Badge className="bg-[#FFF4EE] text-[#FF5E00] border border-[#FF5E00]/30 font-bold text-sm px-3.5 py-1 self-start sm:self-auto">
                  Sua Taxa Atual: {commissionRate}% Recorrente
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Link */}
                <div className="rounded-2xl border border-gray-200 bg-[#FAFAFA] p-5 space-y-3">
                  <span className="text-xs sm:text-sm font-bold text-[#555555] uppercase tracking-wider flex items-center gap-2">
                    <Share2 className="h-4 w-4 text-[#FF5E00]" /> Seu Link de Indicação
                  </span>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <code className="flex-1 bg-white px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm font-mono truncate text-[#1A1A1A]">
                      {referralLink}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(referralLink, "link-topo", "Link de indicação copiado!")}
                      className="h-10 shrink-0 text-xs sm:text-sm font-semibold gap-1.5 border-gray-300 bg-white hover:bg-gray-100"
                    >
                      {copiedItem === "link-topo" ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                      {copiedItem === "link-topo" ? "Copiado!" : "Copiar Link"}
                    </Button>
                  </div>
                  <p className="text-xs sm:text-sm text-[#666666] leading-relaxed">
                    Identifica sua indicação. O cliente paga o valor padrão e você recebe a comissão recorrente.
                  </p>
                </div>

                {/* Cupom */}
                <div className="rounded-2xl border border-[#FF5E00]/30 bg-[#FFF4EE]/40 p-5 space-y-3">
                  <span className="text-xs sm:text-sm font-bold text-[#FF5E00] uppercase tracking-wider flex items-center gap-2">
                    <Gift className="h-4 w-4 text-[#FF5E00]" /> Seu Cupom de 10% OFF
                  </span>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <code className="flex-1 bg-white px-3.5 py-2.5 rounded-xl border border-[#FF5E00]/30 text-base sm:text-lg font-mono font-bold text-[#FF5E00] tracking-widest text-center sm:text-left">
                      {affiliateCode}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(affiliateCode, "cupom-topo", "Cupom copiado com sucesso!")}
                      className="h-10 shrink-0 text-xs sm:text-sm font-semibold gap-1.5 border-[#FF5E00]/30 bg-white text-[#FF5E00] hover:bg-[#FFF4EE]"
                    >
                      {copiedItem === "cupom-topo" ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4 text-[#FF5E00]" />}
                      {copiedItem === "cupom-topo" ? "Copiado!" : "Copiar Cupom"}
                    </Button>
                  </div>
                  <p className="text-xs sm:text-sm text-[#666666] leading-relaxed">
                    Dá <strong>10% de desconto no 1º mês</strong> para o lojista. Sua comissão continua sendo calculada sobre o preço cheio!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Seção Especial: Liberdade Criativa & Escolha seu Formato (ESCURO ⚫) ── */}
        <section className="w-full bg-[#0F1016] text-white py-14 sm:py-20 border-b border-zinc-800">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-8 text-center">
            <div className="space-y-3 max-w-3xl mx-auto">
              <span className="text-sm font-bold uppercase tracking-wider text-[#FF5E00] px-3.5 py-1.5 rounded-full bg-[#FF5E00]/10 border border-[#FF5E00]/30 inline-block">
                Liberdade Criativa
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
                Escolha seu formato: Como produzir seu conteúdo
              </h2>
              <p className="text-base sm:text-lg text-zinc-300 leading-relaxed">
                Você não precisa seguir uma fórmula engessada. O Scalius fornece toda a estrutura e as ferramentas, mas você decide como criar, se prefere aparecer na câmera e quais canais utilizar.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 text-left pt-2">
              <div className="rounded-2xl border border-white/10 bg-[#181926] p-6 space-y-2.5 shadow-lg hover:border-[#FF5E00]/40 transition-all">
                <div className="flex items-center gap-2.5 font-bold text-lg text-white">
                  <span className="p-2 rounded-xl bg-[#FF5E00]/10 text-[#FF5E00]">
                    <Mic className="h-5 w-5" />
                  </span>
                  Falando para a Câmera
                </div>
                <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
                  Você aparece conversando diretamente com o público, apresentando problemas cotidianos e dando dicas. Excelente para gerar conexão e autoridade.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#181926] p-6 space-y-2.5 shadow-lg hover:border-indigo-500/40 transition-all">
                <div className="flex items-center gap-2.5 font-bold text-lg text-white">
                  <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                    <Video className="h-5 w-5" />
                  </span>
                  Apresentação + Demo
                </div>
                <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
                  Você aparece no início chamando a atenção para um problema e corta para a gravação da tela demonstrando a vitrine ou painel funcionando.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#181926] p-6 space-y-2.5 shadow-lg hover:border-blue-500/40 transition-all">
                <div className="flex items-center gap-2.5 font-bold text-lg text-white">
                  <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                    <Monitor className="h-5 w-5" />
                  </span>
                  Gravação de Tela / Demo
                </div>
                <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
                  Grave a tela do celular ou computador mostrando o catálogo e checkout com sua narração em voz ou legendas dinâmicas.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#181926] p-6 space-y-2.5 shadow-lg hover:border-emerald-500/40 transition-all">
                <div className="flex items-center gap-2.5 font-bold text-lg text-white">
                  <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                    <Layers className="h-5 w-5" />
                  </span>
                  Carrosséis & Posts
                </div>
                <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
                  Conteúdos educativos em imagens e slides para feed no Instagram, ensinando como organizar lojas virtuais e links na bio.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#181926] p-6 space-y-2.5 shadow-lg hover:border-purple-500/40 transition-all">
                <div className="flex items-center gap-2.5 font-bold text-lg text-white">
                  <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                    <Smartphone className="h-5 w-5" />
                  </span>
                  Stories Interativos
                </div>
                <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
                  Enquetes, caixinhas de perguntas e demonstrações rápidas no dia a dia com sticker de link e cupom.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#181926] p-6 space-y-2.5 shadow-lg hover:border-amber-500/40 transition-all">
                <div className="flex items-center gap-2.5 font-bold text-lg text-white">
                  <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                    <MessageSquare className="h-5 w-5" />
                  </span>
                  Indicações 1 a 1
                </div>
                <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
                  Recomendações consultivas diretas no WhatsApp para comerciantes, lojistas amigos e clientes de consultoria.
                </p>
              </div>
            </div>

            {/* 📸 Dica de Ouro: Câmera + Prints do Site como B-Roll / Fundo */}
            <div className="rounded-3xl border border-[#FF5E00]/40 bg-gradient-to-r from-[#FF5E00]/15 via-[#181926] to-[#181926] p-6 sm:p-7 text-left shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-3xl">
                <div className="flex items-center gap-2.5 text-[#FF5E00] font-bold text-base sm:text-lg">
                  <Sparkles className="h-5 w-5 shrink-0" />
                  <span>Dica Prática: Fale para a câmera usando Prints do Site como fundo!</span>
                </div>
                <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
                  Você não precisa de gravadores de tela complexos nem de edições demoradas: tire <strong>prints de 2 ou 3 seções do site do Scalius</strong> (como o catálogo no celular, a taxa de entrega ou o Pix aprovado) e use o <strong>efeito de Tela Verde (Green Screen)</strong> do Instagram Reels, TikTok ou CapCut enquanto você fala para a câmera. É simples, rápido e converte muito bem!
                </p>
              </div>
              <div className="shrink-0">
                <Badge className="bg-[#FF5E00] text-white font-bold text-xs sm:text-sm px-4 py-1.5 shadow-md">
                  💡 Zero complicação
                </Badge>
              </div>
            </div>
          </div>
        </section>

        {/* ── Barra de Navegação Rápida por Âncoras ── */}
        <div className="w-full bg-[#111218] py-2.5 border-b border-zinc-800/80 sticky top-[57px] sm:top-[61px] z-40 backdrop-blur-md shadow-md">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 overflow-x-auto no-scrollbar">
            <div className="flex items-center justify-start md:justify-center gap-2 min-w-max mx-auto py-1">
              <a
                href="#comece-aqui"
                className="px-4 py-1.5 rounded-full bg-[#1C1D2B] hover:bg-[#FF5E00] text-zinc-300 hover:text-white border border-white/10 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shadow-xs"
              >
                1. Comece Aqui
              </a>
              <a
                href="#como-divulgar"
                className="px-4 py-1.5 rounded-full bg-[#1C1D2B] hover:bg-[#FF5E00] text-zinc-300 hover:text-white border border-white/10 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shadow-xs"
              >
                2. Como Divulgar
              </a>
              <a
                href="#biblioteca-ideias"
                className="px-4 py-1.5 rounded-full bg-[#1C1D2B] hover:bg-[#FF5E00] text-zinc-300 hover:text-white border border-white/10 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shadow-xs"
              >
                3. Ideias de Conteúdo
              </a>
              <a
                href="#lojas-demo"
                className="px-4 py-1.5 rounded-full bg-[#1C1D2B] hover:bg-[#FF5E00] text-zinc-300 hover:text-white border border-white/10 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shadow-xs"
              >
                4. Lojas Demo
              </a>
              <a
                href="#pack-divulgacao"
                className="px-4 py-1.5 rounded-full bg-[#1C1D2B] hover:bg-[#FF5E00] text-zinc-300 hover:text-white border border-white/10 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shadow-xs"
              >
                5. Logos & Legendas
              </a>
              <a
                href="#ctas-sugestoes"
                className="px-4 py-1.5 rounded-full bg-[#1C1D2B] hover:bg-[#FF5E00] text-zinc-300 hover:text-white border border-white/10 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shadow-xs"
              >
                6. Sugestões de CTA
              </a>
              <a
                href="#regras-comissoes"
                className="px-4 py-1.5 rounded-full bg-[#1C1D2B] hover:bg-[#FF5E00] text-zinc-300 hover:text-white border border-white/10 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shadow-xs"
              >
                7. Comissões
              </a>
              <a
                href="#faq"
                className="px-4 py-1.5 rounded-full bg-[#1C1D2B] hover:bg-[#FF5E00] text-zinc-300 hover:text-white border border-white/10 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shadow-xs"
              >
                8. FAQ
              </a>
            </div>
          </div>
        </div>

        {/* ── 1. Comece Aqui: Trilha Prática em 7 Passos (CLARO ⚪) ── */}
        <section id="comece-aqui" className="w-full bg-[#FFFFFF] py-14 sm:py-20 border-b border-gray-200 scroll-mt-28 sm:scroll-mt-32">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-8">
            <div className="text-center space-y-3 max-w-3xl mx-auto">
              <span className="text-sm font-semibold uppercase tracking-wider text-[#FF5E00] px-3.5 py-1.5 rounded-full bg-[#FFF4EE] border border-[#FF5E00]/20 inline-block">
                Passo a Passo
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1A1A1A]">
                1. Comece aqui: O que fazer logo após entrar no programa
              </h2>
              <p className="text-base sm:text-lg text-[#555555]">
                Siga esta sequência prática para realizar suas primeiras divulgações com segurança e clareza.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Passo 1 */}
              <div className="rounded-3xl border border-gray-200 bg-[#FAFAFA] p-6 sm:p-7 space-y-4 hover:border-[#FF5E00]/50 hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-[#FFF4EE] text-[#FF5E00] font-bold text-xl flex items-center justify-center border border-[#FF5E00]/20">
                    1
                  </div>
                  <Badge variant="outline" className="text-xs font-semibold bg-white">Conhecimento</Badge>
                </div>
                <h3 className="font-bold text-xl text-[#1A1A1A]">Conheça o Scalius</h3>
                <p className="text-base text-[#444444] leading-relaxed">
                  Entenda o que a plataforma faz: uma vitrine online com checkout Pix automático, controle de estoque por variações e cálculo de frete para quem vende no WhatsApp e redes sociais.
                </p>
              </div>

              {/* Passo 2 */}
              <div className="rounded-3xl border border-gray-200 bg-[#FAFAFA] p-6 sm:p-7 space-y-4 hover:border-[#FF5E00]/50 hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-[#FFF4EE] text-[#FF5E00] font-bold text-xl flex items-center justify-center border border-[#FF5E00]/20">
                    2
                  </div>
                  <Badge variant="outline" className="text-xs font-semibold bg-white">Experiência</Badge>
                </div>
                <h3 className="font-bold text-xl text-[#1A1A1A]">Explore as Lojas Demo</h3>
                <p className="text-base text-[#444444] leading-relaxed">
                  Abra as 3 lojas de demonstração oficiais (Aurora Moda, Floricultura e Elena Cosméticos). Navegue, adicione ao carrinho e veja como é fluida a experiência no celular.
                </p>
              </div>

              {/* Passo 3 */}
              <div className="rounded-3xl border border-gray-200 bg-[#FAFAFA] p-6 sm:p-7 space-y-4 hover:border-[#FF5E00]/50 hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-[#FFF4EE] text-[#FF5E00] font-bold text-xl flex items-center justify-center border border-[#FF5E00]/20">
                    3
                  </div>
                  <Badge variant="outline" className="text-xs font-semibold bg-white">Atribuição</Badge>
                </div>
                <h3 className="font-bold text-xl text-[#1A1A1A]">Pegue seu Link & Cupom</h3>
                <p className="text-base text-[#444444] leading-relaxed">
                  Copie seu link com rastreio (<code className="text-xs font-mono bg-white px-1.5 py-0.5 rounded border border-gray-200 font-bold">?ref={affiliateCode}</code>) e seu cupom próprio de 10% OFF. Salve no seu teclado de atalhos.
                </p>
              </div>

              {/* Passo 4 */}
              <div className="rounded-3xl border border-gray-200 bg-[#FAFAFA] p-6 sm:p-7 space-y-4 hover:border-[#FF5E00]/50 hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-[#FFF4EE] text-[#FF5E00] font-bold text-xl flex items-center justify-center border border-[#FF5E00]/20">
                    4
                  </div>
                  <Badge variant="outline" className="text-xs font-semibold bg-white">Estratégia</Badge>
                </div>
                <h3 className="font-bold text-xl text-[#1A1A1A]">Escolha uma Forma de Divulgar</h3>
                <p className="text-base text-[#444444] leading-relaxed">
                  Decida como prefere começar: gravando a tela do celular, aparecendo diante da câmera, postando carrosséis educativos ou indicando diretamente no WhatsApp.
                </p>
              </div>

              {/* Passo 5 */}
              <div className="rounded-3xl border border-gray-200 bg-[#FAFAFA] p-6 sm:p-7 space-y-4 hover:border-[#FF5E00]/50 hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-[#FFF4EE] text-[#FF5E00] font-bold text-xl flex items-center justify-center border border-[#FF5E00]/20">
                    5
                  </div>
                  <Badge variant="outline" className="text-xs font-semibold bg-white">Execução</Badge>
                </div>
                <h3 className="font-bold text-xl text-[#1A1A1A]">Crie sua 1ª Divulgação</h3>
                <p className="text-base text-[#444444] leading-relaxed">
                  Escolha uma ideia na Biblioteca abaixo. Você pode gravar a tela da loja demo ou simplesmente tirar prints de seções do nosso site (scalius.com.br) para usar como fundo enquanto fala para a câmera. Publique com seu link na bio e cupom!
                </p>
              </div>

              {/* Passo 6 */}
              <div className="rounded-3xl border border-gray-200 bg-[#FAFAFA] p-6 sm:p-7 space-y-4 hover:border-[#FF5E00]/50 hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-[#FFF4EE] text-[#FF5E00] font-bold text-xl flex items-center justify-center border border-[#FF5E00]/20">
                    6
                  </div>
                  <Badge variant="outline" className="text-xs font-semibold bg-white">Métricas</Badge>
                </div>
                <h3 className="font-bold text-xl text-[#1A1A1A]">Acompanhe no Painel</h3>
                <p className="text-base text-[#444444] leading-relaxed">
                  Acesse o painel em <Link to="/affiliates" className="text-[#FF5E00] font-bold hover:underline">/affiliates</Link> para ver em tempo real as lojas criadas, assinaturas ativas e as comissões mensais geradas.
                </p>
              </div>

              {/* Passo 7 */}
              <div className="rounded-3xl border-2 border-[#FF5E00]/30 bg-[#FFF4EE]/60 p-6 sm:p-8 space-y-4 md:col-span-2 lg:col-span-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xs">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#FF5E00] text-white font-bold text-xl flex items-center justify-center shadow-xs">
                      7
                    </div>
                    <h3 className="font-bold text-xl sm:text-2xl text-[#1A1A1A]">Teste Novas Formas de Divulgação</h3>
                  </div>
                  <p className="text-base text-[#444444] max-w-3xl leading-relaxed">
                    O segredo da renda recorrente é a consistência. Teste diferentes ganchos, outros nichos de lojas e descubra o formato que mais converte com seu público.
                  </p>
                </div>
                <Button
                  size="lg"
                  onClick={() => {
                    const el = document.getElementById("biblioteca-ideias");
                    el?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="gap-2 text-base font-semibold bg-[#FF5E00] hover:bg-[#E65500] text-white rounded-full px-6 py-6 shrink-0 shadow-sm border-0"
                >
                  Ver Ideias Prontas
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* ── 2. Como Divulgar o Scalius (Modelos Mentais) (ESCURO ⚫) ── */}
        <section id="como-divulgar" className="w-full bg-[#0F1016] text-white py-14 sm:py-20 border-b border-zinc-800 scroll-mt-28 sm:scroll-mt-32">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-8">
            <div className="text-center space-y-3 max-w-3xl mx-auto">
              <span className="text-sm font-semibold uppercase tracking-wider text-[#FF5E00] px-3.5 py-1.5 rounded-full bg-[#FF5E00]/10 border border-[#FF5E00]/30 inline-block">
                Estrutura de Alta Conversão
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
                2. Como pensar em uma divulgação eficiente
              </h2>
              <p className="text-base sm:text-lg text-zinc-300 leading-relaxed">
                O objetivo não é simplesmente dizer <em>"Conheça o Scalius"</em>. O ideal é apresentar uma <strong>situação, problema, curiosidade ou demonstração</strong> que faça sentido para quem está assistindo.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Card 1 */}
              <div className="rounded-3xl border border-white/10 bg-[#181926] p-6 space-y-3 shadow-lg hover:border-[#FF5E00]/40 transition-all">
                <div className="flex items-center gap-3 text-lg font-bold text-white">
                  <span className="p-2 rounded-xl bg-red-500/10 text-red-400 text-xl">🎯</span>
                  Problema → Solução
                </div>
                <p className="text-base text-zinc-300 leading-relaxed">
                  Mostre uma dificuldade real que o lojista enfrenta (ex: perder 2 horas por dia calculando frete manual) e apresente o Scalius como a solução automática.
                </p>
              </div>

              {/* Card 2 */}
              <div className="rounded-3xl border border-white/10 bg-[#181926] p-6 space-y-3 shadow-lg hover:border-emerald-500/40 transition-all">
                <div className="flex items-center gap-3 text-lg font-bold text-white">
                  <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 text-xl">📱</span>
                  Demonstração ao Vivo
                </div>
                <p className="text-base text-zinc-300 leading-relaxed">
                  Grave a loja funcionando em vez de apenas falar. Mostre a escolha da cor, o carrinho e a geração imediata do Pix na tela.
                </p>
              </div>

              {/* Card 3 */}
              <div className="rounded-3xl border border-white/10 bg-[#181926] p-6 space-y-3 shadow-lg hover:border-blue-500/40 transition-all">
                <div className="flex items-center gap-3 text-lg font-bold text-white">
                  <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400 text-xl">🔄</span>
                  Antes e Depois
                </div>
                <p className="text-base text-zinc-300 leading-relaxed">
                  Contraste uma rotina caótica (pedidos anotados em papel ou conversas perdidas no WhatsApp) com uma vitrine moderna e profissional.
                </p>
              </div>

              {/* Card 4 */}
              <div className="rounded-3xl border border-white/10 bg-[#181926] p-6 space-y-3 shadow-lg hover:border-amber-500/40 transition-all">
                <div className="flex items-center gap-3 text-lg font-bold text-white">
                  <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 text-xl">⚖️</span>
                  Comparação Educativa
                </div>
                <p className="text-base text-zinc-300 leading-relaxed">
                  Compare depender exclusivamente de conversas manuais versus ter um link de vitrine com autoatendimento e Pix 24 horas.
                </p>
              </div>

              {/* Card 5 */}
              <div className="rounded-3xl border border-white/10 bg-[#181926] p-6 space-y-3 shadow-lg hover:border-purple-500/40 transition-all">
                <div className="flex items-center gap-3 text-lg font-bold text-white">
                  <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400 text-xl">🛠️</span>
                  Tutorial Rápido
                </div>
                <p className="text-base text-zinc-300 leading-relaxed">
                  Ensine algo prático (ex: como organizar grade de tamanhos ou calcular frete nacional) usando a interface do Scalius durante a explicação.
                </p>
              </div>

              {/* Card 6 */}
              <div className="rounded-3xl border border-white/10 bg-[#181926] p-6 space-y-3 shadow-lg hover:border-pink-500/40 transition-all">
                <div className="flex items-center gap-3 text-lg font-bold text-white">
                  <span className="p-2 rounded-xl bg-pink-500/10 text-pink-400 text-xl">📖</span>
                  Storytelling & Curiosidade
                </div>
                <p className="text-base text-zinc-300 leading-relaxed">
                  Conte uma história que desperte curiosidade: <em>"Essa loja quase perdeu uma venda de R$ 300 porque o cliente queria comprar meia-noite..."</em>.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── 3. Biblioteca de Ideias de Conteúdo (CLARO ⚪) ── */}
        <section id="biblioteca-ideias" className="w-full bg-[#F6F7FB] py-14 sm:py-20 border-b border-gray-200 scroll-mt-28 sm:scroll-mt-32">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-8">
            <div className="text-center space-y-3 max-w-3xl mx-auto">
              <span className="text-sm font-semibold uppercase tracking-wider text-[#FF5E00] px-3.5 py-1.5 rounded-full bg-[#FFF4EE] border border-[#FF5E00]/20 inline-block">
                Inspiração de Conteúdo
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1A1A1A]">
                3. Biblioteca de Ideias de Conteúdo
              </h2>
              <p className="text-base sm:text-lg text-[#555555]">
                Ideias estruturadas para você gravar hoje. Cada conceito pode ser executado falando para a câmera, gravando a tela, demonstrando a loja ou em formato de post.
              </p>
            </div>

            {/* Categorias Tabs por Formato */}
            <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2 no-scrollbar">
              {[
                { id: "all", label: "Todas as Ideias" },
                { id: "camera", label: "Apresentação & Câmera" },
                { id: "curto", label: "Vídeos Curtos & Reels" },
                { id: "demo", label: "Demonstrações da Loja" },
                { id: "carrossel", label: "Carrosséis & Posts" },
                { id: "direto", label: "1 a 1 (WhatsApp)" },
              ].map((tab) => (
                <Button
                  key={tab.id}
                  variant={selectedCategory === tab.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(tab.id)}
                  className={`text-sm font-semibold shrink-0 rounded-full h-10 px-5 transition-all ${
                    selectedCategory === tab.id
                      ? "bg-[#FF5E00] hover:bg-[#E65500] text-white border-0 shadow-xs"
                      : "border-gray-200 bg-white text-[#444444] hover:bg-gray-100"
                  }`}
                >
                  {tab.label}
                </Button>
              ))}
            </div>

            {/* Grid de Ideias Estruturadas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredIdeas.map((idea) => {
                const demoStore = REAL_DEMO_STORES.find(s => s.slug === idea.recommendedStoreSlug) || REAL_DEMO_STORES[0];
                const hydratedCta = hydrateText(idea.suggestedCta, demoStore.slug);

                return (
                  <div
                    key={idea.id}
                    className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-8 space-y-5 shadow-xs hover:border-[#FF5E00]/40 hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-4">
                      {/* Header do Card */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-gray-100 text-gray-700">
                              {idea.formatBadge}
                            </span>
                            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                              {idea.timeEstimate}
                            </span>
                          </div>
                          <h3 className="font-bold text-xl sm:text-2xl text-[#1A1A1A] pt-1 leading-snug">
                            {idea.title}
                          </h3>
                        </div>
                        <Badge variant="outline" className="text-xs shrink-0 font-semibold">
                          {idea.difficulty}
                        </Badge>
                      </div>

                      {/* Objetivo */}
                      <div className="text-sm sm:text-base text-[#555555] leading-relaxed">
                        <strong className="text-[#1A1A1A] font-bold">🎯 Objetivo: </strong>
                        {idea.objective}
                      </div>

                      {/* Gancho (Hook) */}
                      <div className="rounded-2xl bg-[#FFF4EE] border border-[#FF5E00]/30 p-4 space-y-1.5">
                        <span className="text-xs font-bold text-[#FF5E00] uppercase tracking-wider flex items-center gap-1.5">
                          <Flame className="h-4 w-4" /> Gancho Sugerido (Primeiros 3 segundos):
                        </span>
                        <p className="text-base sm:text-lg font-bold text-[#1A1A1A] italic leading-snug">
                          "{hydrateText(idea.hook)}"
                        </p>
                      </div>

                      {/* Contexto & Roteiro */}
                      <div className="space-y-2 pt-1">
                        <span className="text-sm font-bold text-[#1A1A1A] uppercase tracking-wider block">
                          🧩 Contexto & Roteiro Sugerido:
                        </span>
                        <ol className="space-y-2 text-sm sm:text-base text-[#444444] list-decimal pl-5">
                          {idea.script.map((step, idx) => (
                            <li key={idx} className="leading-relaxed">
                              {hydrateText(step, demoStore.slug)}
                            </li>
                          ))}
                        </ol>
                      </div>

                      {/* O Que Mostrar na Tela */}
                      <div className="rounded-2xl border border-gray-200 bg-[#FAFAFA] p-4 text-sm sm:text-base space-y-1.5">
                        <span className="font-bold text-[#1A1A1A] block">
                          👀 O que mostrar:
                        </span>
                        <p className="text-[#555555] leading-relaxed">{idea.whatToShow}</p>
                        {idea.recommendedStoreSlug && (
                          <div className="pt-1.5 flex items-center gap-2">
                            <span className="text-xs text-[#777777]">Loja recomendada:</span>
                            <a
                              href={`https://${demoStore.slug}.scalius.com.br`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs sm:text-sm font-bold text-[#FF5E00] hover:underline inline-flex items-center gap-1"
                            >
                              {demoStore.name} ({demoStore.slug}.scalius.com.br)
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Formas de Executar */}
                      <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4 text-sm sm:text-base space-y-2">
                        <span className="font-bold text-indigo-950 block flex items-center gap-1.5">
                          🎥 Formas possíveis de executar esta ideia:
                        </span>
                        <ul className="space-y-1 text-xs sm:text-sm text-indigo-900 list-disc pl-5">
                          {idea.possibleFormats.map((fmt, i) => (
                            <li key={i} className="leading-relaxed">{fmt}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Sugestão de CTA + Ações */}
                    <div className="border-t border-gray-100 pt-4 space-y-2.5 mt-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs sm:text-sm text-[#777777] uppercase tracking-wider">
                          📣 Sugestão de CTA:
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs sm:text-sm font-semibold gap-1.5 border-gray-300 text-[#1A1A1A] hover:bg-gray-100"
                          onClick={() => copyToClipboard(hydratedCta, `cta-${idea.id}`, "CTA copiada com sucesso!")}
                        >
                          {copiedItem === `cta-${idea.id}` ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                          {copiedItem === `cta-${idea.id}` ? "Copiada!" : "Copiar CTA"}
                        </Button>
                      </div>
                      <p className="text-xs sm:text-sm text-[#1A1A1A] bg-[#FAFAFA] p-3 rounded-xl border border-gray-200 font-mono leading-relaxed">
                        {hydratedCta}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── 4. Lojas de Demonstração Reais do Sistema (ESCURO ⚫) ── */}
        <section id="lojas-demo" className="w-full bg-[#0F1016] text-white py-14 sm:py-20 border-b border-zinc-800 scroll-mt-28 sm:scroll-mt-32">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-8">
            <div className="text-center space-y-3 max-w-3xl mx-auto">
              <span className="text-sm font-semibold uppercase tracking-wider text-[#FF5E00] px-3.5 py-1.5 rounded-full bg-[#FF5E00]/10 border border-[#FF5E00]/30 inline-block">
                Lojas Oficiais do Sistema
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
                4. Lojas de Demonstração para Usar e Gravar
              </h2>
              <p className="text-base sm:text-lg text-zinc-300 leading-relaxed">
                O Scalius disponibiliza 3 lojas demo reais e completas. Você pode utilizá-las para conhecer a plataforma, gravar a tela do celular, tirar prints para posts e enviar para clientes verem o produto funcionando na prática.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {REAL_DEMO_STORES.map((demo) => {
                const demoUrl = `https://${demo.slug}.scalius.com.br`;
                return (
                  <div
                    key={demo.slug}
                    className="rounded-3xl border border-white/10 bg-[#181926] overflow-hidden shadow-lg hover:border-[#FF5E00]/40 transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Banner / Header visual */}
                      <div className="h-36 w-full bg-zinc-900 relative overflow-hidden flex items-center justify-center border-b border-white/10">
                        {demo.bannerUrl ? (
                          <img src={demo.bannerUrl} alt={demo.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-sm text-zinc-400 flex items-center gap-1.5">
                            <Store className="h-5 w-5" /> {demo.name}
                          </div>
                        )}
                        <div className="absolute top-3 right-3">
                          <Badge className="bg-black/80 text-white border-white/20 font-bold text-xs shadow-xs">
                            {demo.productsCount} Produtos
                          </Badge>
                        </div>
                      </div>

                      <div className="p-6 space-y-4">
                        <div className="flex items-center gap-3">
                          {demo.logoUrl && (
                            <img src={demo.logoUrl} alt="" className="w-12 h-12 rounded-full object-cover border border-white/10 shadow-xs" />
                          )}
                          <div>
                            <h3 className="font-bold text-lg sm:text-xl text-white leading-tight">{demo.name}</h3>
                            <span className="text-xs sm:text-sm text-zinc-400">{demo.niche}</span>
                          </div>
                        </div>

                        <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
                          {demo.description}
                        </p>

                        <div className="space-y-2 pt-1">
                          <span className="text-xs font-bold text-white uppercase tracking-wider block">
                            Destaques para mostrar no vídeo:
                          </span>
                          <ul className="space-y-1.5 text-xs sm:text-sm text-zinc-300">
                            {demo.highlights.map((h, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-emerald-400 font-bold">✓</span> {h}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 pt-0 space-y-2">
                      <div className="flex items-center gap-2">
                        <a
                          href={demoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 text-center py-3 px-4 rounded-xl bg-[#FF5E00] hover:bg-[#E65500] text-white text-sm font-bold inline-flex items-center justify-center gap-2 transition-colors no-underline shadow-xs"
                        >
                          Abrir Loja Demo
                          <ExternalLink className="h-4 w-4" />
                        </a>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(demoUrl, `demo-${demo.slug}`, "Link da vitrine demo copiado!")}
                          className="h-11 px-3.5 rounded-xl border-zinc-700 bg-zinc-800/80 text-zinc-200 hover:bg-zinc-700 hover:text-white"
                          title="Copiar link da vitrine demo"
                        >
                          {copiedItem === `demo-${demo.slug}` ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Dica de gravação de tela e prints */}
            <div className="rounded-2xl border border-white/10 bg-[#181926] p-5 text-sm sm:text-base text-zinc-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
              <div className="flex items-center gap-3">
                <Smartphone className="h-6 w-6 text-[#FF5E00] shrink-0" />
                <span>
                  <strong className="text-white">Dica prática:</strong> Abra as lojas demo no celular para gravar a tela ou <strong>tire prints das seções mais chamativas</strong> (catálogo, carrinho, checkout Pix) para usar como B-roll ou fundo verde nos seus vídeos!
                </span>
              </div>
              {affiliateProfile && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs sm:text-sm font-semibold h-9 gap-1.5 shrink-0 border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700 hover:text-white"
                  onClick={() => navigate("/admin")}
                >
                  Acessar Minha Loja Demo no Admin
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </section>

        {/* ── 5. Pack de Divulgação Oficial: Logos & Legendas (CLARO ⚪) ── */}
        <section id="pack-divulgacao" className="w-full bg-[#FFFFFF] py-14 sm:py-20 border-b border-gray-200 scroll-mt-28 sm:scroll-mt-32">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-8">
            <div className="text-center space-y-3 max-w-3xl mx-auto">
              <span className="text-sm font-semibold uppercase tracking-wider text-[#FF5E00] px-3.5 py-1.5 rounded-full bg-[#FFF4EE] border border-[#FF5E00]/20 inline-block">
                Arquivos & Textos
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1A1A1A]">
                5. Pack Oficial de Divulgação
              </h2>
              <p className="text-base sm:text-lg text-[#555555]">
                Logotipos oficiais em alta resolução e sugestões de legendas prontas para você usar em suas divulgações.
              </p>
            </div>

            {/* Dica de Uso de Prints da Landing Page */}
            <div className="rounded-2xl border border-gray-200 bg-[#FAFAFA] p-5 text-sm sm:text-base text-[#444444] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-xl bg-[#FFF4EE] text-[#FF5E00] shrink-0 font-bold">
                  <Camera className="h-5 w-5" />
                </span>
                <span>
                  <strong className="text-[#1A1A1A]">Imagens & Prints Livres:</strong> Você tem total liberdade para tirar prints de qualquer seção do site oficial (<strong>scalius.com.br</strong>) e das lojas demo para usar em vídeos, carrosséis ou fundos de tela verde!
                </span>
              </div>
              <a
                href="https://scalius.com.br"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs sm:text-sm font-bold text-[#FF5E00] hover:underline shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#FF5E00]/30 bg-white"
              >
                Visitar scalius.com.br
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>

            <Tabs defaultValue="logos" className="space-y-6">
              <div className="flex justify-center">
                <TabsList className="grid grid-cols-2 max-w-xs w-full h-11 p-1 bg-gray-100 rounded-2xl">
                  <TabsTrigger value="logos" className="text-xs sm:text-sm font-semibold rounded-xl">Logos Oficiais</TabsTrigger>
                  <TabsTrigger value="legendas" className="text-xs sm:text-sm font-semibold rounded-xl">Legendas Prontas</TabsTrigger>
                </TabsList>
              </div>

              {/* Sub-aba: Logos */}
              <TabsContent value="logos" className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  {[
                    { title: "Logo Scalius (Dark)", file: "/scalius-logo-dark.png", bg: "bg-white", desc: "Para fundos claros" },
                    { title: "Logo Scalius (Light)", file: "/scalius-logo.png", bg: "bg-zinc-900", desc: "Para fundos escuros" },
                    { title: "Ícone Scalius", file: "/scalius-icon.png", bg: "bg-gray-50", desc: "Símbolo e avatar" },
                  ].map((logo, idx) => (
                    <div key={idx} className="rounded-2xl border border-gray-200 bg-[#FAFAFA] p-5 space-y-4 shadow-xs">
                      <div className={cn("h-28 rounded-xl flex items-center justify-center p-4 border border-gray-200", logo.bg)}>
                        <img src={logo.file} alt={logo.title} className="max-h-12 max-w-full object-contain" />
                      </div>
                      <div>
                        <h4 className="font-bold text-base text-[#1A1A1A]">{logo.title}</h4>
                        <p className="text-xs sm:text-sm text-[#666666]">{logo.desc}</p>
                      </div>
                      <a
                        href={logo.file}
                        download
                        className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-gray-100 text-[#1A1A1A] border border-gray-200 text-center text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-1.5 transition-colors no-underline shadow-xs"
                      >
                        <Download className="h-4 w-4" /> Baixar Logo
                      </a>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* Sub-aba: Legendas Prontas */}
              <TabsContent value="legendas" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {[
                    {
                      title: "Legenda 1: Foco em Praticidade & WhatsApp",
                      text: `Você ainda passa o dia todo respondendo "tem tamanho M?" e calculando frete na mão?\n\nCom o Scalius, sua loja ganha uma vitrine completa onde o cliente escolhe o produto, calcula o frete e paga no Pix com baixa automática.\n\n✨ Menos mensagens repetitivas, mais vendas caindo sozinhas.\n\n🔗 Conheça pelo link na minha bio e use meu cupom [CUPOM] para ganhar 10% de desconto no 1º mês!\n\n#ecommerce #lojistas #vendasonline #lojavirtual #empreendedorismo`,
                    },
                    {
                      title: "Legenda 2: Foco em Pix Automático",
                      text: `O cliente fecha a compra, o Pix aprova sozinho e você só precisa embalar o pacote.\n\nNada de ficar pedindo comprovante ou conferindo extrato do banco. O Scalius conecta com o Mercado Pago e faz a baixa instantânea.\n\n👉 Quer essa estrutura na sua loja? Acesse o link da minha bio!\n🎟️ Cupom exclusivo de 10% OFF: [CUPOM]`,
                    },
                    {
                      title: "Legenda 3: Foco em Criação Rápida de Loja",
                      text: `Criar uma loja virtual não precisa ser caro nem demorado.\n\nCom o Scalius você monta seu catálogo com controle de estoque, variações de cor e tamanho e cálculo de frete em poucos minutos.\n\n🚀 Comece hoje mesmo pelo link na minha bio!\nCupom de desconto: [CUPOM]`,
                    },
                    {
                      title: "Legenda 4: Mensagem Direta para Lojistas (WhatsApp)",
                      text: `Oi! Tudo bem? Vi as peças lindas que você posta aqui no Instagram e lembrei do Scalius.\n\nÉ uma plataforma brasileira de vitrine online super prática que automatiza o Pix e o frete pros seus clientes comprarem direto pelo celular.\n\nDá uma olhada nessa loja demo: [LINK_DEMO]\nSe gostar, tenho um cupom de 10% OFF pra você testar: [CUPOM]!`,
                    },
                  ].map((leg, idx) => {
                    const hydrated = hydrateText(leg.text);
                    return (
                      <div key={idx} className="rounded-3xl border border-gray-200 bg-[#FAFAFA] p-6 space-y-4 flex flex-col justify-between shadow-xs">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-base text-[#1A1A1A]">{leg.title}</h4>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs sm:text-sm font-semibold gap-1.5 border-gray-300 bg-white"
                              onClick={() => copyToClipboard(hydrated, `leg-${idx}`, "Legenda copiada!")}
                            >
                              {copiedItem === `leg-${idx}` ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                              {copiedItem === `leg-${idx}` ? "Copiada" : "Copiar"}
                            </Button>
                          </div>
                          <p className="text-xs sm:text-sm text-[#444444] whitespace-pre-line bg-white p-4 rounded-2xl border border-gray-200 font-mono leading-relaxed">
                            {hydrated}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </section>

        {/* ── 6 & 7. Como Criar uma Boa Divulgação & Sugestões de CTA (ESCURO ⚫) ── */}
        <section id="ctas-sugestoes" className="w-full bg-[#0F1016] text-white py-14 sm:py-20 border-b border-zinc-800 scroll-mt-28 sm:scroll-mt-32">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Boas Práticas */}
              <div className="space-y-5">
                <div className="space-y-2">
                  <span className="text-sm font-semibold uppercase tracking-wider text-[#FF5E00] px-3 py-1 rounded-full bg-[#FF5E00]/10 border border-[#FF5E00]/30 inline-block">
                    Metodologia
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-bold text-white">
                    6. Como criar uma boa divulgação
                  </h3>
                </div>

                <div className="space-y-3.5 text-base">
                  <div className="rounded-2xl border border-white/10 bg-[#181926] p-5 space-y-1.5 shadow-lg">
                    <strong className="text-white flex items-center gap-2 font-bold text-base sm:text-lg">
                      <span className="text-[#FF5E00]">1.</span> Mostre o problema antes da solução
                    </strong>
                    <p className="text-zinc-300 text-sm sm:text-base leading-relaxed">
                      Comece sempre com a dor do lojista (responder preço 100x por dia, conferir comprovante, etc.).
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-[#181926] p-5 space-y-1.5 shadow-lg">
                    <strong className="text-white flex items-center gap-2 font-bold text-base sm:text-lg">
                      <span className="text-[#FF5E00]">2.</span> Mostre o produto funcionando
                    </strong>
                    <p className="text-zinc-300 text-sm sm:text-base leading-relaxed">
                      Vídeos demonstrando o produto convertem muito mais. Você pode gravar a tela ou simplesmente falar para a câmera com prints do site passando no fundo (efeito tela verde).
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-[#181926] p-5 space-y-1.5 shadow-lg">
                    <strong className="text-white flex items-center gap-2 font-bold text-base sm:text-lg">
                      <span className="text-[#FF5E00]">3.</span> Prenda a atenção nos primeiros 3 segundos
                    </strong>
                    <p className="text-zinc-300 text-sm sm:text-base leading-relaxed">
                      O gancho inicial define se a pessoa continua assistindo ou passa para o próximo vídeo.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-[#181926] p-5 space-y-1.5 shadow-lg">
                    <strong className="text-white flex items-center gap-2 font-bold text-base sm:text-lg">
                      <span className="text-[#FF5E00]">4.</span> Seja específico
                    </strong>
                    <p className="text-zinc-300 text-sm sm:text-base leading-relaxed">
                      Em vez de dizer "o Scalius é bom", diga "ele calcula o frete dos Correios em 1 segundo".
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-[#181926] p-5 space-y-1.5 shadow-lg">
                    <strong className="text-white flex items-center gap-2 font-bold text-base sm:text-lg">
                      <span className="text-[#FF5E00]">5.</span> Não dependa de uma única publicação
                    </strong>
                    <p className="text-zinc-300 text-sm sm:text-base leading-relaxed">
                      A renda recorrente é construída com consistência. Poste ideias diferentes toda semana.
                    </p>
                  </div>
                </div>
              </div>

              {/* Sugestões de CTA Dinâmicas */}
              <div className="space-y-5">
                <div className="space-y-2">
                  <span className="text-sm font-semibold uppercase tracking-wider text-[#FF5E00] px-3 py-1 rounded-full bg-[#FF5E00]/10 border border-[#FF5E00]/30 inline-block">
                    Chamadas para Ação
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-bold text-white">
                    7. Sugestões de CTA para Adaptar
                  </h3>
                </div>

                <div className="space-y-3.5">
                  {[
                    { label: "Para Bio do Instagram / TikTok", text: `Crie sua vitrine online com Pix e frete automático 👇\n${referralLink}\nCupom 10% OFF: ${affiliateCode}` },
                    { label: "Para Final de Vídeo (Reels / Shorts)", text: `Quer uma loja assim? O link tá na minha bio! Use o cupom ${affiliateCode} para 10% de desconto.` },
                    { label: "Para Stories com Sticker de Link", text: `Acesse pelo sticker e use o cupom ${affiliateCode} no checkout!` },
                    { label: "Para Descrição de Vídeo do YouTube", text: `Conheça o Scalius e crie sua vitrine online:\n👉 ${referralLink}\nCupom com 10% OFF no 1º mês: ${affiliateCode}` },
                    { label: "Para Mensagem 1 a 1 no WhatsApp", text: `Dá uma olhada no site deles: ${referralLink}\nSe for assinar, usa meu cupom ${affiliateCode} pra ganhar 10% de desconto!` },
                  ].map((cta, i) => (
                    <div key={i} className="rounded-2xl border border-white/10 bg-[#181926] p-5 space-y-2.5 shadow-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-bold text-[#FF5E00] uppercase tracking-wider">
                          {cta.label}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs sm:text-sm font-semibold gap-1.5 border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700 hover:text-white"
                          onClick={() => copyToClipboard(cta.text, `cta-list-${i}`, "CTA copiada!")}
                        >
                          {copiedItem === `cta-list-${i}` ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                          {copiedItem === `cta-list-${i}` ? "Copiada" : "Copiar"}
                        </Button>
                      </div>
                      <code className="block text-xs sm:text-sm font-mono bg-[#10111A] p-3 rounded-xl border border-zinc-800 text-zinc-200 whitespace-pre-line leading-relaxed">
                        {cta.text}
                      </code>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 8 & 9. Regras de Link, Cupom e Comissões (CLARO ⚪) ── */}
        <section id="regras-comissoes" className="w-full bg-[#F6F7FB] py-14 sm:py-20 border-b border-gray-200 scroll-mt-28 sm:scroll-mt-32">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-8">
            <div className="text-center space-y-3 max-w-3xl mx-auto">
              <span className="text-sm font-semibold uppercase tracking-wider text-[#FF5E00] px-3.5 py-1.5 rounded-full bg-[#FFF4EE] border border-[#FF5E00]/20 inline-block">
                Transparência Total
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1A1A1A]">
                8 & 9. Regras de Link, Cupom e Faixas de Comissão
              </h2>
              <p className="text-base sm:text-lg text-[#555555]">
                Entenda exatamente como suas comissões são calculadas, sem pegadinhas nem letras miúdas.
              </p>
            </div>

            {/* Comparativo Link vs Cupom */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-7 space-y-3 shadow-xs">
                <div className="flex items-center gap-2 text-lg sm:text-xl font-bold text-[#1A1A1A]">
                  <span>🔗</span> Link de Afiliado (?ref=CÓDIGO)
                </div>
                <ul className="text-sm sm:text-base text-[#555555] space-y-2 list-disc pl-5 leading-relaxed">
                  <li>Rastreia e vincula a nova loja ao seu perfil de parceiro.</li>
                  <li>O cliente paga o valor normal do plano (ex: R$ 89,00).</li>
                  <li>Gera sua comissão cheia sobre o valor pago.</li>
                </ul>
              </div>

              <div className="rounded-3xl border border-[#FF5E00]/30 bg-[#FFF4EE]/40 p-6 sm:p-7 space-y-3 shadow-xs">
                <div className="flex items-center gap-2 text-lg sm:text-xl font-bold text-[#FF5E00]">
                  <span>🎟️</span> Cupom de Afiliado (10% OFF)
                </div>
                <ul className="text-sm sm:text-base text-[#444444] space-y-2 list-disc pl-5 leading-relaxed">
                  <li>Vincula a nova loja e concede 10% de desconto na 1ª mensalidade para o cliente.</li>
                  <li><strong>Sua comissão continua sendo calculada sobre o valor cheio original</strong> (sem cortes para você).</li>
                  <li>Se o cliente usar Link + Cupom juntos, há <strong>uma única atribuição e comissão única</strong>.</li>
                </ul>
              </div>
            </div>

            {/* Tabela de Faixas Progressivas */}
            <div className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-8 space-y-6 shadow-xs">
              <h3 className="font-bold text-xl sm:text-2xl text-[#1A1A1A] flex items-center gap-2.5">
                <TrendingUp className="h-6 w-6 text-[#FF5E00]" />
                Tabela de Faixas Progressivas de Comissão
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 text-center">
                <div className="rounded-2xl border border-gray-200 p-5 space-y-1.5 bg-[#FAFAFA]">
                  <span className="text-xs font-bold uppercase text-[#777777]">Nível 1</span>
                  <div className="text-3xl font-bold text-[#1A1A1A]">20%</div>
                  <p className="text-xs sm:text-sm font-semibold text-[#555555]">1 a 4 clientes ativos</p>
                </div>

                <div className="rounded-2xl border border-gray-200 p-5 space-y-1.5 bg-[#FAFAFA]">
                  <span className="text-xs font-bold uppercase text-indigo-700">Nível 2</span>
                  <div className="text-3xl font-bold text-indigo-600">22,5%</div>
                  <p className="text-xs sm:text-sm font-semibold text-[#555555]">5 a 14 clientes ativos</p>
                </div>

                <div className="rounded-2xl border border-gray-200 p-5 space-y-1.5 bg-[#FAFAFA]">
                  <span className="text-xs font-bold uppercase text-blue-700">Nível 3</span>
                  <div className="text-3xl font-bold text-blue-600">25%</div>
                  <p className="text-xs sm:text-sm font-semibold text-[#555555]">15 a 29 clientes ativos</p>
                </div>

                <div className="rounded-2xl border border-gray-200 p-5 space-y-1.5 bg-[#FAFAFA]">
                  <span className="text-xs font-bold uppercase text-amber-800">Nível 4</span>
                  <div className="text-3xl font-bold text-amber-600">27,5%</div>
                  <p className="text-xs sm:text-sm font-semibold text-[#555555]">30 a 49 clientes ativos</p>
                </div>

                <div className="rounded-2xl border-2 border-[#FF5E00] bg-[#FFF4EE] p-5 space-y-1.5 col-span-2 sm:col-span-1 shadow-sm">
                  <span className="text-xs font-bold uppercase text-[#FF5E00]">Nível VIP</span>
                  <div className="text-3xl font-bold text-[#FF5E00]">30%</div>
                  <p className="text-xs sm:text-sm font-bold text-[#1A1A1A]">50+ clientes ativos</p>
                </div>
              </div>

              <div className="text-sm sm:text-base text-[#555555] space-y-2 pt-4 border-t border-gray-100 leading-relaxed">
                <p>• <strong>Duração:</strong> Até 12 meses consecutivos de comissão recorrente por cliente ativo.</p>
                <p>• <strong>Repasses:</strong> Realizados diretamente para sua chave PIX cadastrada, sem valor mínimo de saque.</p>
                <p>• <strong>Cancelamentos / Estornos:</strong> Suspendem novas comissões e revertem pagamentos estornados.</p>
                <p>• <strong>Porcentagem:</strong> Determinada na data em que o pagamento do cliente é gerado (sem recálculo retroativo).</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── 10. FAQ Completo do Afiliado com Busca (ESCURO ⚫) ── */}
        <section id="faq" className="w-full bg-[#0F1016] text-white py-14 sm:py-20 border-b border-zinc-800 scroll-mt-28 sm:scroll-mt-32">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-8">
            <div className="text-center space-y-3 max-w-3xl mx-auto">
              <span className="text-sm font-semibold uppercase tracking-wider text-[#FF5E00] px-3.5 py-1.5 rounded-full bg-[#FF5E00]/10 border border-[#FF5E00]/30 inline-block">
                Dúvidas Frequentes
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
                10. Perguntas Frequentes do Afiliado
              </h2>
              <p className="text-base sm:text-lg text-zinc-300">
                Respostas claras e diretas para todas as principais dúvidas sobre o programa.
              </p>
            </div>

            {/* Campo de Busca no FAQ */}
            <div className="relative max-w-lg mx-auto">
              <Search className="h-5 w-5 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
              <Input
                placeholder="Buscar dúvida (ex: comissão, cupom, cancelamento)..."
                value={faqSearch}
                onChange={(e) => setFaqSearch(e.target.value)}
                className="pl-12 h-12 text-sm sm:text-base bg-[#181926] border-zinc-700 text-white placeholder:text-zinc-500 rounded-2xl shadow-lg focus-visible:ring-[#FF5E00]"
              />
            </div>

            {/* Accordion */}
            <div className="rounded-3xl border border-white/10 bg-[#181926] p-6 sm:p-8 shadow-lg">
              {filteredFaq.length === 0 ? (
                <p className="text-base text-zinc-400 text-center py-8">
                  Nenhuma pergunta encontrada para "{faqSearch}".
                </p>
              ) : (
                <Accordion type="single" collapsible className="w-full divide-y divide-zinc-800">
                  {filteredFaq.map((item, idx) => (
                    <AccordionItem key={idx} value={`item-${idx}`} className="border-b-0 py-2">
                      <AccordionTrigger className="text-left font-bold text-base sm:text-lg text-white hover:no-underline hover:text-[#FF5E00] py-4">
                        {item.q}
                      </AccordionTrigger>
                      <AccordionContent className="text-sm sm:text-base text-zinc-300 leading-relaxed pt-1 pb-4">
                        {item.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer (ESCURO ⚫) ── */}
      <footer className="border-t border-zinc-800 bg-[#090A0E] py-8 text-sm text-zinc-400 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <img src="/scalius-logo.png" alt="Scalius" className="h-6 object-contain" />
            <span>© {new Date().getFullYear()} Scalius. Central de Apoio ao Parceiro.</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/affiliates" className="hover:text-[#FF5E00] transition-colors font-semibold text-zinc-300">Meu Painel</Link>
            <Link to="/programa-afiliados" className="hover:text-[#FF5E00] transition-colors text-zinc-300">Regras Públicas</Link>
            <Link to="/politica-de-privacidade" className="hover:text-[#FF5E00] transition-colors text-zinc-300">Privacidade</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

# Scalius

Sistema SaaS multi-tenant para pedidos online de lojas locais (floriculturas, artesanato, confeitarias, etc).

## 📋 Sobre o Projeto

Scalius permite que pequenas lojas criem sua própria loja online para receber pedidos via WhatsApp, com gestão completa de produtos, categorias, regiões de entrega e pedidos.

### Funcionalidades Principais

**Para o Cliente (Loja Pública):**
- Catálogo de produtos com busca e filtros
- Produtos em destaque
- Carrinho de compras
- Checkout com cálculo de frete por região
- Pagamento via Pix (manual ou automático)
- Notificação automática via WhatsApp

**Para o Dono da Loja (Admin):**
- Gestão de produtos e categorias
- Controle de estoque
- Gestão de regiões de entrega
- Painel de pedidos com status
- Dashboard com métricas
- Configurações da loja (cores, logo, informações)

## 🛠️ Stack Tecnológica

### Frontend
- **React** 18 com TypeScript
- **Vite** como build tool
- **TanStack Query** para gerenciamento de estado server
- **React Router** v6 para roteamento
- **Tailwind CSS** para estilização
- **shadcn/ui** para componentes
- **Lucide React** para ícones
- **Sonner** para notificações toast

### Backend
- **Supabase** (PostgreSQL + Auth + Storage)
- **Row Level Security (RLS)** para segurança multi-tenant
- **PostgreSQL Functions** para lógica de negócio
- **Supabase Realtime** (futuro: notificações em tempo real)

### Ferramentas de Desenvolvimento
- **Antigravity** (Google) como IDE
- **GitHub** para versionamento
- **ESLint** para linting
- **TypeScript** para type safety

## 📁 Estrutura do Projeto
src/
├── components/
│   ├── admin/          # Componentes do painel admin
│   ├── auth/           # Componentes de autenticação
│   ├── layouts/        # Layouts (Admin, Public, SuperAdmin)
│   ├── store/          # Componentes da loja pública
│   └── ui/             # Componentes shadcn/ui
├── contexts/
│   ├── AuthContext.tsx      # Autenticação e memberships
│   ├── TenantContext.tsx    # Contexto da loja atual
│   └── CartContext.tsx      # Carrinho de compras
├── hooks/              # Custom hooks
├── integrations/
│   └── supabase/       # Cliente e tipos do Supabase
├── lib/
│   ├── mockData.ts     # Dados mock (sendo migrados)
│   └── utils.ts        # Funções utilitárias
├── pages/
│   ├── admin/          # Páginas do painel admin
│   ├── public/         # Páginas da loja pública
│   └── super-admin/    # Páginas do super admin
├── types/
│   └── database.ts     # Tipos do banco de dados
└── App.tsx             # Componente raiz com rotas

## 🗄️ Estrutura do Banco de Dados

### Tabelas Principais

**stores**
- Informações básicas da loja (nome, slug, status)

**store_settings**
- Configurações da loja (cores, logo, whatsapp, endereço)
- Chave Pix e preferências de pagamento

**profiles**
- Perfil do usuário logado

**store_members**
- Vínculo usuário ↔ loja (role: owner/admin/staff)

**categories**
- Categorias de produtos (por loja)

**products**
- Produtos do catálogo
- Campos: nome, descrição, preço, imagem, estoque, destaque

**shipping_regions**
- Regiões de entrega com taxa de frete

**orders**
- Pedidos dos clientes
- Status: pending → preparing → out_for_delivery → delivered
- Payment status: unpaid/paid/pending

**order_items**
- Itens do pedido (product_name e preços denormalizados)

### Funções PostgreSQL

**create_public_order**
- Cria pedido via RPC
- Recalcula preços no servidor (segurança)
- Gera order_number único por loja

**is_store_member**
- Verifica se usuário é membro da loja
- Usado nas políticas RLS

## 🚀 Setup Local

### Pré-requisitos
- Node.js 18+ 
- npm ou yarn
- Conta no Supabase

### Instalação

1. **Clone o repositório:**
```bash
git clone https://github.com/NightCombed/scalius-vitrine.git
cd scalius-vitrine
```

2. **Instale as dependências:**
```bash
npm install
```

3. **Configure as variáveis de ambiente:**

Crie um arquivo `.env` na raiz:
```env
VITE_SUPABASE_URL=https://jrmixsvdnejzfxvybmng.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anon_aqui
```

4. **Execute o projeto:**
```bash
npm run dev
```

Acesse: http://localhost:5173

## 🔐 Autenticação e Acesso

### Super Admin
- Acesso total ao sistema
- Gerencia todas as lojas

### Dono da Loja
- Acesso ao painel admin da própria loja
- Gerencia produtos, pedidos, configurações

### Cliente (Público)
- Acessa a loja pública via `/loja/:slug`
- Não precisa autenticação para fazer pedidos

## 🌐 Rotas Principais

### Públicas
- `/` - Landing page
- `/loja/:slug` - Home da loja
- `/loja/:slug/produto/:id` - Detalhes do produto
- `/loja/:slug/carrinho` - Carrinho
- `/loja/:slug/checkout` - Checkout
- `/loja/:slug/pedido/:id` - Confirmação

### Admin (autenticado)
- `/admin` - Dashboard
- `/admin/produtos` - Gestão de produtos
- `/admin/categorias` - Gestão de categorias
- `/admin/pedidos` - Lista de pedidos
- `/admin/pedidos/:id` - Detalhes do pedido
- `/admin/entregas` - Regiões de entrega
- `/admin/configuracoes` - Configurações da loja

### Super Admin
- `/super-admin` - Dashboard do sistema

## 📊 Status do Desenvolvimento

### ✅ Concluído (Fases 1-3)

**Fase 1: Autenticação e Base**
- [x] Sistema de autenticação
- [x] Multi-tenant com RLS
- [x] Contexto de loja (TenantContext)
- [x] Memberships (store_members)

**Fase 2: Catálogo**
- [x] CRUD de produtos e categorias
- [x] Sistema de destaques
- [x] Home única (hero + destaques + catálogo)
- [x] Filtros e busca
- [x] Página de detalhes

**Fase 3: Pedidos**
- [x] Checkout com regiões de entrega
- [x] Criação de pedidos via RPC
- [x] Painel de pedidos no admin
- [x] Fluxo de status flexível
- [x] Dashboard com métricas

### 🔄 Em Andamento (Fase 4)

**Pagamentos via Pix**
- [ ] Pix Manual (chave cadastrada)
- [ ] Confirmação manual/comprovante
- [ ] WhatsApp automático
- [ ] Mercado Pago (futuro)

### 📝 Roadmap Futuro

**Essenciais:**
- [ ] Upload de imagens de produtos
- [ ] Notificações para loja (novo pedido)
- [ ] Responsividade mobile do admin
- [ ] Landing page do Scalius

**Melhorias:**
- [ ] Campos customizados em produtos
- [ ] Relatórios de vendas
- [ ] Histórico de pedidos
- [ ] Sistema de cupons/descontos
- [ ] Multi-domínio (subdomínios por loja)

## 🧪 Scripts Disponíveis

```bash
npm run dev          # Desenvolvimento local
npm run build        # Build para produção
npm run preview      # Preview do build
npm run lint         # Verificar erros de lint
```

## 🤝 Contribuindo

Este é um projeto em desenvolvimento ativo. Contribuições são bem-vindas!

## 📄 Licença

Proprietary - Todos os direitos reservados

## 👤 Autor

**Scalius**
- GitHub: [@NightCombed](https://github.com/NightCombed)

## 🔗 Links

- [Repositório](https://github.com/NightCombed/scalius-vitrine)
- [Supabase Dashboard](https://supabase.com/dashboard/project/jrmixsvdnejzfxvybmng)
- [Documentação Supabase](https://supabase.com/docs)
- [Documentação React](https://react.dev)
- [Documentação Tailwind](https://tailwindcss.com)

---

**Versão:** 0.4.0 (MVP em desenvolvimento)  
**Última atualização:** Abril 2026
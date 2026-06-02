import { useEffect, type ReactNode } from "react";
import { Link } from "react-router-dom";

const updatedAt = "01 de junho de 2026";

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="space-y-3">
    <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
    <div className="space-y-3 leading-7 text-muted-foreground">{children}</div>
  </section>
);

const PrivacyPolicy = () => {
  useEffect(() => {
    document.title = "Política de Privacidade | Scalius";

    let meta = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "robots";
      document.head.appendChild(meta);
    }
    meta.content = "noindex, nofollow, noarchive";
  }, []);

  return (
    <main className="min-h-screen bg-gradient-soft">
      <div className="container max-w-4xl py-12 md:py-16">
        <Link to="/" className="mb-8 inline-flex text-sm font-medium text-primary hover:underline">
          Voltar para o Scalius
        </Link>

        <article className="rounded-lg border border-border/70 bg-background p-6 shadow-soft md:p-10">
          <header className="mb-10 space-y-3">
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">Scalius</p>
            <h1 className="text-4xl font-semibold text-foreground md:text-5xl">
              Política de Privacidade
            </h1>
            <p className="text-muted-foreground">Última atualização: {updatedAt}</p>
          </header>

          <div className="space-y-10">
            <Section title="1. Sobre esta política">
              <p>
                Esta Política de Privacidade explica como o Scalius trata dados pessoais ao
                disponibilizar sua plataforma de vitrines digitais, painel administrativo,
                checkout, notificações, área do cliente e demais recursos relacionados.
              </p>
              <p>
                O tratamento de dados segue a Lei Geral de Proteção de Dados Pessoais, Lei no
                13.709/2018 ("LGPD"), e busca oferecer informações claras sobre finalidades,
                compartilhamentos, direitos dos titulares e canais de contato.
              </p>
            </Section>

            <Section title="2. Quem trata seus dados">
              <p>
                Para dados de cadastro, contratação, suporte, acesso ao painel e comunicações
                institucionais, o Scalius atua como controlador.
              </p>
              <p>
                Para dados de clientes finais inseridos nas lojas criadas por comerciantes na
                plataforma, a loja vendedora normalmente atua como controladora da venda, e o
                Scalius atua como operador ou provedor de tecnologia, conforme as instruções
                da loja e os recursos contratados.
              </p>
              <p>
                Identificação do controlador: o Scalius, operado por Luiz Reinaldo Lima,
                CPF 805.593.363-49, telefone +55 63 98414-2775 e e-mail
                suporte@scalius.com.br.
                Contato para privacidade e encarregado de dados:
                <a href="mailto:suporte@scalius.com.br" className="font-medium text-primary hover:underline">
                  {" "}suporte@scalius.com.br
                </a>
                .
              </p>
            </Section>

            <Section title="3. Dados que podemos coletar">
              <ul className="list-disc space-y-2 pl-6">
                <li>Dados de conta: nome, e-mail, senha protegida, telefone e perfil de acesso.</li>
                <li>Dados da loja: nome comercial, slug, identidade visual, endereço, contatos, preferências e configurações.</li>
                <li>Dados de pedido: itens comprados, valores, status, forma de entrega, observações e histórico de atualizações.</li>
                <li>Dados do cliente final: nome, e-mail, telefone, CPF ou CNPJ quando necessário, endereço de entrega e dados de acompanhamento.</li>
                <li>Dados técnicos: endereço IP, data e hora de acesso, navegador, dispositivo, registros de segurança e cookies essenciais.</li>
                <li>Dados de atendimento: mensagens enviadas ao suporte, solicitações, anexos e registros de comunicação.</li>
              </ul>
            </Section>

            <Section title="4. Finalidades e bases legais">
              <ul className="list-disc space-y-2 pl-6">
                <li>Executar contratos e entregar os recursos da plataforma, incluindo loja, painel, checkout, carrinho e área do cliente.</li>
                <li>Processar pedidos, pagamentos, fretes, notificações e atualizações de status solicitadas pela loja.</li>
                <li>Cumprir obrigações legais e regulatórias, inclusive registros fiscais, antifraude e segurança.</li>
                <li>Enviar e-mails transacionais, como confirmação de pedido, pagamento, rastreio, entrega, cancelamento, avisos de conta e suporte.</li>
                <li>Enviar comunicações comerciais do Scalius quando houver base legal aplicável, respeitando descadastro e oposição.</li>
                <li>Melhorar a plataforma, prevenir abuso, diagnosticar falhas, medir desempenho e proteger usuários, lojas e clientes.</li>
              </ul>
              <p>
                As bases legais podem incluir execução de contrato, cumprimento de obrigação
                legal, exercício regular de direitos, proteção do crédito, prevenção a fraude,
                legítimo interesse e consentimento, conforme o contexto.
              </p>
            </Section>

            <Section title="5. E-mails e comunicações">
              <p>
                O Scalius pode enviar e-mails transacionais em nome próprio ou em nome das lojas
                que usam a plataforma. Esses e-mails existem para operar o serviço, confirmar
                eventos importantes e manter clientes informados sobre pedidos, pagamentos,
                entregas, acesso a conta e segurança.
              </p>
              <p>
                Comunicações promocionais teráo mecanismo de descadastro quando aplicável. Para
                relatar abuso, recebimento indevido ou problemas com mensagens enviadas pela
                plataforma, entre em contato por
                <a href="mailto:suporte@scalius.com.br" className="font-medium text-primary hover:underline">
                  {" "}suporte@scalius.com.br
                </a>
                .
              </p>
            </Section>

            <Section title="6. Compartilhamento de dados">
              <p>
                Podemos compartilhar dados pessoais apenas quando necessário para operar a
                plataforma, cumprir obrigações legais, proteger direitos ou viabilizar recursos
                contratados. Isso pode envolver provedores de hospedagem, banco de dados,
                autenticação, envio de e-mails, pagamento, frete, atendimento, análise técnica,
                segurança e autoridades competentes.
              </p>
              <p>
                Exemplos de integrações usadas ou que podem ser usadas pela plataforma incluem
                provedores como AWS/Amazon SES, Supabase, Mercado Pago e Melhor Envio, de acordo
                com os recursos ativados pela loja.
              </p>
            </Section>

            <Section title="7. Transferência internacional">
              <p>
                Alguns fornecedores de tecnologia podem armazenar ou processar dados fora do
                Brasil. Quando isso ocorrer, o Scalius adotará medidas compativeis com a LGPD,
                contratos adequados e controles de segurança proporcionais ao tratamento realizado.
              </p>
            </Section>

            <Section title="8. Retenção e eliminação">
              <p>
                Os dados são mantidos pelo tempo necessário para cumprir as finalidades informadas,
                obrigações legais, prazos contratuais, auditoria, segurança, prevenção a fraude e
                exercício regular de direitos. Quando não forem mais necessários, poderáo ser
                eliminados, anonimizados ou bloqueados, conforme aplicável.
              </p>
            </Section>

            <Section title="9. Direitos dos titulares">
              <p>
                Nos termos da LGPD, titulares podem solicitar confirmação de tratamento, acesso,
                correção, anonimização, bloqueio, eliminação, portabilidade, informações sobre
                compartilhamento, revisão de decisões automatizadas, revogação de consentimento e
                oposição a tratamentos irregulares.
              </p>
              <p>
                Para exercer direitos, envie uma solicitação para
                <a href="mailto:suporte@scalius.com.br" className="font-medium text-primary hover:underline">
                  {" "}suporte@scalius.com.br
                </a>
                . Poderemos solicitar informações adicionais para confirmar a identidade do titular
                e proteger a conta.
              </p>
            </Section>

            <Section title="10. Segurança">
              <p>
                O Scalius adota medidas técnicas e organizacionais para proteger dados pessoais
                contra acesso não autorizado, perda, uso indevido, alterácao e divulgação indevida.
                Nenhuma plataforma e imune a todos os riscos, mas trabalhamos para reduzir riscos
                de forma contínua.
              </p>
            </Section>

            <Section title="11. Alterações nesta política">
              <p>
                Esta Política pode ser atualizada para refletir mudanças legais, técnicas ou
                operacionais. A versão vigente será publicada nesta página com a data de
                atualização.
              </p>
            </Section>
          </div>
        </article>
      </div>
    </main>
  );
};

export default PrivacyPolicy;

import { useEffect, type ReactNode } from "react";
import { Link } from "react-router-dom";

const updatedAt = "01 de junho de 2026";

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="space-y-3">
    <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
    <div className="space-y-3 leading-7 text-muted-foreground">{children}</div>
  </section>
);

const TermsOfService = () => {
  useEffect(() => {
    document.title = "Termos de Serviço | Scalius";

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
            <h1 className="text-4xl font-semibold text-foreground md:text-5xl">Termos de Serviço</h1>
            <p className="text-muted-foreground">Última atualização: {updatedAt}</p>
          </header>

          <div className="space-y-10">
            <Section title="1. Aceitação dos termos">
              <p>
                Estes Termos de Serviço regulam o acesso e uso da plataforma Scalius,
                incluindo vitrine digital, painel administrativo, checkout, carrinho,
                notificações, área do cliente, integrações e demais recursos disponibilizados.
              </p>
              <p>
                Ao criar conta, contratar plano, administrar uma loja, realizar um pedido em
                uma loja criada na plataforma ou acessar os serviços, você declara que leu e
                aceita estes Termos e a Política de Privacidade.
              </p>
            </Section>

            <Section title="2. Identificação e contato">
              <p>
                Prestadora da plataforma: o Scalius, operado por Luiz Reinaldo Lima, CPF
                805.593.363-49, telefone +55 63 98414-2775 e e-mail suporte@scalius.com.br.
                Contato para suporte, privacidade e comunicações:
                <a href="mailto:suporte@scalius.com.br" className="font-medium text-primary hover:underline">
                  {" "}suporte@scalius.com.br
                </a>
                .
              </p>
            </Section>

            <Section title="3. Natureza da plataforma">
              <p>
                O Scalius fornece tecnologia para que comerciantes criem e administrem suas
                vitrines digitais. Salvo indicação expressa em contrário, o Scalius não é a
                vendedora dos produtos anunciados nas lojas, não define preços, estoque, prazos,
                condições comerciais ou políticas de troca das lojas.
              </p>
              <p>
                Cada loja e responsável por seus produtos, ofertas, descrições, atendimento,
                cumprimento de pedidos, emissão de documentos fiscais quando aplicável,
                garantias, entregas, cancelamentos e relação com seus consumidores.
              </p>
            </Section>

            <Section title="4. Conta e responsabilidades do usuário">
              <ul className="list-disc space-y-2 pl-6">
                <li>Fornecer informações verdadeiras, atualizadas e completas.</li>
                <li>Manter a confidencialidade de login, senha e acessos administrativos.</li>
                <li>Usar a plataforma de forma lícita e compatível com estes Termos.</li>
                <li>Obter autorizações e consentimentos necessários para tratar dados de clientes, quando aplicável.</li>
                <li>Responder por conteúdos, imagens, marcas, produtos, textos e configurações publicados na loja.</li>
              </ul>
            </Section>

            <Section title="5. Pagamentos, planos e cancelamento">
              <p>
                Planos, valores, recursos e limites podem variar conforme a oferta vigente ou
                contrato aplicável. O Scalius pode alterar planos e recursos mediante comunicação
                adequada, preservados direitos já adquiridos quando exigido por lei.
              </p>
              <p>
                O cancelamento de assinatura pode limitar ou encerrar o acesso a recursos pagos.
                Valores de gateways de pagamento, frete, intermediadores e outros serviços de
                terceiros podem ser cobrados separadamente pelos respectivos provedores.
              </p>
            </Section>

            <Section title="6. Pedidos, pagamentos e entregas">
              <p>
                As lojas podem usar integrações de pagamento e frete, como Mercado Pago e Melhor
                Envio, conforme disponibilidade. Esses serviços são prestados por terceiros e
                também podem estar sujeitos aos termos, taxas, regras antifraude e políticas
                desses provedores.
              </p>
              <p>
                O Scalius pode auxiliar no registro técnico de pedidos, status, comprovantes,
                etiquetas, rastreios e notificações, mas a execução comercial da venda permanece
                sob responsabilidade da loja vendedora.
              </p>
            </Section>

            <Section title="7. E-mails e notificações">
              <p>
                A plataforma pode enviar e-mails transacionais relacionados a conta, segurança,
                pedidos, pagamentos, frete, rastreio, entrega, cancelamento, suporte e operação
                da loja. Esses e-mails são parte do funcionamento do serviço.
              </p>
              <p>
                É proibido usar o Scalius para spam, listas compradas, mensagens enganosas,
                phishing, conteúdo ilícito, assédio, fraude ou qualquer prática que prejudique
                destinatários, provedores de e-mail ou a reputação de envio da plataforma.
                Comunicações promocionais devem respeitar a legislação aplicável e oferecer
                descadastro quando necessário.
              </p>
            </Section>

            <Section title="8. Uso proibido">
              <ul className="list-disc space-y-2 pl-6">
                <li>Vender produtos ou serviços ilegais, fraudulentos ou que violem direitos de terceiros.</li>
                <li>Publicar conteúdo discriminatório, enganoso, ofensivo, abusivo ou que incentive atos ilícitos.</li>
                <li>Tentar acessar sistemas, contas, dados ou áreas sem autorização.</li>
                <li>Interferir na segurança, disponibilidade, integridade ou desempenho da plataforma.</li>
                <li>Usar automações abusivas, engenharia reversa ou coleta massiva não autorizada.</li>
              </ul>
              <p>
                O Scalius pode suspender, limitar ou encerrar contas em caso de violação destes
                Termos, risco operacional, suspeita de fraude, ordem legal ou uso prejudicial da
                plataforma.
              </p>
            </Section>

            <Section title="9. Proteção de dados e LGPD">
              <p>
                O tratamento de dados pessoais pelo Scalius é descrito na
                <Link to="/politica-de-privacidade" className="font-medium text-primary hover:underline">
                  {" "}Política de Privacidade
                </Link>
                . Lojas que usam a plataforma devem tratar dados de seus clientes em conformidade
                com a LGPD e demais normas aplicáveis, incluindo informacao adequada aos titulares,
                bases legais, segurança e atendimento de direitos.
              </p>
            </Section>

            <Section title="10. Propriedade intelectual">
              <p>
                A marca Scalius, software, interface, códigos, textos institucionais, elementos
                visuais e tecnologias da plataforma são protegidos por direitos de propriedade
                intelectual. O uso da plataforma não transfere propriedade sobre esses ativos.
              </p>
              <p>
                O usuário declara possuir direitos ou autorizações sobre conteúdos, imagens,
                marcas e materiais que publicar em sua loja.
              </p>
            </Section>

            <Section title="11. Disponibilidade e suporte">
              <p>
                O Scalius trabalha para manter a plataforma disponível, segura e funcional. Podem
                ocorrer interrupções por manutenção, atualizações, falhas técnicas,
                indisponibilidade de terceiros, eventos de força maior ou motivos fora do controle
                razoável do Scalius.
              </p>
            </Section>

            <Section title="12. Limitação de responsabilidade">
              <p>
                Na máxima extensão permitida por lei, o Scalius não responde por perdas indiretas,
                lucros cessantes, danos decorrentes de conteúdos publicados por lojas, relações
                comerciais entre loja e consumidor, indisponibilidade de terceiros, uso indevido de
                credenciais ou descumprimento destes Termos pelo usuário.
              </p>
            </Section>

            <Section title="13. Alterações dos termos">
              <p>
                Estes Termos podem ser atualizados para refletir mudanças legais, operacionais,
                comerciais ou técnicas. A versão vigente será publicada nesta página com a data de
                atualização.
              </p>
            </Section>

            <Section title="14. Lei aplicável">
              <p>
                Estes Termos são regidos pelas leis da República Federativa do Brasil. Eventuais
                conflitos seráo resolvidos conforme a legislação aplicável e o foro competente
                definido em contrato ou pela lei.
              </p>
            </Section>
          </div>
        </article>
      </div>
    </main>
  );
};

export default TermsOfService;

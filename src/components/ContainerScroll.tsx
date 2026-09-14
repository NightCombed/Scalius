import React, { useRef, useState, useEffect } from "react";
import { useScroll, useTransform, motion } from "framer-motion";

interface ContainerScrollProps {
  titleComponent: React.ReactNode;
}

export const ContainerScroll: React.FC<ContainerScrollProps> = ({ titleComponent }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // offset: começa a contar quando o topo do container chega ao centro da tela
  //         termina quando o fundo do container sai pelo topo da tela
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 0.85", "end 0.1"]
  });

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  // Rotação 3D: inclina ao entrar, endireita enquanto centra
  const rotateX = useTransform(scrollYProgress, [0.0, 0.35], [18, 0], { clamp: true });

  // Escala geral da composição
  const scale = useTransform(
    scrollYProgress,
    [0.0, 0.35],
    isMobile ? [0.95, 1.02] : [1.05, 1],
    { clamp: true }
  );

  // Sobe levemente ao entrar
  const translateY = useTransform(scrollYProgress, [0.0, 0.35], [60, 0], { clamp: true });

  // Imagem nos celulares: rola sincronizada a partir do topo (0%)
  const imageY = useTransform(
    scrollYProgress,
    [0.30, 0.46, 0.64, 0.82],
    ["0%", "-8%", "-20%", "-32%"],
    { clamp: true }
  );

  // Deslocamento vertical sticky do bloco
  const phoneY = useTransform(
    scrollYProgress,
    [0.0, 0.25, 0.82, 1.0],
    [0, 0, isMobile ? 220 : 410, isMobile ? 220 : 410],
    { clamp: true }
  );

  return (
    <div
      ref={containerRef}
      className="relative pt-2 pb-[260px] md:pt-24 md:pb-[440px] px-2 md:px-4 overflow-visible"
      style={{ perspective: "1200px" }}
    >
      {/* Background Grid com degradê suave */}
      <div 
        className="absolute inset-0 pointer-events-none -z-10"
        style={{
          backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 0, 0, 0.08) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          backgroundPosition: "center center",
          WebkitMaskImage: "linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)",
          maskImage: "linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)",
        }}
      />
      
      {/* Cabeçalho da seção */}
      <motion.div
        style={{ translateY }}
        className="max-w-4xl mx-auto mb-8 md:mb-14 px-4"
      >
        <div style={{ textAlign: 'center', width: '100%' }}>
          {titleComponent}
        </div>
      </motion.div>

      {/* Composição de 3 celulares (Centro + 2 Cópias rebaixadas e menores nas laterais) */}
      <motion.div
        style={{
          rotateX,
          scale,
          y: phoneY,
        }}
        className="relative w-full max-w-5xl mx-auto flex items-center justify-center min-h-[440px] sm:min-h-[520px] md:min-h-[640px]"
      >
        {/* CELULAR ESQUERDO (Cópia menor, posicionada mais para baixo e levemente inclinada) */}
        <div 
          className="absolute right-[50%] mr-[40px] sm:mr-[65px] md:mr-[105px] top-[25px] sm:top-[38px] md:top-[55px] z-10 
                     w-[160px] sm:w-[195px] md:w-[255px] h-[320px] sm:h-[390px] md:h-[510px] 
                     border-[5px] sm:border-[7px] md:border-[9px] border-[#1e2022] bg-[#1e2022] 
                     rounded-[30px] sm:rounded-[36px] md:rounded-[44px] overflow-hidden 
                     ring-2 sm:ring-4 ring-[#2d3135] ring-opacity-50
                     shadow-xl shadow-black/20 -rotate-3 transition-transform duration-300 hover:rotate-0"
        >
          {/* Dynamic Island */}
          <div className="absolute top-1.5 sm:top-2 left-1/2 -translate-x-1/2 w-[45px] sm:w-[55px] md:w-[75px] h-[12px] sm:h-[16px] md:h-[22px] bg-black rounded-full z-30 flex items-center justify-end px-1.5 sm:px-2">
            <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-[#111] border border-[#222]"></div>
          </div>
          {/* Speaker */}
          <div className="absolute top-0.5 sm:top-1 left-1/2 -translate-x-1/2 w-[22px] sm:w-[30px] md:w-[36px] h-[2px] bg-[#333] rounded-full z-30"></div>

          {/* Tela */}
          <div className="h-full w-full overflow-hidden rounded-[24px] sm:rounded-[28px] md:rounded-[34px] bg-white relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/15 pointer-events-none z-20 rounded-[24px] sm:rounded-[28px] md:rounded-[34px]" />
            <div className="w-full h-full overflow-hidden bg-[#fafafa]">
              <motion.img
                src="/store_print_1.png"
                alt="Vitrine no Celular - Vista Catalogo"
                style={{ y: imageY }}
                className="w-full h-auto block select-none pointer-events-none"
              />
            </div>
          </div>
        </div>

        {/* CELULAR PRINCIPAL (Centro - Destaque em tamanho maior) */}
        <div 
          style={{
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.3), 0 0 45px rgba(255,94,0,0.12)",
          }}
          className="relative z-20 
                     w-[205px] sm:w-[250px] md:w-[325px] h-[410px] sm:h-[500px] md:h-[640px] 
                     border-[7px] sm:border-[8px] md:border-[10px] border-[#1e2022] bg-[#1e2022] 
                     rounded-[36px] sm:rounded-[42px] md:rounded-[48px] overflow-hidden 
                     ring-4 ring-[#2d3135] ring-opacity-60"
        >
          {/* Dynamic Island */}
          <div className="absolute top-2 sm:top-2.5 md:top-3 left-1/2 -translate-x-1/2 w-[60px] sm:w-[68px] md:w-[90px] h-[16px] sm:h-[18px] md:h-[25px] bg-black rounded-full z-30 flex items-center justify-end px-2 sm:px-2.5">
            <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-[#111] border border-[#222]"></div>
          </div>
          {/* Speaker */}
          <div className="absolute top-1 md:top-1.5 left-1/2 -translate-x-1/2 w-[28px] sm:w-[32px] md:w-[40px] h-[2px] md:h-[3px] bg-[#333] rounded-full z-30"></div>

          {/* Tela */}
          <div className="h-full w-full overflow-hidden rounded-[28px] sm:rounded-[32px] md:rounded-[38px] bg-white relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/15 pointer-events-none z-20 rounded-[28px] sm:rounded-[32px] md:rounded-[38px]" />
            <div className="w-full h-full overflow-hidden bg-[#fafafa]">
              <motion.img
                src="/store_print_2.png"
                alt="Vitrine Principal no Celular"
                style={{ y: imageY }}
                className="w-full h-auto block select-none pointer-events-none"
              />
            </div>
          </div>
        </div>

        {/* CELULAR DIREITO (Cópia menor, posicionada mais para baixo e levemente inclinada) */}
        <div 
          className="absolute left-[50%] ml-[40px] sm:ml-[65px] md:ml-[105px] top-[25px] sm:top-[38px] md:top-[55px] z-10 
                     w-[160px] sm:w-[195px] md:w-[255px] h-[320px] sm:h-[390px] md:h-[510px] 
                     border-[5px] sm:border-[7px] md:border-[9px] border-[#1e2022] bg-[#1e2022] 
                     rounded-[30px] sm:rounded-[36px] md:rounded-[44px] overflow-hidden 
                     ring-2 sm:ring-4 ring-[#2d3135] ring-opacity-50
                     shadow-xl shadow-black/20 rotate-3 transition-transform duration-300 hover:rotate-0"
        >
          {/* Dynamic Island */}
          <div className="absolute top-1.5 sm:top-2 left-1/2 -translate-x-1/2 w-[45px] sm:w-[55px] md:w-[75px] h-[12px] sm:h-[16px] md:h-[22px] bg-black rounded-full z-30 flex items-center justify-end px-1.5 sm:px-2">
            <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-[#111] border border-[#222]"></div>
          </div>
          {/* Speaker */}
          <div className="absolute top-0.5 sm:top-1 left-1/2 -translate-x-1/2 w-[22px] sm:w-[30px] md:w-[36px] h-[2px] bg-[#333] rounded-full z-30"></div>

          {/* Tela */}
          <div className="h-full w-full overflow-hidden rounded-[24px] sm:rounded-[28px] md:rounded-[34px] bg-white relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/15 pointer-events-none z-20 rounded-[24px] sm:rounded-[28px] md:rounded-[34px]" />
            <div className="w-full h-full overflow-hidden bg-[#fafafa]">
              <motion.img
                src="/store_print_3.png"
                alt="Vitrine no Celular - Vista Produto"
                style={{ y: imageY }}
                className="w-full h-auto block select-none pointer-events-none"
              />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

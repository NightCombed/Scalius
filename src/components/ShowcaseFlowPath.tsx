import React, { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Cores BRILHANTES que seguem os badges de cada showcase row.
 * Versões mais vibrantes para ficarem bem como linha fina + glow.
 */
const COLORS = ['#FF6B1A', '#22C55E', '#6366F1', '#F59E0B', '#EC4899'];
const CORNER_RADIUS = 35;
const STROKE_WIDTH = 5;
const ENTRY_DEPTH = 30;

interface ShowcaseFlowPathProps {
  containerRef: React.RefObject<HTMLDivElement>;
}

interface GradientStop {
  offset: string;
  color: string;
}

const ShowcaseFlowPath: React.FC<ShowcaseFlowPathProps> = ({ containerRef }) => {
  const pathRef = useRef<SVGPathElement>(null);
  const glowPathRef = useRef<SVGPathElement>(null);
  const dotRef = useRef<SVGCircleElement>(null);
  const dotGlowRef = useRef<SVGCircleElement>(null);
  const rafIdRef = useRef<number>(0);

  const [pathD, setPathD] = useState('');
  const [dimensions, setDimensions] = useState({ w: 0, h: 0 });
  const [gradientBounds, setGradientBounds] = useState({ y1: 0, y2: 100 });
  const [stops, setStops] = useState<GradientStop[]>([]);

  /* ------------------------------------------------------------------ */
  /*  Calcula o path SVG com base nas posições reais dos .showcase-image */
  /* ------------------------------------------------------------------ */
  const buildPath = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const cRect = container.getBoundingClientRect();
    const images = Array.from(container.querySelectorAll('.showcase-image'));
    if (images.length < 2) return;

    const isDesktop = window.innerWidth >= 992;
    const R = isDesktop ? CORNER_RADIUS : 16;

    const pts = images.map(img => {
      const r = img.getBoundingClientRect();
      return {
        cx: r.left + r.width / 2 - cRect.left,
        top: r.top - cRect.top,
        bot: r.bottom - cRect.top,
      };
    });

    let d = `M ${pts[0].cx} ${pts[0].bot - 8}`;
    let pathMaxY = pts[0].bot;
    const pathMinY = pts[0].bot;

    for (let i = 0; i < pts.length - 1; i++) {
      const sx = pts[i].cx;
      const sy = pts[i].bot;
      const ex = pts[i + 1].cx;
      const ey = pts[i + 1].top + ENTRY_DEPTH;

      if (isDesktop && Math.abs(sx - ex) > 20) {
        /* ---------- desktop: padrão escada com cantos arredondados ---------- */
        const nextRow = images[i + 1].closest('.showcase-row');
        // Pega o topo da row inteira (que inclui o texto). Assim, se o texto for mais alto
        // que a imagem (como na Row 5), a linha desvia ANTES de encostar no texto!
        const nextRowTop = nextRow ? nextRow.getBoundingClientRect().top - cRect.top : ey - 60;
        
        let midY = (sy + nextRowTop) / 2;
        if (midY < sy + R + 5) midY = sy + R + 5; // Proteção mínima para a curva

        const dir = ex > sx ? 1 : -1;

        d += ` L ${sx} ${midY - R}`;
        d += ` Q ${sx} ${midY} ${sx + dir * R} ${midY}`;
        d += ` L ${ex - dir * R} ${midY}`;
        d += ` Q ${ex} ${midY} ${ex} ${midY + R}`;
        d += ` L ${ex} ${ey}`;
        pathMaxY = Math.max(pathMaxY, ey);

        // Segmento "through-mockup" (escondido atrás do card)
        if (i < pts.length - 2) {
          d += ` L ${pts[i + 1].cx} ${pts[i + 1].bot - 8}`;
          pathMaxY = Math.max(pathMaxY, pts[i + 1].bot);
        }
      } else if (!isDesktop) {
        /* ---------- mobile: zig-zag (alterna direita e esquerda) ---------- */
        const isRightSide = i % 2 === 0;
        // Trilho a 4px da borda do container (com padding 15px, fica a 11px longe do texto)
        const trackX = isRightSide ? cRect.width - 4 : 4;
        const dirToTrack = isRightSide ? 1 : -1;

        // Margem inferior é 64px, gap é 32px. Braços passam no meio para não cruzar o texto.
        const branchOutY = sy + 32; 
        const branchInY = pts[i + 1].top - 36;  

        // Sai do mockup atual
        d += ` L ${sx} ${branchOutY - R}`;
        d += ` Q ${sx} ${branchOutY} ${sx + dirToTrack * R} ${branchOutY}`;
        d += ` L ${trackX - dirToTrack * R} ${branchOutY}`;
        d += ` Q ${trackX} ${branchOutY} ${trackX} ${branchOutY + R}`;

        // Desce pelo trilho lateral (totalmente fora do texto)
        d += ` L ${trackX} ${branchInY - R}`;

        // Entra no próximo mockup (curva no centro bem acima do card para entrar 100% reto)
        d += ` Q ${trackX} ${branchInY} ${trackX - dirToTrack * R} ${branchInY}`;
        d += ` L ${ex + dirToTrack * R} ${branchInY}`;
        d += ` Q ${ex} ${branchInY} ${ex} ${branchInY + R}`;
        d += ` L ${ex} ${ey}`;
        
        pathMaxY = Math.max(pathMaxY, ey);

        // Segmento "through-mockup" escondido
        if (i < pts.length - 2) {
           d += ` L ${ex} ${pts[i + 1].bot - 8}`;
           pathMaxY = Math.max(pathMaxY, pts[i + 1].bot);
        }
      }
    }

    /* -------------------------------------------------------------- */
    /*  Gradient com cor do DESTINO ("anuncia" a próxima seção)        */
    /*  Cada staircase visível tem a cor do mockup pra onde está indo. */
    /*  A troca acontece no exit do through-mockup (atrás do card).   */
    /* -------------------------------------------------------------- */
    const totalSpan = pathMaxY - pathMinY || 1;
    const toPct = (y: number) => {
      const pct = ((y - pathMinY) / totalSpan) * 100;
      return `${Math.max(0, Math.min(100, pct))}%`;
    };

    const gradStops: GradientStop[] = [];
    // Começa com a cor do destino do primeiro staircase (img2)
    gradStops.push({ offset: '0%', color: COLORS[Math.min(1, COLORS.length - 1)] });

    for (let i = 1; i < pts.length - 1 && i + 1 < COLORS.length; i++) {
      // Transição sharp BEM NO MEIO do mockup (totalmente oculto atrás do card)
      // Antes estava no pts[i].bot, o que fazia o "corte" vazar na borda inferior por causa do glow
      const transitionY = (pts[i].top + pts[i].bot) / 2;
      gradStops.push({ offset: toPct(transitionY), color: COLORS[i] });
      gradStops.push({ offset: toPct(transitionY + 1), color: COLORS[i + 1] });
    }

    gradStops.push({
      offset: '100%',
      color: COLORS[Math.min(pts.length - 1, COLORS.length - 1)],
    });

    setPathD(d);
    setDimensions({ w: cRect.width, h: cRect.height });
    setGradientBounds({ y1: pathMinY, y2: pathMaxY });
    setStops(gradStops);
  }, [containerRef]);

  /* ------------------------------------------------------------------ */
  /*  Animação de scroll com start atrasado                              */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    if (!pathD) return;

    const onScroll = () => {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = requestAnimationFrame(() => {
        const path = pathRef.current;
        const container = containerRef.current;
        if (!path || !container) return;

        const total = path.getTotalLength();
        const section = container.closest('section');
        if (!section) return;

        const sr = section.getBoundingClientRect();
        const vh = window.innerHeight;
        const isMobile = window.innerWidth < 992;

        let progress = 0;
        if (isMobile) {
          // No mobile, o caminho é muito longo.
          // Começa a desenhar quando o início do caminho (y1) atinge 85% do vh (mais cedo).
          // Termina quando o fim do caminho (y2) atinge 30% do vh.
          const startAnchor = vh * 0.85;
          const endAnchor = vh * 0.3;
          const pathHeight = gradientBounds.y2 - gradientBounds.y1;
          
          const startY = sr.top + gradientBounds.y1;
          const startLimit = startAnchor;
          const endLimit = endAnchor - pathHeight;
          
          const scrollP = (startLimit - startY) / (startLimit - endLimit || 1);
          progress = Math.max(0, Math.min(1, scrollP));
        } else {
          // Desktop: animação acelerada para terminar antes
          const rawProgress = (vh - sr.top) / (sr.height + vh * 0.2);
          const linear = Math.max(0, Math.min(1, (rawProgress - 0.2) / 0.8));
          progress = Math.min(1, linear + 0.4 * linear * linear * linear);
        }

        const drawn = total * progress;

        const dashVal = `${total}`;
        const offsetVal = `${total - drawn}`;

        path.style.strokeDasharray = dashVal;
        path.style.strokeDashoffset = offsetVal;

        if (glowPathRef.current) {
          glowPathRef.current.style.strokeDasharray = dashVal;
          glowPathRef.current.style.strokeDashoffset = offsetVal;
        }

        // Dot
        if (dotRef.current && dotGlowRef.current) {
          if (drawn > 1) {
            const pt = path.getPointAtLength(Math.min(drawn, total));
            const cx = `${pt.x}`;
            const cy = `${pt.y}`;
            dotRef.current.setAttribute('cx', cx);
            dotRef.current.setAttribute('cy', cy);
            dotGlowRef.current.setAttribute('cx', cx);
            dotGlowRef.current.setAttribute('cy', cy);
            dotRef.current.style.opacity = '1';
            dotGlowRef.current.style.opacity = '1';
          } else {
            dotRef.current.style.opacity = '0';
            dotGlowRef.current.style.opacity = '0';
          }
        }
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(rafIdRef.current);
    };
  }, [pathD, containerRef, gradientBounds]);

  /* ------------------------------------------------------------------ */
  /*  Calcula/recalcula ao montar, resize, e mudanças de layout          */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    const timer = setTimeout(buildPath, 80);
    let obs: ResizeObserver | null = null;

    if (containerRef.current && typeof ResizeObserver !== 'undefined') {
      obs = new ResizeObserver(() => buildPath());
      obs.observe(containerRef.current);
    }

    window.addEventListener('resize', buildPath);
    return () => {
      clearTimeout(timer);
      obs?.disconnect();
      window.removeEventListener('resize', buildPath);
    };
  }, [buildPath]);

  if (!pathD) return null;

  return (
    <svg
      className="showcase-flow-svg"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: dimensions.w,
        height: dimensions.h,
        pointerEvents: 'none',
        zIndex: 1,
        overflow: 'visible',
      }}
      aria-hidden="true"
    >
      <defs>
        {/* Gradiente multicolorido com transições sharp */}
        <linearGradient
          id="sf-gradient"
          x1="0"
          y1={gradientBounds.y1}
          x2="0"
          y2={gradientBounds.y2}
          gradientUnits="userSpaceOnUse"
        >
          {stops.map((s, i) => (
            <stop key={i} offset={s.offset} stopColor={s.color} />
          ))}
        </linearGradient>

        {/* Glow para o path */}
        <filter id="sf-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Glow para o dot */}
        <filter id="sf-dot-glow" x="-300%" y="-300%" width="700%" height="700%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Camada de glow */}
      <path
        ref={glowPathRef}
        d={pathD}
        fill="none"
        stroke="url(#sf-gradient)"
        strokeWidth={STROKE_WIDTH + 8}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.3}
        filter="url(#sf-glow)"
      />

      {/* Path principal */}
      <path
        ref={pathRef}
        d={pathD}
        fill="none"
        stroke="url(#sf-gradient)"
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Dot – glow colorido */}
      <circle
        ref={dotGlowRef}
        r={14}
        fill="url(#sf-gradient)"
        opacity={0}
        filter="url(#sf-dot-glow)"
      />

      {/* Dot – núcleo colorido (sem branco) */}
      <circle
        ref={dotRef}
        r={6}
        fill="url(#sf-gradient)"
        opacity={0}
      />
    </svg>
  );
};

export default ShowcaseFlowPath;

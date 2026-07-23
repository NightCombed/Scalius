import React from 'react';

export const ShippingAnimation = () => {
  return (
    <>
      <style>{`
        :root {
            --anim-dur: 10s;
            --orange-base: #f97316;
            --orange-light: #ffedd5;
            --green-base: #10b981;
        }

        .animate-float { animation: float 6s ease-in-out infinite; }
        @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-12px); }
        }

        /* TELA 1: 0% a 45% */
        .seq-screen-1 { animation: screen1 var(--anim-dur) infinite cubic-bezier(0.4, 0, 0.2, 1); }
        @keyframes screen1 {
            0%, 45% { opacity: 1; transform: translateX(0); pointer-events: auto; }
            50%, 95% { opacity: 0; transform: translateX(-20px); pointer-events: none; }
            100% { opacity: 1; transform: translateX(0); pointer-events: auto; }
        }

        /* TELA 2: 50% a 95% */
        .seq-screen-2 { animation: screen2 var(--anim-dur) infinite cubic-bezier(0.4, 0, 0.2, 1); }
        @keyframes screen2 {
            0%, 45% { opacity: 0; transform: translateX(20px); pointer-events: none; }
            50%, 95% { opacity: 1; transform: translateX(0); pointer-events: auto; }
            100% { opacity: 0; transform: translateX(-20px); pointer-events: none; }
        }

        /* Animação do Cursor do Mouse */
        .seq-mouse { animation: mouseMove var(--anim-dur) cubic-bezier(0.4, 0, 0.2, 1) infinite; transform-origin: top left; }
        @keyframes mouseMove {
            0%, 3% { top: 90%; left: 70%; opacity: 0; transform: scale(1); }
            4% { top: 90%; left: 70%; opacity: 1; transform: scale(1); }
            10%, 17% { top: 25%; left: 65%; opacity: 1; transform: scale(1); } /* Chega Opt 1 */
            22%, 28% { top: 44%; left: 65%; opacity: 1; transform: scale(1); } /* Chega Opt 2 */
            32%, 36% { top: 62%; left: 65%; opacity: 1; transform: scale(1); } /* Chega Opt 3 */
            37% { top: 62%; left: 65%; opacity: 1; transform: scale(0.85); } /* Clica Opt 3 */
            39% { top: 62%; left: 65%; opacity: 1; transform: scale(1); }
            43% { top: 85%; left: 50%; opacity: 1; transform: scale(1); } /* Vai pro Botão */
            44% { top: 85%; left: 50%; opacity: 1; transform: scale(0.85); } /* Clica Botão */
            46% { top: 85%; left: 50%; opacity: 1; transform: scale(1); }
            48%, 100% { top: 100%; left: 50%; opacity: 0; transform: scale(1); }
        }

        /* Seleção das opções perfeitamente sincronizada com o mouse */
        .seq-opt-1 { animation: optSelect1 var(--anim-dur) infinite; }
        .seq-opt-2 { animation: optSelect2 var(--anim-dur) infinite; }
        .seq-opt-3 { animation: optSelect3 var(--anim-dur) infinite; }
        
        @keyframes optSelect1 {
            0%, 9% { border-color: #e5e7eb; background-color: white; }
            10%, 17% { border-color: var(--orange-base); background-color: var(--orange-light); }
            18%, 100% { border-color: #e5e7eb; background-color: white; }
        }
        @keyframes optSelect2 {
            0%, 21% { border-color: #e5e7eb; background-color: white; }
            22%, 28% { border-color: var(--orange-base); background-color: var(--orange-light); }
            29%, 100% { border-color: #e5e7eb; background-color: white; }
        }
        @keyframes optSelect3 {
            0%, 31% { border-color: #e5e7eb; background-color: white; }
            32%, 36% { border-color: var(--orange-base); background-color: var(--orange-light); } /* Hover */
            37%, 46% { border-color: var(--orange-base); background-color: var(--orange-light); } /* Mantém selecionado após clique */
            47%, 100% { border-color: #e5e7eb; background-color: white; }
        }

        /* Animação do botão "Radio" preenchendo no clique */
        .seq-radio-fill { animation: radioFill var(--anim-dur) infinite; }
        @keyframes radioFill {
            0%, 36% { transform: scale(0); opacity: 0; }
            37%, 46% { transform: scale(1); opacity: 1; } /* Aparece no exato momento do clique (37%) */
            47%, 100% { transform: scale(0); opacity: 0; }
        }

        .seq-btn-click { animation: btnClick var(--anim-dur) infinite ease-in-out; }
        @keyframes btnClick {
            0%, 43% { transform: scale(1); background-color: var(--orange-base); }
            44% { transform: scale(0.95); background-color: #ea580c; } /* Clique no Confirmar */
            46%, 100% { transform: scale(1); background-color: var(--orange-base); }
        }

        /* Mapa nascendo com Zoom-in suave */
        .seq-map-scale { animation: mapScale var(--anim-dur) infinite cubic-bezier(0.4, 0, 0.2, 1); }
        @keyframes mapScale {
            0%, 45% { transform: scale(0.8); opacity: 0; }
            50%, 95% { transform: scale(1); opacity: 1; }
            100% { transform: scale(0.8); opacity: 0; }
        }
        /* Radar agora para de piscar quando conclui a entrega (69%) */
        .seq-radar-pulse { animation: radarPulse var(--anim-dur) infinite ease-out; }
        @keyframes radarPulse {
            0%, 50% { opacity: 0; }
            51%, 68% { opacity: 1; } /* Pisca apenas enquanto está em rota */
            69%, 100% { opacity: 0; } /* Desliga ao chegar (Sincronizado) */
        }
        
        .seq-radar-ring { animation: radarRing 1.5s infinite ease-out; }
        @keyframes radarRing {
            0% { transform: scale(0.3); opacity: 1; }
            100% { transform: scale(2.5); opacity: 0; }
        }

        .seq-route-draw { 
            stroke-dasharray: 250;
            stroke-dashoffset: 250;
            animation: routeDraw var(--anim-dur) infinite ease-in-out; 
        }
        @keyframes routeDraw {
            0%, 55% { stroke-dashoffset: 250; stroke: var(--orange-base); }
            69% { stroke-dashoffset: 0; stroke: var(--orange-base); } /* Chega no destino exato aqui */
            70%, 95% { stroke-dashoffset: 0; stroke: var(--green-base); }
            100% { stroke-dashoffset: 250; stroke: var(--orange-base); }
        }

        .seq-dest-success { animation: destSuccess var(--anim-dur) infinite cubic-bezier(0.34, 1.56, 0.64, 1); }
        @keyframes destSuccess {
            0%, 68% { transform: scale(0); opacity: 0; }
            72%, 95% { transform: scale(1); opacity: 1; } /* Pop elástico sincronizado */
            100% { transform: scale(0); opacity: 0; }
        }
        
        .seq-success-blast { animation: successBlast var(--anim-dur) infinite ease-out; }
        @keyframes successBlast {
            0%, 68% { transform: scale(0); opacity: 0; border-width: 8px; }
            69% { transform: scale(0); opacity: 1; border-width: 8px; }
            80%, 100% { transform: scale(2.5); opacity: 0; border-width: 0px; }
        }

        /* Overlay do card de baixo usando a MESMA curva elástica para sincronia perfeita */
        .seq-success-overlay { animation: successOverlay var(--anim-dur) infinite cubic-bezier(0.34, 1.56, 0.64, 1); }
        @keyframes successOverlay {
            0%, 68% { opacity: 0; transform: scale(0.95); pointer-events: none; }
            72%, 95% { opacity: 1; transform: scale(1); pointer-events: auto; } /* Pop elástico sincronizado */
            100% { opacity: 0; transform: scale(0.95); pointer-events: none; }
        }

        .seq-progress-bar { animation: progressBar var(--anim-dur) infinite ease-out; }
        @keyframes progressBar {
            0%, 55% { width: 0%; }
            69%, 100% { width: 100%; } /* Chega em 100% exato junto com a linha */
        }

        /* Efeito de Skeleton piscando durante o cálculo */
        .seq-skeleton { animation: skeletonPulse var(--anim-dur) infinite; }
        @keyframes skeletonPulse {
            0%, 50% { opacity: 1; }
            55%, 68% { opacity: 0.4; } /* Pisca enquanto calcula */
            69%, 100% { opacity: 1; } /* Fica sólido no frame de chegada */
        }

        .seq-calc-card { animation: calcCard var(--anim-dur) infinite cubic-bezier(0.4, 0, 0.2, 1); }
        @keyframes calcCard {
            0%, 55% { transform: translateY(30px); opacity: 0; }
            58%, 95% { transform: translateY(0); opacity: 1; }
            100% { transform: translateY(30px); opacity: 0; }
        }
      `}</style>

      <div className="w-full flex justify-center items-center relative p-6 md:p-12">
        <div className="absolute hidden md:block w-96 h-96 bg-orange-400 blur-[100px] opacity-20 rounded-full pointer-events-none"></div>

        <div className="md:animate-float w-full max-w-sm bg-white rounded-2xl shadow-xl md:shadow-2xl border border-gray-200 overflow-hidden relative z-10 perspective-1000 flex flex-col h-[280px] md:h-[420px]">
            <div className="flex flex-col w-full h-full md:h-[420px] origin-top md:scale-100">

            <div className="relative w-full flex-1 bg-gray-50/50 overflow-hidden">

                <div className="seq-screen-1 absolute inset-0 p-4 md:p-6 flex flex-col bg-gray-50/50 z-30">
                    
                    <div className="seq-mouse absolute z-50 pointer-events-none drop-shadow-md shrink-0 w-6 h-6 md:w-7 md:h-7">
                        <svg className="w-full h-full" viewBox="0 0 24 24" fill="white" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
                            <path d="M5 2 L5 16 L8 13 L11.5 20 L13.5 19 L10 12 L15 12 Z" />
                        </svg>
                    </div>

                    <div className="w-24 md:w-32 h-2 md:h-3 bg-gray-300 rounded-full mb-3 md:mb-4"></div>
                    <div className="w-16 md:w-20 h-1.5 md:h-2 bg-gray-200 rounded-full mb-4 md:mb-6"></div>

                    <div className="space-y-2 md:space-y-3 flex-1">
                        <div className="seq-opt-1 border-2 border-gray-200 rounded-xl p-2 md:p-3 flex items-center gap-3 md:gap-4 transition-colors">
                            <div className="w-8 h-8 md:w-10 md:h-10 bg-white border border-gray-100 rounded-lg shadow-sm flex justify-center items-center shrink-0 text-gray-400">
                                <svg className="w-4 h-4 md:w-5 md:h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 6h-2c0-2.76-2.24-5-5-5S7 3.24 7 6H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-7-3c1.66 0 3 1.34 3 3H9c0-1.66 1.34-3 3-3z"/></svg>
                            </div>
                            <div className="flex-1 space-y-1.5 md:space-y-2">
                                <div className="w-20 md:w-24 h-2 bg-gray-300 rounded-full"></div>
                                <div className="w-12 md:w-16 h-2 bg-gray-200 rounded-full"></div>
                            </div>
                            <div className="w-3 h-3 md:w-4 md:h-4 rounded-full border-2 border-gray-300 bg-white"></div>
                        </div>

                        <div className="seq-opt-2 border-2 border-gray-200 rounded-xl p-2 md:p-3 flex items-center gap-3 md:gap-4 transition-colors">
                            <div className="w-8 h-8 md:w-10 md:h-10 bg-white border border-gray-100 rounded-lg shadow-sm flex justify-center items-center shrink-0 text-gray-400">
                                <svg className="w-4 h-4 md:w-5 md:h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M15.5 11l2.5-3.5H16L14 10h-2l-2-2-4 0v2h3l2 2h-4v2h3l-2.5 3.5H10l2-2.5h2l2 2h4.5l-2.5-3.5h3z"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>
                            </div>
                            <div className="flex-1 space-y-1.5 md:space-y-2">
                                <div className="w-24 md:w-28 h-2 bg-gray-300 rounded-full"></div>
                                <div className="w-10 md:w-14 h-2 bg-gray-200 rounded-full"></div>
                            </div>
                            <div className="w-3 h-3 md:w-4 md:h-4 rounded-full border-2 border-gray-300 bg-white"></div>
                        </div>

                        <div className="seq-opt-3 border-2 border-gray-200 rounded-xl p-2 md:p-3 flex items-center gap-3 md:gap-4 transition-colors">
                            <div className="w-8 h-8 md:w-10 md:h-10 bg-white border border-gray-100 rounded-lg shadow-sm flex justify-center items-center shrink-0 text-orange-500">
                                <svg className="w-4 h-4 md:w-5 md:h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>
                            </div>
                            <div className="flex-1 space-y-1.5 md:space-y-2">
                                <div className="w-16 md:w-20 h-2 bg-orange-800/80 rounded-full"></div>
                                <div className="w-24 md:w-32 h-2 bg-gray-300 rounded-full"></div>
                            </div>
                            <div className="w-3 h-3 md:w-4 md:h-4 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center">
                                <div className="seq-radio-fill w-1.5 h-1.5 md:w-2 md:h-2 bg-orange-500 rounded-full"></div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-2 md:pt-4 mt-2 border-t border-gray-200">
                        <div className="seq-btn-click w-full h-8 md:h-10 rounded-lg flex items-center justify-center shadow-md text-white font-medium">
                            <div className="w-20 md:w-24 h-2 bg-white/90 rounded-full"></div>
                        </div>
                    </div>
                </div>

                <div className="seq-screen-2 absolute inset-0 bg-white z-20 flex flex-col justify-between overflow-hidden">
                    
                    <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, #f3f4f6 2px, transparent 2.5px)', backgroundSize: '20px 20px' }}></div>
                    
                    <div className="p-4 md:p-6 relative z-10 flex flex-col items-center justify-center h-full pb-16 md:pb-20">
                        
                        <div className="seq-map-scale relative w-44 h-44 md:w-56 md:h-56">
                            
                            <svg className="absolute inset-0 w-full h-full drop-shadow-md" viewBox="0 0 200 200">
                                <path d="M 40 160 Q 60 60 160 40" fill="none" stroke="#e5e7eb" strokeWidth="4" strokeDasharray="6,6" strokeLinecap="round"/>
                                <path className="seq-route-draw" d="M 40 160 Q 60 60 160 40" fill="none" stroke="var(--orange-base)" strokeWidth="4" strokeLinecap="round"/>
                                
                                <circle cx="40" cy="160" r="10" fill="white" stroke="var(--orange-base)" strokeWidth="4"/>
                                <circle cx="160" cy="40" r="10" fill="white" stroke="#374151" strokeWidth="4"/>
                            </svg>

                            <div className="absolute w-6 h-6 md:w-8 md:h-8 -ml-3 -mt-3 md:-ml-4 md:-mt-4 z-20 flex items-center justify-center" style={{ left: '80%', top: '20%' }}>
                                <div className="seq-success-blast absolute inset-0 rounded-full border-green-500"></div>
                                <div className="seq-dest-success absolute inset-0 bg-green-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                                    <svg className="w-4 h-4 md:w-5 md:h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                                </div>
                            </div>
                            
                            <div className="seq-radar-pulse absolute w-10 h-10 md:w-12 md:h-12 -ml-5 -mt-5 md:-ml-6 md:-mt-6 z-10" style={{ left: '20%', top: '80%' }}>
                                <div className="seq-radar-ring absolute inset-0 border-2 border-orange-500 rounded-full"></div>
                                <div className="seq-radar-ring absolute inset-0 border-2 border-orange-500 rounded-full" style={{ animationDelay: '0.7s' }}></div>
                            </div>
                        </div>

                    </div>

                    <div className="seq-calc-card absolute bottom-4 left-4 right-4 md:bottom-6 md:left-6 md:right-6 bg-white border border-gray-100 rounded-xl p-3 md:p-4 shadow-xl shadow-gray-200/50 flex items-center gap-3 md:gap-4 z-20 overflow-hidden">
                        
                        <div className="seq-success-overlay absolute inset-0 bg-green-500 flex items-center justify-center gap-2 md:gap-3 z-30 transition-all">
                            <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-white/20 flex items-center justify-center">
                                <svg className="w-4 h-4 md:w-5 md:h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                            </div>
                            <div className="w-20 md:w-24 h-2 md:h-3 bg-white/90 rounded-full"></div>
                        </div>

                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-orange-50 flex items-center justify-center">
                            <svg className="w-4 h-4 md:w-5 md:h-5 text-orange-500" fill="currentColor" viewBox="0 0 24 24"><path d="M15.5 11l2.5-3.5H16L14 10h-2l-2-2-4 0v2h3l2 2h-4v2h3l-2.5 3.5H10l2-2.5h2l2 2h4.5l-2.5-3.5h3z"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>
                        </div>
                        <div className="flex-1 space-y-1.5 md:space-y-2">
                            <div className="seq-skeleton w-20 md:w-24 h-2 bg-gray-800 rounded-full"></div>
                            <div className="w-full h-1 md:h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className="seq-progress-bar h-full bg-orange-500"></div>
                            </div>
                            <div className="seq-skeleton w-12 md:w-16 h-2 bg-gray-300 rounded-full"></div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
      </div>
    </div>
    </>
  );
};

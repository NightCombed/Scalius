import React from 'react';

export const PaymentAnimation = () => {
  return (
    <>
      <style>{`
        :root {
            --anim-dur: 12s; /* Ciclo total da animação */
            --orange-base: #f97316;
            --green-base: #10b981;
        }

        .animate-float {
            animation: float 6s ease-in-out infinite;
        }

        @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-12px); }
        }

        .seq-screen-1 { animation: screen1 var(--anim-dur) infinite cubic-bezier(0.4, 0, 0.2, 1); }
        @keyframes screen1 {
            0%, 25% { opacity: 1; transform: translateX(0); }
            30%, 85% { opacity: 0; transform: translateX(-20px); pointer-events: none; }
            90%, 100% { opacity: 1; transform: translateX(0); }
        }

        /* Botão sendo clicado (Tela 1) */
        .seq-btn-click { animation: btnClick var(--anim-dur) infinite ease-in-out; }
        @keyframes btnClick {
            0%, 20% { transform: scale(1); background-color: var(--orange-base); }
            23% { transform: scale(0.95); background-color: #ea580c; } /* Pressionado */
            26%, 100% { transform: scale(1); background-color: var(--orange-base); }
        }

        .seq-screen-2 { animation: screen2 var(--anim-dur) infinite cubic-bezier(0.4, 0, 0.2, 1); }
        @keyframes screen2 {
            0%, 25% { opacity: 0; transform: scale(0.95); pointer-events: none; }
            30%, 60% { opacity: 1; transform: scale(1); pointer-events: auto; }
            65%, 100% { opacity: 0; transform: scale(1.05); pointer-events: none; }
        }

        /* Scanner Laser sobre o QR Code */
        .seq-scanner { animation: scannerSweep var(--anim-dur) infinite ease-in-out; }
        @keyframes scannerSweep {
            0%, 30% { top: 0%; opacity: 0; }
            35% { opacity: 1; }
            55% { top: 98%; opacity: 1; }
            60%, 100% { top: 98%; opacity: 0; }
        }
        
        /* Rastro de luz do Scanner */
        .seq-scanner-bg { animation: scannerBg var(--anim-dur) infinite ease-in-out; }
        @keyframes scannerBg {
            0%, 30% { height: 0%; opacity: 0; }
            35% { opacity: 0.15; }
            55% { height: 98%; opacity: 0.15; }
            60%, 100% { height: 98%; opacity: 0; }
        }

        .seq-screen-3 { animation: screen3 var(--anim-dur) infinite cubic-bezier(0.4, 0, 0.2, 1); }
        @keyframes screen3 {
            0%, 60% { opacity: 0; transform: translateY(15px); pointer-events: none; }
            65%, 85% { opacity: 1; transform: translateY(0); pointer-events: auto; }
            90%, 100% { opacity: 0; transform: translateY(15px); pointer-events: none; }
        }

        /* Pop do Checkmark verde (Tela 3) */
        .seq-check-pop { animation: checkPop var(--anim-dur) infinite cubic-bezier(0.34, 1.56, 0.64, 1); }
        @keyframes checkPop {
            0%, 63% { transform: scale(0); opacity: 0; }
            67%, 85% { transform: scale(1); opacity: 1; }
            90%, 100% { transform: scale(0); opacity: 0; }
        }

        /* Recibo descendo (Tela 3) */
        .seq-receipt { animation: receiptDrop var(--anim-dur) infinite ease-out; }
        @keyframes receiptDrop {
            0%, 65% { transform: translateY(-30px); opacity: 0; }
            69%, 85% { transform: translateY(0); opacity: 1; }
            90%, 100% { transform: translateY(-30px); opacity: 0; }
        }

        /* Skeleton lines animadas (Recibo) */
        .seq-line-fill-1 { animation: lineFill1 var(--anim-dur) infinite ease-out; }
        .seq-line-fill-2 { animation: lineFill2 var(--anim-dur) infinite ease-out; }
        @keyframes lineFill1 {
            0%, 67% { width: 0%; opacity: 0; }
            71%, 100% { width: 100%; opacity: 1; }
        }
        @keyframes lineFill2 {
            0%, 69% { width: 0%; opacity: 0; }
            73%, 100% { width: 60%; opacity: 1; }
        }
      `}</style>

      <div className="w-full flex justify-center items-center relative p-6 md:p-12">
        
        {/* Fundo decorativo sutil */}
        <div className="absolute hidden md:block w-96 h-96 bg-orange-400 blur-[100px] opacity-20 rounded-full pointer-events-none"></div>

        {/* Mockup do Painel Flutuante */}
        <div className="md:animate-float w-full max-w-sm bg-white rounded-2xl shadow-xl md:shadow-2xl border border-gray-200 overflow-hidden relative z-10 perspective-1000 flex flex-col h-[280px] md:h-[420px]">
            <div className="flex flex-col w-full h-full md:h-[420px] origin-top md:scale-100">

                {/* CONTAINER DE TELAS SOBREPOSTAS (Corpo do App) */}
                <div className="relative w-full flex-1 bg-gray-50/50 overflow-hidden">

                    <div className="seq-screen-1 absolute inset-0 p-4 md:p-6 flex flex-col bg-gray-50/50">
                        
                        <div className="w-24 h-2 md:h-3 bg-gray-300 rounded-full mb-4 md:mb-6"></div>

                        {/* Produto Resumo (Skeleton) */}
                        <div className="bg-white p-3 md:p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center">
                                 <svg className="w-5 h-5 md:w-6 md:h-6 text-gray-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                    <path fillRule="evenodd" d="M7.5 6v.75H5.513c-.96 0-1.764.724-1.865 1.679l-1.263 12A1.875 1.875 0 004.25 22.5h15.5a1.875 1.875 0 001.865-2.071l-1.263-12a1.875 1.875 0 00-1.865-1.679H16.5V6a4.5 4.5 0 10-9 0zM12 3a3 3 0 00-3 3v.75h6V6a3 3 0 00-3-3zm-3 8.25a3 3 0 106 0v-.75a.75.75 0 011.5 0v.75a4.5 4.5 0 11-9 0v-.75a.75.75 0 011.5 0v.75z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="flex-1 space-y-2">
                                <div className="w-3/4 h-2 bg-gray-300 rounded-full"></div>
                                <div className="w-1/2 h-2 bg-gray-200 rounded-full"></div>
                            </div>
                        </div>

                        {/* Opção Pix Selecionada */}
                        <div className="border-2 border-orange-500 bg-orange-50/50 rounded-xl p-2 md:p-3 flex items-center gap-2 md:gap-3 relative overflow-hidden mb-auto shadow-sm shadow-orange-500/10">
                            <div className="w-3 h-3 md:w-4 md:h-4 rounded-full border-2 md:border-4 border-orange-500 bg-white"></div>
                            <div className="flex-1">
                                <div className="w-16 h-2 bg-orange-800/80 rounded-full"></div>
                            </div>
                            {/* Ícone Pix Menor */}
                            <svg className="w-3 h-3 md:w-4 md:h-4 text-orange-500" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2.5L2.5 12 12 21.5 21.5 12 12 2.5zm0 2.83l6.67 6.67-6.67 6.67-6.67-6.67L12 5.33z"/>
                            </svg>
                        </div>

                        {/* Botão Finalizar */}
                        <div className="pt-2 md:pt-4 mt-2 md:mt-4">
                            <div className="seq-btn-click w-full h-8 md:h-10 rounded-lg flex items-center justify-center shadow-lg shadow-orange-500/30 text-white font-medium">
                                <div className="w-20 md:w-24 h-2 bg-white/90 rounded-full"></div>
                            </div>
                        </div>
                    </div>

                    <div className="seq-screen-2 absolute inset-0 bg-white flex flex-col items-center justify-center p-4 md:p-6 z-10">
                        
                        <div className="w-24 md:w-32 h-2 md:h-3 bg-gray-800 rounded-full mb-6 md:mb-8"></div>

                        {/* Box do QR Code com Animação de Scanner */}
                        <div className="relative w-32 h-32 md:w-40 md:h-40 bg-white border border-gray-100 rounded-xl p-3 shadow-xl shadow-gray-200/50 flex items-center justify-center overflow-hidden">
                            
                            {/* Marcações nos cantos do scanner */}
                            <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-orange-500 rounded-tl"></div>
                            <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-orange-500 rounded-tr"></div>
                            <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-orange-500 rounded-bl"></div>
                            <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-orange-500 rounded-br"></div>

                            {/* SVG Simulação de QR Code */}
                            <svg className="w-full h-full text-gray-800 relative z-10" viewBox="0 0 24 24" fill="currentColor">
                                {/* Cantos principais */}
                                <path d="M3 3h6v6H3V3zm2 2v2h2V5H5z"/>
                                <path d="M15 3h6v6h-6V3zm2 2v2h2V5h-2z"/>
                                <path d="M3 15h6v6H3v-6zm2 2v2h2v-2H5z"/>
                                {/* Elementos internos */}
                                <rect x="11" y="3" width="2" height="2"/>
                                <rect x="11" y="7" width="2" height="2"/>
                                <rect x="3" y="11" width="2" height="2"/>
                                <rect x="7" y="11" width="2" height="2"/>
                                <rect x="15" y="11" width="2" height="2"/>
                                <rect x="19" y="11" width="2" height="2"/>
                                <rect x="11" y="15" width="2" height="2"/>
                                <rect x="15" y="15" width="4" height="4"/>
                                <rect x="11" y="19" width="4" height="2"/>
                                <rect x="19" y="19" width="2" height="2"/>
                            </svg>

                            {/* Laser animado (Linha e Fundo) */}
                            <div className="seq-scanner absolute left-0 w-full h-[2px] bg-orange-500 shadow-[0_0_10px_2px_rgba(249,115,22,0.8)] z-20"></div>
                            <div className="seq-scanner-bg absolute left-0 top-0 w-full bg-orange-500 z-10"></div>
                        </div>

                        <div className="w-24 md:w-32 h-2 bg-gray-200 rounded-full mt-6 md:mt-8"></div>
                    </div>

                    <div className="seq-screen-3 absolute inset-0 bg-gray-50 flex flex-col items-center justify-center p-4 md:p-6 z-20">
                        
                        {/* Cabeçalho Sucesso */}
                        <div className="mb-4 md:mb-6 flex flex-col items-center">
                            <div className="seq-check-pop w-10 h-10 md:w-12 md:h-12 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30 mb-3 md:mb-4">
                                <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                            </div>
                            <div className="w-20 md:w-24 h-2 md:h-3 bg-green-500 rounded-full"></div>
                        </div>

                        {/* Recibo Dropdown */}
                        <div className="seq-receipt w-full max-w-[240px] bg-white border border-gray-200 rounded-xl p-4 md:p-5 shadow-sm relative">
                            {/* Detalhe de serrilhado no topo simulando papel */}
                            <div className="absolute -top-1 left-0 w-full flex justify-around overflow-hidden">
                                <div className="w-2 h-2 rounded-full bg-gray-50"></div>
                                <div className="w-2 h-2 rounded-full bg-gray-50"></div>
                                <div className="w-2 h-2 rounded-full bg-gray-50"></div>
                                <div className="w-2 h-2 rounded-full bg-gray-50"></div>
                                <div className="w-2 h-2 rounded-full bg-gray-50"></div>
                                <div className="w-2 h-2 rounded-full bg-gray-50"></div>
                                <div className="w-2 h-2 rounded-full bg-gray-50"></div>
                                <div className="w-2 h-2 rounded-full bg-gray-50"></div>
                            </div>

                            <div className="space-y-3 md:space-y-4 pt-1 md:pt-2">
                                <div>
                                    <div className="w-12 h-2 bg-gray-200 rounded-full mb-1.5 md:mb-2"></div>
                                    <div className="seq-line-fill-1 h-2 bg-gray-800 rounded-full"></div>
                                </div>
                                <div>
                                    <div className="w-16 h-2 bg-gray-200 rounded-full mb-1.5 md:mb-2"></div>
                                    <div className="seq-line-fill-2 h-2 bg-gray-800 rounded-full"></div>
                                </div>
                                
                                <div className="border-t border-dashed border-gray-300 pt-3 mt-3 md:pt-4 md:mt-4 flex justify-between items-center">
                                    <div className="w-10 h-2 bg-gray-200 rounded-full"></div>
                                    <div className="w-16 h-3 md:h-4 bg-green-500 rounded-full"></div>
                                </div>
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

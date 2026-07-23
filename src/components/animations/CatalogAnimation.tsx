import React from 'react';

export const CatalogAnimation = () => {
  return (
    <>
      <style>{`
        .animate-float {
            animation: float 6s ease-in-out infinite;
        }

        .anim-seq-card {
            animation: cardGlow 8s infinite ease-in-out;
        }

        .anim-seq-camera {
            animation: hideCamera 8s infinite ease-in-out;
        }

        .anim-seq-image {
            animation: revealImage 8s infinite ease-out;
            transform-origin: bottom;
        }

        .anim-seq-text1 {
            animation: fillText1 8s infinite ease-out;
        }

        .anim-seq-text2 {
            animation: fillText2 8s infinite ease-out;
        }

        .anim-seq-dot1 { animation: popDot1 8s infinite ease-out; }
        .anim-seq-dot2 { animation: popDot2 8s infinite ease-out; }
        .anim-seq-dot3 { animation: popDot3 8s infinite ease-out; }

        .anim-seq-button {
            animation: buttonPop 8s infinite ease-out;
        }

        .anim-seq-shimmer {
            animation: shimmer 8s infinite linear;
        }

        @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-15px); }
        }

        @keyframes cardGlow {
            0%, 50% { box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); border-color: #f3f4f6; }
            55%, 85% { 
                box-shadow: 0 20px 25px -5px rgba(249, 115, 22, 0.15), 0 0 0 2px rgba(249, 115, 22, 0.6); 
                border-color: #f97316; 
                transform: scale(1.02);
            }
            90%, 100% { box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); border-color: #f3f4f6; transform: scale(1); }
        }

        @keyframes hideCamera {
            0%, 10% { opacity: 1; transform: scale(1); }
            15%, 85% { opacity: 0; transform: scale(0.5); }
            90%, 100% { opacity: 1; transform: scale(1); }
        }

        @keyframes revealImage {
            0%, 10% { transform: scaleY(0); opacity: 0; }
            15%, 85% { transform: scaleY(1); opacity: 1; }
            90%, 100% { transform: scaleY(0); opacity: 0; }
        }

        @keyframes fillText1 {
            0%, 20% { width: 0%; opacity: 0; background-color: #e5e7eb; }
            25%, 50% { width: 70%; opacity: 1; background-color: #e5e7eb; }
            55%, 85% { width: 70%; opacity: 1; background-color: #374151; } 
            90%, 100% { width: 0%; opacity: 0; }
        }

        @keyframes fillText2 {
            0%, 28% { width: 0%; opacity: 0; background-color: #e5e7eb; } 
            33%, 50% { width: 40%; opacity: 1; background-color: #e5e7eb; }
            55%, 85% { width: 40%; opacity: 1; background-color: #10b981; } 
            90%, 100% { width: 0%; opacity: 0; }
        }

        @keyframes popDot1 {
            0%, 35% { transform: scale(0); opacity: 0; }
            40%, 85% { transform: scale(1); opacity: 1; }
            90%, 100% { transform: scale(0); opacity: 0; }
        }
        @keyframes popDot2 {
            0%, 37% { transform: scale(0); opacity: 0; }
            42%, 85% { transform: scale(1); opacity: 1; }
            90%, 100% { transform: scale(0); opacity: 0; }
        }
        @keyframes popDot3 {
            0%, 39% { transform: scale(0); opacity: 0; }
            44%, 85% { transform: scale(1); opacity: 1; }
            90%, 100% { transform: scale(0); opacity: 0; }
        }

        @keyframes buttonPop {
            0%, 45% { transform: scale(0.9); opacity: 0; }
            50%, 85% { transform: scale(1); opacity: 1; }
            90%, 100% { transform: scale(0.9); opacity: 0; }
        }

        @keyframes shimmer {
            0%, 55% { transform: translateX(-100%); opacity: 0; }
            60% { opacity: 0.5; }
            70%, 100% { transform: translateX(200%); opacity: 0; }
        }

        @keyframes buttonBar {
            0%, 55% { transform: scale(1); opacity: 1; }
            60%, 85% { transform: scale(0); opacity: 0; }
            90%, 100% { transform: scale(1); opacity: 1; }
        }
        @keyframes buttonCheck {
            0%, 55% { transform: scale(0.5); opacity: 0; }
            60%, 85% { transform: scale(1); opacity: 1; }
            90%, 100% { transform: scale(0.5); opacity: 0; }
        }
      `}</style>

      <div className="w-full flex justify-center items-center relative p-6 md:p-12">
        <div className="absolute hidden md:block w-96 h-96 bg-orange-400 blur-[100px] opacity-20 rounded-full pointer-events-none"></div>

        <div className="md:animate-float w-full max-w-sm bg-white rounded-2xl shadow-xl md:shadow-2xl border border-gray-200 overflow-hidden relative z-10 perspective-1000 flex flex-col h-[320px] md:h-[420px]">
            <div className="flex flex-col w-full h-full md:h-[420px] origin-top md:scale-100">

            <div className="p-4 md:p-6 bg-gray-50/50 flex-1">
                <div className="anim-seq-card w-full h-full bg-white rounded-xl border border-gray-200 p-4 relative overflow-hidden transition-all duration-300 flex flex-col justify-between">
                    <div className="anim-seq-shimmer absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/80 to-transparent skew-x-12 z-20 pointer-events-none"></div>

                    <div className="h-28 md:h-36 rounded-lg bg-gray-100 mb-3 md:mb-5 flex items-center justify-center relative overflow-hidden border border-dashed border-gray-300">
                        <svg className="anim-seq-camera w-6 h-6 md:w-8 md:h-8 text-gray-400 absolute z-10" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <div className="anim-seq-image absolute inset-0 bg-gradient-to-tr from-orange-500 to-orange-300 flex items-center justify-center">
                            <svg className="w-8 h-8 md:w-12 md:h-12 text-white opacity-80" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                <path fillRule="evenodd" d="M7.5 6v.75H5.513c-.96 0-1.764.724-1.865 1.679l-1.263 12A1.875 1.875 0 004.25 22.5h15.5a1.875 1.875 0 001.865-2.071l-1.263-12a1.875 1.875 0 00-1.865-1.679H16.5V6a4.5 4.5 0 10-9 0zM12 3a3 3 0 00-3 3v.75h6V6a3 3 0 00-3-3zm-3 8.25a3 3 0 106 0v-.75a.75.75 0 011.5 0v.75a4.5 4.5 0 11-9 0v-.75a.75.75 0 011.5 0v.75z" clipRule="evenodd" />
                            </svg>
                        </div>
                    </div>

                    <div className="space-y-2 md:space-y-3 mb-3 md:mb-5">
                        <div className="h-2 md:h-3 rounded-full bg-gray-200 w-0 anim-seq-text1"></div>
                        <div className="h-2 md:h-3 rounded-full bg-gray-200 w-0 anim-seq-text2"></div>
                    </div>

                    <div className="flex gap-2 mb-3 md:mb-6">
                        <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-orange-500 shadow-inner anim-seq-dot1 opacity-0"></div>
                        <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-gray-800 shadow-inner anim-seq-dot2 opacity-0"></div>
                        <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-orange-200 shadow-inner anim-seq-dot3 opacity-0 border border-gray-200"></div>
                    </div>

                    <div className="anim-seq-button w-full h-8 md:h-10 bg-orange-500 rounded-lg flex items-center justify-center shadow-lg shadow-orange-500/30 relative overflow-hidden">
                        <div className="w-20 h-2 bg-white/50 rounded-full absolute" style={{ animation: 'buttonBar 8s infinite ease-out' }}></div>
                        <svg className="w-6 h-6 text-white absolute" style={{ animation: 'buttonCheck 8s infinite ease-out' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default function LoadingSplash() {
    return (
        <div className="bg-white min-h-screen flex items-center justify-center overflow-hidden">
            <div className="relative flex flex-col items-center justify-center max-w-sm w-full p-8">
                <div className="relative flex items-center justify-center mb-12">
                    {/* Pulsing Rings */}
                    <div className="absolute w-32 h-32 rounded-full border border-primary/30 pulse-ring"></div>
                    <div className="absolute w-40 h-40 rounded-full border border-primary/10 pulse-ring" style={{ animationDelay: '0.5s' }}></div>

                    <div className="relative z-10 w-24 h-24 flex items-center justify-center">
                        <img
                            src="/favicon.jpg"
                            alt="Logo"
                            className="w-full h-full object-contain logo-fill"
                        />
                    </div>
                </div>

                <div className="text-center space-y-3">
                    <h2 className="font-serif italic text-2xl text-[#111718] tracking-wide opacity-90">
                        Preparing your dashboard...
                    </h2>
                    <div className="flex items-center justify-center gap-1.5">
                        <div className="w-1 h-1 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '0s' }}></div>
                        <div className="w-1 h-1 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-1 h-1 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                </div>

                <div className="absolute bottom-[-100px] flex flex-col items-center">
                    <span className="text-[10px] uppercase tracking-[0.4em] text-slate-400 font-bold">Manatheera</span>
                </div>
            </div>

            {/* Background Blurs */}
            <div className="fixed top-0 left-0 w-64 h-64 bg-primary/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
            <div className="fixed bottom-0 right-0 w-96 h-96 bg-primary/5 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl"></div>
        </div>
    );
}

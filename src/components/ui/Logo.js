export default function Logo({ className = "", iconClassName = "" }) {
    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <div className={`bg-primary/20 p-1 rounded-lg border border-primary/30 overflow-hidden ${iconClassName}`}>
                <img src="/favicon.jpg" alt="Logo" className="size-6 object-cover" />
            </div>
            <span className="text-black text-2xl font-bold tracking-tight">Manatheera</span>
        </div>
    );
}

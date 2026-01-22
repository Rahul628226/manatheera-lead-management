export default function Button({ children, className = "", variant = "primary", ...props }) {
    const baseStyles = "flex items-center justify-center overflow-hidden rounded-lg h-14 px-5 text-base font-bold leading-normal tracking-[0.015em] transition-all active:scale-[0.98]";

    const variants = {
        primary: "bg-primary text-white hover:opacity-90 shadow-lg shadow-primary/20 cursor-pointer",
        secondary: "bg-white dark:bg-slate-800 text-foreground border border-[#dbe4e6] dark:border-slate-700 hover:bg-[#f6f8f8] dark:hover:bg-slate-700 cursor-pointer",
        ghost: "bg-transparent text-primary hover:underline",
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${className}`}
            {...props}
        >
            <span className="truncate">{children}</span>
        </button>
    );
}

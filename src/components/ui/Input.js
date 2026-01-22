export default function Input({ label, type = "text", placeholder, className = "", icon, ...props }) {
    return (
        <div className={`flex flex-col gap-1.5 ${className}`}>
            {label && (
                <label className="text-black text-sm font-semibold leading-normal">
                    {label}
                </label>
            )}
            <div className="relative flex w-full items-stretch rounded-lg group">
                <input
                    type={type}
                    placeholder={placeholder}
                    className={`form-input flex w-full rounded-lg text-[#111718] focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#dbe4e6] bg-[#f0f9ff] h-14 placeholder:text-[#618389] px-4 text-base font-normal transition-all ${icon ? 'pr-12' : ''}`}
                    {...props}
                />
                {icon && (
                    <div className="absolute right-0 top-0 h-full flex items-center justify-center px-4 text-[#618389] hover:text-primary transition-colors cursor-pointer">
                        {icon}
                    </div>
                )}
            </div>
        </div>
    );
}

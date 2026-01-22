export default function Checkbox({ label, ...props }) {
    return (
        <div className="checkbox-tick">
            <label className="flex items-center gap-x-2 cursor-pointer group">
                <input
                    type="checkbox"
                    className="h-5 w-5 rounded border-[#dbe4e6] border-2 bg-transparent text-primary checked:bg-primary checked:border-primary focus:ring-0 focus:ring-offset-0 transition-all cursor-pointer"
                    {...props}
                />
                {label && (
                    <span className="text-black text-sm font-medium group-hover:text-primary transition-colors">
                        {label}
                    </span>
                )}
            </label>
        </div>
    );
}

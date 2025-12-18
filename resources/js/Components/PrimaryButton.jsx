export default function PrimaryButton({
    className = "",
    disabled,
    children,
    ...props
}) {
    return (
        <button
            {...props}
            className={
                `inline-flex items-center rounded-md border border-transparent px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition duration-150 ease-in-out bg-[rgb(17,94,89)] hover:bg-[rgb(13,75,71)] focus:bg-[rgb(13,75,71)] focus:outline-none focus:ring-2 focus:ring-[rgb(17,94,89)] focus:ring-offset-2 active:bg-[rgb(10,60,57)] ${
                    disabled && "opacity-25"
                } ` + className
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/* ================= ROOT ================= */
const SelectContext = React.createContext();

export function Select({ value, onValueChange, children }) {
    const [open, setOpen] = React.useState(false);

    return (
        <SelectContext.Provider
            value={{ value, onValueChange, open, setOpen }}
        >
            <div className="relative w-full">{children}</div>
        </SelectContext.Provider>
    );
}

/* ================= TRIGGER ================= */
export const SelectTrigger = React.forwardRef(
    ({ className, children, ...props }, ref) => {
        const { open, setOpen } = React.useContext(SelectContext);

        return (
            <button
                ref={ref}
                type="button"
                onClick={() => setOpen(!open)}
                className={cn(
                    "flex h-10 w-full items-center justify-between rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm",
                    "focus:outline-none focus:ring-2 focus:ring-primary",
                    className
                )}
                {...props}
            >
                {children}
                <ChevronDown className="h-4 w-4 opacity-50" />
            </button>
        );
    }
);

/* ================= VALUE ================= */
export function SelectValue({ placeholder }) {
    const { value } = React.useContext(SelectContext);

    return (
        <span className="truncate">
            {value || <span className="text-muted-foreground">{placeholder}</span>}
        </span>
    );
}

/* ================= CONTENT ================= */
export function SelectContent({ children }) {
    const { open, setOpen } = React.useContext(SelectContext);

    if (!open) return null;

    return (
        <div
            className="absolute z-50 mt-1 w-full rounded-md border bg-white shadow-lg"
            onMouseLeave={() => setOpen(false)}
        >
            <div className="max-h-60 overflow-auto py-1">{children}</div>
        </div>
    );
}

/* ================= ITEM ================= */
export function SelectItem({ value, children }) {
    const { onValueChange, setOpen } = React.useContext(SelectContext);

    return (
        <div
            onClick={() => {
                onValueChange(value);
                setOpen(false);
            }}
            className="cursor-pointer px-3 py-2 text-sm hover:bg-muted"
        >
            {children}
        </div>
    );
}

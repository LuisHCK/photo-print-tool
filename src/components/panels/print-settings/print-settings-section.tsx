import type { ReactNode } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface PrintSettingsSectionProps {
    title: string
    open: boolean
    onToggle: () => void
    children: ReactNode
}

export function PrintSettingsSection({
    title,
    open,
    onToggle,
    children
}: PrintSettingsSectionProps) {
    return (
        <section className="overflow-hidden rounded-xl border bg-background/80">
            <button
                type="button"
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                onClick={onToggle}
                aria-expanded={open}
            >
                <span className="font-medium">{title}</span>
                {open ? (
                    <ChevronUp className="text-muted-foreground h-4 w-4 shrink-0" />
                ) : (
                    <ChevronDown className="text-muted-foreground h-4 w-4 shrink-0" />
                )}
            </button>

            {open ? <div className="border-t px-4 py-4">{children}</div> : null}
        </section>
    )
}
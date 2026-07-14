import { Button } from '@/components/ui/button'
import { Dialog as DialogPrimitive } from 'radix-ui'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

interface ConfirmDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirm: () => void
    title: string
    description: string
    confirmLabel?: string
    cancelLabel?: string
    variant?: 'default' | 'destructive'
    children?: ReactNode
}

export function ConfirmDialog({
    open,
    onOpenChange,
    onConfirm,
    title,
    description,
    confirmLabel,
    cancelLabel,
    variant = 'default'
}: ConfirmDialogProps) {
    const { t } = useTranslation()

    return (
        <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/40" />
                <DialogPrimitive.Content className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed left-[50%] top-[50%] z-50 w-full max-w-sm translate-x-[-50%] translate-y-[-50%] gap-4 rounded-xl border bg-background p-6 shadow-lg">
                    <DialogPrimitive.Title className="text-base font-semibold">
                        {title}
                    </DialogPrimitive.Title>
                    <DialogPrimitive.Description className="text-muted-foreground mt-2 text-sm">
                        {description}
                    </DialogPrimitive.Description>

                    <div className="mt-6 flex gap-3">
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => onOpenChange(false)}
                        >
                            {cancelLabel || t('settings.cancel') || 'Cancel'}
                        </Button>
                        <Button
                            variant={variant}
                            className="flex-1"
                            onClick={() => {
                                onConfirm()
                                onOpenChange(false)
                            }}
                        >
                            {confirmLabel || t('settings.confirm') || 'Confirm'}
                        </Button>
                    </div>
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    )
}

import { Button } from '@/components/ui/button'
import { usePrintJobState } from '@/hooks/use-print-job-context'
import { Dialog as DialogPrimitive } from 'radix-ui'
import { useTranslation } from 'react-i18next'

interface PrintReviewDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onPrint: () => void
}

export function PrintReviewDialog({ open, onOpenChange, onPrint }: PrintReviewDialogProps) {
    const { t } = useTranslation()
    const state = usePrintJobState()

    const totalPages = state.pages.length
    const selectedPhotos = state.photos.filter((p) => p.selected)
    const totalSelected = selectedPhotos.reduce((sum, p) => sum + Math.max(p.copies, 1), 0)

    const worstPpi =
        state.ppiWarnings.length > 0
            ? Math.min(...state.ppiWarnings.map((w) => Math.round(w.ppi)))
            : null

    return (
        <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/40" />
                <DialogPrimitive.Content className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] gap-4 rounded-xl border bg-background p-6 shadow-lg">
                    <DialogPrimitive.Title className="text-lg font-semibold">
                        {t('settings.printReview') || 'Print review'}
                    </DialogPrimitive.Title>

                    <div className="mt-4 space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                                {t('settings.photos') || 'Photos'}
                            </span>
                            <span className="font-medium">
                                {state.photos.length} selected &middot; {totalSelected} prints
                            </span>
                        </div>

                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                                {t('settings.paperSize')}
                            </span>
                            <span className="font-medium">
                                {state.selectedPaperName} ({state.orientation})
                            </span>
                        </div>

                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                                {t('settings.pages') || 'Pages'}
                            </span>
                            <span className="font-medium">
                                {totalPages} {totalPages === 1 ? t('settings.page') || 'page' : t('settings.pages') || 'pages'}
                            </span>
                        </div>

                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                                {t('settings.printSize') || 'Print size'}
                            </span>
                            <span className="font-medium">
                                {state.cellWidthMm.toFixed(1)} &times; {state.cellHeightMm.toFixed(1)} mm
                            </span>
                        </div>

                        {worstPpi !== null && (
                            <div
                                className={`rounded-md border p-2 text-xs ${
                                    worstPpi < 100
                                        ? 'border-red-200 bg-red-50 text-red-800'
                                        : worstPpi < 150
                                          ? 'border-amber-200 bg-amber-50 text-amber-800'
                                          : 'border-green-200 bg-green-50 text-green-800'
                                }`}
                            >
                                {t('settings.estimatedQuality') || 'Estimated quality'}: ~{worstPpi} PPI{' '}
                                {worstPpi < 100
                                    ? t('settings.qualityLow') || '(may appear blurry)'
                                    : worstPpi < 150
                                      ? t('settings.qualityFair') || '(acceptable)'
                                      : t('settings.qualityGood') || '(good)'}
                            </div>
                        )}

                        {state.hasOverflow && (
                            <div className="rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
                                {t('preview.overflow')}
                            </div>
                        )}
                    </div>

                    <div className="mt-6 flex gap-3">
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => onOpenChange(false)}
                        >
                            {t('settings.cancel') || 'Cancel'}
                        </Button>
                        <Button className="flex-1" onClick={onPrint}>
                            {t('app.print')}
                        </Button>
                    </div>
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    )
}

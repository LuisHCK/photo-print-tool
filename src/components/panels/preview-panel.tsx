import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { usePrintJobActions, usePrintJobState } from '@/hooks/use-print-job-context'
import { getGridOriginMm, getPhotoObjectPosition } from '@/lib/print-layout'
import { useTranslation } from 'react-i18next'

export function PreviewPanel() {
    const { t } = useTranslation()
    const state = usePrintJobState()
    const actions = usePrintJobActions()

    return (
        <Card className="py-4">
            <CardHeader>
                <CardTitle>{t('preview.title')}</CardTitle>
                <CardDescription>
                    {state.pages.length === 0
                        ? t('preview.emptyDescription')
                        : t('preview.pageOf', {
                              current: state.pageIndex + 1,
                              total: state.pages.length
                          })}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                    <div className="text-muted-foreground text-sm">
                        {t('preview.slotsPerPage', { count: state.slotsPerPage })}
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={state.pageIndex <= 0}
                            onClick={() =>
                                actions.setPageIndex((previous) => Math.max(previous - 1, 0))
                            }
                        >
                            {t('preview.previous')}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={
                                state.pageIndex >= state.pages.length - 1 ||
                                state.pages.length === 0
                            }
                            onClick={() =>
                                actions.setPageIndex((previous) =>
                                    Math.min(previous + 1, Math.max(state.pages.length - 1, 0))
                                )
                            }
                        >
                            {t('preview.next')}
                        </Button>
                    </div>
                </div>

                <div className="flex justify-center rounded-md bg-muted/30 p-4">
                    <div
                        className="relative bg-white shadow-sm"
                        style={{
                            width: `${state.pageSize.widthMm * state.previewScale}px`,
                            height: `${state.pageSize.heightMm * state.previewScale}px`
                        }}
                    >
                        {state.currentPage?.slots.map((slot) => {
                            const columnIndex = slot.slotIndex % state.selectedLayoutColumns
                            const rowIndex = Math.floor(slot.slotIndex / state.selectedLayoutColumns)
                            const origin = getGridOriginMm(
                                state.pageSize.widthMm,
                                state.pageSize.heightMm,
                                state.gridWidthMm,
                                state.gridHeightMm,
                                state.marginMm,
                                state.gridAlignment
                            )
                            const offsetX =
                                origin.xMm +
                                columnIndex * (state.cellWidthMm + state.horizontalGapMm)
                            const offsetY =
                                origin.yMm +
                                rowIndex * (state.cellHeightMm + state.verticalGapMm)

                            return (
                                <div
                                    key={`${state.pageIndex}-${slot.slotIndex}`}
                                    className={`absolute overflow-visible ${
                                        slot.photo?.id === state.activePhotoId ? 'shadow-sm' : ''
                                    }`}
                                    onClick={() =>
                                        slot.photo && actions.setActivePhotoId(slot.photo.id)
                                    }
                                    style={{
                                        left: `${offsetX * state.previewScale}px`,
                                        top: `${offsetY * state.previewScale}px`,
                                        width: `${state.cellWidthMm * state.previewScale}px`,
                                        height: `${state.cellHeightMm * state.previewScale}px`
                                    }}
                                >
                                    {state.showCropGuides ? (
                                        <>
                                            <div className="pointer-events-none absolute left-0 -top-3 z-0 h-8 w-px bg-neutral-400/70" />
                                            <div className="pointer-events-none absolute -left-3 top-0 z-0 h-px w-8 bg-neutral-400/70" />
                                            <div className="pointer-events-none absolute right-0 -top-3 z-0 h-8 w-px bg-neutral-400/70" />
                                            <div className="pointer-events-none absolute -right-3 top-0 z-0 h-px w-8 bg-neutral-400/70" />
                                            <div className="pointer-events-none absolute -bottom-3 left-0 z-0 h-8 w-px bg-neutral-400/70" />
                                            <div className="pointer-events-none absolute bottom-0 -left-3 z-0 h-px w-8 bg-neutral-400/70" />
                                            <div className="pointer-events-none absolute -bottom-3 right-0 z-0 h-8 w-px bg-neutral-400/70" />
                                            <div className="pointer-events-none absolute bottom-0 -right-3 z-0 h-px w-8 bg-neutral-400/70" />
                                        </>
                                    ) : null}
                                    <div className="relative z-10 h-full w-full overflow-hidden">
                                        {slot.photo ? (
                                            <img
                                                src={slot.photo.url}
                                                alt={slot.photo.name}
                                                className="h-full w-full"
                                                style={{
                                                    objectFit:
                                                        slot.photo.fitMode === 'fill'
                                                            ? 'cover'
                                                            : 'contain',
                                                    objectPosition: getPhotoObjectPosition(slot.photo),
                                                    transform: `rotate(${slot.photo.rotationDeg}deg)`,
                                                    transformOrigin: 'center center'
                                                }}
                                            />
                                        ) : (
                                            <div className="flex h-full items-center justify-center text-xs text-neutral-400">
                                                {t('preview.empty')}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                <div className="text-muted-foreground space-y-1 text-xs">
                    <p>{t('preview.tip')}</p>
                    {state.hasOverflow ? (
                        <p className="text-destructive">{t('preview.overflow')}</p>
                    ) : null}
                    {state.ppiWarnings.map((warning) => (
                        <p key={warning.photo.id} className="text-amber-700">
                            {t('preview.lowQualityRisk', {
                                name: warning.photo.name,
                                ppi: Math.round(warning.ppi)
                            })}
                        </p>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}

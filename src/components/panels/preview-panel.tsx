import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { usePrintJobActions, usePrintJobState } from '@/hooks/use-print-job-context'
import { getGridOriginMm, getPhotoObjectPosition } from '@/lib/print-layout'
import { FrameIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function PreviewPanel() {
    const { t } = useTranslation()
    const state = usePrintJobState()
    const actions = usePrintJobActions()

    const hasPhotos = state.photos.length > 0

    if (!hasPhotos) {
        return (
            <Card className="py-4 xl:h-full xl:flex xl:flex-col">
                <CardContent className="space-y-3 xl:flex-1 xl:flex xl:flex-col xl:items-center xl:justify-center">
                    <div className="flex flex-col items-center justify-center gap-4 py-12">
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                            <FrameIcon className="text-muted-foreground h-10 w-10" />
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-medium">{t('preview.title')}</p>
                            <p className="text-muted-foreground mt-1 max-w-[240px] text-xs">
                                {t('preview.emptyDescription')}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="py-4 xl:h-full xl:flex xl:flex-col xl:overflow-hidden">
            <CardContent className="space-y-3 xl:flex xl:flex-col xl:h-full xl:overflow-hidden xl:space-y-0 xl:gap-3">
                <div className="xl:shrink-0 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium">{t('preview.title')}</p>
                        <p className="text-muted-foreground text-xs">
                            {state.pages.length === 0
                                ? t('preview.emptyDescription')
                                : t('preview.pageOf', {
                                      current: state.pageIndex + 1,
                                      total: state.pages.length
                                  })}
                        </p>
                    </div>
                    <div className="text-muted-foreground text-right text-xs">
                        <p>
                            {state.photos.length}{' '}
                            {state.photos.length === 1
                                ? t('photos.photo') || 'photo'
                                : t('photos.photos') || 'photos'}
                        </p>
                        {state.pages.length > 0 && (
                            <p>
                                {state.slotsPerPage} slots/page
                            </p>
                        )}
                    </div>
                </div>

                <div className="xl:shrink-0 flex items-center justify-between">
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

                <div className="xl:flex-1 xl:min-h-0 xl:overflow-y-auto space-y-3">
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
                                const rowIndex = Math.floor(
                                    slot.slotIndex / state.selectedLayoutColumns
                                )
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
                                            slot.photo?.id === state.activePhotoId
                                                ? 'shadow-sm'
                                                : ''
                                        }`}
                                        onClick={() =>
                                            slot.photo && actions.setActivePhotoId(slot.photo.id)
                                        }
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => {
                                            if (
                                                (e.key === 'Enter' || e.key === ' ') &&
                                                slot.photo
                                            ) {
                                                actions.setActivePhotoId(slot.photo.id)
                                            }
                                        }}
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
                                                        objectPosition: getPhotoObjectPosition(
                                                            slot.photo
                                                        ),
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

                    {state.pages.length > 1 && (
                        <p className="text-muted-foreground text-center text-xs">
                            {state.photos.length} {t('photos.photos') || 'photos'} &middot;{' '}
                            {state.pages.length} {state.pages.length === 1 ? 'page' : 'pages'}
                        </p>
                    )}

                    <div className="text-muted-foreground space-y-1 text-xs">
                        <p>{t('preview.tip')}</p>
                        {state.hasOverflow ? (
                            <p className="text-destructive flex items-center gap-1">
                                <span aria-hidden="true">&#9888;</span>
                                <strong>{t('preview.overflowLabel') || 'Overflow'}:</strong>{' '}
                                {t('preview.overflow')}
                            </p>
                        ) : null}
                        {state.ppiWarnings.map((warning) => (
                            <p key={warning.photo.id} className="flex items-center gap-1 text-amber-700">
                                <span aria-hidden="true">&#9888;</span>
                                <strong>{t('preview.qualityLabel') || 'Quality'}:</strong>{' '}
                                {t('preview.lowQualityRisk', {
                                    name: warning.photo.name,
                                    ppi: Math.round(warning.ppi)
                                })}
                            </p>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

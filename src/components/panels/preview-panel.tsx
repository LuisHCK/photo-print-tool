import { Button } from '@/components/ui/button'
import type { Dispatch, SetStateAction } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getGridOriginMm, getPhotoObjectPosition } from '@/lib/print-layout'
import type { GridAlignment, PageAssignment, PhotoItem } from '@/types/print'
import { useTranslation } from 'react-i18next'

interface PreviewPanelProps {
    pages: PageAssignment[]
    pageIndex: number
    slotsPerPage: number
    currentPage: PageAssignment | null
    pageSize: { widthMm: number; heightMm: number }
    previewScale: number
    selectedLayoutColumns: number
    cellWidthMm: number
    cellHeightMm: number
    marginMm: number
    horizontalGapMm: number
    verticalGapMm: number
    gridWidthMm: number
    gridHeightMm: number
    gridAlignment: GridAlignment
    showCropGuides: boolean
    hasOverflow: boolean
    ppiWarnings: Array<{ photo: PhotoItem; ppi: number }>
    activePhotoId: string | null
    onPageIndexChange: Dispatch<SetStateAction<number>>
    onSetActivePhotoId: (photoId: string) => void
}

export function PreviewPanel({
    pages,
    pageIndex,
    slotsPerPage,
    currentPage,
    pageSize,
    previewScale,
    selectedLayoutColumns,
    cellWidthMm,
    cellHeightMm,
    marginMm,
    horizontalGapMm,
    verticalGapMm,
    gridWidthMm,
    gridHeightMm,
    gridAlignment,
    showCropGuides,
    hasOverflow,
    ppiWarnings,
    activePhotoId,
    onPageIndexChange,
    onSetActivePhotoId
}: PreviewPanelProps) {
    const { t } = useTranslation()

    return (
        <Card className="py-4">
            <CardHeader>
                <CardTitle>{t('preview.title')}</CardTitle>
                <CardDescription>
                    {pages.length === 0
                        ? t('preview.emptyDescription')
                        : t('preview.pageOf', { current: pageIndex + 1, total: pages.length })}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                    <div className="text-muted-foreground text-sm">
                        {t('preview.slotsPerPage', { count: slotsPerPage })}
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={pageIndex <= 0}
                            onClick={() =>
                                onPageIndexChange((previous) => Math.max(previous - 1, 0))
                            }
                        >
                            {t('preview.previous')}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={pageIndex >= pages.length - 1 || pages.length === 0}
                            onClick={() =>
                                onPageIndexChange((previous) =>
                                    Math.min(previous + 1, Math.max(pages.length - 1, 0))
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
                            width: `${pageSize.widthMm * previewScale}px`,
                            height: `${pageSize.heightMm * previewScale}px`
                        }}
                    >
                        {currentPage?.slots.map((slot) => {
                            const columnIndex = slot.slotIndex % selectedLayoutColumns
                            const rowIndex = Math.floor(slot.slotIndex / selectedLayoutColumns)
                            const origin = getGridOriginMm(
                                pageSize.widthMm,
                                pageSize.heightMm,
                                gridWidthMm,
                                gridHeightMm,
                                marginMm,
                                gridAlignment
                            )
                            const offsetX = origin.xMm + columnIndex * (cellWidthMm + horizontalGapMm)
                            const offsetY = origin.yMm + rowIndex * (cellHeightMm + verticalGapMm)

                            return (
                                <div
                                    key={`${currentPage.pageIndex}-${slot.slotIndex}`}
                                    className={`absolute overflow-visible ${
                                        slot.photo?.id === activePhotoId ? 'shadow-sm' : ''
                                    }`}
                                    onClick={() => slot.photo && onSetActivePhotoId(slot.photo.id)}
                                    style={{
                                        left: `${offsetX * previewScale}px`,
                                        top: `${offsetY * previewScale}px`,
                                        width: `${cellWidthMm * previewScale}px`,
                                        height: `${cellHeightMm * previewScale}px`
                                    }}
                                >
                                    {showCropGuides ? (
                                        <>
                                            <div className="pointer-events-none absolute left-0 top-[-12px] z-0 h-8 w-px bg-neutral-400/70" />
                                            <div className="pointer-events-none absolute left-[-12px] top-0 z-0 h-px w-8 bg-neutral-400/70" />
                                            <div className="pointer-events-none absolute right-0 top-[-12px] z-0 h-8 w-px bg-neutral-400/70" />
                                            <div className="pointer-events-none absolute right-[-12px] top-0 z-0 h-px w-8 bg-neutral-400/70" />
                                            <div className="pointer-events-none absolute bottom-[-12px] left-0 z-0 h-8 w-px bg-neutral-400/70" />
                                            <div className="pointer-events-none absolute bottom-0 left-[-12px] z-0 h-px w-8 bg-neutral-400/70" />
                                            <div className="pointer-events-none absolute bottom-[-12px] right-0 z-0 h-8 w-px bg-neutral-400/70" />
                                            <div className="pointer-events-none absolute bottom-0 right-[-12px] z-0 h-px w-8 bg-neutral-400/70" />
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
                    {hasOverflow ? (
                        <p className="text-destructive">{t('preview.overflow')}</p>
                    ) : null}
                    {ppiWarnings.map((warning) => (
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

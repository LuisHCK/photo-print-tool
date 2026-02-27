import { Button } from '@/components/ui/button'
import type { Dispatch, SetStateAction } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getPhotoObjectPosition } from '@/lib/print-layout'
import type { PageAssignment, PhotoItem } from '@/types/print'
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
    gapMm: number
    gridWidthMm: number
    gridHeightMm: number
    hasOverflow: boolean
    ppiWarnings: Array<{ photo: PhotoItem; ppi: number }>
    activePhotoId: string | null
    onPageIndexChange: Dispatch<SetStateAction<number>>
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
    gapMm,
    gridWidthMm,
    gridHeightMm,
    hasOverflow,
    ppiWarnings,
    activePhotoId,
    onPageIndexChange
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

                <div className="flex justify-center rounded-md border bg-muted/30 p-4">
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
                            const offsetX =
                                (pageSize.widthMm - gridWidthMm) / 2 +
                                columnIndex * (cellWidthMm + gapMm)
                            const offsetY =
                                (pageSize.heightMm - gridHeightMm) / 2 +
                                rowIndex * (cellHeightMm + gapMm)

                            return (
                                <div
                                    key={`${currentPage.pageIndex}-${slot.slotIndex}`}
                                    className={`absolute overflow-hidden border ${
                                        slot.photo?.id === activePhotoId
                                            ? 'preview-selection-highlight border-primary/60 ring-1 ring-primary/40'
                                            : 'border-neutral-300'
                                    }`}
                                    style={{
                                        left: `${offsetX * previewScale}px`,
                                        top: `${offsetY * previewScale}px`,
                                        width: `${cellWidthMm * previewScale}px`,
                                        height: `${cellHeightMm * previewScale}px`
                                    }}
                                >
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

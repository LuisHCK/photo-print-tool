import { Button } from '@/components/ui/button'
import type { Dispatch, SetStateAction } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { PageAssignment, PhotoItem } from '@/types/print'

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
    onPageIndexChange
}: PreviewPanelProps) {
    return (
        <Card className="py-4">
            <CardHeader>
                <CardTitle>Preview</CardTitle>
                <CardDescription>
                    {pages.length === 0
                        ? 'Add and select photos to generate preview pages.'
                        : `Page ${pageIndex + 1} of ${pages.length}`}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                    <div className="text-muted-foreground text-sm">
                        Slots per page: {slotsPerPage}
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
                            Previous
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
                            Next
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
                                    className="absolute overflow-hidden border border-neutral-300"
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
                                                transform: `rotate(${slot.photo.rotationDeg}deg)`,
                                                transformOrigin: 'center center'
                                            }}
                                        />
                                    ) : (
                                        <div className="flex h-full items-center justify-center text-xs text-neutral-400">
                                            Empty
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>

                <div className="text-muted-foreground space-y-1 text-xs">
                    <p>
                        Tip: in the browser print dialog, disable scale options like “Fit to page”
                        to keep exact physical dimensions.
                    </p>
                    {hasOverflow ? (
                        <p className="text-destructive">
                            Layout overflow: current size and spacing exceed printable area.
                        </p>
                    ) : null}
                    {ppiWarnings.map((warning) => (
                        <p key={warning.photo.id} className="text-amber-700">
                            Low quality risk: {warning.photo.name} ~{Math.round(warning.ppi)} PPI at
                            current print size.
                        </p>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}

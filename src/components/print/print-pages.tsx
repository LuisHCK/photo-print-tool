import { getGridOriginMm, getPhotoObjectPosition } from '@/lib/print-layout'
import type { GridAlignment, PageAssignment } from '@/types/print'

interface PrintPagesProps {
    pages: PageAssignment[]
    pageSize: { widthMm: number; heightMm: number }
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
}

export function PrintPages({
    pages,
    pageSize,
    selectedLayoutColumns,
    cellWidthMm,
    cellHeightMm,
    marginMm,
    horizontalGapMm,
    verticalGapMm,
    gridWidthMm,
    gridHeightMm,
    gridAlignment,
    showCropGuides
}: PrintPagesProps) {
    return (
        <section className="print-pages">
            {pages.map((page) => (
                <div
                    key={`print-page-${page.pageIndex}`}
                    className="print-page relative overflow-hidden"
                    style={{
                        width: `${pageSize.widthMm}mm`,
                        height: `${pageSize.heightMm}mm`,
                        margin: '0 auto',
                        backgroundColor: 'white'
                    }}
                >
                    {page.slots.map((slot) => {
                        if (!slot.photo) {
                            return null
                        }

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
                                key={`print-slot-${page.pageIndex}-${slot.slotIndex}`}
                                style={{
                                    position: 'absolute',
                                    left: `${offsetX}mm`,
                                    top: `${offsetY}mm`,
                                    width: `${cellWidthMm}mm`,
                                    height: `${cellHeightMm}mm`,
                                    overflow: 'visible'
                                }}
                            >
                                {showCropGuides ? (
                                    <>
                                        <div style={{ position: 'absolute', left: 0, top: '-3mm', width: '0.2mm', height: '4mm', backgroundColor: '#737373' }} />
                                        <div style={{ position: 'absolute', left: '-3mm', top: 0, width: '4mm', height: '0.2mm', backgroundColor: '#737373' }} />
                                        <div style={{ position: 'absolute', right: 0, top: '-3mm', width: '0.2mm', height: '4mm', backgroundColor: '#737373' }} />
                                        <div style={{ position: 'absolute', right: '-3mm', top: 0, width: '4mm', height: '0.2mm', backgroundColor: '#737373' }} />
                                        <div style={{ position: 'absolute', left: 0, bottom: '-3mm', width: '0.2mm', height: '4mm', backgroundColor: '#737373' }} />
                                        <div style={{ position: 'absolute', left: '-3mm', bottom: 0, width: '4mm', height: '0.2mm', backgroundColor: '#737373' }} />
                                        <div style={{ position: 'absolute', right: 0, bottom: '-3mm', width: '0.2mm', height: '4mm', backgroundColor: '#737373' }} />
                                        <div style={{ position: 'absolute', right: '-3mm', bottom: 0, width: '4mm', height: '0.2mm', backgroundColor: '#737373' }} />
                                    </>
                                ) : null}
                                <div
                                    style={{
                                        position: 'relative',
                                        zIndex: 1,
                                        width: '100%',
                                        height: '100%',
                                        overflow: 'hidden'
                                    }}
                                >
                                    <img
                                        src={slot.photo.url}
                                        alt={slot.photo.name}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit:
                                                slot.photo.fitMode === 'fill' ? 'cover' : 'contain',
                                            objectPosition: getPhotoObjectPosition(slot.photo),
                                            transform: `rotate(${slot.photo.rotationDeg}deg)`,
                                            transformOrigin: 'center center'
                                        }}
                                    />
                                </div>
                            </div>
                        )
                    })}
                </div>
            ))}
        </section>
    )
}

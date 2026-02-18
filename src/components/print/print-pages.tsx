import type { PageAssignment } from '@/types/print'

interface PrintPagesProps {
    pages: PageAssignment[]
    pageSize: { widthMm: number; heightMm: number }
    selectedLayoutColumns: number
    cellWidthMm: number
    cellHeightMm: number
    gapMm: number
    gridWidthMm: number
    gridHeightMm: number
}

export function PrintPages({
    pages,
    pageSize,
    selectedLayoutColumns,
    cellWidthMm,
    cellHeightMm,
    gapMm,
    gridWidthMm,
    gridHeightMm
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
                                key={`print-slot-${page.pageIndex}-${slot.slotIndex}`}
                                style={{
                                    position: 'absolute',
                                    left: `${offsetX}mm`,
                                    top: `${offsetY}mm`,
                                    width: `${cellWidthMm}mm`,
                                    height: `${cellHeightMm}mm`,
                                    overflow: 'hidden',
                                    border: '0.2mm solid #d4d4d4'
                                }}
                            >
                                {slot.photo ? (
                                    <img
                                        src={slot.photo.url}
                                        alt={slot.photo.name}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit:
                                                slot.photo.fitMode === 'fill' ? 'cover' : 'contain',
                                            transform: `rotate(${slot.photo.rotationDeg}deg)`,
                                            transformOrigin: 'center center'
                                        }}
                                    />
                                ) : null}
                            </div>
                        )
                    })}
                </div>
            ))}
        </section>
    )
}

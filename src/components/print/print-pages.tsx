import { getGridOriginMm, getPhotoObjectPosition } from '@/lib/print-layout'
import { usePrintJobState } from '@/hooks/use-print-job-context'

export function PrintPages() {
    const state = usePrintJobState()

    return (
        <section className="print-pages">
            {state.pages.map((page) => (
                <div
                    key={`print-page-${page.pageIndex}`}
                    className="print-page relative overflow-hidden"
                    style={{
                        width: `${state.pageSize.widthMm}mm`,
                        height: `${state.pageSize.heightMm}mm`,
                        margin: '0 auto',
                        backgroundColor: 'white'
                    }}
                >
                    {page.slots.map((slot) => {
                        if (!slot.photo) {
                            return null
                        }

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
                            origin.xMm + columnIndex * (state.cellWidthMm + state.horizontalGapMm)
                        const offsetY =
                            origin.yMm + rowIndex * (state.cellHeightMm + state.verticalGapMm)

                        return (
                            <div
                                key={`print-slot-${page.pageIndex}-${slot.slotIndex}`}
                                style={{
                                    position: 'absolute',
                                    left: `${offsetX}mm`,
                                    top: `${offsetY}mm`,
                                    width: `${state.cellWidthMm}mm`,
                                    height: `${state.cellHeightMm}mm`,
                                    overflow: 'visible'
                                }}
                            >
                                {state.showCropGuides ? (
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

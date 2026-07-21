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
                                <div
                                    style={{
                                        position: 'relative',
                                        zIndex: 0,
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
                                {state.showCropGuides ? (
                                    state.cutGuideStyle === 'crosses' ? (
                                        <>
                                            <div style={{ position: 'absolute', zIndex: 1, left: '-1mm', top: '-5mm', width: '0.2mm', height: '4mm', backgroundColor: '#737373' }} />
                                            <div style={{ position: 'absolute', zIndex: 1, top: '-1mm', left: '-5mm', height: '0.2mm', width: '4mm', backgroundColor: '#737373' }} />
                                            <div style={{ position: 'absolute', zIndex: 1, right: '-1mm', top: '-5mm', width: '0.2mm', height: '4mm', backgroundColor: '#737373' }} />
                                            <div style={{ position: 'absolute', zIndex: 1, top: '-1mm', right: '-5mm', height: '0.2mm', width: '4mm', backgroundColor: '#737373' }} />
                                            <div style={{ position: 'absolute', zIndex: 1, left: '-1mm', bottom: '-5mm', width: '0.2mm', height: '4mm', backgroundColor: '#737373' }} />
                                            <div style={{ position: 'absolute', zIndex: 1, bottom: '-1mm', left: '-5mm', height: '0.2mm', width: '4mm', backgroundColor: '#737373' }} />
                                            <div style={{ position: 'absolute', zIndex: 1, right: '-1mm', bottom: '-5mm', width: '0.2mm', height: '4mm', backgroundColor: '#737373' }} />
                                            <div style={{ position: 'absolute', zIndex: 1, bottom: '-1mm', right: '-5mm', height: '0.2mm', width: '4mm', backgroundColor: '#737373' }} />
                                        </>
                                    ) : (
                                        <div
                                            style={{
                                                position: 'absolute',
                                                zIndex: 1,
                                                top: '-1mm',
                                                right: '-1mm',
                                                bottom: '-1mm',
                                                left: '-1mm',
                                                border: '0.2mm solid #737373',
                                                borderStyle: state.cutGuideStyle === 'dotted' ? 'dotted' : 'dashed'
                                            }}
                                        />
                                    )
                                ) : null}
                            </div>
                        )
                    })}
                </div>
            ))}
        </section>
    )
}

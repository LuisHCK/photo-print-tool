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
                                            <div style={{ position: 'absolute', zIndex: 1, left: '-0.2mm', top: '-4mm', width: '0.2mm', height: '4mm', backgroundColor: '#737373' }} />
                                            <div style={{ position: 'absolute', zIndex: 1, top: '-0.2mm', left: '-4mm', height: '0.2mm', width: '4mm', backgroundColor: '#737373' }} />
                                            <div style={{ position: 'absolute', zIndex: 1, right: '-0.2mm', top: '-4mm', width: '0.2mm', height: '4mm', backgroundColor: '#737373' }} />
                                            <div style={{ position: 'absolute', zIndex: 1, top: '-0.2mm', right: '-4mm', height: '0.2mm', width: '4mm', backgroundColor: '#737373' }} />
                                            <div style={{ position: 'absolute', zIndex: 1, left: '-0.2mm', bottom: '-4mm', width: '0.2mm', height: '4mm', backgroundColor: '#737373' }} />
                                            <div style={{ position: 'absolute', zIndex: 1, bottom: '-0.2mm', left: '-4mm', height: '0.2mm', width: '4mm', backgroundColor: '#737373' }} />
                                            <div style={{ position: 'absolute', zIndex: 1, right: '-0.2mm', bottom: '-4mm', width: '0.2mm', height: '4mm', backgroundColor: '#737373' }} />
                                            <div style={{ position: 'absolute', zIndex: 1, bottom: '-0.2mm', right: '-4mm', height: '0.2mm', width: '4mm', backgroundColor: '#737373' }} />
                                        </>
                                    ) : (
                                        <div
                                            style={{
                                                position: 'absolute',
                                                zIndex: 1,
                                                inset: 0,
                                                outlineWidth: '0.2mm',
                                                outlineStyle: state.cutGuideStyle === 'dotted' ? 'dotted' : 'dashed',
                                                outlineColor: '#737373'
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

import type {
    GridAlignment,
    LayoutPreset,
    Orientation,
    PageAssignment,
    PaperPreset,
    PhotoItem
} from '@/types/print'

const PREVIEW_MAX_WIDTH = 680
const PREVIEW_MAX_HEIGHT = 820

export function getPageSizeMm(paper: PaperPreset, orientation: Orientation) {
    if (orientation === 'portrait') {
        return { widthMm: paper.widthMm, heightMm: paper.heightMm }
    }

    return { widthMm: paper.heightMm, heightMm: paper.widthMm }
}

export function getPreviewScale(widthMm: number, heightMm: number) {
    return Math.min(PREVIEW_MAX_WIDTH / widthMm, PREVIEW_MAX_HEIGHT / heightMm)
}

export function buildPageAssignments(
    layout: LayoutPreset,
    selectedPhotos: PhotoItem[],
    maxCopiesPerPage?: number
): PageAssignment[] {
    if (selectedPhotos.length === 0) {
        return []
    }

    const capacity = layout.columns * layout.rows
    const slotsPerPage =
        typeof maxCopiesPerPage === 'number'
            ? Math.min(Math.max(Math.floor(maxCopiesPerPage), 1), capacity)
            : capacity

    if (layout.repeatSinglePhoto && selectedPhotos.length === 1) {
        const firstPhoto = selectedPhotos[0]
        return [
            {
                pageIndex: 0,
                slots: Array.from({ length: slotsPerPage }, (_, index) => ({
                    slotIndex: index,
                    photo: firstPhoto
                }))
            }
        ]
    }

    const pages: PageAssignment[] = []
    const totalPages = Math.ceil(selectedPhotos.length / slotsPerPage)

    for (let pageIndex = 0; pageIndex < totalPages; pageIndex += 1) {
        const slots = Array.from({ length: slotsPerPage }, (_, slotIndex) => {
            const photoIndex = pageIndex * slotsPerPage + slotIndex
            return {
                slotIndex,
                photo: selectedPhotos[photoIndex] ?? null
            }
        })

        pages.push({ pageIndex, slots })
    }

    return pages
}

export function calcEffectivePpi(photo: PhotoItem, widthMm: number, heightMm: number) {
    const widthIn = widthMm / 25.4
    const heightIn = heightMm / 25.4
    const ppiW = photo.widthPx / widthIn
    const ppiH = photo.heightPx / heightIn
    return Math.min(ppiW, ppiH)
}

export function getGridOriginMm(
    pageWidthMm: number,
    pageHeightMm: number,
    gridWidthMm: number,
    gridHeightMm: number,
    marginMm: number,
    alignment: GridAlignment
) {
    const availableWidthMm = Math.max(pageWidthMm - marginMm * 2, 0)
    const availableHeightMm = Math.max(pageHeightMm - marginMm * 2, 0)
    const remainingWidthMm = Math.max(availableWidthMm - gridWidthMm, 0)
    const remainingHeightMm = Math.max(availableHeightMm - gridHeightMm, 0)

    const isLeft = alignment.endsWith('left')
    const isRight = alignment.endsWith('right')
    const isTop = alignment.startsWith('top-')
    const isBottom = alignment.startsWith('bottom-')

    const horizontalFactor = isLeft ? 0 : isRight ? 1 : 0.5
    const verticalFactor = isTop ? 0 : isBottom ? 1 : 0.5

    return {
        xMm: marginMm + remainingWidthMm * horizontalFactor,
        yMm: marginMm + remainingHeightMm * verticalFactor
    }
}

export function computeOptimalGrid(
    paperWidthMm: number,
    paperHeightMm: number,
    printWidthMm: number,
    printHeightMm: number,
    marginMm: number,
    horizontalGapMm: number,
    verticalGapMm: number,
    photoCount: number
) {
    const availableWidthMm = Math.max(paperWidthMm - marginMm * 2, 0)
    const availableHeightMm = Math.max(paperHeightMm - marginMm * 2, 0)

    function tryOrientation(pw: number, ph: number) {
        const cols = Math.max(1, Math.floor((availableWidthMm + horizontalGapMm) / (pw + horizontalGapMm)))
        const rows = Math.max(1, Math.floor((availableHeightMm + verticalGapMm) / (ph + verticalGapMm)))
        const perPage = cols * rows
        return { cols, rows, perPage, totalPages: Math.ceil(photoCount / perPage) }
    }

    const normal = tryOrientation(printWidthMm, printHeightMm)
    const rotated = tryOrientation(printHeightMm, printWidthMm)

    const best = rotated.perPage > normal.perPage ? rotated : normal

    const usedWidthMm = best.cols * printWidthMm + (best.cols - 1) * horizontalGapMm
    const usedHeightMm = best.rows * printHeightMm + (best.rows - 1) * verticalGapMm

    const optimalMarginMm = Math.min(
        marginMm,
        Math.max(0, (paperWidthMm - usedWidthMm) / 2),
        Math.max(0, (paperHeightMm - usedHeightMm) / 2)
    )

    return {
        cols: best.cols,
        rows: best.rows,
        photosPerPage: best.perPage,
        totalPages: best.totalPages,
        fitsAllOnOnePage: best.totalPages <= 1,
        usedWidthMm,
        usedHeightMm,
        optimalMarginMm
    }
}

export function getPhotoObjectPosition(photo: PhotoItem) {
    if (!photo.manualPositionEnabled) {
        return '50% 50%'
    }

    const xPct = 50 + photo.nudgeRightPct - photo.nudgeLeftPct
    const yPct = 50 + photo.nudgeDownPct - photo.nudgeUpPct

    return `${xPct}% ${yPct}%`
}

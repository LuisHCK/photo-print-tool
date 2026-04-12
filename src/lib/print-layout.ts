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

export function getPhotoObjectPosition(photo: PhotoItem) {
    if (!photo.manualPositionEnabled) {
        return '50% 50%'
    }

    const xPct = 50 + photo.nudgeRightPct - photo.nudgeLeftPct
    const yPct = 50 + photo.nudgeDownPct - photo.nudgeUpPct

    return `${xPct}% ${yPct}%`
}

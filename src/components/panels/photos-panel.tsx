import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Input } from '@/components/ui/input'

import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { usePrintJobActions, usePrintJobState } from '@/hooks/use-print-job-context'
import { ImageIcon, Loader2Icon, Trash2Icon } from 'lucide-react'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

export function PhotosPanel() {
    const { t } = useTranslation()
    const state = usePrintJobState()
    const actions = usePrintJobActions()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [pendingRemovePhotoId, setPendingRemovePhotoId] = useState<string | null>(null)

    const hasPhotos = state.photos.length > 0

    return (
        <Card className="py-4 xl:h-full xl:flex xl:flex-col xl:overflow-hidden">
            <CardContent className="space-y-3 xl:flex xl:flex-col xl:h-full xl:overflow-hidden">
                {!hasPhotos ? (
                    <div className="flex flex-col items-center justify-center gap-4 py-8">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                            <ImageIcon className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-medium">{t('photos.title')}</p>
                            <p className="text-muted-foreground mt-1 text-xs">
                                {t('photos.description')}
                            </p>
                        </div>
                        <label
                            htmlFor="photo-upload-empty"
                            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                        >
                            {t('photos.import')}
                        </label>
                        <Input
                            ref={fileInputRef}
                            id="photo-upload-empty"
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={actions.handleFileUpload}
                            className="hidden"
                        />
                        <p className="text-muted-foreground max-w-[200px] text-center text-xs">
                            {t('photos.dropHint') || 'Drop photos here or click to browse'}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="xl:shrink-0 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium">
                                    {state.photos.length}{' '}
                                    {state.photos.length === 1
                                        ? t('photos.photo')
                                        : t('photos.photos')}
                                </p>
                            </div>
                            <label
                                htmlFor="photo-upload-more"
                                className="inline-flex cursor-pointer items-center justify-center gap-1 rounded-md border bg-background px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent"
                            >
                                {t('photos.addMore') || 'Add more'}
                            </label>
                            <Input
                                id="photo-upload-more"
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={actions.handleFileUpload}
                                className="hidden"
                            />
                        </div>

                        <Separator className="xl:shrink-0" />

                        {state.isUploading ? (
                            <div className="xl:shrink-0 flex items-center justify-center gap-2 py-8">
                                <Loader2Icon className="h-4 w-4 animate-spin text-muted-foreground" />
                                <span className="text-muted-foreground text-sm">
                                    {t('photos.processing') || 'Processing photos...'}
                                </span>
                            </div>
                        ) : (
                            <ScrollArea className="h-[55vh] pr-2 xl:flex-1 xl:min-h-0">
                                <div className="space-y-2">
                                    {state.photos.map((photo) => (
                                        <div
                                            key={photo.id}
                                            className={`flex items-center gap-2 overflow-hidden rounded-md border p-2 transition-colors ${
                                                photo.id === state.activePhotoId
                                                    ? 'border-primary/50 bg-muted/40'
                                                    : 'border-border'
                                            }`}
                                        >
                                            <button
                                                type="button"
                                                className="h-14 w-14 shrink-0 overflow-hidden rounded border cursor-pointer"
                                                onClick={() =>
                                                    actions.setActivePhotoId(photo.id)
                                                }
                                                aria-label={photo.name}
                                            >
                                                <img
                                                    src={photo.url}
                                                    alt={photo.name}
                                                    className="h-full w-full object-cover"
                                                />
                                            </button>
                                            <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
                                                <div
                                                    className="w-36 truncate text-sm font-medium"
                                                    title={photo.name}
                                                >
                                                    {photo.name}
                                                </div>
                                                <label className="text-muted-foreground flex items-center gap-2 text-xs">
                                                    <input
                                                        type="checkbox"
                                                        checked={photo.selected}
                                                        onChange={(event) =>
                                                            actions.togglePhotoSelection(
                                                                photo.id,
                                                                event.target.checked
                                                            )
                                                        }
                                                    />
                                                    {t('photos.include')}
                                                </label>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon-xs"
                                                onClick={() => setPendingRemovePhotoId(photo.id)}
                                                aria-label={t('photos.remove')}
                                            >
                                                <Trash2Icon className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        )}
                    </>
                )}

                <ConfirmDialog
                    open={pendingRemovePhotoId !== null}
                    onOpenChange={(open) => {
                        if (!open) setPendingRemovePhotoId(null)
                    }}
                    onConfirm={() => {
                        if (pendingRemovePhotoId) {
                            actions.removePhoto(pendingRemovePhotoId)
                        }
                    }}
                    title={t('photos.confirmRemoveTitle') || 'Remove photo'}
                    description={
                        t('photos.confirmRemoveDescription') ||
                        'This action cannot be undone.'
                    }
                    confirmLabel={t('photos.remove')}
                    variant="destructive"
                />
            </CardContent>
        </Card>
    )
}

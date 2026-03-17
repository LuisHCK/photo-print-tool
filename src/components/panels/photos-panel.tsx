import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { usePrintJobActions, usePrintJobState } from '@/hooks/use-print-job-context'
import { useTranslation } from 'react-i18next'

export function PhotosPanel() {
    const { t } = useTranslation()
    const state = usePrintJobState()
    const actions = usePrintJobActions()

    return (
        <Card className="py-4">
            <CardHeader>
                <CardTitle>{t('photos.title')}</CardTitle>
                <CardDescription>{t('photos.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="space-y-2">
                    <Label htmlFor="photo-upload" className="cursor-pointer">
                        {t('photos.import')}
                    </Label>
                    <Input
                        id="photo-upload"
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={actions.handleFileUpload}
                        className="cursor-pointer"
                    />
                </div>

                <Separator />

                <ScrollArea className="h-[62vh] pr-2">
                    <div className="space-y-2">
                        {state.photos.length === 0 ? (
                            <div className="text-muted-foreground rounded-md border border-dashed p-4 text-sm">
                                {t('photos.noPhotos')}
                            </div>
                        ) : (
                            state.photos.map((photo) => (
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
                                        onClick={() => actions.setActivePhotoId(photo.id)}
                                    >
                                        <img
                                            src={photo.url}
                                            alt={photo.name}
                                            className="h-full w-full object-cover"
                                        />
                                    </button>
                                    <div className="flex items-start min-w-0 flex-1 flex-col gap-1">
                                        <div
                                            className="truncate w-40 text-sm font-medium"
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
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => actions.removePhoto(photo.id)}
                                        >
                                            {t('photos.remove')}
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    )
}

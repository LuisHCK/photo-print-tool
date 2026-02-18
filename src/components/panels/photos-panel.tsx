import { Button } from '@/components/ui/button'
import type { ChangeEvent } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import type { PhotoItem } from '@/types/print'

interface PhotosPanelProps {
    photos: PhotoItem[]
    activePhotoId: string | null
    onFileUpload: (event: ChangeEvent<HTMLInputElement>) => void
    onSetActivePhotoId: (photoId: string) => void
    onTogglePhotoSelection: (photoId: string, selected: boolean) => void
    onRemovePhoto: (photoId: string) => void
}

export function PhotosPanel({
    photos,
    activePhotoId,
    onFileUpload,
    onSetActivePhotoId,
    onTogglePhotoSelection,
    onRemovePhoto
}: PhotosPanelProps) {
    return (
        <Card className="py-4">
            <CardHeader>
                <CardTitle>Photos</CardTitle>
                <CardDescription>Select multiple photos for this print job.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="space-y-2">
                    <Label htmlFor="photo-upload">Import photos</Label>
                    <Input
                        id="photo-upload"
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={onFileUpload}
                    />
                </div>

                <Separator />

                <ScrollArea className="h-[62vh] pr-2">
                    <div className="space-y-2">
                        {photos.length === 0 ? (
                            <div className="text-muted-foreground rounded-md border border-dashed p-4 text-sm">
                                No photos selected yet.
                            </div>
                        ) : (
                            photos.map((photo) => (
                                <div
                                    key={photo.id}
                                    className={`flex gap-2 rounded-md border p-2 ${
                                        photo.id === activePhotoId ? 'ring-2 ring-primary/40' : ''
                                    }`}
                                >
                                    <button
                                        type="button"
                                        className="h-14 w-14 shrink-0 overflow-hidden rounded border"
                                        onClick={() => onSetActivePhotoId(photo.id)}
                                    >
                                        <img
                                            src={photo.url}
                                            alt={photo.name}
                                            className="h-full w-full object-cover"
                                        />
                                    </button>
                                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                                        <div className="truncate text-sm font-medium">
                                            {photo.name}
                                        </div>
                                        <label className="text-muted-foreground flex items-center gap-2 text-xs">
                                            <input
                                                type="checkbox"
                                                checked={photo.selected}
                                                onChange={(event) =>
                                                    onTogglePhotoSelection(
                                                        photo.id,
                                                        event.target.checked
                                                    )
                                                }
                                            />
                                            Include
                                        </label>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onRemovePhoto(photo.id)}
                                    >
                                        Remove
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    )
}

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'
import type { PrintSettingsProfile } from '@/types/print'

interface PrintSettingsProfilesSectionProps {
    profiles: PrintSettingsProfile[]
    onSaveProfile: (name: string) => { id: string; mode: 'created' | 'updated' } | null
    onLoadProfile: (profileId: string) => void
    onDeleteProfile: (profileId: string) => void
}

export function PrintSettingsProfilesSection({
    profiles,
    onSaveProfile,
    onLoadProfile,
    onDeleteProfile
}: PrintSettingsProfilesSectionProps) {
    const [expanded, setExpanded] = useState(false)
    const [profileName, setProfileName] = useState('')
    const [selectedProfileId, setSelectedProfileId] = useState('')
    const [error, setError] = useState('')
    const [notice, setNotice] = useState('')

    const selectedProfile = useMemo(
        () => profiles.find((profile) => profile.id === selectedProfileId) ?? null,
        [profiles, selectedProfileId]
    )

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <Label>Print setting profiles</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => setExpanded((v) => !v)}>
                    {expanded ? 'Hide' : 'Manage'}
                </Button>
            </div>

            {expanded ? (
                <div className="space-y-3 rounded-md border p-3">
                    <div className="space-y-2">
                        <Label className="text-xs">Save current setup</Label>
                        <div className="flex gap-2">
                            <Input
                                value={profileName}
                                onChange={(event) => setProfileName(event.target.value)}
                                placeholder="Profile name"
                            />
                            <Button
                                type="button"
                                size="sm"
                                onClick={() => {
                                    const result = onSaveProfile(profileName)
                                    if (!result) {
                                        setError('Enter a valid profile name.')
                                        setNotice('')
                                        return
                                    }

                                    setError('')
                                    setNotice(
                                        result.mode === 'created'
                                            ? 'Profile saved.'
                                            : 'Profile updated.'
                                    )
                                    setSelectedProfileId(result.id)
                                    setProfileName('')
                                }}
                            >
                                Save
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs">Saved profiles</Label>
                        <Select value={selectedProfileId} onValueChange={setSelectedProfileId}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select profile" />
                            </SelectTrigger>
                            <SelectContent>
                                {profiles.map((profile) => (
                                    <SelectItem key={profile.id} value={profile.id}>
                                        {profile.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex gap-2">
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={!selectedProfile}
                            onClick={() => {
                                if (!selectedProfile) {
                                    return
                                }

                                onLoadProfile(selectedProfile.id)
                                setError('')
                                setNotice('Profile loaded.')
                            }}
                        >
                            Load
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            disabled={!selectedProfile}
                            onClick={() => {
                                if (!selectedProfile) {
                                    return
                                }

                                onDeleteProfile(selectedProfile.id)
                                setSelectedProfileId('')
                                setError('')
                                setNotice('Profile deleted.')
                            }}
                        >
                            Delete
                        </Button>
                    </div>

                    {notice ? <p className="text-muted-foreground text-xs">{notice}</p> : null}
                    {error ? <p className="text-destructive text-xs">{error}</p> : null}
                </div>
            ) : null}
        </div>
    )
}

# 004 — macOS Auto-Update (Investigation)

**Status:** Investigation only — nothing implemented.
**Date:** 2026-11-02

Investigate how the macOS desktop app can update itself automatically, what is
required from the native app, the React frontend, and the release pipeline, and
whether GitHub can host the update assets.

**Conclusion:** use [Sparkle 2](https://sparkle-project.org/) and host the DMG +
`appcast.xml` on GitHub Releases. No backend is required. The main work is
native/CMake integration, release-pipeline changes, and versioning discipline.

---

## Recommended architecture

```
git tag v1.2.3  →  GitHub Actions
                     ├─ build universal .app + DMG (already works)
                     ├─ generate/sign appcast.xml with EdDSA key
                     └─ publish GitHub Release:
                          ├─ PhotoPrintTool-1.2.3.dmg
                          └─ appcast.xml

Installed app (Sparkle)
  GET https://github.com/LuisHCK/photo-print-tool/releases/latest/download/appcast.xml
   → compare CFBundleVersion
   → download DMG from the same release
   → verify EdDSA signature + length
   → verify/install app, remove quarantine, relaunch
```

There are no runtime API calls, no database, and no server. GitHub Releases is
the backend; the appcast is a static XML file.

---

## Why Sparkle

| Option | Assessment |
|---|---|
| **Sparkle 2** | De facto macOS updater. Standard UI, EdDSA signing, delta updates, channels, phased rollouts. Works from a non-Xcode CMake build. **Recommended.** |
| Custom GitHub updater | Requires implementing download, signature/checksum verification, DMG mounting, atomic replacement, permissions, quarantine handling, and relaunch. High risk, no standard UI. Not recommended. |
| Squirrel.Mac | Electron-oriented, JSON feed, less featureful for native apps. Not recommended. |
| Homebrew Cask | Good distribution alternative, but updates are `brew upgrade`-driven, not in-app. Not a replacement. |

Verified against **Sparkle 2.10.1** (released 2026-10-25):

- Requires macOS **12+**; the app targets **13.0**, so it fits.
- Framework is universal (`arm64 + x86_64`) and ~2.9 MB.
- `generate_appcast` supports `--ed-key-file -`, so CI can pipe the private key
  through stdin without writing it to disk.
- `generate_appcast` can infer minimum OS and architecture requirements from the
  app bundle.

---

## Backend / hosting

The repository is **public**, so GitHub Release assets can be downloaded without
authentication. GitHub documents no total size or bandwidth limit for release
assets, with a per-file limit (2 GiB on the free plan). The current DMG is
~3.1 MB; Sparkle adds ~3 MB.

### Appcast hosting options

| Option | URL | Notes |
|---|---|---|
| **Appcast as a release asset** | `https://github.com/LuisHCK/photo-print-tool/releases/latest/download/appcast.xml` | **Recommended.** No GitHub Pages setup or gh-pages branch. `releases/latest/download/...` follows the newest non-prerelease release. |
| GitHub Pages | `https://luishck.github.io/photo-print-tool/appcast.xml` | More control and suitable for beta feeds/release notes, but Pages is currently disabled and adds a deploy step. |
| Existing website | `https://photoprint.memoriasdevidafoto.com/appcast.xml` | Stable custom-domain URL; DMG still on GitHub. Requires deploying the appcast with the site. |

### Caveats

- **Prereleases are invisible to `releases/latest`.** Good for a stable channel;
  beta users need a separate feed or Sparkle channel.
- **Private repositories break this model** unless a token is shipped in the app
  (not acceptable). This repository is public.
- GitHub redirects release asset downloads to `objects.githubusercontent.com`;
  Sparkle follows redirects normally.
- GitHub controls caching headers. With a once-a-day check interval this is fine;
  move the appcast to the project website if stricter control is ever needed.
- **Stable website download link:** publish an unversioned asset (e.g.
  `PhotoPrintTool.dmg`) in addition to the versioned DMG so
  `releases/latest/download/PhotoPrintTool.dmg` always resolves.

---

## Native app requirements

### 1. Embed Sparkle

- Pin a Sparkle release (2.10.1 at time of writing) and download the prebuilt
  framework tarball.
- Link with `-framework Sparkle`, add `-F<framework dir>` and the rpath
  `@executable_path/../Frameworks`.
- Copy `Sparkle.framework` to `Photo Print Tool.app/Contents/Frameworks/`,
  preserving symlinks.
- CMake supports this through `find_library` and the existing
  `MACOSX_BUNDLE_INFO_PLIST` template.
- Sparkle ships an `Autoupdate` helper and an `Updater.app`; keep them inside the
  framework and sign them.

### 2. Info.plist keys

| Key | Purpose |
|---|---|
| `SUFeedURL` | Appcast URL. |
| `SUPublicEDKey` | EdDSA **public** key generated once. |
| `SUEnableAutomaticChecks` | Optional: enable background checks without prompting on second launch. |
| `SUScheduledCheckInterval` | Optional: check interval in seconds (default 86400). |
| `SUAutomaticallyUpdate` | Optional: silently download/install by default. |

`CFBundleVersion` already exists in `Info.plist.in` and is what Sparkle compares.

### 3. Start the updater

- Instantiate `SPUStandardUpdaterController(startingUpdater: YES, ...)` on the
  main thread in `desktop/src/main.mm`.
- Keep it alive for the app lifetime (static/global ObjC object).
- Add a **“Check for Updates…”** item to the app menu using its
  `checkForUpdates:` action.
- Sparkle provides the download/progress/relaunch UI, so no React changes are
  strictly required.

### 4. Signing

- The current `codesign --force --deep --sign -` is compatible with ad-hoc
  Sparkle updates.
- Sparkle’s policy explicitly allows ad-hoc signing as the minimum fallback when
  no Apple certificate is available; EdDSA is the actual update-authenticity
  gate.
- Sparkle removes `com.apple.quarantine` from downloaded updates
  (`SUFileManager`), so later launches should not re-trigger Gatekeeper.
- If Developer ID + hardened runtime is adopted later, sign **inside-out**
  (Sparkle XPC services → `Autoupdate`/`Updater.app` → framework → app) and avoid
  `--deep`. Enabling hardened runtime with only an ad-hoc signature can prevent
  Sparkle from loading.

---

## Frontend (React) requirements

**Required: none.** Sparkle’s standard updater UI is native, and the menu item
lives in the macOS menu bar.

Optional enhancements:

- “About / Updates” section in settings showing the current version.
- “Check for updates” button calling a bridge method.
- Update status events (checking, available, downloading, ready to restart).

That would need new bridge methods such as `app.getVersion()`,
`updater.checkForUpdates()`, and update-status events. Nice to have, not a
prerequisite. The browser/PWA version already auto-updates through the service
worker; this only affects the desktop app.

---

## Release pipeline requirements

The existing tag workflow is a good base. Auto-update adds:

1. **EdDSA keypair, once**
   - Run Sparkle’s `generate_keys` locally.
   - Commit the **public** key to `Info.plist`.
   - Store the private key as a GitHub Actions secret (e.g.
     `SPARKLE_ED_PRIVATE_KEY`).
   - Never commit the private key. Tag-only workflows can access secrets; keep
     tag creation restricted to maintainers.

2. **Generate the appcast in CI**

   ```bash
   echo "$SPARKLE_ED_PRIVATE_KEY" | generate_appcast \
     --ed-key-file - \
     --download-url-prefix "https://github.com/LuisHCK/photo-print-tool/releases/download/$TAG/" \
     --link "https://photoprint.memoriasdevidafoto.com/" \
     --maximum-deltas 0 \
     "$INBOX"
   ```

   - Stage the DMG in a flat temp directory (the tool does not recurse).
   - Upload `appcast.xml` alongside the DMG in the same release.
   - Validate the XML and signature before publishing.

3. **Version discipline**
   - Sparkle compares `CFBundleVersion`; it **must be monotonic**.
   - Current workflow issue: any tag triggers a release, and a non-numeric tag
     falls back to app version `1.0.0`. A stray tag could publish an equal/lower
     version and break update logic.
   - Enforce `vMAJOR.MINOR.PATCH` tags and fail otherwise; optionally verify the
     new version is greater than the latest release.

4. **Beta/prerelease handling**
   - Today every tag becomes a normal release. Once auto-update is live, a beta
     tag would be served to stable users.
   - Use GitHub prereleases plus a separate beta appcast, or Sparkle channels
     (`sparkle:channel` + `allowedChannelsForUpdater`). Stable-only is the
     simpler first release.

5. **Delta updates (later)**
   - `generate_appcast` can create binary deltas, but needs previous DMGs staged
     in the same flat directory.
   - The app is ~6 MB with Sparkle; full-DMG updates are fine initially. Use
     `--maximum-deltas 0` and revisit later.

---

## Security model

- **EdDSA signature** on the DMG is the trust anchor: the app embeds the public
  key and rejects any tampered or replaced DMG. GitHub account compromise alone
  is not enough to push a malicious update.
- Optional **signed feed** (`SURequireSignedFeed` +
  `SUVerifyUpdateBeforeExtraction`) also protects the appcast and release notes.
  Adds key-management complexity; phase 2+.
- Apple Developer ID signing/notarization is a separate layer. Not required by
  Sparkle, but recommended for distribution quality.

---

## Risks / items to validate

1. **Ad-hoc end-to-end update on macOS 26/27** — upstream supports it and
   Sparkle strips quarantine, but do a real two-version test before relying on
   it.
2. **App Management TCC prompt** — macOS 14+ may ask for approval the first time
   an app modifies another app in `/Applications`. Usually one-time; needs
   testing.
3. **Version monotonicity** — the current `1.0.0` fallback must be fixed before
   the first Sparkle-enabled release.
4. **First release is manual** — existing builds have no Sparkle; the first
   update-capable DMG must be installed normally.
5. **Read-only location** — updates can’t apply while running from the DMG.

---

## Phased plan

| Phase | Work | Effort |
|---|---|---|
| 0 | Generate EdDSA key; decide stable-only vs beta; decide appcast location | ~1 hour |
| 1 | Embed Sparkle, Info.plist keys, updater controller, menu item, CMake/signing changes | 0.5–1 day |
| 2 | CI: EdDSA appcast generation, release assets, version guard, XML/signature verification | 0.5 day |
| 3 | End-to-end test with two versions, including Gatekeeper/App Management behavior | 0.5 day |
| 4 (optional) | Developer ID + notarization, delta updates, beta channel, in-app update UI | 0.5–1 day + Apple account |

**Realistic total for working ad-hoc auto-updates: ~2 days.**

---

## Open decisions

1. Stable only first, or stable + beta channel from the start?
2. Stay ad-hoc for now, or start the Developer ID/notarization path?
3. Appcast on GitHub Releases (simplest) or the existing website (more control)?
4. Native “Check for Updates…” menu only, or also an in-app Updates section?
5. Delta updates later, or is a small full DMG fine?

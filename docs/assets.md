# Asset provenance

The current asset set uses project-local geometric artwork, captured game screens, a licensed font, and synthesized audio. The repository code license does not grant rights to third-party characters, trademarks, or removed media.

| Asset | Origin | License / status |
| --- | --- | --- |
| `scripts/actor-art.js` | Project-local kite player and hexagonal rival drawings; no imported image sheets | Repository MIT license |
| `images/maze-icon.svg` | Project-local P-shaped maze mark | Repository MIT license |
| `images/icon-192.png`, `images/icon-512.png` | Raster exports of `maze-icon.svg` using `node scripts/build-icons.js` | Same project artwork; actual dimensions match the manifest |
| `docs/assets/gameplay.png` | Browser capture of the current game | Project UI/artwork; includes the licensed Bungee font |
| `images/pacman-share.png` | Browser capture of the current game for social previews | Same as the gameplay capture |
| `fonts/Bungee-Regular.ttf` | [Google Fonts Bungee directory](https://github.com/google/fonts/tree/main/ofl/bungee), file `Bungee-Regular.ttf` | SIL Open Font License 1.1; original notice retained in `fonts/OFL.txt` |
| Title lettering | Bungee text rendered from the bundled font | SIL Open Font License; no imported logo image |
| Walls, pellets, fruit, transitions, and interface styling | Canvas/CSS definitions in the project source | Repository MIT license |
| Effects and music | Web Audio oscillator patterns in `scripts/game-config.js` and playback in `scripts/audio.js` | Repository code; no external recordings, samples, or music files |

## Retired media

The following files were removed from the current tree because their distribution rights could not be established. Their original Git history and contributor information are preserved.

| Removed file | Available origin evidence | Disposition |
| --- | --- | --- |
| `images/animations.gif` | Uploaded in `b5802b5`; no upstream source or asset-specific license recorded | Player drawing replaced with project-local geometry |
| `images/ghost.png` | Uploaded in `b5802b5`; no upstream source or asset-specific license recorded | Rival drawings replaced with project-local geometry |
| `images/pacman favicon.png` | Uploaded in `b5802b5`; no upstream source or asset-specific license recorded | Replaced by the maze mark; both derived PNG install icons replaced |
| `images/animation-footer.mov` | Added in `2f91476`; no source or media license recorded | Unused video removed |
| `images/animation` | One-byte newline placeholder from `b5802b5` | Empty placeholder removed |
| Previous screenshot/icon contents | Captures or derivatives containing the retired character artwork | Replaced with current captures and maze-mark exports |

PAC-MAN and the retained historical character names identify the arcade homage. No affiliation, endorsement, or trademark license is claimed. The MIT license and the font license do not settle those identity questions. No legal clearance of the project name is asserted.

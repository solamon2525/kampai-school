# Plant Parts Explorer v1.2.0

## Teaching contract

- Existing media URL: `/games/science/plant-parts-media.html`.
- Grade 4, core indicator: ว 1.2 ป.4/1. Root, stem, leaf and flower are core; fruit and seed are supplementary.
- No new game, scores, personal data, database schema, or worksheet changes.
- User selects a part, opens details, advances one step, and optionally listens. No speech on selection or page entry.
- Examples and teacher questions are collapsed initially to prioritize the large image and explanation.
- Seven lesson images plus a replacement cover. Generated botanical illustrations are not scale drawings or experimental evidence.
- English integration shows root, stem, leaf, flower, fruit and seed with Thai reading; English and Thai explanation speech are separate user-triggered actions.
- Activity cards use a large square visual frame with `object-fit: contain`; Thai and English labels are separate block lines at classroom-readable sizes.

## Content references

- https://www.scimath.org/ebook-science/item/13114-2023-09-22-08-17-27
- https://proj14.ipst.ac.th/m1/m1-sci-book1/sci-m1b1-016/ (teacher reference; not a claim that all details are required Grade 4 content)

## Asset prompt set

Built-in image generation, one image per call. All closeups use the generated overview as reference. Converted to the requested WebP dimensions with contain fitting, not cropping.

Shared direction: semi-realistic botanical painting of Thai round green eggplant, Solanum melongena. Cream background, natural textures, lobed green leaves, purple flowers with yellow anthers, pale green striped round fruits. No text, logos, arrows or diagram symbols in lesson images.

| Asset | Prompt subject and constraints |
| --- | --- |
| overview.webp | Complete plant centered, soil surface near lower third, exposed branching roots below. All teaching structures visible. 1280x720. |
| root.webp | Root system and lower stem in soil cutaway, fine lateral roots visible, no missing root tips. 1024x1024. |
| stem.webp | Isolated stem sample, two complete attached leaves, branch junctions, deliberately cut lower stem end. Regenerated because the first variant clipped leaves. 1024x1024. |
| leaf.webp | One complete softly lobed leaf, natural branching veins and short petiole, generous margins. 1024x1024. |
| flower.webp | Purple five-lobed eggplant flower, central yellow anthers and pistil, three-quarter front view. 1024x1024. |
| fruit.webp | Whole green striped fruit and longitudinal half; solid pale flesh with many small embedded seeds, not tomato-like watery chambers. 1024x1024. |
| seed.webp | Magnified mature light tan flat oval eggplant seeds, face and edge views, not beans or sunflower seeds. 1024x1024. |
| cover.png | Reference plant on right, large Thai title ส่วนของพืชดอก on left and subtitle สำรวจภาพ · วิทยาศาสตร์ ป.4. Full-bleed 1280x720. |

## Verification commands

```sh
node scripts/verify-plant-parts.mjs
node scripts/test-plant-parts.mjs
pnpm verify:media public/games/science/plant-parts-media.html
pnpm build
supabase db push --dry-run
```

Browser tests use HTTP (default port 8080; override MEDIA_TEST_BASE), speech mocks, and screenshots under `output/plant-parts/`. Viewports: 360x800, 768x1024, 1280x720, 3840x2160. Cover and contact sheet also inspected visually. Native Thai voice availability varies by device; mock tests verify state/lifecycle, not acoustic pronunciation.

Migration 503 changes metadata only. Do not apply remote while local and remote migration history differ.

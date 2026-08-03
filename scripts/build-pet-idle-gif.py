"""Build a transparent looping GIF from a 4x2 chroma-key pet sprite sheet."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


def make_transparent(frame: Image.Image) -> Image.Image:
    rgba = frame.convert("RGBA")
    key_red, key_green, key_blue, _ = rgba.getpixel((0, 0))
    pixels = rgba.load()
    for y in range(rgba.height):
        for x in range(rgba.width):
            red, green, blue, _ = pixels[x, y]
            key_distance = max(
                abs(key_red - red),
                abs(key_green - green),
                abs(key_blue - blue),
            )
            alpha = max(0, min(255, (key_distance - 8) * 8))
            pixels[x, y] = (red, green, blue, alpha)
    return rgba


def to_gif_frames(frames: list[Image.Image]) -> list[Image.Image]:
    flattened: list[Image.Image] = []
    for frame in frames:
        background = Image.new("RGB", frame.size, (0, 0, 0))
        background.paste(frame.convert("RGB"), mask=frame.getchannel("A"))
        flattened.append(background)

    atlas = Image.new("RGB", (frames[0].width * len(frames), frames[0].height))
    for index, frame in enumerate(flattened):
        atlas.paste(frame, (index * frame.width, 0))
    shared_palette = atlas.quantize(colors=255, method=Image.Quantize.MEDIANCUT)

    source_palette = shared_palette.getpalette()[: 255 * 3]
    shifted_palette = [255, 0, 255, *source_palette]
    shifted_palette.extend([0] * (768 - len(shifted_palette)))

    gif_frames: list[Image.Image] = []
    for rgba, rgb in zip(frames, flattened):
        indexed = rgb.quantize(palette=shared_palette, dither=Image.Dither.FLOYDSTEINBERG)
        source_indices = indexed.tobytes()
        alpha = rgba.getchannel("A").tobytes()
        target_indices = bytes(
            0 if alpha_value < 96 else min(255, palette_index + 1)
            for palette_index, alpha_value in zip(source_indices, alpha)
        )
        gif_frame = Image.frombytes("P", rgba.size, target_indices)
        gif_frame.putpalette(shifted_palette)
        gif_frame.info["transparency"] = 0
        gif_frames.append(gif_frame)
    return gif_frames


def build_gif(source: Path, output: Path, size: int, duration: int) -> None:
    sheet = Image.open(source).convert("RGB")
    cell_width = sheet.width // 4
    cell_height = sheet.height // 2
    frames: list[Image.Image] = []

    for row in range(2):
        for column in range(4):
            left = column * cell_width
            top = row * cell_height
            frame = sheet.crop((left, top, left + cell_width, top + cell_height))
            frame = make_transparent(frame)
            frame.thumbnail((size, size), Image.Resampling.LANCZOS)

            canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
            x = (size - frame.width) // 2
            y = (size - frame.height) // 2
            canvas.alpha_composite(frame, (x, y))
            frames.append(canvas)

    output.parent.mkdir(parents=True, exist_ok=True)
    gif_frames = to_gif_frames(frames)
    gif_frames[0].save(
        output,
        save_all=True,
        append_images=gif_frames[1:],
        duration=duration,
        loop=0,
        disposal=2,
        transparency=0,
        optimize=False,
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--size", type=int, default=320)
    parser.add_argument("--duration", type=int, default=140)
    args = parser.parse_args()
    build_gif(args.source, args.output, args.size, args.duration)


if __name__ == "__main__":
    main()

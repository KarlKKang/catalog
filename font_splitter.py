from pathlib import Path
import os
import sys
from fontTools.subset import main as pyftsubset


def split(unicode_blocks: dict, glyph: str, unicode_range: list, count: int) -> None:
    if len(unicode_range) != 2:
        raise ValueError("Unicode range must have 2 elements")

    start = int(unicode_range[0], 16)
    end = int(unicode_range[1], 16)

    current_count = 0
    while current_count != count:
        block_size = round((end - start + 1) / (count - current_count))
        if block_size < 1:
            raise Exception("Block size less than 1")
        current_count += 1
        unicode_blocks[glyph + " part" + str(current_count)] = "U+{0:0{1}X}-".format(
            start, 4
        ) + "{0:0{1}X}".format(start + block_size - 1, 4)
        start = start + block_size


def font_splitter(
    src_dir: str,
    file_name: str,
    file_extension: str,
    font_weight: int,
    font_family: str,
    split_blocks: dict,
    dest_dir: str,
    font_display: str = "swap",
) -> None:
    script_path = os.path.dirname(__file__)
    src_root_dir = os.path.join(script_path, "src", "font")

    options = ["--harfbuzz-repacker"]

    # split
    unicode_blocks = {}
    for glyph in split_blocks:
        glyph_config = split_blocks[glyph]
        if isinstance(glyph_config, str):
            unicode_blocks[glyph] = glyph_config
        else:
            split(unicode_blocks, glyph, glyph_config["range"], glyph_config["count"])

    output_sub_dir = dest_dir
    output_root_dir = os.path.join(src_root_dir, "dist", src_dir)
    output_dir = os.path.join(output_root_dir, output_sub_dir)
    Path(output_dir).mkdir(parents=True, exist_ok=True)

    with open(os.path.join(output_root_dir, file_name + ".css"), "w") as css:
        css.write('@charset "UTF-8";\n/* CSS Document */\n\n')
        for glyph in unicode_blocks:
            end_index = len(unicode_blocks[glyph])
            hyphen_index = unicode_blocks[glyph].find("-")
            comma_index = unicode_blocks[glyph].find(",")
            if hyphen_index != -1:
                end_index = hyphen_index
            if comma_index != -1 and comma_index < end_index:
                end_index = comma_index
            dest_file_name = unicode_blocks[glyph][2:end_index]
            output_file_woff2 = os.path.join(output_dir, dest_file_name + ".woff2")
            sys.argv = [
                None,
                os.path.join(src_root_dir, src_dir, file_name + "." + file_extension),
                f"--unicodes={unicode_blocks[glyph]}",
            ]
            sys.argv.extend(options)
            sys.argv.append("--flavor=woff2")
            sys.argv.append(f"--output-file={output_file_woff2}")
            pyftsubset()
            font_weight_declaration = (
                (f"font-weight: {str(font_weight)};\n")
                if font_weight is not None
                else ""
            )
            css.write(
                f"/*{glyph}*/\n"
                + "@font-face {\n"
                + f'font-family: "{font_family}";\n'
                + "src: "
                + f'url("{output_sub_dir}/{dest_file_name}.woff2") format("woff2");\n'
                + font_weight_declaration
                + f"font-display: {font_display};\n"
                + (
                    f"unicode-range: {unicode_blocks[glyph]};\n"
                    if unicode_blocks[glyph] != "U+0000-10FFFF"
                    else ""
                )
                + "}\n\n"
            )

from pathlib import Path
from typing import Dict
import os
import sys
from fontTools.subset import main as pyftsubset


def font_splitter(
    src_dir: str,
    file_name: str,
    file_extension: str,
    font_weight: int,
    font_family: str,
    split_blocks: Dict[str, int],
    dest_dir: str,
    font_display: str = "swap",
    custom_unicode_blocks: Dict[str, str] = None,
) -> None:
    script_path = os.path.dirname(__file__)
    src_root_dir = os.path.join(script_path, "src", "font")

    options = ["--harfbuzz-repacker"]

    unicode_blocks = {
        "Basic Latin": ["0000", "007F"],
        "Latin Extension": ["0080", "036F"],  # combined block
        "Language Extension 1": ["0370", "08FF"],  # combined block
        "Language Extension 2": ["0900", "1C7F"],  # combined block
        "Language Extension 3": ["1C80", "1FFF"],  # combined block
        "Symbol Extension": ["2000", "2BFF"],  # combined block
        "Language Extension 4": ["2C00", "2FFF"],  # combined block
        "CJK Essential": ["3000", "30FF"],  # combined block
        "CJK Extension 1": ["3100", "33FF"],  # combined block
        "CJK Unified Ideographs Extension A": ["3400", "4DBF"],
        "Yijing Hexagram Symbols": ["4DC0", "4DFF"],
        "CJK Unified Ideographs": ["4E00", "9FFF"],
        "Language Extension 5": ["A000", "F8FF"],  # combined block
        "CJK Compatibility Ideographs": ["F900", "FAFF"],
        "Language Extension 6": ["FB00", "FEFF"],  # combined block
        "Halfwidth and Fullwidth Forms": ["FF00", "FFEF"],
        "Language Extension 7": ["FFF0", "1FBFF"],  # combined block
        "CJK Unified Ideographs Extension B": ["20000", "2A6DF"],
        "Language Extension 8": ["2A700", "10FFFF"],  # combined block
    }

    def split(glyph, count):
        if count == 0:
            del unicode_blocks[glyph]
            return

        block = unicode_blocks[glyph]
        start = int(block[0], 16)
        end = int(block[1], 16)

        del unicode_blocks[glyph]

        current_count = 0
        while current_count != count:
            block_size = round((end - start + 1) / (count - current_count))
            if block_size < 1:
                raise Exception("Block size less than 1")
            current_count += 1
            unicode_blocks[glyph + " part" + str(current_count)] = [
                "{0:0{1}X}".format(start, 4),
                "{0:0{1}X}".format(start + block_size - 1, 4),
            ]
            start = start + block_size

    if custom_unicode_blocks is None:
        # split
        temp_keys = []
        for glyph in unicode_blocks:
            temp_keys.append(glyph)
        for glyph in temp_keys:
            if glyph in split_blocks:
                split(glyph, split_blocks[glyph])

        # format
        for glyph in unicode_blocks:
            unicode_blocks[glyph] = (
                "U+" + unicode_blocks[glyph][0] + "-" + unicode_blocks[glyph][1]
            )
    else:
        unicode_blocks = custom_unicode_blocks

    # prepare files
    output_sub_dir = dest_dir
    output_root_dir = os.path.join(src_root_dir, "dist", src_dir)
    output_dir = os.path.join(output_root_dir, output_sub_dir)
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    css = open(os.path.join(output_root_dir, file_name + ".css"), "w")
    css.write('@charset "UTF-8";\n/* CSS Document */\n\n')

    # compress
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
        output_file_woff = os.path.join(output_dir, dest_file_name + ".woff")
        sys.argv = [
            None,
            os.path.join(src_root_dir, src_dir, file_name + "." + file_extension),
            f"--unicodes={unicode_blocks[glyph]}",
        ]
        sys.argv.extend(options)
        sys.argv.append("--flavor=woff2")
        sys.argv.append(f"--output-file={output_file_woff2}")
        pyftsubset()
        sys.argv[len(sys.argv) - 2] = "--flavor=woff"
        sys.argv[len(sys.argv) - 1] = f"--output-file={output_file_woff}"
        pyftsubset()
        font_weight_declaration = (
            (f"font-weight: {str(font_weight)};\n") if font_weight is not None else ""
        )
        css.write(
            f"/*{glyph}*/\n"
            + "@font-face {\n"
            + f'font-family: "{font_family}";\n'
            + "src: "
            + f'url("{output_sub_dir}/{dest_file_name}.woff2") format("woff2"),\n'
            + f'url("{output_sub_dir}/{dest_file_name}.woff") format("woff");\n'
            + font_weight_declaration
            + f"font-display: {font_display};\n"
            + f"unicode-range: {unicode_blocks[glyph]};\n"
            + "}\n\n"
        )
    css.close()

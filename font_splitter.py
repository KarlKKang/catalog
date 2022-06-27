from pathlib import Path
from typing import Dict, List
import os
import sys
from fontTools.subset import main as pyftsubset

#font_names = ['NotoSansJP-Light','NotoSansJP-Regular','NotoSansJP-Medium']
#font_extension = 'otf'

#font_family = 'Noto Sans JP'
#font_weights = ['300', '400', '500']
#

#dir_surfix = '_v2'

#is_cjk = True



#split_blocks = {
#    'CJK Unified Ideographs': 50, #SC - 70, TC & JP - 50
#    'CJK Unified Ideographs Extension B': 2, #TC - 10, JP - 2
#    #'CJK Unified Ideographs Extension A': 30, #SC - 30, TC - 2
#}

def font_splitter (font_name: str, src_dir: str, file_name: str, file_extension: str, font_weight: int, font_family: str, is_cjk: bool, split_blocks: Dict[str, int], dir_surfix: str, font_display: str = 'swap', custom_unicode_blocks: Dict[str, str] = None) -> None:

    script_path = os.path.dirname(__file__)
    src_root_dir = os.path.join(script_path, 'src', 'font')

    options = [
        "--layout-features='*'",
        "--glyph-names",
        "--symbol-cmap",
        "--legacy-cmap",
        "--notdef-glyph",
        "--notdef-outline",
        "--recommended-glyphs",
        "--name-IDs='*'",
        "--name-legacy",
        "--name-languages='*'",
        "--harfbuzz-repacker",
        "--recalc-bounds",
        "--recalc-average-width",
        "--recalc-max-context",
        "--canonical-order",
    ]

    unicode_blocks = {
        'Basic Latin': ['0000','007F'],
        'Latin-1 Supplement': ['0080', '00FF'],
        'Latin Extended-A': ['0100', '017F'],
        'Latin Extended-B': ['0180', '024F'],
        'IPA Extensions': ['0250', '02AF'], 
        'Spacing Modifier Letters': ['02B0', '02FF'],
        'Combining Diacritical Marks': ['0300', '036F'],
        'Greek and Coptic': ['0370', '03FF'],
        'Greek Extended': ['1F00', '1FFF'],
        'General Punctuation': ['2000', '206F'],
        'Letterlike Symbols': ['2100', '214F'],
        'Number Forms': ['2150', '218F'],
        'Arrows': ['2190', '21FF'],
        'Mathematical Operators': ['2200', '22FF'],
        'Enclosed Alphanumerics': ['2460', '24FF'],
        'Geometric Shapes': ['25A0', '25FF'],
        'Miscellaneous Symbols': ['2600', '26FF'],
        'Dingbats': ['2700', '27BF']
    }

    unicode_blocks_cjk = {
        'CJK Radicals Supplement': ['2E80', '2EFF'],
        'Kangxi Radicals': ['2F00', '2FDF'],
        'Ideographic Description Characters': ['2FF0', '2FFF'],
        'CJK Symbols and Punctuation': ['3000', '303F'],
        'Hiragana and Katakana': ['3040', '30FF'], #combined block
        'Bopomofo': ['3100', '312F'],
        'Kanbun': ['3190', '319F'],
        'Bopomofo Extended': ['31A0', '31BF'],
        'CJK Strokes': ['31C0', '31EF'],
        'Katakana Phonetic Extensions': ['31F0', '31FF'],
        'Enclosed CJK Letters and Months': ['3200', '32FF'],
        'CJK Compatibility': ['3300', '33FF'],
        'CJK Unified Ideographs Extension A': ['3400', '4DBF'],
        'CJK Unified Ideographs': ['4E00', '9FFF'],
        'CJK Compatibility Ideographs': ['F900', 'FAFF'],
        'Vertical Forms': ['FE10', 'FE1F'],
        'CJK Compatibility Forms': ['FE30', 'FE4F'],
        'Small Form Variants': ['FE50', 'FE6F'],
        'Halfwidth and Fullwidth Forms': ['FF00', 'FFEF'],
        'CJK Unified Ideographs Extension B': ['20000', '2A6DF'],
        'CJK Unified Ideographs Extension C': ['2A700', '2B73F'],
        'CJK Unified Ideographs Extension D': ['2B740', '2B81F'],
        'CJK Unified Ideographs Extension E': ['2B820', '2CEAF'],
        'CJK Unified Ideographs Extension F': ['2CEB0', '2EBEF'],
        'CJK Compatibility Ideographs Supplement': ['2F800', '2FA1F'],
        'CJK Unified Ideographs Extension G': ['30000', '3134F']
    }

    def split (glyph, count):
        block = unicode_blocks[glyph]
        start = int(block[0], 16)
        end = int(block[1], 16)

        del unicode_blocks[glyph]

        current_count = 0
        while current_count != count:
            block_size = round((end - start + 1) / (count - current_count))
            if block_size < 1:
                raise Exception('Block size less than 1')
            current_count += 1
            unicode_blocks[glyph + ' part' + str(current_count)] = ['{0:0{1}X}'.format(start, 4), '{0:0{1}X}'.format(start + block_size - 1, 4)]
            start = start + block_size

    if custom_unicode_blocks is None:
        if is_cjk:
            unicode_blocks.update(unicode_blocks_cjk)
            
        #split
        temp_keys = []
        for glyph in unicode_blocks:
            temp_keys.append(glyph)
        for glyph in temp_keys:
            if glyph in split_blocks:
                split (glyph, split_blocks[glyph])

        #format
        for glyph in unicode_blocks:
            unicode_blocks[glyph] = 'U+' + unicode_blocks[glyph][0] + '-' + unicode_blocks[glyph][1]
    else:
        unicode_blocks = custom_unicode_blocks
        

    #prepare files
    output_sub_dir = file_name + dir_surfix
    output_root_dir = os.path.join(src_root_dir, 'dist', src_dir)
    output_dir = os.path.join(output_root_dir, output_sub_dir)
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    css = open(os.path.join(src_root_dir, src_dir, file_name+".css"), "w")
    css.write('@charset "UTF-8";\n/* CSS Document */\n\n')

    #compress
    for glyph in unicode_blocks:
        end_index = len(unicode_blocks[glyph])
        hyphen_index = unicode_blocks[glyph].find('-')
        comma_index = unicode_blocks[glyph].find(',')
        if (hyphen_index != -1):
            end_index = hyphen_index
        if (comma_index != -1 and comma_index < end_index):
            end_index = comma_index
        dest_file_name = unicode_blocks[glyph][2:end_index]
        output_file_woff2 = os.path.join(output_dir, dest_file_name+".woff2")
        output_file_woff = os.path.join(output_dir, dest_file_name+".woff")
        sys.argv = [
            None, 
            os.path.join(src_root_dir, src_dir, file_name+'.'+file_extension), 
            f'--unicodes={unicode_blocks[glyph]}',
        ]
        sys.argv.extend(options)
        sys.argv.append('--flavor=woff2')
        sys.argv.append(f'--output-file={output_file_woff2}')
        pyftsubset()
        sys.argv[len(sys.argv)-2] = '--flavor=woff'
        sys.argv[len(sys.argv)-1] = f'--output-file={output_file_woff}'
        pyftsubset()
        css.write('/*' + glyph + '*/\n@font-face {\nfont-family: "' + font_family + '";\nsrc: local("' + font_name + '"), \nurl("' + output_sub_dir + '/' + dest_file_name + '.woff2") format("woff2"),\nurl("' + output_sub_dir +
                  '/' + dest_file_name + '.woff") format("woff");\n' + (('font-weight: ' + str(font_weight) + ';\n') if font_weight is not None else '') + 'font-display: ' + font_display + ';\nunicode-range: ' + unicode_blocks[glyph] + ';\n}\n\n')
    css.close()

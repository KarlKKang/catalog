import subprocess
import os

font_names = ['NotoSansJP-Light','NotoSansJP-Regular','NotoSansJP-Medium']
font_extension = 'otf'

font_family = 'Noto Sans JP'
font_weights = ['300', '400', '500']
font_display = 'swap'

is_cjk = True

unicode_blocks = {
    'Basic Latin': ['0000','007F'],
    'Latin-1 Supplement': ['0080', '00FF'],
    'Latin Extended-A': ['0100', '017F'],
    'Latin Extended-B': ['0180', '024F'],
    'IPA Extensions': ['0250', '02AF'],
    'Spacing Modifier Letters': ['02B0', '02FF'],
    'Combining Diacritical Marks': ['0300', '036F'],
    'Greek and Coptic': ['0370', '03FF'],
    'Phonetic Extensions': ['1D00', '1D7F'],
    'Phonetic Extensions Supplement': ['1D80', '1DBF'],
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
    'Hiragana': ['3040', '309F'],
    'Katakana': ['30A0', '30FF'],
    'Bopomofo': ['3100', '312F'],
    'Kanbun': ['3190', '319F'],
    'Bopomofo Extended': ['31A0', '31BF'],
    'CJK Strokes': ['31C0', '31EF'],
    'Katakana Phonetic Extensions': ['31F0', '31FF'],
    'Enclosed CJK Letters and Months': ['3200', '32FF'],
    'CJK Compatibility': ['3300', '33FF'],
    'CJK Unified Ideographs Extension A': ['3400', '4DBF'],
    'CJK Unified Ideographs A': ['4E00', '55CF'],
    'CJK Unified Ideographs B': ['55D0', '5D9F'],
    'CJK Unified Ideographs C': ['5DA0', '656F'],
    'CJK Unified Ideographs D': ['6570', '6D3F'],
    'CJK Unified Ideographs E': ['6D40', '750F'],
    'CJK Unified Ideographs F': ['7510', '7CDF'],
    'CJK Unified Ideographs G': ['7CE0', '84AF'],
    'CJK Unified Ideographs H': ['84B0', '8C7F'],
    'CJK Unified Ideographs I': ['8C80', '944F'],
    'CJK Unified Ideographs J': ['9450', '9C1F'],
    'CJK Unified Ideographs K': ['9C20', '9FFF'],
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

options='--recommended-glyphs --name-IDs="*" --name-legacy'

for i in range(len(font_names)):
    font_name = font_names[i]
    if not os.path.exists(font_name):
        os.makedirs(font_name)
    css = open(font_name + ".css", "w")
    css.write('@charset "UTF-8";\n/* CSS Document */\n\n')
    if is_cjk:
        unicode_blocks.update(unicode_blocks_cjk)
    for glyph in unicode_blocks:
        subprocess.run('pyftsubset "'+font_name+'.'+font_extension+'" --unicodes="U+'+unicode_blocks[glyph][0]+'-'+unicode_blocks[glyph][1]+'" ' + options + ' --flavor="woff2" --output-file="'+font_name+'/'+font_name+'_'+unicode_blocks[glyph][0]+'.woff2"', shell=True, check=True)
        subprocess.run('pyftsubset "'+font_name+'.'+font_extension+'" --unicodes="U+'+unicode_blocks[glyph][0]+'-'+unicode_blocks[glyph][1]+'" ' + options + ' --flavor="woff" --output-file="'+font_name+'/'+font_name+'_'+unicode_blocks[glyph][0]+'.woff"', shell=True, check=True)
        css.write('/*'+glyph+'*/\n@font-face {\nfont-family: "'+font_family+'";\nsrc: url("'+font_name+'/'+font_name+'_'+unicode_blocks[glyph][0]+'.woff2") format("woff2"),\nurl("'+font_name+'/'+font_name+'_'+unicode_blocks[glyph][0]+'.woff") format("woff");\nfont-weight: '+font_weights[i]+';\nfont-display: '+font_display+';\nunicode-range: U+'+unicode_blocks[glyph][0]+'-'+unicode_blocks[glyph][1]+';\n}\n\n')
    css.close()


    
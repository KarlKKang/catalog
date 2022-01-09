import subprocess
import os

font_names = ['NotoSansJP-Light','NotoSansJP-Regular','NotoSansJP-Medium']
font_extension = 'otf'

font_family = 'Noto Sans JP'
font_weights = ['300', '400', '500']
font_display = 'swap'

dir_surfix = '_v2'

is_cjk = True

split_blocks = {
    'CJK Unified Ideographs': 50, #SC - 70, TC & JP - 50
    'CJK Unified Ideographs Extension B': 2, #TC - 10, JP - 2
    #'CJK Unified Ideographs Extension A': 30, #SC - 30, TC - 2
}

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

options='--recommended-glyphs --name-IDs="*" --name-legacy'

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

if is_cjk:
    unicode_blocks.update(unicode_blocks_cjk)
    
#split
temp_keys = []
for glyph in unicode_blocks:
    temp_keys.append(glyph)
for glyph in temp_keys:
    if glyph in split_blocks:
        split (glyph, split_blocks[glyph])

for i in range(len(font_names)):
    font_name = font_names[i]
    dir_name = font_name + dir_surfix
    if not os.path.exists(dir_name):
        os.makedirs(dir_name)
    css = open(font_name + ".css", "w")
    css.write('@charset "UTF-8";\n/* CSS Document */\n\n')

    #compress
    for glyph in unicode_blocks:
        command = 'pyftsubset "'+font_name+'.'+font_extension+'" --unicodes="U+'+unicode_blocks[glyph][0]+'-'+unicode_blocks[glyph][1]+'" ' + options
        file_name = font_name+'_'+unicode_blocks[glyph][0]
        subprocess.run(command + ' --flavor="woff2" --output-file="'+dir_name+'/'+file_name+'.woff2"', shell=True, check=True)
        subprocess.run(command + ' --flavor="woff" --output-file="'+dir_name+'/'+file_name+'.woff"', shell=True, check=True)
        css.write('/*'+glyph+'*/\n@font-face {\nfont-family: "'+font_family+'";\nsrc: url("'+dir_name+'/'+file_name+'.woff2") format("woff2"),\nurl("'+dir_name+'/'+file_name+'.woff") format("woff");\nfont-weight: '+font_weights[i]+';\nfont-display: '+font_display+';\nunicode-range: U+'+unicode_blocks[glyph][0]+'-'+unicode_blocks[glyph][1]+';\n}\n\n')
    css.close()



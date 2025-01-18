from font_splitter import font_splitter

dir_surfix = "7.1"

font_families = [
    {
        "font_family": "Courier New",
        "split_blocks": {
            "All": "U+0000-10FFFF",
        },
        "dir": "CourierNew",
        "fonts": [
            {
                "file_name": "CourierNew-Regular",
                "file_extension": "ttf",
                "font_weight": None,
                "dest_dir": "R",
            },
        ],
    },
    {
        "font_family": "Noto Sans JP",
        "split_blocks": {
            "Latin and CJK Essential": "U+0000-33FF, U+F900-FAFF",
            "CJK Unified Ideographs": {
                "range": ["4E00", "9FFF"],
                "count": 7,
            },
            "Extension": "U+3400-4DFF, U+A000-F8FF, U+FB00-1FBFF, U+20000-10FFFF",
        },
        "dir": "NotoSansJP",
        "fonts": [
            {
                "file_name": "NotoSansJP-Light",
                "file_extension": "otf",
                "font_weight": 300,
                "dest_dir": "L",
            },
            {
                "file_name": "NotoSansJP-Regular",
                "file_extension": "otf",
                "font_weight": 400,
                "dest_dir": "R",
            },
            {
                "file_name": "NotoSansJP-Medium",
                "file_extension": "otf",
                "font_weight": 500,
                "dest_dir": "M",
            },
        ],
    },
    {
        "font_family": "Noto Sans TC",
        "split_blocks": {
            "Latin and CJK Essential": "U+0000-33FF, U+F900-FAFF",
            "CJK Unified Ideographs": {
                "range": ["4E00", "9FFF"],
                "count": 9,
            },
            "CJK Unified Ideographs Extension B": "U+20000-2A6DF",
            "Extension": "U+3400-4DFF, U+A000-F8FF, U+FB00-1FBFF, U+2A700-10FFFF",
        },
        "dir": "NotoSansTC",
        "fonts": [
            {
                "file_name": "NotoSansTC-Light",
                "file_extension": "otf",
                "font_weight": 300,
                "dest_dir": "L",
            },
            {
                "file_name": "NotoSansTC-Regular",
                "file_extension": "otf",
                "font_weight": 400,
                "dest_dir": "R",
            },
            {
                "file_name": "NotoSansTC-Medium",
                "file_extension": "otf",
                "font_weight": 500,
                "dest_dir": "M",
            },
        ],
    },
    {
        "font_family": "Noto Sans SC",
        "split_blocks": {
            "Latin and CJK Essential": "U+0000-33FF, U+F900-FAFF",
            "CJK Unified Ideographs Extension A": {
                "range": ["3400", "4DBF"],
                "count": 4,
            },
            "CJK Unified Ideographs": {
                "range": ["4E00", "9FFF"],
                "count": 13,
            },
            "Extension": "U+4DC0-4DFF, U+A000-F8FF, U+FB00-1FBFF, U+20000-10FFFF",
        },
        "dir": "NotoSansSC",
        "fonts": [
            {
                "file_name": "NotoSansSC-Light",
                "file_extension": "otf",
                "font_weight": 300,
                "dest_dir": "L",
            },
            {
                "file_name": "NotoSansSC-Regular",
                "file_extension": "otf",
                "font_weight": 400,
                "dest_dir": "R",
            },
            {
                "file_name": "NotoSansSC-Medium",
                "file_extension": "otf",
                "font_weight": 500,
                "dest_dir": "M",
            },
        ],
    },
    {
        "font_family": "Noto Sans",
        "split_blocks": {
            "All": "U+0000-10FFFF",
        },
        "dir": "NotoSans",
        "fonts": [
            {
                "file_name": "NotoSans-Light",
                "file_extension": "ttf",
                "font_weight": 300,
                "dest_dir": "L",
            },
            {
                "file_name": "NotoSans-Regular",
                "file_extension": "ttf",
                "font_weight": 400,
                "dest_dir": "R",
            },
            {
                "file_name": "NotoSans-Medium",
                "file_extension": "ttf",
                "font_weight": 500,
                "dest_dir": "M",
            },
        ],
    },
    {
        "font_family": "SegMDL2",
        "split_blocks": {
            "All": "U+0000-10FFFF",
        },
        "dir": "Segoe",
        "fonts": [
            {
                "file_name": "SegMDL2",
                "file_extension": "ttf",
                "font_weight": None,
                "dest_dir": "R",
                "display": "block",
            },
        ],
    },
]

for font_family in font_families:
    for font in font_family["fonts"]:
        font_splitter(
            font_family["dir"],
            font["file_name"],
            font["file_extension"],
            font["font_weight"],
            font_family["font_family"],
            font_family["split_blocks"],
            font["dest_dir"] + dir_surfix,
            font["display"] if "display" in font else "swap",
        )

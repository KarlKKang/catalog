from font_splitter import font_splitter

dir_surfix = "5"

font_families = [
    {
        "font_family": "Courier New",
        "split_blocks": {
            "Latin Extension": 3,
            "Language Extension 1": 6,
            "Language Extension 3": 2,
            "CJK Essential": 0,
            "CJK Extension 1": 0,
            "CJK Unified Ideographs Extension A": 0,
            "Yijing Hexagram Symbols": 0,
            "CJK Unified Ideographs": 0,
            "CJK Compatibility Ideographs": 0,
            "Halfwidth and Fullwidth Forms": 0,
            "CJK Unified Ideographs Extension B": 0,
            "Language Extension 8": 0,
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
            "Language Extension 2": 0,
            "CJK Extension 1": 3,
            "Yijing Hexagram Symbols": 0,
            "CJK Unified Ideographs": 80,
            "Language Extension 5": 0,
            "CJK Compatibility Ideographs": 3,
            "CJK Unified Ideographs Extension B": 2,
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
            "Language Extension 2": 0,
            "CJK Extension 1": 3,
            "CJK Unified Ideographs Extension A": 3,
            "Yijing Hexagram Symbols": 0,
            "CJK Unified Ideographs": 110,
            "Language Extension 5": 0,
            "CJK Unified Ideographs Extension B": 15,
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
            "Language Extension 2": 0,
            "CJK Extension 1": 3,
            "CJK Unified Ideographs Extension A": 40,
            "Yijing Hexagram Symbols": 0,
            "CJK Unified Ideographs": 145,
            "Language Extension 5": 0,
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
            "CJK Essential": 0,
            "CJK Extension 1": 0,
            "CJK Unified Ideographs Extension A": 0,
            "Yijing Hexagram Symbols": 0,
            "CJK Unified Ideographs": 0,
            "CJK Compatibility Ideographs": 0,
            "Halfwidth and Fullwidth Forms": 0,
            "CJK Unified Ideographs Extension B": 0,
            "Language Extension 8": 0,
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
        )

font_splitter(
    "Segoe",
    "SegMDL2",
    "ttf",
    None,
    "SegMDL2",
    {},
    dir_surfix,
    "block",
    {"custom": "U+E70D,U+E971,U+E972"},
)

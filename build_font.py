from font_splitter import font_splitter

dir_surfix = "_v4"

font_families = [
    {
        "font_family": "Noto Sans JP",
        "is_cjk": True,
        "split_blocks": {
            "CJK Unified Ideographs": 50,
            "CJK Unified Ideographs Extension B": 2,
        },
        "dir": "NotoSansJP",
        "fonts": [
            {
                "file_name": "NotoSansJP-Light",
                "file_extension": "otf",
                "font_name": "Noto Sans JP Light",
                "font_weight": 300,
            },
            {
                "file_name": "NotoSansJP-Regular",
                "file_extension": "otf",
                "font_name": "Noto Sans JP",
                "font_weight": 400,
            },
            {
                "file_name": "NotoSansJP-Medium",
                "file_extension": "otf",
                "font_name": "Noto Sans JP Medium",
                "font_weight": 500,
            },
        ],
    },
    {
        "font_family": "Noto Sans TC",
        "is_cjk": True,
        "split_blocks": {
            "CJK Unified Ideographs": 60,
            "CJK Unified Ideographs Extension B": 10,
            "CJK Unified Ideographs Extension A": 2,
        },
        "dir": "NotoSansTC",
        "fonts": [
            {
                "file_name": "NotoSansTC-Light",
                "file_extension": "otf",
                "font_name": "Noto Sans TC Light",
                "font_weight": 300,
            },
            {
                "file_name": "NotoSansTC-Regular",
                "file_extension": "otf",
                "font_name": "Noto Sans TC",
                "font_weight": 400,
            },
            {
                "file_name": "NotoSansTC-Medium",
                "file_extension": "otf",
                "font_name": "Noto Sans TC Medium",
                "font_weight": 500,
            },
        ],
    },
    {
        "font_family": "Noto Sans SC",
        "is_cjk": True,
        "split_blocks": {
            "CJK Unified Ideographs": 75,
            "CJK Unified Ideographs Extension A": 30,
        },
        "dir": "NotoSansSC",
        "fonts": [
            {
                "file_name": "NotoSansSC-Light",
                "file_extension": "otf",
                "font_name": "Noto Sans SC Light",
                "font_weight": 300,
            },
            {
                "file_name": "NotoSansSC-Regular",
                "file_extension": "otf",
                "font_name": "Noto Sans SC",
                "font_weight": 400,
            },
            {
                "file_name": "NotoSansSC-Medium",
                "file_extension": "otf",
                "font_name": "Noto Sans SC Medium",
                "font_weight": 500,
            },
        ],
    },
    {
        "font_family": "roboto",
        "is_cjk": False,
        "split_blocks": {},
        "dir": "Roboto",
        "fonts": [
            {
                "file_name": "Roboto-Light",
                "file_extension": "ttf",
                "font_name": "Roboto Light",
                "font_weight": 300,
            },
            {
                "file_name": "Roboto-Regular",
                "file_extension": "ttf",
                "font_name": "Roboto",
                "font_weight": 400,
            },
            {
                "file_name": "Roboto-Medium",
                "file_extension": "ttf",
                "font_name": "Roboto Medium",
                "font_weight": 500,
            },
        ],
    },
]

for font_family in font_families:
    for font in font_family["fonts"]:
        font_splitter(
            font["font_name"],
            font_family["dir"],
            font["file_name"],
            font["file_extension"],
            font["font_weight"],
            font_family["font_family"],
            font_family["is_cjk"],
            font_family["split_blocks"],
            dir_surfix,
        )

font_splitter(
    "Segoe MDL2 Assets",
    "Segoe",
    "SegMDL2",
    "ttf",
    None,
    "SegMDL2",
    False,
    {},
    dir_surfix,
    "block",
    {"custom": "U+E70D,U+E971,U+E972"},
)

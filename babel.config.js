module.exports = {
    presets: [
        ["@babel/preset-env", {
            "useBuiltIns": "usage",
            "corejs": "3.19", // or 2,
        }],
    ],
	plugins: [
            [
              "@babel/plugin-transform-runtime",
              {
                "regenerator": true
              }
            ]
        ]
}
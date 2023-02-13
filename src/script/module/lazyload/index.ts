export default async function () {
    const [{ default: lazyloadInitialize }, { default: imageLoader }] = await Promise.all([
        import(
            /* webpackExports: ["default"] */
            './lazyload'
        ),
        import(
            /* webpackExports: ["default"] */
            '../image_loader'
        ),
    ]);

    return function () {
        lazyloadInitialize(imageLoader);
    };
}
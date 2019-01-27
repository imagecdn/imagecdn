const sharp = require('sharp')

module.exports = (parameters = {}) => async buffer => {
    const image = sharp(buffer, {
        failOnError: false,
        density: 450
    })

    if (parameters.width || parameters.height) {
        image.resize(parameters.width, parameters.height, {
            fit: parameters.fit || parameters.fill
        })
    }

    switch (parameters.format) {
        case 'jpg':
            image.jpeg({
                optimiseScans: false,
                optimiseCoding: false,
                progressive: true
            })
            break

        case 'webp':
            image.webp()
            break

        case 'svg':
            break

        case 'png':
            image.png()
            break
    }

    return await image.toBuffer()
}

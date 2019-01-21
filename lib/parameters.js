class Parameters {
    constructor(opts) {
        Object.keys(opts).forEach(key => {
            this[key] = opts[key]
        })
    }

    set width(width) {
        if (width >= 0) this._width = Number(width)
    }

    get width() {
        if (this._width >= 0) {
            return Number(this._width)
        }
        return null
    }

    set height(height) {
        if (height >= 0) this._height = Number(height)
    }

    get height() {
        if (this._height >= 0) {
            return Number(this._height)
        }
        return null
    }
}

/**
 * URI from which to download image.
 *
 * @var string
 */
Parameters.uri = undefined

/**
 * Width to generate.
 *
 * @var int
 */
Parameters.width = undefined

/**
 * Height of image.
 *
 * @var int
 */
Parameters.height = undefined

/**
 * Device pixel ratio to generate with.
 *
 * @var int
 */
Parameters.dpr = undefined

/**
 * How to fill the image frame.
 *
 * @var string
 */
Parameters.fill = undefined

/**
 * Quality of image.
 *
 * @var string
 */
Parameters.quality = undefined

/**
 * Level of compression.
 *
 * @var string
 */
Parameters.compression = undefined

module.exports = Parameters

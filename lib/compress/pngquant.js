const execa = require('execa')
const pngquant = require('pngquant-bin')


module.exports = (parameters = {}) => buffer => {

    if (parameters.format !== 'png') {
        return buffer
    }

    const args = ['-']

    switch (parameters.quality || "") {
        case 'lossless':
            break

        case 'low':
            args.push('--quality', '20-60')
            break

        case 'medium':
            args.push('--quality', '60-80')
            break

        case 'high':
        default:
            args.push('--quality', '80-100')

    }

	return execa.stdout(pngquant, args, {
		encoding: null,
		input: buffer,
		maxBuffer: Infinity
	})
}

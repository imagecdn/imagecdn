const execa = require('execa')
const cwebp = require('cwebp-bin')

module.exports = (parameters = {}) => buffer => {

    if (parameters.format !== 'webp') {
        return buffer
    }

	const args = [
		'-quiet',
        '-mt',
    ];

    switch (parameters.quality || "") {
        case 'lossless':
            args.push('-lossless')
            break

        case 'low':
            break

        case 'medium':
            break


        case 'high':
        default:
            args.push('-q', '80')
    }

    args.push('-o', '-')
    args.push('--', '-')

	return execa.stdout(cwebp, args, {
		encoding: null,
		input: buffer,
		maxBuffer: Infinity
    }).catch(err => {
        return buffer
    })

    return buffer
}

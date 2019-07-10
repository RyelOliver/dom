function parsePath(path) {
    return path
        .replace(/>\s+/g, '>')
        .replace(/(\S)>/g, (match, nonWhiteSpaceCharacter) => `${nonWhiteSpaceCharacter} >`)
        .split(' ')
        .filter(Boolean)
        .map(selector => {
            if (selector.indexOf('>') >= 0) {
                if (selector.length === 1)
                    throw Error('\'>\' selectors require a following node name');

                return {
                    nodeName: selector.substring(1),
                    isDirectChild: true,
                };
            } else {
                return {
                    nodeName: selector,
                };
            }
        });
}

module.exports = {
    parsePath,
};
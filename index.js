function parsePath(path) {
    return path
        // Remove trailing space from '>'
        .replace(/>\s+/g, '>')
        // Add leading space to '>'
        .replace(/(\S)>/g, (match, nonWhiteSpaceCharacter) => `${nonWhiteSpaceCharacter} >`)
        // Remove leading and spaces within '(n)'
        .replace(/\s*\(\s*(\S*)\s*\)/g, (match, nonWhiteSpaceCharacter) => `(${nonWhiteSpaceCharacter})`)
        // Add trailing space to '(n)'
        .replace(/(\(\S*\))(\S)/g, (match, indexSelector, nonWhiteSpaceCharacter) => `${indexSelector} ${nonWhiteSpaceCharacter}`)
        .split(' ')
        // Remove any whitespace
        .filter(Boolean)
        .map(selector => {
            let nodeName = selector;
            let isDirectChild = false;
            let index;

            if (nodeName.indexOf('>') >= 0) {
                nodeName = nodeName.substring(1);
                isDirectChild = true;

                if (nodeName.length === 0)
                    throw Error('\'>\' selectors require a following node name');
            }

            if (/(\(.+\))/.test(nodeName)) {
                const match = nodeName.match(/(\S+)\((\d+)\)/);

                if (!match)
                    throw Error('\'(n)\' selectors require a preceding node name, e.g. w:t(0)');

                nodeName = match[1];
                index = parseInt(match[2]);
            }

            return { nodeName, isDirectChild, index };
        });
}

module.exports = {
    parsePath,
};
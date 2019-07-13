function parsePath(path) {
    return path
        // Remove trailing space from '>'
        .replace(/>\s+/g, '>')
        // Remove trailing space from '#'
        .replace(/#\s+/g, '#')
        // Add leading space to '>' and '#'
        .replace(/(\S)([>#]{1,2})/g, (match, nonWhiteSpaceCharacter, childOrIdSelector) => `${nonWhiteSpaceCharacter} ${childOrIdSelector}`)
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
            let isId = false;

            if (nodeName.indexOf('>') === 0) {
                nodeName = nodeName.substring(1);
                isDirectChild = true;

                if (nodeName.length === 0)
                    throw Error('\'>\' selectors require a following node name');
            }

            if (nodeName.indexOf('#') === 0) {
                nodeName = nodeName.substring(1);
                isId = true;

                if (nodeName.length === 0)
                    throw Error('\'#\' selectors require a following id');
            }

            if (/(\(.+\))/.test(nodeName)) {
                const match = nodeName.match(/(\S+)\((\d+)\)/);

                if (!match)
                    throw Error('\'(n)\' selectors require a preceding node name, e.g. w:t(0)');

                nodeName = match[1];
                index = parseInt(match[2]);
            }

            return { nodeName, isDirectChild, index, isId };
        });
}

function getNodesByPath(node, path) {
    const selectors = parsePath(path);
    let nodes = [ node ];
    while (selectors.length) {
        const { nodeName, isDirectChild, index, isId } = selectors.shift();
        if (isId) {
            let childNode;
            while (!childNode && nodes.length > 0) {
                const node = nodes.shift();
                childNode = node.getElementById(nodeName);
            }
            nodes = childNode ? [ childNode ] : [];
        } else {
            const childNodes = [];
            nodes.forEach(node => {
                if (isDirectChild) {
                    childNodes.push(...Array.from(node.childNodes).filter(node => node.tagName === nodeName));
                } else {
                    childNodes.push(...Array.from(node.getElementsByTagName(nodeName)));
                }
            });
            if (index === undefined) {
                nodes = childNodes;
            } else {
                const childNode = childNodes[index];
                nodes = childNode ? [ childNode ] : [];
            }
        }
    }
    return nodes;
}

function getNodeByPath(node, path) {
    const nodes = getNodesByPath(node, path);
    return nodes.length > 0 ? nodes[0] : undefined;
}

module.exports = {
    parsePath,
    getNodesByPath,
    getNodeByPath,
};
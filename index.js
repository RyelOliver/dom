function parsePath(path) {
    return path
        // Remove trailing space from '#'
        .replace(/#\s+/g, '#')
        // Remove trailing space from '>'
        .replace(/>\s+/g, '>')
        // Add leading space to '#'
        .replace(/(\S)#/g, (match, nonWhiteSpaceCharacter) => `${nonWhiteSpaceCharacter} #`)
        // Add leading space to '>'
        .replace(/(\S)>/g, (match, nonWhiteSpaceCharacter) => `${nonWhiteSpaceCharacter} >`)
        // Remove leading space from '['
        .replace(/\s+\]/g, ']')
        // Remove trailing space from '['
        .replace(/\[\s+/g, '[')
        // Remove leading and trailing space from '='
        .replace(/\s*=\s*/g, '=')
        // Remove leading and spaces within '(n)'
        .replace(/\s*\(\s*(\S*)\s*\)/g, (match, nonWhiteSpaceCharacter) => `(${nonWhiteSpaceCharacter})`)
        // Add trailing space to '(n)'
        .replace(/(\(\S*\))(\S)/g, (match, indexSelector, nonWhiteSpaceCharacter) => `${indexSelector} ${nonWhiteSpaceCharacter}`)
        // Remove leading and trailing space from '|'
        .replace(/\s*\|\s*/g, '|')
        .split(' ')
        // Remove any whitespace
        .filter(Boolean)
        .map((selector, selectorIndex) => {
            let nodeName = selector;
            let isId = false;
            let isDirectChild = false;
            let attributeName;
            let attributeValue;
            let index;

            if (nodeName.indexOf('#') === 0) {
                nodeName = nodeName.substring(1);
                isId = true;

                if (selectorIndex > 0)
                    throw Error('\'#\' selectors must be at the start of a provided path');

                if (nodeName.length === 0)
                    throw Error('\'#\' selectors require a following id');

            } else if (nodeName.indexOf('>') === 0) {
                nodeName = nodeName.substring(1);
                isDirectChild = true;

                if (nodeName.length === 0)
                    throw Error('\'>\' selectors require a following node name');
            }

            if (nodeName.includes('|')) {
                if (isId)
                    throw Error('\'#\' selectors must not be used in combination with multiple node names');

                const nodeNames = nodeName.split('|');

                if (nodeNames.length < 2 || nodeNames.some(name => !name))
                    throw Error('Multiple node names must be provided when using or selectors');

                nodeNames.forEach(name => {
                    if (/[#>\[\]=""\(\)]/.test(name))
                        throw Error('A node name provided to an or selector must not include any reserved characters \'#>[]=""()\'');
                });

                nodeName = nodeNames;
            }

            if (/\[.*\]/.test(nodeName)) {
                const match = nodeName.match(/(\S*)\[(.*)\]/);

                nodeName = match[1] || undefined;
                attributeName = match[2].trim();

                if (/="(.*)"/.test(attributeName)) {
                    const match = attributeName.match(/(\S+)="(.+)"/);

                    attributeName = match[1];
                    attributeValue = match[2];

                }

                if (/[#>\[\]=""\(\)]/.test(attributeName) || /[#>\[\]=""\(\)]/.test(attributeValue))
                    throw Error('An attribute must not include any reserved characters \'#>[]=""()\'');
            }

            if (/\(.+\)/.test(nodeName)) {
                const match = nodeName.match(/(\S+)\((\d+)\)/);

                if (!match)
                    throw Error('\'(n)\' selectors require a preceding node name, e.g. w:t(0)');

                nodeName = match[1];
                index = parseInt(match[2]);
            }

            if (/[#>\[\]=""\(\)]/.test(nodeName))
                throw Error('A node name must not include any reserved characters \'#>[]=""()\'');

            return { nodeName, isId, isDirectChild, attributeName, attributeValue, index };
        });
}

function getNodesByNodeNames(node, nodeNames) {
    const nodes = [];
    if (node.childNodes)
        Array.from(node.childNodes)
            .forEach(node => {
                if (nodeNames.includes(node.tagName))
                    nodes.push(node);

                nodes.push(...getNodesByNodeNames(node, nodeNames));
            });
    return nodes;
}

function getNodesByPath(node, path) {
    const selectors = parsePath(path);

    let nodes = [ node ];
    while (selectors.length) {
        const { nodeName, isDirectChild, index, isId, attributeName, attributeValue } = selectors.shift();

        if (isId) {
            let childNode;
            while (!childNode && nodes.length > 0) {
                const node = nodes.shift();
                if (!node.getElementById)
                    throw Error('\'#\' selectors must be used from a document node');
                childNode = node.getElementById(nodeName);
            }
            nodes = childNode ? [ childNode ] : [];

        } else {
            const childNodes = [];
            nodes.forEach(node => {
                if (isDirectChild) {
                    if (Array.isArray(nodeName)) {
                        childNodes.push(...Array.from(node.childNodes).filter(node => nodeName.includes(node.tagName)));
                    } else if (nodeName) {
                        childNodes.push(...Array.from(node.childNodes).filter(node => node.tagName === nodeName));
                    } else {
                        childNodes.push(...Array.from(node.childNodes));
                    }
                } else if (Array.isArray(nodeName)) {
                    childNodes.push(...Array.from(getNodesByNodeNames(node, nodeName)));
                } else {
                    childNodes.push(...Array.from(node.getElementsByTagName(nodeName ? nodeName : '*')));
                }
            });
            nodes = childNodes;

            if (attributeName && attributeValue) {
                nodes = childNodes.filter(node => node.getAttribute(attributeName) === attributeValue);
            } else if (attributeName) {
                nodes = childNodes.filter(node => node.getAttribute(attributeName));
            }

            if (index !== undefined) {
                const childNode = nodes[index];
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
    getNodesByNodeNames,
    getNodesByPath,
    getNodeByPath,
};
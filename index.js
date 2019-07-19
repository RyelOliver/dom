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

function _getNodesBySelectors(node, selectors) {
    let nodes = [ node ];
    while (selectors.length) {
        const { isId, isDirectChild, nodeName, attributeName, attributeValue, index } = selectors.shift();

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

function getNodesByPath(node, path) {
    const selectors = parsePath(path);

    if (selectors.length <= 1) {
        return _getNodesBySelectors(node, selectors);
    } else {
        const lastSelector = selectors[selectors.length - 1];
        lastSelector.isId = false;
        lastSelector.isDirectChild = false;
        const nodesMatchingLastSelector = _getNodesBySelectors(node, [ lastSelector ]);
        const nodesMatchingFullSelector = _getNodesBySelectors(node, selectors);
        return nodesMatchingLastSelector.filter(node => nodesMatchingFullSelector.includes(node));
    }
}

function getNodeByPath(node, path) {
    const nodes = getNodesByPath(node, path);
    return nodes.length > 0 ? nodes[0] : undefined;
}

function setNodeAttributes(node, attributes) {
    Object.entries(attributes)
        .forEach(([ key, value ]) => node.setAttribute(key, value));
    return node;
}

function appendChildNodes(node, child) {
    const children = Array.isArray(child) ? child : [ child ];
    children.forEach(child => child && node.appendChild(child));
    return node;
}

function createNode({ document, name, attributes = {}, children = [] }) {
    return appendChildNodes(setNodeAttributes(document.createElement(name), attributes), children);
}

function insertAfterNode(thatNode, thisNode) {
    return thatNode.nextSibling ?
        thatNode.parentNode.insertBefore(thisNode, thatNode.nextSibling) :
        thatNode.parentNode.appendChild(thisNode);
}

function insertBeforeNode(thatNode, thisNode) {
    return thatNode.parentNode.insertBefore(thisNode, thatNode);
}

function removeNode(node) {
    return node.parentNode.removeChild(node);
}

// Syntactic sugar
function get(path) {
    let all = false;
    return {
        all: function() {
            all = true;
            return this;
        },
        from: function(node) {
            return all ? getNodesByPath(node, path) : getNodeByPath(node, path);
        },
    };
}

function set(attributes) {
    return {
        to: function(node) {
            return setNodeAttributes(node, attributes);
        },
    };
}

function append(child) {
    const children = Array.isArray(child) ? child : [ child ];
    return {
        to: function(node) {
            return appendChildNodes(node, children);
        },
    };
}

function create(name) {
    const attributes = {};
    const children = [];
    return {
        withAttributes: function(attrs) {
            Object.entries(attrs)
                .forEach(([ key, value ]) => attributes[key] = value);
            return this;
        },
        andAttributes: function(attrs) {
            return this.withAttributes(attrs);
        },
        withChildren: function(child) {
            const childs = Array.isArray(child) ? child : [ child ];
            children.push(...childs);
            return this;
        },
        andChildren: function(childs) {
            return this.withChildren(childs);
        },
        for: function(document) {
            return createNode({ document, name, attributes, children });
        },
    };
}

function insert(thisNode) {
    return {
        after: function(thatNode) {
            return insertAfterNode(thatNode, thisNode);
        },
        before: function(thatNode) {
            return insertBeforeNode(thatNode, thisNode);
        },
    };
}

function remove(node) {
    return removeNode(node);
}

module.exports = {
    parsePath,
    getNodesByNodeNames,
    getNodesByPath,
    getNodeByPath,
    setNodeAttributes,
    appendChildNodes,
    createNode,
    insertAfterNode,
    insertBeforeNode,
    removeNode,
    get,
    set,
    append,
    create,
    insert,
    remove,
};
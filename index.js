function parsePath(path) {
    return path
        .split(' ')
        .map(nodeName => ({ nodeName }));
}

module.exports = {
    parsePath,
};
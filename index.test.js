const { parsePath } = require('./index');

describe('Path parser', () => {
    it('Should parse a single node name', () => {
        const expected = [
            { nodeName: 'w:t' },
        ];
        const actual = parsePath('w:t');
        expect(actual).toStrictEqual(expected);
    });

    it('Should parse multiple node names', () => {
        const expected = [
            { nodeName: 'w:r' },
            { nodeName: 'w:t' },
        ];
        const actual = parsePath('w:r w:t');
        expect(actual).toStrictEqual(expected);
    });
});
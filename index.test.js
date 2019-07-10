const { parsePath } = require('./index');

describe('Path parser', () => {
    it('Should parse a single node name selector', () => {
        const expected = [
            { nodeName: 'w:t' },
        ];
        const actual = parsePath('w:t');
        expect(actual).toStrictEqual(expected);
    });

    it('Should parse multiple node name selectors', () => {
        const expected = [
            { nodeName: 'w:r' },
            { nodeName: 'w:t' },
        ];
        const actual = parsePath('w:r w:t');
        expect(actual).toStrictEqual(expected);
    });

    it('Should parse multiple node name selectors with varying spaces', () => {
        const expected = [
            { nodeName: 'w:r' },
            { nodeName: 'w:t' },
        ];
        expect(parsePath('w:r  w:t')).toStrictEqual(expected);
        expect(parsePath(' w:r w:t')).toStrictEqual(expected);
        expect(parsePath('w:r w:t ')).toStrictEqual(expected);
        expect(parsePath(' w:r  w:t ')).toStrictEqual(expected);
    });

    it('Should parse a direct child node selector', () => {
        const expected = [
            { nodeName: 'w:t', isDirectChild: true },
        ];
        expect(parsePath('>w:t')).toStrictEqual(expected);
        expect(parsePath('> w:t')).toStrictEqual(expected);
    });

    it('Should error parsing a direct child node selector without a following node name', () => {
        expect(() => parsePath('>')).toThrowError('\'>\' selectors require a following node name');
    });
});
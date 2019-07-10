const { parsePath } = require('./index');

describe('Path parser', () => {
    it('Should parse a single node name selector', () => {
        const expected = [
            { nodeName: 'w:t', isDirectChild: false, index: undefined },
        ];
        const actual = parsePath('w:t');
        expect(actual).toStrictEqual(expected);
    });

    it('Should parse multiple node name selectors', () => {
        const expected = [
            { nodeName: 'w:r', isDirectChild: false, index: undefined },
            { nodeName: 'w:t', isDirectChild: false, index: undefined },
        ];
        const actual = parsePath('w:r w:t');
        expect(actual).toStrictEqual(expected);
    });

    it('Should parse multiple node name selectors with varying spaces', () => {
        const expected = [
            { nodeName: 'w:r', isDirectChild: false, index: undefined },
            { nodeName: 'w:t', isDirectChild: false, index: undefined },
        ];
        expect(parsePath('w:r  w:t')).toStrictEqual(expected);
        expect(parsePath(' w:r w:t')).toStrictEqual(expected);
        expect(parsePath('w:r w:t ')).toStrictEqual(expected);
        expect(parsePath(' w:r  w:t ')).toStrictEqual(expected);
    });

    it('Should parse a direct child node selector', () => {
        const expected = [
            { nodeName: 'w:t', isDirectChild: true, index: undefined },
        ];
        expect(parsePath('>w:t')).toStrictEqual(expected);
        expect(parsePath('> w:t')).toStrictEqual(expected);
    });

    it('Should error parsing a direct child node selector without a following node name', () => {
        expect(() => parsePath('>')).toThrowError('\'>\' selectors require a following node name');
    });

    it('Should parse index selectors', () => {
        const expected = [
            { nodeName: 'w:r', isDirectChild: false, index: 0 },
            { nodeName: 'w:t', isDirectChild: false, index: 12 },
        ];
        expect(parsePath('w:r(0) w:t(12)')).toStrictEqual(expected);
        expect(parsePath('w:r (0)   w:t( 12 )')).toStrictEqual(expected);
    });

    it('Should error parsing an index selector without a preceding node name or without an integer', () => {
        expect(() => parsePath('(40)')).toThrowError('\'(n)\' selectors require a preceding node name');
        expect(() => parsePath('w:t(n)')).toThrowError('\'(n)\' selectors require a preceding node name');
    });
});
const { DOMParser } = require('xmldom');
const { parsePath, getNodesByPath, getNodeByPath } = require('./index');

describe('Path parser', () => {
    it('Should parse a single node name selector', () => {
        const expected = [
            { nodeName: 'w:t', isDirectChild: false, index: undefined, isId: false },
        ];
        const actual = parsePath('w:t');
        expect(actual).toStrictEqual(expected);
    });

    it('Should parse multiple node name selectors', () => {
        const expected = [
            { nodeName: 'w:r', isDirectChild: false, index: undefined, isId: false },
            { nodeName: 'w:t', isDirectChild: false, index: undefined, isId: false },
        ];
        const actual = parsePath('w:r w:t');
        expect(actual).toStrictEqual(expected);
    });

    it('Should parse multiple node name selectors with varying spaces', () => {
        const expected = [
            { nodeName: 'w:r', isDirectChild: false, index: undefined, isId: false },
            { nodeName: 'w:t', isDirectChild: false, index: undefined, isId: false },
        ];
        expect(parsePath('w:r  w:t')).toStrictEqual(expected);
        expect(parsePath(' w:r w:t')).toStrictEqual(expected);
        expect(parsePath('w:r w:t ')).toStrictEqual(expected);
        expect(parsePath(' w:r  w:t ')).toStrictEqual(expected);
    });

    it('Should parse a direct child node selector', () => {
        const expected = [
            { nodeName: 'w:t', isDirectChild: true, index: undefined, isId: false },
        ];
        expect(parsePath('>w:t')).toStrictEqual(expected);
        expect(parsePath('> w:t')).toStrictEqual(expected);
    });

    it('Should error parsing a direct child node selector without a following node name', () => {
        expect(() => parsePath('>')).toThrowError('\'>\' selectors require a following node name');
    });

    it('Should parse index selectors', () => {
        const expected = [
            { nodeName: 'w:r', isDirectChild: false, index: 0, isId: false },
            { nodeName: 'w:t', isDirectChild: false, index: 12, isId: false },
        ];
        expect(parsePath('w:r(0) w:t(12)')).toStrictEqual(expected);
        expect(parsePath('w:r (0)   w:t( 12 )')).toStrictEqual(expected);
    });

    it('Should error parsing an index selector without a preceding node name or without an integer', () => {
        expect(() => parsePath('(40)')).toThrowError('\'(n)\' selectors require a preceding node name');
        expect(() => parsePath('w:t(n)')).toThrowError('\'(n)\' selectors require a preceding node name');
    });

    it('Should parse id selectors', () => {
        const expected = [
            { nodeName: 'id', isDirectChild: false, index: undefined, isId: true },
        ];
        expect(parsePath('#id')).toStrictEqual(expected);
        expect(parsePath('# id')).toStrictEqual(expected);
    });

    it('Should parse multiple selectors', () => {
        const expected = [
            { nodeName: 'paragraph-6', isDirectChild: false, index: undefined, isId: true },
            { nodeName: 'w:r', isDirectChild: true, index: 0, isId: false },
            { nodeName: 'w:t', isDirectChild: false, index: 12, isId: false },
        ];
        expect(parsePath('#paragraph-6 > w:r(0) w:t(12)')).toStrictEqual(expected);
        expect(parsePath('  #paragraph-6 >w:r (0)w:t(12) ')).toStrictEqual(expected);
    });
});

describe('Get nodes', () => {
    let xmlDocument;
    beforeEach(() => {
        xmlDocument = new DOMParser().parseFromString(`
            <xml>
                <w:p />
                <w:p>
                    <w:r>
                        <w:t>First</w:t>
                    </w:r>
                    <w:r>
                        <w:t> and second</w:t>
                    </w:r>
                </w:p>
                <w:p>Third</w:p>
                <w:p />
                <w:p>
                    <w:ins>
                        <w:r>
                            <w:t> and </w:t>
                        </w:r>
                    </w:ins>
                </w:p>
                <w:p id="paragraph-6" para-id="6">
                    <w:r>
                        <w:t>Fourth</w:t>
                    </w:r>
                    <w:r>
                        <w:t> and fifth</w:t>
                    </w:r>
                </w:p>
            </xml>`, 'text/xml'
        );
    });

    describe('Get nodes by path', () => {
        it('Should get all child nodes matching the node name', () => {
            const expected = [
                'First',
                ' and second',
                ' and ',
                'Fourth',
                ' and fifth',
            ];
            const actual = getNodesByPath(xmlDocument, 'w:t').map(t => t.textContent);
            expect(actual).toStrictEqual(expected);
        });

        it('Should get all direct child nodes matching the node name', () => {
            const expected = [
                'Fourth',
            ];
            const actual = getNodesByPath(xmlDocument, 'w:p > w:r(2) w:t').map(t => t.textContent);
            expect(actual).toStrictEqual(expected);
        });
    });

    describe('Get node by path', () => {
        it('Should get the first child node matching the node name', () => {
            const expected = 'First';
            const actual = getNodeByPath(xmlDocument, 'w:t').textContent;
            expect(actual).toStrictEqual(expected);
        });

        it('Should get the node matching the id', () => {
            const expected = '6';
            const actual = getNodeByPath(xmlDocument, '#paragraph-6').getAttribute('para-id');
            expect(actual).toEqual(expected);
        });
    });
});
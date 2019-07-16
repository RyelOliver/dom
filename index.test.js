const { DOMParser } = require('xmldom');
const { parsePath, getNodesByPath, getNodeByPath } = require('./index');

describe('Path parser', () => {
    it('Should parse a single node name selector', () => {
        const expected = [
            { nodeName: 'w:t', isDirectChild: false, index: undefined, isId: false, attributeName: undefined, attributeValue: undefined },
        ];
        const actual = parsePath('w:t');
        expect(actual).toStrictEqual(expected);
    });

    it('Should parse multiple node name selectors', () => {
        const expected = [
            { nodeName: 'w:r', isDirectChild: false, index: undefined, isId: false, attributeName: undefined, attributeValue: undefined },
            { nodeName: 'w:t', isDirectChild: false, index: undefined, isId: false, attributeName: undefined, attributeValue: undefined },
        ];
        const actual = parsePath('w:r w:t');
        expect(actual).toStrictEqual(expected);
    });

    it('Should parse multiple node name selectors with varying spaces', () => {
        const expected = [
            { nodeName: 'w:r', isDirectChild: false, index: undefined, isId: false, attributeName: undefined, attributeValue: undefined },
            { nodeName: 'w:t', isDirectChild: false, index: undefined, isId: false, attributeName: undefined, attributeValue: undefined },
        ];
        expect(parsePath('w:r  w:t')).toStrictEqual(expected);
        expect(parsePath(' w:r w:t')).toStrictEqual(expected);
        expect(parsePath('w:r w:t ')).toStrictEqual(expected);
        expect(parsePath(' w:r  w:t ')).toStrictEqual(expected);
    });

    it('Should parse id selectors', () => {
        const expected = [
            { nodeName: 'id', isDirectChild: false, index: undefined, isId: true, attributeName: undefined, attributeValue: undefined },
        ];
        expect(parsePath('#id')).toStrictEqual(expected);
        expect(parsePath('# id')).toStrictEqual(expected);
    });

    it('Should error parsing an id selector which isn\'t at the start of the path or that is without an id', () => {
        expect(() => parsePath('w:p #id')).toThrowError('\'#\' selectors must be at the start of a provided path');
        expect(() => parsePath('#')).toThrowError('\'#\' selectors require a following id');
        expect(() => parsePath('>#id')).toThrowError('\'>\' selectors require a following node name');
        expect(() => parsePath('#>id')).toThrowError('\'#\' selectors require a following id');
    });

    it('Should parse a direct child node selector', () => {
        const expected = [
            { nodeName: 'w:t', isDirectChild: true, index: undefined, isId: false, attributeName: undefined, attributeValue: undefined },
        ];
        expect(parsePath('>w:t')).toStrictEqual(expected);
        expect(parsePath('> w:t')).toStrictEqual(expected);
    });

    it('Should error parsing a direct child node selector without a following node name', () => {
        expect(() => parsePath('>')).toThrowError('\'>\' selectors require a following node name');
    });

    it('Should parse attribute selectors', () => {
        const expected = [
            { nodeName: undefined, isDirectChild: false, index: undefined, isId: false, attributeName: 'hidden', attributeValue: undefined },
        ];
        expect(parsePath('[hidden]')).toStrictEqual(expected);
        expect(parsePath('[ hidden ]')).toStrictEqual(expected);
    });

    it('Should parse attribute value selectors', () => {
        const expected = [
            { nodeName: undefined, isDirectChild: false, index: undefined, isId: false, attributeName: 'w14:paraId', attributeValue: '707BD5C8' },
        ];
        expect(parsePath('[w14:paraId="707BD5C8"]')).toStrictEqual(expected);
        expect(parsePath('[w14:paraId = "707BD5C8"]')).toStrictEqual(expected);
    });

    it('Should parse node name and attribute value selectors', () => {
        const expected = [
            { nodeName: 'w:p', isDirectChild: false, index: undefined, isId: false, attributeName: 'w14:paraId', attributeValue: '707BD5C8' },
        ];
        expect(parsePath('w:p[w14:paraId="707BD5C8"]')).toStrictEqual(expected);
        expect(parsePath('w:p[w14:paraId = "707BD5C8"]')).toStrictEqual(expected);
    });

    it('Should parse index selectors', () => {
        const expected = [
            { nodeName: 'w:r', isDirectChild: false, index: 0, isId: false, attributeName: undefined, attributeValue: undefined },
            { nodeName: 'w:t', isDirectChild: false, index: 12, isId: false, attributeName: undefined, attributeValue: undefined },
        ];
        expect(parsePath('w:r(0) w:t(12)')).toStrictEqual(expected);
        expect(parsePath('w:r (0)   w:t( 12 )')).toStrictEqual(expected);
    });

    it('Should error parsing an index selector without a preceding node name or without an integer', () => {
        expect(() => parsePath('(40)')).toThrowError('\'(n)\' selectors require a preceding node name');
        expect(() => parsePath('w:t(n)')).toThrowError('\'(n)\' selectors require a preceding node name');
    });

    it('Should parse an or selector', () => {
        const expected = [
            { nodeName: [ 'w:ins', 'w:del' ], isDirectChild: false, index: undefined, isId: false, attributeName: undefined, attributeValue: undefined },
            { nodeName: 'w:r', isDirectChild: true, index: undefined, isId: false, attributeName: undefined, attributeValue: undefined },
            { nodeName: [ 'w:t', 'w:delText' ], isDirectChild: true, index: undefined, isId: false, attributeName: undefined, attributeValue: undefined },
        ];
        expect(parsePath('w:ins|w:del > w:r > w:t|w:delText')).toStrictEqual(expected);
        expect(parsePath('  w:ins | w:del >w:r> w:t|  w:delText ')).toStrictEqual(expected);
    });

    it('Should error parsing an or selector without multiple node names', () => {
        expect(() => parsePath('w:t|')).toThrowError('Multiple node names must be provided when using or selectors');
    });

    it('Should error parsing multiple node names used in combination with another selector other than the direct child node selector', () => {
        expect(() => parsePath('#id|rsid')).toThrowError('\'#\' selectors must not be used in combination with multiple node names');
        expect(() => parsePath('[hidden]|[required]')).toThrowError('A node name provided to an or selector must not include any reserved characters \'#>[]=""()\'');
        expect(() => parsePath('w:p(1)|w:p(3)')).toThrowError('A node name provided to an or selector must not include any reserved characters \'#>[]=""()\'');
    });

    it('Should parse multiple selectors', () => {
        const expected = [
            { nodeName: 'paragraph-6', isDirectChild: false, index: undefined, isId: true, attributeName: undefined, attributeValue: undefined },
            { nodeName: 'w:r', isDirectChild: true, index: 1, isId: false, attributeName: undefined, attributeValue: undefined },
            { nodeName: 'w:t', isDirectChild: false, index: undefined, isId: false, attributeName: 'xml:space', attributeValue: 'preserve' },
        ];
        expect(parsePath('#paragraph-6 > w:r(1) w:t[xml:space="preserve"]')).toStrictEqual(expected);
        expect(parsePath('  #paragraph-6 >w:r (1)w:t[xml:space="preserve"] ')).toStrictEqual(expected);
    });

    it('Should error parsing any reserved characters', () => {
        expect(() => parsePath('[')).toThrowError('A node name must not include any reserved characters \'#>[]=""()\'');
        expect(() => parsePath(']')).toThrowError('A node name must not include any reserved characters \'#>[]=""()\'');
        expect(() => parsePath('=')).toThrowError('A node name must not include any reserved characters \'#>[]=""()\'');
        expect(() => parsePath('"')).toThrowError('A node name must not include any reserved characters \'#>[]=""()\'');
        expect(() => parsePath('(')).toThrowError('A node name must not include any reserved characters \'#>[]=""()\'');
        expect(() => parsePath(')')).toThrowError('A node name must not include any reserved characters \'#>[]=""()\'');

        expect(() => parsePath('[>]')).toThrowError('An attribute must not include any reserved characters \'#>[]=""()\'');
        expect(() => parsePath('["]')).toThrowError('An attribute must not include any reserved characters \'#>[]=""()\'');
    });
});

describe('Get nodes', () => {
    let xmlDocument;
    beforeEach(() => {
        xmlDocument = new DOMParser({
            errorHandler: function(severity, message) {
                // Ignore attribute missing a value warning
                // Without an attribute value specified, the value is set to the attribute name
                if (!/\[xmldom warning\]\tattribute ".*" missed value!!/.test(message))
                    severity === 'warning' ? console.warn(message) : console.error(message);
            },
        }).parseFromString(`
            <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
                <w:document>
                    <w:body>
                        <w:p/>
                        <w:p>
                            <w:r>
                                <w:t>First</w:t>
                            </w:r>
                            <w:r>
                                <w:t xml:space="preserve"> and second</w:t>
                            </w:r>
                            <w:ins>
                                <w:del>
                                    <w:r>
                                        <w:delText> that's</w:delText>
                                    </w:r>
                                </w:del>
                                <w:r>
                                    <w:t xml:space="preserve"> right before</w:t>
                                </w:r>
                            </w:ins>
                        </w:p>
                        <w:p hidden>Third</w:p>
                        <w:p/>
                        <w:p>
                            <w:ins>
                                <w:r>
                                    <w:t xml:space="preserve"> and </w:t>
                                </w:r>
                            </w:ins>
                        </w:p>
                        <w:p id="paragraph-6" w14:paraId="707BD5C8">
                            <w:r>
                                <w:t>Fourth</w:t>
                            </w:r>
                            <w:r>
                                <w:t xml:space="preserve"> and fifth</w:t>
                            </w:r>
                        </w:p>
                    </w:body>
                </w:document>
            </xml>`, 'text/xml'
        );
    });

    describe('Get nodes by path', () => {
        it('Should get all child nodes matching the node name', () => {
            const expected = [
                'First',
                ' and second',
                ' right before',
                ' and ',
                'Fourth',
                ' and fifth',
            ];
            const actual = getNodesByPath(xmlDocument, 'w:t').map(t => t.textContent);
            expect(actual).toStrictEqual(expected);
        });

        it('Should get all child nodes matching either node name', () => {
            const expected = [
                ' right before',
                ' that\'s',
                ' and ',
            ];
            const actual = getNodesByPath(xmlDocument, 'w:ins|w:del > w:r > w:t|w:delText')
                .map(t => t.textContent);
            expect(actual).toStrictEqual(expected);
        });

        it('Should get all direct child nodes matching the node name', () => {
            const expected = [
                'First',
                ' and second',
                'Fourth',
                ' and fifth',
            ];
            const actual = getNodesByPath(xmlDocument, 'w:p > w:r w:t').map(t => t.textContent);
            expect(actual).toStrictEqual(expected);
        });

        it('Should get all child nodes matching the attribute name', () => {
            const expected = [
                'Third',
            ];
            const actual = getNodesByPath(xmlDocument, '[hidden]').map(t => t.textContent);
            expect(actual).toStrictEqual(expected);
        });

        it('Should get all child nodes matching the attribute value', () => {
            const expected = [
                'paragraph-6',
            ];
            const actual = getNodesByPath(xmlDocument, '[w14:paraId="707BD5C8"]').map(t => t.getAttribute('id'));
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
            const expected = '707BD5C8';
            const actual = getNodeByPath(xmlDocument, '#paragraph-6').getAttribute('w14:paraId');
            expect(actual).toEqual(expected);
        });

        it('Should error using an id selector from a node other than a document node', () => {
            const body = getNodeByPath(xmlDocument, 'w:body');
            expect(() => getNodeByPath(body, '#paragraph-6')).toThrowError('\'#\' selectors must be used from a document node');
        });

        it('Should get the node matching the attribute', () => {
            const expected = 'Third';
            const actual = getNodeByPath(xmlDocument, '[hidden]').textContent;
            expect(actual).toEqual(expected);
        });
    });
});
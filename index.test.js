const { DOMParser } = require('xmldom');
const {
    parsePath,
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
} = require('./index');

const Word = {
    // Nodes
    document: 'w:document',
    body: 'w:body',
    p: 'w:p', // Paragraph
    pPr: 'w:pPr', // Paragraph properties
    r: 'w:r', // Run
    rPr: 'w:rPr', // Run properties
    br: 'w:br',
    t: 'w:t', // Text
    ins: 'w:ins', // Insert
    del: 'w:del', // Delete
    delText: 'w:delText', // Deleted text
    people: 'w15:people',
    person: 'w15:person',
    presenceInfo: 'w15:presenceInfo',
    // Attributes
    rsids: 'w:rsids', // Revision save IDs
    rsidRoot: 'w:rsidRoot', // Revision save ID of root (first) version of document
    rsid: 'w:rsid', // Revision save ID
    rsidR: 'w:rsidR', // Revision save ID of run
    rsidRDefault: 'w:rsidRDefault',
    rsidDel: 'w:rsidDel', // Revision save ID of delete
    id: 'w:id',
    paraId: 'w14:paraId',
    color: 'w:color',
    space: 'xml:space',
    preserve: 'preserve',
    author: 'w:author',
    date: 'w:date',
    personAuthor: 'w15:author',
    providerId: 'w15:providerId',
    userId: 'w15:userId',
};

describe('Path parser', () => {
    it('Should parse a single node name selector', () => {
        const expected = [
            { nodeName: Word.t, isDirectChild: false, index: undefined, isId: false, attributeName: undefined, attributeValue: undefined },
        ];
        const actual = parsePath(Word.t);
        expect(actual).toStrictEqual(expected);
    });

    it('Should parse multiple node name selectors', () => {
        const expected = [
            { nodeName: Word.r, isDirectChild: false, index: undefined, isId: false, attributeName: undefined, attributeValue: undefined },
            { nodeName: Word.t, isDirectChild: false, index: undefined, isId: false, attributeName: undefined, attributeValue: undefined },
        ];
        const actual = parsePath(`${Word.r} ${Word.t}`);
        expect(actual).toStrictEqual(expected);
    });

    it('Should parse multiple node name selectors with varying spaces', () => {
        const expected = [
            { nodeName: Word.r, isDirectChild: false, index: undefined, isId: false, attributeName: undefined, attributeValue: undefined },
            { nodeName: Word.t, isDirectChild: false, index: undefined, isId: false, attributeName: undefined, attributeValue: undefined },
        ];
        expect(parsePath(`${Word.r}  ${Word.t}`)).toStrictEqual(expected);
        expect(parsePath(` ${Word.r} ${Word.t}`)).toStrictEqual(expected);
        expect(parsePath(`${Word.r} ${Word.t} `)).toStrictEqual(expected);
        expect(parsePath(` ${Word.r}  ${Word.t} `)).toStrictEqual(expected);
    });

    it('Should parse id selectors', () => {
        const expected = [
            { nodeName: 'id', isDirectChild: false, index: undefined, isId: true, attributeName: undefined, attributeValue: undefined },
        ];
        expect(parsePath('#id')).toStrictEqual(expected);
        expect(parsePath('# id')).toStrictEqual(expected);
    });

    it('Should error parsing an id selector which isn\'t at the start of the path or that is without an id', () => {
        expect(() => parsePath(`${Word.p} #id`)).toThrowError('\'#\' selectors must be at the start of a provided path');
        expect(() => parsePath('#')).toThrowError('\'#\' selectors require a following id');
        expect(() => parsePath('>#id')).toThrowError('\'>\' selectors require a following node name');
        expect(() => parsePath('#>id')).toThrowError('\'#\' selectors require a following id');
    });

    it('Should parse a direct child node selector', () => {
        const expected = [
            { nodeName: Word.t, isDirectChild: true, index: undefined, isId: false, attributeName: undefined, attributeValue: undefined },
        ];
        expect(parsePath(`>${Word.t}`)).toStrictEqual(expected);
        expect(parsePath(`> ${Word.t}`)).toStrictEqual(expected);
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
            { nodeName: undefined, isDirectChild: false, index: undefined, isId: false, attributeName: Word.paraId, attributeValue: '707BD5C8' },
        ];
        expect(parsePath(`[${Word.paraId}="707BD5C8"]`)).toStrictEqual(expected);
        expect(parsePath(`[${Word.paraId} = "707BD5C8"]`)).toStrictEqual(expected);
    });

    it('Should parse node name and attribute value selectors', () => {
        const expected = [
            { nodeName: Word.p, isDirectChild: false, index: undefined, isId: false, attributeName: Word.paraId, attributeValue: '707BD5C8' },
        ];
        expect(parsePath(`${Word.p}[${Word.paraId}="707BD5C8"]`)).toStrictEqual(expected);
        expect(parsePath(`${Word.p}[${Word.paraId} = "707BD5C8"]`)).toStrictEqual(expected);
    });

    it('Should parse index selectors', () => {
        const expected = [
            { nodeName: Word.r, isDirectChild: false, index: 0, isId: false, attributeName: undefined, attributeValue: undefined },
            { nodeName: Word.t, isDirectChild: false, index: 12, isId: false, attributeName: undefined, attributeValue: undefined },
        ];
        expect(parsePath(`${Word.r}(0) ${Word.t}(12)`)).toStrictEqual(expected);
        expect(parsePath(`${Word.r} (0)   ${Word.t}( 12 )`)).toStrictEqual(expected);
    });

    it('Should error parsing an index selector without a preceding node name or without an integer', () => {
        expect(() => parsePath('(40)')).toThrowError('\'(n)\' selectors require a preceding node name');
        expect(() => parsePath(`${Word.t}(n)`)).toThrowError('\'(n)\' selectors require a preceding node name');
    });

    it('Should parse an or selector', () => {
        const expected = [
            { nodeName: [ Word.ins, Word.del ], isDirectChild: false, index: undefined, isId: false, attributeName: undefined, attributeValue: undefined },
            { nodeName: Word.r, isDirectChild: true, index: undefined, isId: false, attributeName: undefined, attributeValue: undefined },
            { nodeName: [ Word.t, Word.delText ], isDirectChild: true, index: undefined, isId: false, attributeName: undefined, attributeValue: undefined },
        ];
        expect(parsePath(`${Word.ins}|${Word.del} > ${Word.r} > ${Word.t}|${Word.delText}`)).toStrictEqual(expected);
        expect(parsePath(`  ${Word.ins} | ${Word.del} >${Word.r}> ${Word.t}|  ${Word.delText} `)).toStrictEqual(expected);
    });

    it('Should error parsing an or selector without multiple node names', () => {
        expect(() => parsePath(`${Word.t}|`)).toThrowError('Multiple node names must be provided when using or selectors');
    });

    it('Should error parsing multiple node names used in combination with another selector other than the direct child node selector', () => {
        expect(() => parsePath('#id|rsid')).toThrowError('\'#\' selectors must not be used in combination with multiple node names');
        expect(() => parsePath('[hidden]|[required]')).toThrowError('A node name provided to an or selector must not include any reserved characters \'#>[]=""()\'');
        expect(() => parsePath(`${Word.p}(1)|${Word.p}(3)`)).toThrowError('A node name provided to an or selector must not include any reserved characters \'#>[]=""()\'');
    });

    it('Should parse multiple selectors', () => {
        const expected = [
            { nodeName: 'paragraph-6', isDirectChild: false, index: undefined, isId: true, attributeName: undefined, attributeValue: undefined },
            { nodeName: Word.r, isDirectChild: true, index: 1, isId: false, attributeName: undefined, attributeValue: undefined },
            { nodeName: Word.t, isDirectChild: false, index: undefined, isId: false, attributeName: Word.space, attributeValue: Word.preserve },
        ];
        expect(parsePath(`#paragraph-6 > ${Word.r}(1) ${Word.t}[${Word.space}="${Word.preserve}"]`)).toStrictEqual(expected);
        expect(parsePath(`  #paragraph-6 >${Word.r} (1)${Word.t}[${Word.space}="${Word.preserve}"] `)).toStrictEqual(expected);
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

describe('Getting and manipulating nodes', () => {
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
                                        <w:delText xml:space="preserve"> that's</w:delText>
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

    describe('Get nodes', () => {
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
                const actual = getNodesByPath(xmlDocument, Word.t).map(t => t.textContent);
                expect(actual).toStrictEqual(expected);
            });

            it('Should get all child nodes matching either node name', () => {
                const expected = [
                    ' that\'s',
                    ' right before',
                    ' and ',
                ];
                const actual = getNodesByPath(xmlDocument, `${Word.ins}|${Word.del} > ${Word.r} > ${Word.t}|${Word.delText}`)
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
                const actual = getNodesByPath(xmlDocument, `${Word.p} > ${Word.r} ${Word.t}`).map(t => t.textContent);
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
                const actual = getNodesByPath(xmlDocument, `[${Word.paraId}="707BD5C8"]`).map(t => t.getAttribute('id'));
                expect(actual).toStrictEqual(expected);
            });

            it('Should support syntactic sugar', () => {
                const expected = [
                    'First',
                    ' and second',
                    'Fourth',
                    ' and fifth',
                ];
                const actual = get(`${Word.p} > ${Word.r} ${Word.t}`).all().from(xmlDocument).map(t => t.textContent);
                expect(actual).toStrictEqual(expected);
            });
        });

        describe('Get node by path', () => {
            it('Should get the first child node matching the node name', () => {
                const expected = 'First';
                const actual = getNodeByPath(xmlDocument, Word.t).textContent;
                expect(actual).toStrictEqual(expected);
            });

            it('Should get the node matching the id', () => {
                const expected = '707BD5C8';
                const actual = getNodeByPath(xmlDocument, '#paragraph-6').getAttribute(Word.paraId);
                expect(actual).toEqual(expected);
            });

            it('Should error using an id selector from a node other than a document node', () => {
                const body = getNodeByPath(xmlDocument, Word.body);
                expect(() => getNodeByPath(body, '#paragraph-6')).toThrowError('\'#\' selectors must be used from a document node');
            });

            it('Should get the node matching the attribute', () => {
                const expected = 'Third';
                const actual = getNodeByPath(xmlDocument, '[hidden]').textContent;
                expect(actual).toEqual(expected);
            });

            it('Should support syntactic sugar', () => {
                const expected = '707BD5C8';
                const actual = get('#paragraph-6').from(xmlDocument).getAttribute(Word.paraId);
                expect(actual).toEqual(expected);
            });
        });
    });

    describe('Manipulate nodes', () => {
        describe('Setting attributes', () => {
            it('Should set an attribute', () => {
                const wR = getNodeByPath(xmlDocument, Word.r);
                expect(wR.getAttribute(Word.rsidR)).toBeFalsy();

                setNodeAttributes(wR, { [Word.rsidR]: '000000' });

                expect(wR.getAttribute(Word.rsidR)).toEqual('000000');
            });

            it('Should set multiple attributes', () => {
                const wP = getNodeByPath(xmlDocument, Word.p);
                expect(wP.getAttribute(Word.paraId)).toBeFalsy();
                expect(wP.getAttribute(Word.rsidRDefault)).toBeFalsy();

                setNodeAttributes(wP, { [Word.paraId]: '000001', [Word.rsidRDefault]: '000002' });

                expect(wP.getAttribute(Word.paraId)).toEqual('000001');
                expect(wP.getAttribute(Word.rsidRDefault)).toEqual('000002');
            });

            it('Should support syntactic sugar', () => {
                const wR = get(Word.r).from(xmlDocument);
                expect(wR.getAttribute(Word.rsidR)).toBeFalsy();

                set({ [Word.rsidR]: '000000' }).to(wR);

                expect(wR.getAttribute(Word.rsidR)).toEqual('000000');
            });
        });

        describe('Appending child nodes', () => {
            it('Should append child nodes', () => {
                const wR = getNodeByPath(xmlDocument, `${Word.r}(1)`);
                const wIns = getNodeByPath(xmlDocument, Word.ins);

                appendChildNodes(wIns, [ wR ]);

                const actual = getNodesByPath(xmlDocument, `${Word.p}(1) > ${Word.r} ${Word.t}`)
                    .map(wT => wT.textContent);

                expect(actual).toStrictEqual([
                    'First',
                ]);
            });

            it('Should support syntactic sugar', () => {
                const wR = get(`${Word.r}(1)`).from(xmlDocument);
                const wIns = get(Word.ins).from(xmlDocument);

                append(wR).to(wIns);

                const actual = get(`${Word.p}(1) > ${Word.r} ${Word.t}`).all().from(xmlDocument)
                    .map(wT => wT.textContent);

                expect(actual).toStrictEqual([
                    'First',
                ]);
            });
        });

        describe('Creating nodes', () => {
            it('Should create a node', () => {
                const expected = 'Lorem ipsum ';

                const wDel = createNode({
                    document: xmlDocument,
                    name: Word.del,
                    children: [ createNode({
                        document: xmlDocument,
                        name: Word.r,
                        children: [ createNode({
                            document: xmlDocument,
                            name: Word.delText,
                            attributes: { [Word.space]: Word.preserve },
                            children: [ xmlDocument.createTextNode(expected) ],
                        }) ],
                    }) ],
                });

                expect(wDel.nodeName).toEqual(Word.del);
                expect(getNodeByPath(wDel, Word.delText).getAttribute(Word.space)).toEqual(Word.preserve);
                expect(getNodeByPath(wDel, Word.delText).textContent).toEqual(expected);
            });

            it('Should support syntactic sugar', () => {
                const expected = 'Lorem ipsum ';

                const wDel = create(Word.del)
                    .withChildren([
                        create(Word.r)
                            .withChildren([
                                create(Word.delText)
                                    .withAttributes({
                                        [Word.space]: Word.preserve,
                                    })
                                    .andChildren([
                                        xmlDocument.createTextNode(expected),
                                    ])
                                    .for(xmlDocument),
                            ])
                            .for(xmlDocument),
                    ])
                    .for(xmlDocument);

                expect(wDel.nodeName).toEqual(Word.del);
                expect(getNodeByPath(wDel, Word.delText).getAttribute(Word.space)).toEqual(Word.preserve);
                expect(getNodeByPath(wDel, Word.delText).textContent).toEqual(expected);
            });
        });

        describe('Inserting nodes', () => {
            it('Should insert a node after another node with a next sibling', () => {
                const wR = createNode({
                    document: xmlDocument,
                    name: Word.r,
                    children: [ createNode({
                        document: xmlDocument,
                        name: Word.t,
                        children: [ xmlDocument.createTextNode('Lorem ipsum') ],
                    }) ],
                });

                const wRFirst = getNodeByPath(xmlDocument, Word.r);

                insertAfterNode(wRFirst, wR);

                const actual = getNodesByPath(xmlDocument, `${Word.p}(1) ${Word.r} ${Word.t}`)
                    .map(wT => wT.textContent);

                expect(actual).toStrictEqual([
                    'First',
                    'Lorem ipsum',
                    ' and second',
                    ' right before',
                ]);
            });

            it('Should insert a node after another node with no next sibling', () => {
                const wR = createNode({
                    document: xmlDocument,
                    name: Word.r,
                    children: [ createNode({
                        document: xmlDocument,
                        name: Word.t,
                        children: [ xmlDocument.createTextNode('Lorem ipsum') ],
                    }) ],
                });

                const wIns = getNodeByPath(xmlDocument, Word.ins);

                insertAfterNode(wIns, wR);

                const actual = getNodesByPath(xmlDocument, `${Word.p}(1) ${Word.r} ${Word.t}`)
                    .map(wT => wT.textContent);

                expect(actual).toStrictEqual([
                    'First',
                    ' and second',
                    ' right before',
                    'Lorem ipsum',
                ]);
            });

            it('Should insert a node before another node', () => {
                const wR = createNode({
                    document: xmlDocument,
                    name: Word.r,
                    children: [ createNode({
                        document: xmlDocument,
                        name: Word.t,
                        children: [ xmlDocument.createTextNode('Lorem ipsum') ],
                    }) ],
                });

                const wIns = getNodeByPath(xmlDocument, Word.ins);

                insertBeforeNode(wIns, wR);

                const actual = getNodesByPath(xmlDocument, `${Word.p}(1) ${Word.r} ${Word.t}`)
                    .map(wT => wT.textContent);

                expect(actual).toStrictEqual([
                    'First',
                    ' and second',
                    'Lorem ipsum',
                    ' right before',
                ]);
            });

            it('Should support syntactic sugar', () => {
                const wR = create(Word.r)
                    .withChildren([
                        create(Word.t)
                            .andChildren([
                                xmlDocument.createTextNode('Lorem ipsum'),
                            ])
                            .for(xmlDocument),
                    ])
                    .for(xmlDocument);

                const wIns = get(Word.ins).from(xmlDocument);

                insert(wR).before(wIns);

                const actual = get(`${Word.p}(1) ${Word.r} ${Word.t}`).all().from(xmlDocument)
                    .map(wT => wT.textContent);

                expect(actual).toStrictEqual([
                    'First',
                    ' and second',
                    'Lorem ipsum',
                    ' right before',
                ]);
            });
        });

        describe('Removing nodes', () => {
            it('Should remove a node', () => {
                const wInssBefore = getNodesByPath(xmlDocument, Word.ins);
                expect(wInssBefore).toHaveLength(2);

                const wIns = getNodeByPath(xmlDocument, Word.ins);
                removeNode(wIns);

                const wInssAfter = getNodesByPath(xmlDocument, Word.ins);
                expect(wInssAfter).toHaveLength(1);
            });

            it('Should support syntactic sugar', () => {
                const wInssBefore = get(Word.ins).all().from(xmlDocument);
                expect(wInssBefore).toHaveLength(2);

                const wIns = get(Word.ins).from(xmlDocument);
                remove(wIns);

                const wInssAfter = get(Word.ins).all().from(xmlDocument);
                expect(wInssAfter).toHaveLength(1);
            });
        });
    });
});
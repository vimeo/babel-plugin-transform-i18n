module.exports = function({ types: t }) {
    function getNodeForValue(value, tokens) {
        if (value.match(/^\{.*?\}$/) && tokens[value]) {
            return tokens[value];
        }

        return t.stringLiteral(value);
    }

    return {
        visitor: {
            CallExpression(path, state) {
                const translationFunctionName = state.opts.functionName || 't';
                const dictionary = state.opts.dictionary || {};

                if (t.isIdentifier(path.node.callee) && path.node.callee.name === translationFunctionName) {
                    let string = path.node.arguments[0].extra.rawValue;

                    if (dictionary[string]) {
                        string = dictionary[string];
                    }

                    if (path.node.arguments.length > 1 && t.isObjectExpression(path.node.arguments[1])) {
                        const tokens = path.node.arguments[1].properties.reduce((previous, current) => {
                            previous[`{${current.key.name}}`] = current.value;
                            return previous;
                        }, {});

                        const replacementNode = string.split(/(\{.*?\})/g).filter((component) => {
                            return component !== '';
                        }).reduce((previous, current, i) => {
                            if (i === 1) {
                                previous = getNodeForValue(previous, tokens);
                            }

                            const currentNode = getNodeForValue(current, tokens);

                            if (t.isStringLiteral(currentNode)) {
                                // If the previous node is a StringLiteral, return a combined StringLiteral
                                if (t.isStringLiteral(previous)) {
                                    return t.stringLiteral(`${previous.value}${currentNode.value}`);
                                }

                                // If the previous node is a BinaryExpression with a StringLiteral on the right side,
                                // update the BinaryExpression to have a combined StringLiteral on the right
                                if (t.isBinaryExpression(previous) && t.isStringLiteral(previous.right)) {
                                    previous.right = t.stringLiteral(`${previous.right.value}${currentNode.value}`);
                                    return previous;
                                }
                            }

                            return t.binaryExpression('+', previous, currentNode);
                        });

                        path.replaceWith(replacementNode);
                        return;
                    }

                    path.replaceWith(t.stringLiteral(string));
                }
            }
        }
    };
};

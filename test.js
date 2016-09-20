import test from 'ava';
import fs from 'fs';
import path from 'path';
import i18nPlugin from './index';
import { transformFileSync } from 'babel-core';

function babel(t, input, expected) {
    const casePath = path.dirname(input);
    const optionsFile = path.join(casePath, 'options.json');

    let options = {};
    if (fs.existsSync(optionsFile)) {
        options = JSON.parse(fs.readFileSync(optionsFile).toString());
    }

    const compiled = transformFileSync(input, {
        babelrc: false,
        plugins: [
            [i18nPlugin, options]
        ]
    }).code;

    expected = fs.readFileSync(expected).toString();

    t.true(compiled.trim() === expected.trim());
}

babel.title = (providedTitle) => providedTitle.replace('-', ' ');

const fixturesDir = path.join(__dirname, 'test/fixtures');
fs.readdirSync(fixturesDir).forEach((caseName) => {
    const fixtureDir = path.join(fixturesDir, caseName);
    test(caseName, babel, path.join(fixtureDir, 'actual.js'), path.join(fixtureDir, 'expected.js'));
});

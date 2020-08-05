const ELK = require('elkjs')
const elksvg = require('../elkjs-svg');

const fs = require('fs');
const xml2js = require('xml2js');

const testCase = require('mocha').it;
const assert = require('chai').assert;

const testcase_directory = "test/testcases"
var files = fs.readdirSync(testcase_directory);
files = files.filter(filename => filename.endsWith(".json"));

files.forEach(json_filename => {
    testCase("Checking " + json_filename, () => {

        fs.readFile(testcase_directory + "/" + json_filename, "utf-8", (err, data) => {
            const elk = new ELK()
            const graph = JSON.parse(data)
            elk.layout(graph)
                .then(data => {
                    const renderer = new elksvg.Renderer();
                    const result = renderer.toSvg(data);

                    const svg_filename = json_filename.replace(".json", ".svg");
                    fs.readFile(testcase_directory + "/" + svg_filename, "utf-8", (err, expected) => {
                        xml2js.parseString(result, {trim: true}, (err, parsed_result) => {
                            xml2js.parseString(expected, {trim: true}, (err, parsed_expected) => {
                                testCase(json_filename, () => {
                                    assert.deepEqual(parsed_result, parsed_expected)
                                });
                            })
                        });
                    });
                })
                .catch(console.error);
        });
    });
});

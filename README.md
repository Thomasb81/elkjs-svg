elkjs-svg
=== 

A simple SVG generator for JSON graphs laid out 
with [elkjs](https://github.com/kieler/elkjs)
that requires no further dependencies.
We mainly use it for debugging and rapid prototyping.

For more complex use cases using [D3.js](https://d3js.org/) 
should be more suitable. 

Usage 
===

If you want to use it in the browser, 
consider using [browserify](browserify.org). 

Apart from that do:

```
npm install elkjs-svg
```
```
var elksvg = require('elkjs-svg');

var renderer = new elksvg.Renderer();
var svg = renderer.toSvg(graph);
console.log(svg);
```

The generated SVG elements can be styled using css. 
A simple style definition is already included and used as 
default. 
Each SVG element's id equals the id in the json graph. 
Additionally, nodes, edges, ports and labels 
receive a class attribute equal to their type (e.g. `.node`). 

Custom styles and svg definitions can be specified as follows:

```
const ELK = require('elkjs')
const elksvg = require('elkjs-svg');

var graph = {
  "id": "root",
  "layoutOptions": {
    "elk.algorithm": "layered"
  },
  "children": [
    {"id": "n1", "width": 30, "height": 30},
    {"id": "n2", "width": 30, "height": 30},
    {"id": "n3", "width": 30, "height": 30}
  ],
  "edges": [
    {"id": "e1", "sources": ["n1"], "targets": ["n2"]},
    {"id": "e2", "sources": ["n1"], "targets": ["n3"]}
  ]
}

const elk = new ELK()
elk.layout(graph)
    .then(data => {
      var renderer = new elksvg.Renderer();
      var svg = renderer.toSvg(
        data,
        styles=`
          rect {
            opacity: 0.8;
            fill: #6094CC;
            stroke-width: 1;
            stroke: #222222;
          }
        `, 
        defs=`
          <marker id="node">
            <path d="0,7 L10,4 L0,1 L0,7" style="" />
          </marker>
        `
      );
      console.log(svg);
    })
```

To remove all the default styling and defs, set them to en empty string while calling toSvg().

It is possible to specify further attributes, classes, and styles 
as part of the json graph. A node definition like this
```
[...]
{
  "id": "node1",
  "class": ["myClass", "otherClass"],
  "attributes": {
    "data-foo": "bar",
    "rx": 5
  },
  "style": "fill: #ddd;"
}
```
results in a corresponding svg element 
```
<rect id="node1" class="myClass otherClass node" x="12" y="12" width="0" height="0" style="fill: #ddd;" data-foo="bar" rx="5" />
```

Running tests
===

The test runner goes through all files in `test/testcases/*.json`, renders them with ELK, and compares the result with the SVG with the same name.

Run all the tests by typing `npm test` in the project root. 

To run just one test use `ONLY_TEST="simple" npm test`, where "simple" is the name of the json files you want to render.

To add a new testcase, put a new json files into test/testcases, and use the test-render script to generate a new SVG:

```
env ONLY_RENDER="your-testcase" npm run test-render | awk "NR>4" > test/testcases/your-testcase.svg
```

This tells the test-render script to only render your-testcase, removes the first four lines (which are output from npm), and writes the resulting SVG to the path you specify.

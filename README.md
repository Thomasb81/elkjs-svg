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

It helps the renderer to know which 
layout options have been used, e.g. 
to properly render edges either 
with polylines or paths (splines).

```
var opts = { edgeRouting: "SPLINES" };
renderer.usedLayoutOptions(opts)
```

The generated SVG elements can be styled using css. 
A simple style definition is already included and used as 
default. 
Each SVG element's id equals the id in the json graph. 
Additionally, nodes, edges, ports and labels 
receive a class attribute equal to their type (e.g. `.node`). 

Custom styles and svg definitions can be specified as follows, 
note that you explicitly have to include the default style 
if you add further styles.
```
var customstyles = ['...', '...'];
renderer.styles([elksvg.styles.simple].concat(customstyles));
renderer.defs(...);
```

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
<rect id="node1" class="myClass otherClass node" x="0" y="0" width="0" height="0" style="fill: #ddd;" data-foo="bar" rx="5" />
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

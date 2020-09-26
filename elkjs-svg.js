"use strict";

const layoutOptions = require("./src/opts.js");
const styles = require("./src/styles.js");
const defs = require("./src/defs.js");
const beautifer = require("./src/beautifier.js");

function Renderer() {
  // configuration
  this._style = styles.__defaults.map(s => styles[s]).join("\n");
  this._defs = defs.__defaults.map(d => defs[d]).join("\n");

  this.reset();
}

Renderer.prototype = {
  constructor: Renderer,

  reset() {
    // internal housekeeping
    this._edgeRoutingStyle = {
      __global: "POLYLINE"
    };
    this._parentIds = {};
    this._edgeParents = {};
  },

  init(root) {
    // reset
    this.reset();
    this.registerParentIds(root);
    this.registerEdges(root);
  },

  /* Utility methods. */

  // edges can be specified anywhere, there coordinates however are relative
  //  a) to the source node's parent
  //  b) the source node, if the target is a descendant of the source node
  isDescendant(parent, node) {
    var current = node.id;
    while (this._parentIds[current]) {
      current = this._parentIds[current];
      if (current == parent.id) {
          return true;
      }
    }
    return false;
  },

  getOption(e, id) {
    if (!e) {
      return undefined;
    }
    if (e.id) {
      return e.id;
    }
    var suffix = id.substr(id.lastIndexOf('.') + 1);
    if (e[suffix]) {
      return e[suffix];
    }
    return undefined;
  },

  registerParentIds(p) {
    this._edgeParents[p.id] = [];
    if (p.properties) {
      var er = this.getOption(p.properties, layoutOptions.edgeRouting);
      if (er) {
        this._edgeRoutingStyle[p.id] = er;
      }
    }
    (p.children || []).forEach((c) => {
      this._parentIds[c.id] = p.id;
      this.registerParentIds(c);
    });
  },

  registerEdges(p) {
    (p.edges || []).forEach((e) => {
      e.sources.forEach(source_id => {
        e.targets.forEach(target_id => {
          if (source_id.includes(":")) {
            source_id = source_id.slice(0, source_id.indexOf(":"));
          }
          if (!this.isDescendant(source_id, target_id)) {
            source_id = this._parentIds[source_id];
          }
          this._edgeParents[source_id].push(e);
        });
      });
    });
    (p.children || []).forEach(c => this.registerEdges(c));
  },

  /*
   * Rendering methods.
   */

  renderRoot(root) {
    return `
      <svg version="1.1" xmlns="http://www.w3.org/2000/svg"
        width="${root.width || 100}" height="${root.height || 100}">
        <defs>
          ${this.svgCss(root.css || this._style)}
          ${root.defs || this._defs}
        </defs>
        ${this.renderGraph(root)}
      </svg>
    `
  },

  renderGraph(graph) {
    // paint edges first such that ports are drawn on top of them
    return `
      <g transform="translate(${(graph.x || 0) + "," + (graph.y || 0)})">
        ${(this._edgeParents[graph.id] || []).map((e) => { return this.renderEdge(e, graph); }).join("\n")}
        ${(graph.children || []).map(c => this.renderNode(c)).join("\n")}
        ${(graph.children || []).filter((c) => { return c.children != null && c.children.length > 0; })
                                .map(c => this.renderGraph(c))
                                .join("\n")}
      </g>
    `
  },

  renderNode(node) {
    if (node.ports || node.labels) {
      return `
        ${this.renderRect(node)}
        <g transform="translate(${(node.x || 0) + "," + (node.y || 0)})">
          ${node.ports? (node.ports || []).map(p => this.renderPort(p)).join("\n"): ""}
          ${node.labels? (node.labels || []).map(l => this.renderLabel(l)).join("\n"): ""}
        </g>
      `
    }
    return this.renderRect(node)
  },

  renderRect(node) {
    return `
      <rect ${this.idClass(node, "node")} ${this.posSize(node)} ${this.style(node)} ${this.attributes(node)} />
    `
  },

  renderPort(port) {
    if (port.labels) {
      return `
        ${this.renderRect(port)}
        <g class="port" transform="translate(${(port.x || 0) + "," + (port.y || 0)})">
          ${this.renderLabels(port.labels)}
        </g>
      `
    }
    return this.renderRect(port);
  },

  renderEdge(edge, node) {
    var bends = this.getBends(edge.sections);

    if (this._edgeRoutingStyle[node.id] == "SPLINES" || this._edgeRoutingStyle.__global == "SPLINES") {
      return `
        ${this.renderPath(edge, bends)}
        ${this.renderLabels(edge.labels)}
      `
    }
    return `
      ${this.renderPolyline(edge, bends)}
      ${this.renderLabels(edge.labels)}
    `
  },

  renderPath(edge, bends) {
    return `
      <path d="${this.bendsToSpline(bends)}" ${this.idClass(edge, "edge")} ${this.style(edge)} ${this.attributes(edge)} />
    `
  },

  renderPolyline(edge, bends) {
    return `
      <polyline points="${this.bendsToPolyline(bends)}" ${this.idClass(edge, "edge")} ${this.style(edge)} ${this.attributes(edge)} />
    `
  },

  getBends(sections) {
    var bends = [];
    if (sections && sections.length > 0) {
      sections.forEach(section => {
        if (section.startPoint) {
          bends.push(section.startPoint);
        }
        if (section.bendPoints) {
          bends = bends.concat(section.bendPoints);
        }
        if (section.endPoint) {
          bends.push(section.endPoint);
        }
      });
    }
    return bends;
  },

  renderLabels(labels) {
    return (labels || []).map(l => this.renderLabel(l)).join("\n")
  },

  renderLabel(label) {
    return `
      <text ${this.idClass(label)} ${this.posSize(label)} ${this.style(label)} ${this.attributes(label)}>
        ${label.text}
      </text>
    `
  },

  bendsToPolyline(bends) {
    return bends.map(bend => `${bend.x},${bend.y}`).join(" ")
  },

  bendsToSpline(bends) {
    if (!bends.length) {
      return ""
    }

    let {x, y} = bends[0];
    points = [`M${x} ${y}`]

    for (let i = 1; i < bends.length; i = i+3) {
      var left = bends.length - i;
      if (left == 1) {
        points.push(`L${bends[i].x + " " + bends[i].y}`);
      } else if (left == 2) {
        points.push(`Q${bends[i].x + " " + bends[i].y}`);
        points.push(bends[i+1].x + " " + bends[i+1].y);
      } else {
        points.push(`C${bends[i].x + " " + bends[i].y}`);
        points.push(bends[i+1].x + " " + bends[i+1].y);
        points.push(bends[i+2].x + " " + bends[i+2].y);
      }
    }
    return points.join(" ");
  },

  svgCss(css) {
    return `
      <style type="text/css">
      <![CDATA[
        ${css}
      ]]>
      </style>
    `
  },

  posSize(e) {
    return `x="${e.x | 0}" y="${e.y | 0}" width="${e.width | 0}" height="${e.height | 0}" `
  },

  idClass(e, className) {
    var elemClasses = Array.isArray(e.class)? e.class.join(" "): e.class;
    var classes = [elemClasses, className].filter(c => c).join(" ")
    return `${e.id? `id="${e.id}"`: ""} ${classes? `class="${classes}"`: ""}`
  },

  style(e) {
    return `${e.style? `style="${e.style}"`: ""}`
  },

  attributes(e) {
    var s = "";
    if (e.attributes) {
      var attrs = e.attributes;
      for (var key in attrs) {
        s += `${key}="${attrs[key]}" `;
      }
    }
    return s;
  },


  /*
   * Public API
   */

  styles(...styles) {
    if (styles.length == 0)
      return this._style;
    this._style = styles.join(" ");
    return this;
  },

  defs(...defs) {
    if (defs.length == 0)
      return this._defs;
    this._defs = defs.join(" ");
    return this;
  },

  toSvg(json) {
   this.init(json);
   return beautifer(this.renderRoot(json));
  }
};


exports = module.exports = {
  Renderer,
  opts: layoutOptions,
  defs,
  styles
};

import React, { useMemo } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { colors } from '../tokens/colors';

export interface OceanNode {
  id: string;
  title: string;
  type: string;
}

export interface OceanEdge {
  source: string;
  target: string;
}

export interface OceanPalette {
  bg: string;
  border: string;
  text: string;
  note: string;
  project: string;
  book: string;
  tag: string;
}

interface OceanGraphProps {
  nodes: OceanNode[];
  edges: OceanEdge[];
  palette: OceanPalette;
  centerId?: string;
  onSelectNode: (id: string) => void;
}

/**
 * Grafo do vault renderizado em WebView + D3 force simulation.
 * O toque num nó devolve o id por postMessage para navegar até a nota.
 * Se o D3 (CDN) não carregar, cai num layout circular simples — o WebView
 * nunca fica em branco.
 */
function buildHtml(
  nodes: OceanNode[],
  edges: OceanEdge[],
  palette: OceanPalette,
  centerId?: string
): string {
  const payload = JSON.stringify({ nodes, edges, palette, centerId: centerId ?? '' });
  const script =
    'var DATA = ' +
    payload +
    ';\n' +
    'var C = DATA.palette;\n' +
    'var W = window.innerWidth || 320;\n' +
    'var H = window.innerHeight || 480;\n' +
    'document.documentElement.style.background = C.bg;\n' +
    'document.body.style.background = C.bg;\n' +
    'function post(id) {\n' +
    '  if (window.ReactNativeWebView) {\n' +
    '    window.ReactNativeWebView.postMessage(JSON.stringify({ type: "select", id: id }));\n' +
    '  }\n' +
    '}\n' +
    'var svg = d3.select("svg").attr("width", W).attr("height", H);\n' +
    'var g = svg.append("g");\n' +
    'var nodes = DATA.nodes.map(function (n) { return Object.assign({}, n); });\n' +
    'var edges = DATA.edges.map(function (e) { return { source: e.source, target: e.target }; });\n' +
    'var link = g.selectAll("line").data(edges).enter().append("line")\n' +
    '  .attr("stroke", C.border).attr("stroke-width", 1.2);\n' +
    'function radius(d) { return d.id === DATA.centerId ? 16 : 7; }\n' +
    'function fillOf(d) { return C[d.type] || C.note; }\n' +
    'var node = g.selectAll("circle").data(nodes).enter().append("circle")\n' +
    '  .attr("r", radius).attr("fill", fillOf).attr("stroke", C.bg).attr("stroke-width", 1.5)\n' +
    '  .style("cursor", "pointer")\n' +
    '  .on("click", function (event, d) { post(d.id); });\n' +
    'var label = g.selectAll("text").data(nodes).enter().append("text")\n' +
    '  .text(function (d) { return d.title; })\n' +
    '  .attr("fill", C.text).attr("font-size", 11).attr("font-family", "sans-serif")\n' +
    '  .attr("dx", 10).attr("dy", 4).style("pointer-events", "none");\n' +
    'var sim = d3.forceSimulation(nodes)\n' +
    '  .force("link", d3.forceLink(edges).id(function (d) { return d.id; }).distance(90))\n' +
    '  .force("charge", d3.forceManyBody().strength(-220))\n' +
    '  .force("center", d3.forceCenter(W / 2, H / 2))\n' +
    '  .on("tick", function () {\n' +
    '    link.attr("x1", function (d) { return d.source.x; })\n' +
    '      .attr("y1", function (d) { return d.source.y; })\n' +
    '      .attr("x2", function (d) { return d.target.x; })\n' +
    '      .attr("y2", function (d) { return d.target.y; });\n' +
    '    node.attr("cx", function (d) { return d.x; }).attr("cy", function (d) { return d.y; });\n' +
    '    label.attr("x", function (d) { return d.x; }).attr("y", function (d) { return d.y; });\n' +
    '  });\n' +
    'node.call(d3.drag()\n' +
    '  .on("start", function (event, d) { if (!event.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })\n' +
    '  .on("drag", function (event, d) { d.fx = event.x; d.fy = event.y; })\n' +
    '  .on("end", function (event, d) { if (!event.active) sim.alphaTarget(0); d.fx = null; d.fy = null; }));\n';

  const fallback =
    'function drawFallback() {\n' +
    '  var svg = d3.select("svg").attr("width", W).attr("height", H);\n' +
    '  var cx = W / 2, cy = H / 2, rad = Math.min(W, H) / 2 - 30;\n' +
    '  DATA.nodes.forEach(function (n, i) {\n' +
    '    var a = (i / DATA.nodes.length) * 2 * Math.PI;\n' +
    '    var x = cx + rad * Math.cos(a);\n' +
    '    var y = cy + rad * Math.sin(a);\n' +
    '    svg.append("circle").attr("cx", x).attr("cy", y).attr("r", 7)\n' +
    '      .attr("fill", C[n.type] || C.note).style("cursor", "pointer")\n' +
    '      .on("click", function () { post(n.id); });\n' +
    '    svg.append("text").text(n.title).attr("x", x + 10).attr("y", y + 4)\n' +
    '      .attr("fill", C.text).attr("font-size", 11);\n' +
    '  });\n' +
    '}\n' +
    'if (typeof d3 === "undefined") { drawFallback(); }\n';

  return (
    '<!DOCTYPE html><html><head><meta charset="utf-8" />' +
    '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />' +
    '<style>html,body{margin:0;padding:0;height:100%;overflow:hidden}svg{display:block}</style>' +
    '</head><body><svg></svg>' +
    '<script src="https://cdn.jsdelivr.net/npm/d3@7/dist/d3.min.js"></script>' +
    '<script>' +
    script +
    fallback +
    '</script></body></html>'
  );
}

export function OceanGraph({ nodes, edges, palette, centerId, onSelectNode }: OceanGraphProps) {
  const html = useMemo(
    () => buildHtml(nodes, edges, palette, centerId),
    [nodes, edges, palette, centerId]
  );

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data) as { type?: string; id?: string };
      if (data.type === 'select' && data.id) onSelectNode(data.id);
    } catch {
      // mensagem malformada: ignora
    }
  };

  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={['*']}
        source={{ html }}
        onMessage={handleMessage}
        javaScriptEnabled
        domStorageEnabled={false}
        style={styles.web}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary } as ViewStyle,
  web: { flex: 1, backgroundColor: colors.background.primary } as ViewStyle,
});
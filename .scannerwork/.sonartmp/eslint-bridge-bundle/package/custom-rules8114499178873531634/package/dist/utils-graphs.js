"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hierarchicalTarjan = exports.tarjan = exports.extractCfg = exports.subgraph = void 0;
const utils_1 = require("./utils");
/** Constructs a new subgraph that has only the specified vertices. */
function subgraph(g, vertexSubset) {
    return new Map(Array.from(vertexSubset).map(v => [v, g.get(v).filter(w => vertexSubset.has(w))]));
}
exports.subgraph = subgraph;
/**
 * Almost same as `subgraph`, but additionally stores the first vertex of the SCC as entry.
 */
function flowSubgraphFromScc(g, scc) {
    const sccSubgraph = subgraph(g, new Set(scc));
    return { graph: sccSubgraph, entry: scc[0] };
}
/**
 * Creates a new graph, with one vertex removed.
 */
function withoutVertex(g, v) {
    const result = new Map();
    for (const [k, successors] of g.entries()) {
        if (k !== v) {
            result.set(k, successors.filter(a => a !== v));
        }
    }
    return result;
}
/**
 * Extracts the control graph (string id's of basic blocks only) from a UCFG.
 */
function extractCfg(ucfg) {
    const graph = new Map();
    const entry = ucfg.getEntriesList()[0];
    const blocks = new Map();
    for (const b of ucfg.getBasicBlocksList()) {
        blocks.set(b.getId(), b);
        if (b.hasJump()) {
            const jump = utils_1.assertIsDefinedNonNull(b.getJump(), "Protobuf's .hasJump() was true, .getJump() must be non-null");
            graph.set(b.getId(), jump.getDestinationsList());
        }
        else {
            graph.set(b.getId(), []);
        }
    }
    return { flowGraph: { graph, entry }, originalVertices: blocks };
}
exports.extractCfg = extractCfg;
/**
 * Tarjan's SCC algorithm.
 *
 * Returns list of strongly connected components. The first node of every component
 * is the one that is discovered first by the DFS.
 */
function tarjan(graph) {
    // Implementation note:
    // With the exception of the added `toposort` buffer, and the fact that the bookkeeping is done
    // on external maps instead of mutating the nodes themselves, this method is almost 1:1 taken from here:
    // https://en.wikipedia.org/wiki/Tarjan%27s_strongly_connected_components_algorithm#The_algorithm_in_pseudocode
    const stack = [];
    const discoveryTime = new Map();
    const lowlink = new Map();
    const valuesOnStack = new Set();
    let index = 0;
    const sccs = [];
    for (const v of graph.keys()) {
        if (!discoveryTime.has(v)) {
            rec(v);
        }
    }
    function rec(v) {
        discoveryTime.set(v, index);
        lowlink.set(v, index);
        index++;
        stack.push(v);
        valuesOnStack.add(v);
        const successors = utils_1.assertIsDefinedNonNull(graph.get(v), `Every node must have a (possibly empty) list of successors, but this node had none: '${v}'`);
        for (const w of successors) {
            if (!discoveryTime.has(w)) {
                rec(w);
                const currLowlink = utils_1.assertIsDefinedNonNull(lowlink.get(v), `Current lowlink should always be set upon entry of the current method, but failed to retrieve for v = ${v} (1)`);
                const succLowlink = utils_1.assertIsDefinedNonNull(lowlink.get(w), 'Successor lowlink is set in the recursive invocation');
                lowlink.set(v, Math.min(currLowlink, succLowlink));
            }
            else if (valuesOnStack.has(w)) {
                const currLowlink = utils_1.assertIsDefinedNonNull(lowlink.get(v), 'Current lowlink always set upon entry of the current method. (2)');
                const succIndex = utils_1.assertIsDefinedNonNull(discoveryTime.get(w), 'Successor index is set in the recursive invocation');
                lowlink.set(v, Math.min(currLowlink, succIndex));
            }
        }
        if (lowlink.get(v) === discoveryTime.get(v)) {
            const newScc = [];
            let w;
            do {
                w = utils_1.assertIsDefinedNonNull(stack.pop(), 'The stack contains at least the current element, and is thus nonempty.');
                valuesOnStack.delete(w);
                newScc.push(w);
            } while (w !== v);
            newScc.reverse();
            sccs.push(newScc);
        }
    }
    if (stack.length !== 0) {
        throw new Error(`Illegal stack state: should be empty, but has ${stack.length} elements.`);
    }
    sccs.reverse();
    return sccs;
}
exports.tarjan = tarjan;
/**
 * Result of recursively applying Tarjan's SCC algorithm to the SCC's with entry node removed.
 */
class HierarchicalFlowScc {
    constructor(entry, subgraphs) {
        this.entry = entry;
        this.subgraphs = subgraphs;
    }
    getVertexOrdering() {
        return [this.entry, ...utils_1.flatMap(this.subgraphs, g => g.getVertexOrdering())];
    }
}
/**
 * Starts exactly as the usual Tarjan's SCC algorithm, but then proceeds with
 * each SCC in the following manner: assuming a strongly connected control flow graph as input, it deletes
 * the entry node, runs Tarjan's original SCC on the remaining subgraph, then (possibly) invokes
 * the same method recursively on each sub-SCC.
 *
 * @param f a non-necessarily strongly connected control flow graph
 * @returns results of recursively applying Tarjan's algorithm to SCC's with removed entry node.
 */
function hierarchicalTarjan(f) {
    // We need one separate `tarjan` invocation at top level, because the top-level graph
    // has no reason to be strongly connected (rather, it will be not strongly connected most of the time).
    const sccs = tarjan(f.graph);
    return sccs.map(scc => hierarchicalTarjanRec(flowSubgraphFromScc(f.graph, scc)));
}
exports.hierarchicalTarjan = hierarchicalTarjan;
/** Recursive helper function invoked by `hierarchicalTarjan` at the top-level. */
function hierarchicalTarjanRec(stronglyConnectedFlowGraph) {
    const graphWithoutEntry = withoutVertex(stronglyConnectedFlowGraph.graph, stronglyConnectedFlowGraph.entry);
    const sccs = tarjan(graphWithoutEntry);
    return new HierarchicalFlowScc(stronglyConnectedFlowGraph.entry, sccs.map(scc => hierarchicalTarjanRec(flowSubgraphFromScc(graphWithoutEntry, scc))));
}
//# sourceMappingURL=utils-graphs.js.map
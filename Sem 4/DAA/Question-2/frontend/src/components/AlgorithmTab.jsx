import styled, { keyframes } from "styled-components";

const fadeIn = keyframes`from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}`;

const Wrap = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  animation: ${fadeIn} 0.4s ease;
  @media (max-width: 900px) { grid-template-columns: 1fr; }
`;

const Card = styled.div`
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 1.25rem;
`;

const PanelTitle = styled.h2`
  font-size: 0.72rem;
  letter-spacing: 0.15em;
  color: var(--muted);
  text-transform: uppercase;
  margin-bottom: 1.1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  &::after { content:''; flex:1; height:1px; background:var(--border); }
`;

const Code = styled.pre`
  font-family: 'Space Mono', monospace;
  font-size: 0.75rem;
  line-height: 1.7;
  color: var(--text);
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 1rem 1.25rem;
  overflow-x: auto;
  counter-reset: line;

  .kw  { color: var(--accent);  font-weight: 700; }
  .fn  { color: var(--accent2); }
  .cm  { color: var(--muted);   font-style: italic; }
  .nm  { color: var(--accent3); }
`;

const Step = styled.div`
  display: flex;
  gap: 1rem;
  padding: 0.85rem 0;
  border-bottom: 1px solid rgba(30,45,74,0.5);
  &:last-child { border-bottom: none; }
`;

const StepNum = styled.div`
  width: 28px; height: 28px;
  border-radius: 50%;
  background: var(--accent);
  color: #000;
  font-weight: 800;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
`;

const StepContent = styled.div`
  h4 { font-size: 0.88rem; font-weight: 700; color: var(--text); margin-bottom: 0.3rem; }
  p  { font-size: 0.78rem; color: var(--muted); line-height: 1.6; }
  code { font-family: 'Space Mono', monospace; font-size: 0.72rem; color: var(--accent2);
    background: var(--surface2); padding: 0.1rem 0.3rem; border-radius: 3px; }
`;

const ProofBox = styled.div`
  background: rgba(56,189,248,0.07);
  border: 1px solid rgba(56,189,248,0.2);
  border-radius: 8px;
  padding: 1rem;
  margin-top: 1rem;

  h4 { color: var(--accent2); font-size: 0.82rem; margin-bottom: 0.5rem; }
  p  { color: var(--muted); font-size: 0.78rem; line-height: 1.6; }
  strong { color: var(--text); }
`;

const HeapBox = styled.div`
  margin-top: 1rem;
  padding: 1rem;
  background: var(--surface2);
  border-radius: 8px;
  border: 1px solid var(--border);

  h4 { font-size: 0.82rem; font-weight: 700; color: var(--highlight); margin-bottom: 0.75rem; }
`;

const HeapOp = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.4rem 0;
  font-size: 0.78rem;
  border-bottom: 1px solid rgba(30,45,74,0.3);
  &:last-child { border-bottom: none; }

  .op   { width: 100px; color: var(--accent2); font-family: 'Space Mono'; font-size: 0.72rem; }
  .cost { color: var(--accent); font-family: 'Space Mono'; font-size: 0.72rem; margin-left: auto; }
  .desc { color: var(--muted); font-size: 0.72rem; }
`;

export default function AlgorithmTab() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <Wrap>
        {/* Pseudocode */}
        <Card>
          <PanelTitle>Pseudocode — Min-Heap Dijkstra</PanelTitle>
          <Code>
            <span className="fn">DIJKSTRA</span>(<span className="nm">Graph</span>, <span className="nm">source</span>):{"\n"}
            {"  "}<span className="cm">// Step 1: Initialize distances</span>{"\n"}
            {"  "}<span className="kw">for</span> <span className="nm">each</span> node <span className="nm">v</span> <span className="kw">in</span> Graph:{"\n"}
            {"    "}<span className="nm">dist</span>[v] ← <span className="nm">∞</span>{"\n"}
            {"    "}<span className="nm">prev</span>[v] ← <span className="kw">null</span>{"\n"}
            {"  "}<span className="nm">dist</span>[source] ← <span className="nm">0</span>{"\n\n"}
            {"  "}<span className="cm">// Step 2: Create min-heap priority queue</span>{"\n"}
            {"  "}<span className="nm">PQ</span> ← <span className="fn">MinHeap</span>(){"\n"}
            {"  "}<span className="nm">PQ</span>.<span className="fn">push</span>((source, priority=<span className="nm">0</span>)){"\n\n"}
            {"  "}<span className="kw">while</span> PQ <span className="nm">not empty</span>:{"\n"}
            {"    "}<span className="cm">// Step 3: Extract minimum-distance node</span>{"\n"}
            {"    "}<span className="nm">u</span> ← <span className="nm">PQ</span>.<span className="fn">pop_min</span>(){"\n\n"}
            {"    "}<span className="kw">if</span> <span className="nm">u</span> <span className="kw">in</span> visited: <span className="kw">continue</span>{"\n"}
            {"    "}visited.<span className="fn">add</span>(<span className="nm">u</span>){"\n\n"}
            {"    "}<span className="cm">// Step 4: Relax all edges from u</span>{"\n"}
            {"    "}<span className="kw">for</span> <span className="nm">each</span> neighbor <span className="nm">v</span>, weight <span className="nm">w</span> <span className="kw">in</span> adj[u]:{"\n"}
            {"      "}<span className="nm">newDist</span> ← dist[u] + <span className="nm">w</span>{"\n"}
            {"      "}<span className="kw">if</span> <span className="nm">newDist</span> {"<"} dist[v]:{"\n"}
            {"        "}<span className="nm">dist</span>[v] ← newDist{"\n"}
            {"        "}<span className="nm">prev</span>[v] ← u{"\n"}
            {"        "}<span className="nm">PQ</span>.<span className="fn">push</span>((v, priority=newDist)){"\n\n"}
            {"  "}<span className="kw">return</span> <span className="nm">dist</span>, <span className="nm">prev</span>{"\n\n"}
            <span className="cm">{"// Reconstruct path to target t:"}</span>{"\n"}
            <span className="fn">GET_PATH</span>(<span className="nm">prev</span>, <span className="nm">t</span>):{"\n"}
            {"  "}<span className="nm">path</span> ← []{"\n"}
            {"  "}<span className="kw">while</span> t ≠ <span className="kw">null</span>:{"\n"}
            {"    "}path.<span className="fn">prepend</span>(<span className="nm">t</span>){"\n"}
            {"    "}<span className="nm">t</span> ← prev[t]{"\n"}
            {"  "}<span className="kw">return</span> <span className="nm">path</span>
          </Code>
        </Card>

        {/* Step-by-step explanation */}
        <Card>
          <PanelTitle>Step-by-Step Explanation</PanelTitle>
          {[
            {
              title: "Initialization",
              body: <>Set <code>dist[source] = 0</code>, all others <code>∞</code>. Create a min-heap and push the source with priority 0. This ensures we always process the closest unvisited node next.</>,
            },
            {
              title: "Greedy Selection (Extract-Min)",
              body: <>Pop the node <code>u</code> with the smallest known distance from the priority queue. Because all edge weights are non-negative, this distance is final — it cannot be improved later (Dijkstra's greedy guarantee).</>,
            },
            {
              title: "Edge Relaxation",
              body: <>For every neighbor <code>v</code> of <code>u</code>, check if going through <code>u</code> gives a shorter path: <code>dist[u] + w(u,v) &lt; dist[v]</code>. If yes, update and push <code>v</code> to the heap with the new priority.</>,
            },
            {
              title: "Visited Set",
              body: <>Once a node is popped and processed, it's added to the visited set. Subsequent pops of the same node (from stale heap entries) are skipped. This lazy deletion avoids heap decrease-key operations.</>,
            },
            {
              title: "Path Reconstruction",
              body: <>The <code>prev[]</code> array traces each node's optimal predecessor. Backtrack from target to source through <code>prev[]</code> to recover the full shortest path.</>,
            },
          ].map((s, i) => (
            <Step key={i}>
              <StepNum>{i+1}</StepNum>
              <StepContent>
                <h4>{s.title}</h4>
                <p>{s.body}</p>
              </StepContent>
            </Step>
          ))}
        </Card>
      </Wrap>

      <Wrap>
        {/* Correctness proof sketch */}
        <Card>
          <PanelTitle>Correctness — Proof Sketch</PanelTitle>
          <ProofBox>
            <h4>Invariant (maintained after each iteration)</h4>
            <p>
              For every node <strong>v</strong> in the visited set, <strong>dist[v]</strong> equals the true shortest path distance from the source to <strong>v</strong>.
            </p>
          </ProofBox>
          <ProofBox style={{ background: "rgba(74,222,128,0.07)", borderColor: "rgba(74,222,128,0.2)", marginTop: 0 }}>
            <h4>Key Lemma (why greedy works)</h4>
            <p>
              When a node <strong>u</strong> is extracted from the min-heap with distance <strong>d</strong>, no future relaxation can produce a path shorter than <strong>d</strong>. This holds because <strong>all edge weights ≥ 0</strong> — any path through an unvisited node can only be longer.
            </p>
          </ProofBox>
          <ProofBox style={{ background: "rgba(251,191,36,0.07)", borderColor: "rgba(251,191,36,0.2)", marginTop: 0 }}>
            <h4>Why Dijkstra fails with negative weights</h4>
            <p>
              A negative edge could provide a shortcut discovered <em>after</em> a node is finalized, violating the invariant. Use <strong>Bellman-Ford</strong> (O(VE)) for graphs with negative weights, or <strong>Johnson's algorithm</strong> for all-pairs.
            </p>
          </ProofBox>
        </Card>

        {/* Min-Heap operations */}
        <Card>
          <PanelTitle>Min-Heap Data Structure</PanelTitle>
          <p style={{ fontSize: "0.78rem", color: "var(--muted)", marginBottom: "1rem", lineHeight: 1.6 }}>
            The min-heap is a complete binary tree where every parent has a smaller key than its children. This guarantees O(log n) push and pop operations, which is what makes heap-based Dijkstra efficient for sparse graphs.
          </p>
          <HeapBox>
            <h4>Heap Operations</h4>
            {[
              ["push(v, d)",    "O(log V)", "Insert node with distance d; bubble up to restore heap property"],
              ["pop_min()",     "O(log V)", "Remove min; move last element to root, sink down"],
              ["peek_min()",    "O(1)",     "Read minimum without removing"],
              ["heapify(arr)", "O(V)",     "Build heap from array — used for initialization"],
              ["size()",       "O(1)",     "Number of elements in heap"],
            ].map(([op, cost, desc]) => (
              <HeapOp key={op}>
                <span className="op">{op}</span>
                <span className="desc">{desc}</span>
                <span className="cost">{cost}</span>
              </HeapOp>
            ))}
          </HeapBox>

          <div style={{ marginTop: "1rem", padding: "1rem", background: "var(--surface2)", borderRadius: 8, border: "1px solid var(--border)" }}>
            <div style={{ fontSize: "0.72rem", color: "var(--muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.6rem" }}>Implementation in this project</div>
            <div style={{ fontSize: "0.78rem", color: "var(--text)", lineHeight: 1.7 }}>
              Uses a <span style={{ color: "var(--accent)", fontWeight: 700 }}>binary min-heap</span> with lazy deletion. When a shorter path to <code style={{ fontFamily: "Space Mono", fontSize: "0.72rem", color: "var(--accent2)", background: "var(--surface)", padding: "0.1rem 0.3rem", borderRadius: 3 }}>v</code> is found, we push a <em>new entry</em> rather than updating the existing one. Stale entries are discarded at pop-time using a visited set check.
            </div>
          </div>

          <div style={{ marginTop: "1rem" }}>
            <div style={{ fontSize: "0.72rem", color: "var(--muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.6rem" }}>Complexity Summary</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
              {[
                ["Array-based",         "O(V²)",         "var(--danger)"],
                ["Binary Heap (this)",  "O((V+E) log V)","var(--accent)"],
                ["D-ary Heap",          "O((V+E) log_d V)","var(--accent2)"],
                ["Fibonacci Heap",      "O(E + V log V)","var(--accent3)"],
              ].map(([name, time, color]) => (
                <div key={name} style={{ background: "var(--surface)", borderRadius: 6, border: "1px solid var(--border)", padding: "0.6rem" }}>
                  <div style={{ fontSize: "0.68rem", color: "var(--muted)" }}>{name}</div>
                  <div style={{ fontSize: "0.88rem", fontWeight: 800, fontFamily: "Space Mono", color }}>{time}</div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </Wrap>
    </div>
  );
}

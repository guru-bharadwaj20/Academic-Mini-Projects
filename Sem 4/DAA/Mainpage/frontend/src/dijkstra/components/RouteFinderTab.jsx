import { useState } from "react";
import styled, { keyframes } from "styled-components";

const spin  = keyframes`to { transform: rotate(360deg); }`;
const fadeIn = keyframes`from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); }`;

/* ── layout ── */
const Grid = styled.div`
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: 1.5rem;
  @media (max-width: 900px) { grid-template-columns: 1fr; }
`;

const Panel = styled.div`
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 1.5rem;
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

/* ── controls ── */
const Label = styled.label`
  display: block;
  font-size: 0.7rem;
  letter-spacing: 0.12em;
  color: var(--muted);
  text-transform: uppercase;
  margin-bottom: 0.4rem;
  margin-top: 1rem;
`;

const Select = styled.select`
  width: 100%;
  background: var(--surface2);
  border: 1px solid var(--border);
  color: var(--text);
  padding: 0.6rem 0.75rem;
  border-radius: 8px;
  font-size: 0.85rem;
  appearance: none;
  cursor: pointer;
  &:focus { outline: none; border-color: var(--accent); }
`;

const WeightRow = styled.div`
  display: grid;
  grid-template-columns: repeat(3,1fr);
  gap: 0.5rem;
  margin-top: 0.85rem;
`;

const WeightBtn = styled.button`
  padding: 0.55rem 0.3rem;
  border-radius: 8px;
  border: 1px solid ${p => p.$active ? "var(--accent)" : "var(--border)"};
  background: ${p => p.$active ? "rgba(249,115,22,.15)" : "var(--surface2)"};
  color: ${p => p.$active ? "var(--accent)" : "var(--muted)"};
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  transition: all .2s;
  cursor: pointer;
  &:hover { border-color:var(--accent); color:var(--accent); }
`;

const BtnRow = styled.div`display: flex; gap: .6rem; margin-top: 1.25rem;`;

const Btn = styled.button`
  flex: ${p => p.$full ? "1" : "0 0 auto"};
  padding: 0.75rem 1rem;
  border-radius: 10px;
  border: none;
  background: ${p => p.$secondary ? "var(--surface2)" : "var(--accent)"};
  border: 1px solid ${p => p.$secondary ? "var(--border)" : "transparent"};
  color: ${p => p.$secondary ? "var(--text)" : "#000"};
  font-family: 'Syne', sans-serif;
  font-weight: 800;
  font-size: 0.82rem;
  letter-spacing: .06em;
  transition: all .2s;
  cursor: pointer;
  &:hover:not(:disabled) { opacity: .88; transform:translateY(-1px); }
  &:disabled { opacity:.45; cursor:not-allowed; }
`;

const Spinner = styled.div`
  width:14px; height:14px;
  border:2px solid rgba(0,0,0,.25);
  border-top-color:#000;
  border-radius:50%;
  animation:${spin} .7s linear infinite;
  display:inline-block; vertical-align:middle; margin-right:.4rem;
`;

/* ── result stats ── */
const StatRow = styled.div`
  display: grid;
  grid-template-columns: repeat(4,1fr);
  gap: .75rem;
  margin-bottom: 1.1rem;
`;

const Stat = styled.div`
  background:var(--surface2);
  border:1px solid var(--border);
  border-radius:10px;
  padding:.75rem .85rem;
  .val { font-size:1.4rem; font-weight:800; color:${p=>p.$c||"var(--accent)"}; font-family:'Space Mono',monospace; line-height:1; }
  .lbl { font-size:.65rem; color:var(--muted); letter-spacing:.1em; text-transform:uppercase; margin-top:.25rem; }
`;

/* ── path viz ── */
const PathNodes = styled.div`
  display:flex; flex-wrap:wrap; align-items:center; gap:.4rem;
`;

const PathNode = styled.div`
  background:${p=>p.$first?"rgba(249,115,22,.2)":p.$last?"rgba(74,222,128,.2)":"var(--surface)"};
  border:1px solid ${p=>p.$first?"var(--accent)":p.$last?"var(--accent3)":"var(--border)"};
  color:${p=>p.$first?"var(--accent)":p.$last?"var(--accent3)":"var(--text)"};
  padding:.32rem .65rem; border-radius:20px; font-size:.75rem; font-weight:600;
`;

const Arrow = styled.div`
  display:flex; flex-direction:column; align-items:center;
  font-family:'Space Mono',monospace; font-size:.6rem; color:var(--accent2);
`;

/* ── edge table ── */
const EdgeTable = styled.table`
  width:100%; border-collapse:collapse; font-size:.78rem;
  th { text-align:left; padding:.45rem .7rem; color:var(--muted); font-size:.65rem; letter-spacing:.1em; text-transform:uppercase; border-bottom:1px solid var(--border); }
  td { padding:.5rem .7rem; border-bottom:1px solid rgba(30,45,74,.4); font-family:'Space Mono',monospace; }
  tr:last-child td { border-bottom:none; }
`;

const CBar = styled.div`
  width:52px; height:5px; background:var(--surface); border-radius:3px; overflow:hidden;
  div { height:100%; width:${p=>Math.min((p.$v-1)*100,100)}%;
    background:${p=>p.$v>1.8?"var(--danger)":p.$v>1.4?"var(--highlight)":"var(--accent3)"}; border-radius:3px; }
`;

/* ── compare panel ── */
const CompareGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3,1fr);
  gap:1rem;
  animation:${fadeIn} .4s ease;
  @media (max-width:800px) { grid-template-columns:1fr; }
`;

const CompareCard = styled.div`
  background:var(--surface2);
  border:1px solid ${p=>p.$winner?"var(--accent3)":"var(--border)"};
  border-radius:12px;
  padding:1rem;
  position:relative;
  overflow:hidden;
  ${p=>p.$winner&&`box-shadow:0 0 20px rgba(74,222,128,.12);`}
`;

const WinnerBadge = styled.div`
  position:absolute; top:.6rem; right:.6rem;
  background:rgba(74,222,128,.2); border:1px solid var(--accent3);
  color:var(--accent3); font-size:.6rem; font-weight:800; letter-spacing:.12em;
  padding:.2rem .5rem; border-radius:10px;
`;

const MetricHeader = styled.div`
  font-size:.7rem; letter-spacing:.15em; color:var(--muted);
  text-transform:uppercase; margin-bottom:.75rem;
  display:flex; align-items:center; gap:.4rem;
`;

const MetricVal = styled.div`
  font-size:1.6rem; font-weight:800;
  font-family:'Space Mono',monospace;
  color:${p=>p.$c||"var(--accent)"};
  line-height:1; margin-bottom:.2rem;
`;

const MetricSub = styled.div`font-size:.68rem; color:var(--muted); margin-bottom:.85rem;`;

const PathPill = styled.div`
  font-size:.68rem; color:var(--text);
  background:var(--surface);
  border:1px solid var(--border);
  border-radius:6px;
  padding:.4rem .6rem;
  line-height:1.6;
`;

const DiffBadge = styled.span`
  font-size:.62rem;
  color:${p=>p.$bad?"var(--danger)":"var(--muted)"};
  margin-left:.35rem;
  font-family:'Space Mono',monospace;
`;

const StepList = styled.div`
  max-height:240px; overflow-y:auto;
  display:flex; flex-direction:column; gap:.35rem;
`;

const Step = styled.div`
  display:flex; align-items:center; gap:.65rem;
  padding:.42rem .65rem;
  background:var(--surface2); border-radius:6px;
  font-size:.75rem;
  border-left:2px solid ${p=>p.$hl?"var(--accent)":"var(--border)"};
`;

const StepNum = styled.div`
  width:20px; height:20px; border-radius:50%;
  background:${p=>p.$hl?"var(--accent)":"var(--surface)"};
  color:${p=>p.$hl?"#000":"var(--muted)"};
  display:flex; align-items:center; justify-content:center;
  font-size:.65rem; font-weight:800; flex-shrink:0;
`;

const Placeholder = styled.div`
  width:100%; height:200px; background:var(--surface2);
  border-radius:10px; border:1px solid var(--border);
  display:flex; align-items:center; justify-content:center;
  flex-direction:column; gap:.6rem; color:var(--muted);
  font-size:.82rem; margin-bottom:1.25rem;
`;

/* ── svg map ── */
function MapViz({ result }) {
  if (!result?.pathCoords?.length) return null;
  const coords = result.pathCoords;
  const lats = coords.map(c=>c.lat), lngs = coords.map(c=>c.lng);
  const minLat=Math.min(...lats)-.025, maxLat=Math.max(...lats)+.025;
  const minLng=Math.min(...lngs)-.025, maxLng=Math.max(...lngs)+.025;
  const W=620,H=260;
  const tx=lng=>((lng-minLng)/(maxLng-minLng))*(W-80)+40;
  const ty=lat=>((maxLat-lat)/(maxLat-minLat))*(H-60)+30;
  const pathD=coords.map((c,i)=>`${i?"L":"M"} ${tx(c.lng)} ${ty(c.lat)}`).join(" ");

  return (
    <div style={{background:"var(--surface2)",borderRadius:10,border:"1px solid var(--border)",overflow:"hidden",marginBottom:"1.1rem"}}>
      <div style={{padding:".5rem 1rem",borderBottom:"1px solid var(--border)",fontSize:".68rem",color:"var(--muted)",letterSpacing:".1em",textTransform:"uppercase"}}>
        Route Map
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%",height:260,display:"block"}}>
        {[.25,.5,.75].map(t=>(
          <g key={t}>
            <line x1={W*t} y1={0} x2={W*t} y2={H} stroke="var(--border)" strokeWidth=".4"/>
            <line x1={0} y1={H*t} x2={W} y2={H*t} stroke="var(--border)" strokeWidth=".4"/>
          </g>
        ))}
        <path d={pathD} fill="none" stroke="var(--accent)" strokeWidth="7" strokeOpacity=".12" strokeLinecap="round" strokeLinejoin="round"/>
        <path d={pathD} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="6 3"/>
        {coords.map((c,i)=>{
          const x=tx(c.lng),y=ty(c.lat),first=i===0,last=i===coords.length-1;
          const r=first||last?12:8;
          const fill=first?"var(--accent)":last?"var(--accent3)":"var(--accent2)";
          return (
            <g key={i}>
              <circle cx={x} cy={y} r={r} fill={fill} opacity=".9"/>
              <circle cx={x} cy={y} r={r*.4} fill="#000" opacity=".5"/>
              <text x={x} y={y-r-5} textAnchor="middle" fill="var(--text)" fontSize="8.5" fontFamily="Syne" fontWeight="700">
                {c.label.length>14?c.label.slice(0,13)+"…":c.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

const METRIC_META = {
  distance:   { icon:"📏", label:"Shortest Distance",   unit:"km",  key:"totalDist",   color:"var(--accent)",  desc:"Minimises total kilometres travelled" },
  time:       { icon:"⏱",  label:"Fastest Route",       unit:"min", key:"totalTime",   color:"var(--accent2)", desc:"Minimises travel time, ignores congestion" },
  congestion: { icon:"🚗",  label:"Least Congestion",   unit:"pts", key:"congScore",   color:"var(--accent3)", desc:"Minimises time × congestion — avoids jams" },
};

export default function RouteFinderTab({ nodes, api }) {
  const [source,     setSource]     = useState("PES_UNIVERSITY");
  const [target,     setTarget]     = useState("ELECTRONIC_CITY");
  const [weightType, setWeightType] = useState("distance");
  const [loading,    setLoading]    = useState(false);
  const [cmpLoading, setCmpLoading] = useState(false);
  const [result,     setResult]     = useState(null);
  const [compare,    setCompare]    = useState(null);
  const [error,      setError]      = useState(null);

  const compute = async () => {
    if (source === target) { setError("Pick different source and destination."); return; }
    setLoading(true); setError(null); setCompare(null); setResult(null);
    try {
      const r = await fetch(`${api}/shortest-path`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ source, target, weightType }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setResult(d);
    } catch(e) { setError(e.message || "Backend not running?"); }
    finally { setLoading(false); }
  };

  const compareAll = async () => {
    if (source === target) { setError("Pick different source and destination."); return; }
    setCmpLoading(true); setError(null); setResult(null); setCompare(null);
    try {
      const r = await fetch(`${api}/compare`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ source, target }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setCompare(d);
    } catch(e) { setError(e.message || "Backend not running?"); }
    finally { setCmpLoading(false); }
  };

  // figure out winners for compare view
  const winners = compare ? {
    distance:   compare.results.distance.totalDist  === Math.min(...Object.values(compare.results).map(x=>x.totalDist)),
    time:       compare.results.time.totalTime       === Math.min(...Object.values(compare.results).map(x=>x.totalTime)),
    congestion: compare.results.congestion.congScore === Math.min(...Object.values(compare.results).map(x=>x.congScore)),
  } : {};

  const pathsMatch = compare
    ? Object.values(compare.results).every(r => JSON.stringify(r.path) === JSON.stringify(compare.results.distance.path))
    : false;

  return (
    <Grid>
      {/* ── Left controls ── */}
      <Panel>
        <PanelTitle>Configure Route</PanelTitle>

        <Label>Source</Label>
        <Select value={source} onChange={e=>setSource(e.target.value)}>
          {nodes.map(n=><option key={n.id} value={n.id}>{n.label}</option>)}
        </Select>

        <Label>Destination</Label>
        <Select value={target} onChange={e=>setTarget(e.target.value)}>
          {nodes.map(n=><option key={n.id} value={n.id}>{n.label}</option>)}
        </Select>

        <Label>Optimise By (single metric)</Label>
        <WeightRow>
          {Object.entries(METRIC_META).map(([k,m])=>(
            <WeightBtn key={k} $active={weightType===k} onClick={()=>setWeightType(k)}>
              {m.icon} {k.charAt(0).toUpperCase()+k.slice(1)}
            </WeightBtn>
          ))}
        </WeightRow>

        <BtnRow>
          <Btn $full onClick={compute} disabled={loading||cmpLoading}>
            {loading?<><Spinner/>Computing…</>:"▶ Find Path"}
          </Btn>
          <Btn $secondary onClick={compareAll} disabled={loading||cmpLoading} title="Compare all 3 metrics side-by-side">
            {cmpLoading?<><Spinner/>…</>:"⚖ Compare 3"}
          </Btn>
        </BtnRow>

        {error && (
          <div style={{marginTop:"1rem",padding:".7rem .9rem",background:"rgba(244,63,94,.1)",border:"1px solid var(--danger)",borderRadius:8,fontSize:".82rem",color:"var(--danger)"}}>
            {error}
          </div>
        )}

        {/* Steps */}
        {result && (
          <div style={{marginTop:"1.5rem"}}>
            <PanelTitle>Algorithm Steps</PanelTitle>
            <StepList>
              {result.steps.map((s,i)=>{
                const onPath = result.path.includes(s.visiting);
                return (
                  <Step key={i} $hl={onPath}>
                    <StepNum $hl={onPath}>{s.step}</StepNum>
                    <div>
                      <div style={{fontWeight:700,fontSize:".76rem"}}>{nodes.find(n=>n.id===s.visiting)?.label||s.visiting}</div>
                      <div style={{fontSize:".65rem",color:"var(--muted)",fontFamily:"Space Mono"}}>
                        d = {s.distances[s.visiting]?.toFixed(1)??"∞"}
                      </div>
                    </div>
                    {onPath&&<div style={{marginLeft:"auto",fontSize:".62rem",color:"var(--accent)",fontWeight:800}}>ON PATH</div>}
                  </Step>
                );
              })}
            </StepList>
          </div>
        )}
      </Panel>

      {/* ── Right results ── */}
      <div style={{display:"flex",flexDirection:"column",gap:"1.25rem"}}>

        {/* Single-metric result */}
        {result && !compare && (
          <div style={{animation:"fadeIn .35s ease"}}>
            <MapViz result={result}/>

            <StatRow>
              <Stat $c="var(--accent)">
                <div className="val">{result.totalDist}<span style={{fontSize:".85rem"}}> km</span></div>
                <div className="lbl">Distance</div>
              </Stat>
              <Stat $c="var(--accent2)">
                <div className="val">{result.totalTime}<span style={{fontSize:".85rem"}}> min</span></div>
                <div className="lbl">Travel Time</div>
              </Stat>
              <Stat $c="var(--accent3)">
                <div className="val">{result.nodesExplored}</div>
                <div className="lbl">Nodes Explored</div>
              </Stat>
              <Stat $c="var(--highlight)">
                <div className="val">{result.executionMicroseconds}<span style={{fontSize:".85rem"}}> µs</span></div>
                <div className="lbl">Exec Time</div>
              </Stat>
            </StatRow>

            <Panel style={{marginBottom:"1rem"}}>
              <PanelTitle>Optimal Path — {METRIC_META[result.weightType].label} ({result.path.length} stops)</PanelTitle>
              <PathNodes>
                {result.pathLabels.map((lbl,i)=>(
                  <>
                    <PathNode key={i} $first={i===0} $last={i===result.pathLabels.length-1}>{lbl}</PathNode>
                    {i<result.pathLabels.length-1&&(
                      <Arrow key={`a${i}`}>
                        <span>{result.edges[i]?.dist} km</span>→
                      </Arrow>
                    )}
                  </>
                ))}
              </PathNodes>
            </Panel>

            <Panel>
              <PanelTitle>Edge Details</PanelTitle>
              <EdgeTable>
                <thead><tr><th>Segment</th><th>Dist</th><th>Time</th><th>Congestion</th></tr></thead>
                <tbody>
                  {result.edges.map((e,i)=>(
                    <tr key={i}>
                      <td style={{fontFamily:"Syne",fontSize:".76rem",color:"var(--text)"}}>
                        {result.pathLabels[i]} → {result.pathLabels[i+1]}
                      </td>
                      <td style={{color:"var(--accent2)"}}>{e.dist} km</td>
                      <td style={{color:"var(--accent3)"}}>{e.time} min</td>
                      <td>
                        <div style={{display:"flex",alignItems:"center",gap:".45rem"}}>
                          <CBar $v={e.congestion}><div/></CBar>
                          <span style={{color:e.congestion>1.8?"var(--danger)":e.congestion>1.4?"var(--highlight)":"var(--accent3)"}}>{e.congestion}×</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </EdgeTable>
            </Panel>
          </div>
        )}

        {/* ── Compare 3 panel ── */}
        {compare && (
          <div>
            <div style={{marginBottom:"1rem"}}>
              <div style={{fontSize:".72rem",color:"var(--muted)",letterSpacing:".15em",textTransform:"uppercase",marginBottom:".5rem"}}>
                Comparing All 3 Metrics — {nodes.find(n=>n.id===compare.source)?.label} → {nodes.find(n=>n.id===compare.target)?.label}
              </div>
              {pathsMatch && (
                <div style={{padding:".65rem 1rem",background:"rgba(251,191,36,.08)",border:"1px solid rgba(251,191,36,.3)",borderRadius:8,fontSize:".78rem",color:"var(--highlight)",marginBottom:"1rem"}}>
                  ⚠ All 3 metrics produced the <strong>same path</strong> for this pair — try a longer route like <em>PES University → Electronic City</em> or <em>MG Road → Banashankari</em> to see divergence.
                </div>
              )}
            </div>

            <CompareGrid>
              {["distance","time","congestion"].map(metric=>{
                const r = compare.results[metric];
                const m = METRIC_META[metric];
                const isWinner = winners[metric];
                // secondary stats
                const distRef = compare.results.distance.totalDist;
                const timeRef = compare.results.time.totalTime;
                const congRef = compare.results.congestion.congScore;

                return (
                  <CompareCard key={metric} $winner={isWinner}>
                    {isWinner&&<WinnerBadge>BEST</WinnerBadge>}
                    <MetricHeader>{m.icon} {m.label}</MetricHeader>
                    <div style={{fontSize:".68rem",color:"var(--muted)",marginBottom:".75rem"}}>{m.desc}</div>

                    <MetricVal $c={m.color}>{r[m.key]}<span style={{fontSize:"1rem"}}> {m.unit}</span></MetricVal>
                    <MetricSub>Optimised metric</MetricSub>

                    {/* secondary stats with deltas */}
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:".4rem",marginBottom:".85rem"}}>
                      <div style={{background:"var(--surface)",borderRadius:6,padding:".45rem .55rem",border:"1px solid var(--border)"}}>
                        <div style={{fontSize:".95rem",fontWeight:800,fontFamily:"Space Mono",color:"var(--accent)"}}>
                          {r.totalDist}
                          {metric!=="distance"&&<DiffBadge $bad={r.totalDist>distRef}>
                            {r.totalDist>distRef?`+${(r.totalDist-distRef).toFixed(1)}`:r.totalDist===distRef?"":"−"+(distRef-r.totalDist).toFixed(1)} km
                          </DiffBadge>}
                        </div>
                        <div style={{fontSize:".6rem",color:"var(--muted)"}}>km total</div>
                      </div>
                      <div style={{background:"var(--surface)",borderRadius:6,padding:".45rem .55rem",border:"1px solid var(--border)"}}>
                        <div style={{fontSize:".95rem",fontWeight:800,fontFamily:"Space Mono",color:"var(--accent2)"}}>
                          {r.totalTime}
                          {metric!=="time"&&<DiffBadge $bad={r.totalTime>timeRef}>
                            {r.totalTime>timeRef?`+${r.totalTime-timeRef}`:r.totalTime===timeRef?"":"−"+(timeRef-r.totalTime)} min
                          </DiffBadge>}
                        </div>
                        <div style={{fontSize:".6rem",color:"var(--muted)"}}>min travel</div>
                      </div>
                    </div>

                    <div style={{fontSize:".68rem",color:"var(--muted)",marginBottom:".4rem",letterSpacing:".08em",textTransform:"uppercase"}}>
                      Path ({r.hops} hop{r.hops!==1?"s":""})
                    </div>
                    <PathPill>
                      {r.pathLabels.join(" → ")}
                    </PathPill>
                  </CompareCard>
                );
              })}
            </CompareGrid>

            {/* path diff summary */}
            {!pathsMatch && (
              <Panel style={{marginTop:"1rem"}}>
                <PanelTitle>Why The Paths Differ</PanelTitle>
                <div style={{fontSize:".8rem",color:"var(--muted)",lineHeight:1.8}}>
                  <strong style={{color:"var(--text)"}}>Distance</strong> picks the route with the fewest kilometres — even if it passes through jammed junctions like MG Road or Silk Board.<br/>
                  <strong style={{color:"var(--text)"}}>Time</strong> avoids signals and chooses faster roads (flyovers, expressways) even if they add km.<br/>
                  <strong style={{color:"var(--text)"}}>Congestion</strong> weights each minute by the congestion multiplier, so a road with 2.8× congestion costs 2.8× more than its base time — Silk Board (3.0×), MG Road (2.8×) and Majestic–MG (2.8×) are aggressively penalised, forcing detours via NICE Road or Hebbal flyover.
                </div>
              </Panel>
            )}
          </div>
        )}

        {!result && !compare && (
          <Placeholder>
            <div style={{fontSize:"2.5rem"}}>🗺</div>
            <div style={{fontWeight:700}}>Select locations and compute a route</div>
            <div style={{fontSize:".72rem"}}>Use <strong style={{color:"var(--accent)"}}>▶ Find Path</strong> for one metric or <strong style={{color:"var(--text)"}}>⚖ Compare 3</strong> to see all metrics side-by-side</div>
          </Placeholder>
        )}
      </div>
    </Grid>
  );
}

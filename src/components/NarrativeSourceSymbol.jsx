import React from 'react';
import { narrativeSymbol } from '../data/narrativeSymbols.js';

// A shared line-and-wash alphabet. Every mark inherits one ink color from its
// card; translucent fills provide depth without introducing more hues.
const Wash = ({ d }) => <path d={d} fill="currentColor" fillOpacity=".13" />;
const Person = ({ x = 0, y = 0, scale = 1 }) => <g transform={`translate(${x} ${y}) scale(${scale})`}><circle cx="12" cy="8" r="6" /><path d="M12 15v20M1 26l11-9 11 9M12 35 3 49m9-14 9 14" /></g>;
const Heart = ({ x = 0, y = 0, scale = 1 }) => <g transform={`translate(${x} ${y}) scale(${scale})`}><Wash d="M20 34 4 19C-8 6 10-6 20 6 30-6 48 6 36 19Z" /></g>;
const Star = ({ x = 0, y = 0, scale = 1 }) => <path transform={`translate(${x} ${y}) scale(${scale})`} d="m12 0 3 8 9 4-9 3-3 9-4-9-8-3 8-4Z" fill="currentColor" fillOpacity=".2" />;
const Crown = ({ x = 0, y = 0, scale = 1 }) => <g transform={`translate(${x} ${y}) scale(${scale})`}><Wash d="m0 2 12 12L24 0l12 14L48 2l-6 30H6Z" /><path d="M7 39h34" /></g>;
const Book = ({ x = 0, y = 0, scale = 1 }) => <g transform={`translate(${x} ${y}) scale(${scale})`}><Wash d="M30 8Q15-3 0 2v38q16-5 30 6 14-11 30-6V2Q45-3 30 8Z" /><path d="M30 8v38M8 13l14 3M8 23l14 3m16-10 14-3m-14 13 14-3" /></g>;
const Speech = ({ x = 0, y = 0, scale = 1, reverse = false }) => <g transform={`translate(${x} ${y}) scale(${scale})`}><Wash d={reverse ? 'M7 0h34q7 0 7 7v19q0 7-7 7H30l-9 9V33H7q-7 0-7-7V7q0-7 7-7Z' : 'M7 0h34q7 0 7 7v19q0 7-7 7H18l-9 9V33H7q-7 0-7-7V7q0-7 7-7Z'} /></g>;
const Bulb = ({ x = 0, y = 0, scale = 1 }) => <g transform={`translate(${x} ${y}) scale(${scale})`}><Wash d="M10 30C-8 11 2 0 15 0s23 11 5 30Z" /><path d="M9 36h12m-10 6h8M15 29V16m-5-4 5 4 5-4" /></g>;
const Shield = ({ x = 0, y = 0, scale = 1 }) => <path transform={`translate(${x} ${y}) scale(${scale})`} d="M20 0 0 8v21q0 15 20 25 20-10 20-25V8Z" fill="currentColor" fillOpacity=".13" />;
const House = ({ x = 0, y = 0, scale = 1 }) => <g transform={`translate(${x} ${y}) scale(${scale})`}><path d="m0 18 22-18 22 18M6 14v30h32V14M17 44V27h10v17" /><path d="M6 44h32V19H6Z" fill="currentColor" fillOpacity=".1" stroke="none" /></g>;
const Arrow = ({ x = 0, y = 0, rotate = 0, scale = 1 }) => <path transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`} d="M0 0h26m-8-8 8 8-8 8" />;

const MARKS = {
  fate: <><rect x="12" y="8" width="96" height="84" rx="16" fill="currentColor" fillOpacity=".06" /><path d="M60 8v84M12 50h96M22 29q14-18 28 0-14 18-28 0Z" /><circle cx="36" cy="29" r="4" /><Shield x={75} y={16} scale={.48} /><Person x={23} y={57} scale={.55} /><Person x={35} y={61} scale={.47} /><Heart x={76} y={60} scale={.55} /></>,
  kolb: <><path d="M75 17q18 4 23 18m0 30q-5 15-23 18m-30 0Q28 79 22 65m0-30q5-14 23-18" /><path d="m90 32 8 3 3-8M80 75l-5 8 7 5M30 68l-8-3-3 8m21-48 5-8-8-4" />{[[60,16],[99,50],[60,84],[21,50]].map(([cx,cy],i)=><g key={i}><circle cx={cx} cy={cy} r="14" fill="currentColor" fillOpacity=".12" /><text x={cx} y={cy+3.5} textAnchor="middle" stroke="none" fill="currentColor" fontSize="10" fontWeight="700">{['CE','RO','AC','AE'][i]}</text></g>)}<path d="M49 50h22m-8-8 8 8-8 8" /></>,
  values: <><circle cx="60" cy="50" r="37" strokeDasharray="4 9" /><Heart x={40} y={30} /><Arrow x={12} y={50} rotate={180} scale={.45} /><Arrow x={108} y={50} scale={.45} /><path d="M42 97h36" /></>,
  'moral-conflicts': <><path d="M60 12v69M27 86h66M23 28h74M30 28 15 58h30L30 28Zm60 0L75 58h30L90 28Z" /><path d="M15 58q15 18 30 0m30 0q15 18 30 0" fill="currentColor" fillOpacity=".18" />{[0,1,2,3,4,5].map(i=><circle key={i} cx={40+i*8} cy="12" r="2" stroke="none" fill="currentColor" />)}</>,
  recovery: <><path d="M12 23C32 23 29 81 60 81s28-58 49-58m-12-5 12 5-3 12" /><Person x={47} y={43} scale={.5} /><Star x={90} y={3} scale={.6} /><path d="M14 94h92" opacity=".35" /></>,
  'home-voyage': <><path d="M37 19C85-9 121 43 98 75 73 110 12 86 18 44m-7 5 7-5 7 5" /><House x={2} y={0} scale={.7} />{[[60,11],[88,23],[105,48],[96,74],[70,91],[43,87],[22,70],[18,44]].map(([cx,cy],i)=><circle key={i} cx={cx} cy={cy} r="3" fill="currentColor" />)}<path d="m55 44 20 8-20 8 4-8Z" fill="currentColor" fillOpacity=".2" /></>,
  'story-building': <><path d="M24 24h72v26H24v26h72" /><rect x="10" y="12" width="28" height="24" rx="5" fill="currentColor" fillOpacity=".13" /><rect x="82" y="38" width="28" height="24" rx="5" fill="currentColor" fillOpacity=".13" /><Book x={69} y={69} scale={.6} /><path d="M19 20h10m-10 8h7M90 46h12m-12 8h8" /></>,
  preferences: <><path d="M15 25h90M15 50h90M15 75h90" />{[[37,25],[83,50],[54,75]].map(([cx,cy])=><circle key={cy} cx={cx} cy={cy} r="10" fill="var(--nw-symbol-paper)" />)}<path d="M15 15v20m90-20v20M15 40v20m90-20v20M15 65v20m90-20v20" opacity=".4" /></>,
  language: <><Speech x={10} y={10} scale={1.45} /><path d="M24 28h40M24 39h29m31-9 23 20-23 20m-12-20h35M25 77h23m-23 11h37" /><circle cx="17" cy="77" r="2" fill="currentColor" /></>,
  profile: <><circle cx="60" cy="44" r="13" /><path d="M35 77v-6a25 25 0 0 1 50 0v6Z" fill="currentColor" fillOpacity=".13" />{Array.from({length:9},(_,i)=>{const a=i*Math.PI*2/9-Math.PI/2;return <g key={i}><path d={`M${60+34*Math.cos(a)} ${50+34*Math.sin(a)}l${10*Math.cos(a)} ${10*Math.sin(a)}`} /><circle cx={60+48*Math.cos(a)} cy={50+48*Math.sin(a)} r="3" fill="currentColor" /></g>;})}</>,
  'feminine-archetypes': <><path d="M60 49C12 34 30-13 60 14c30-27 48 20 0 35Zm0 2C12 66 30 113 60 86c30 27 48-20 0-35Z" fill="currentColor" fillOpacity=".1" /><path d="M60 50C43 6-2 29 25 50-2 71 43 94 60 50Zm0 0c17-44 62-21 35 0 27 21-18 44-35 0Z" fill="currentColor" fillOpacity=".1" /><circle cx="60" cy="50" r="9" /><path d="M60 11v17m0 44v17M21 50h17m44 0h17" /></>,
  'masculine-archetypes': <><path d="M60 10v80M15 50h90" opacity=".45" /><Crown x={18} y={13} scale={.6} /><Shield x={79} y={10} scale={.55} /><Book x={15} y={63} scale={.6} /><Heart x={78} y={64} scale={.65} /></>,
  'dragon-city': <><path d="M10 90V58h10v-9h10v9h10v32m40 0V63h10v-9h10v9h10v27M39 90V70l20-11 20 11v20M54 90V79h12v11M4 92h112" /><Wash d="M35 49c-20-2-26-17-11-22-6 10 7 15 15 8l18-15 1-14 10 8 9-4 14 8-8 12-12-3-7 10 9 11-20-5-12 8Z" /><path d="m52 29-18-17 1 17m36-10h2m10 12 14 9-9 3 13 5M17 69v7m10-7v7m64-1v7m10-7v7" /></>,
  'hero-guide': <><Person x={23} y={39} scale={.9} /><Person x={73} y={28} scale={1.05} /><path d="M106 32v60m-9-60h15M47 64l22-7" /><Star x={45} y={9} scale={.65} /><path d="M14 94h93" opacity=".4" /></>,
  universal: <><Book x={25} y={47} scale={1.2} /><circle cx="60" cy="24" r="20" /><ellipse cx="60" cy="24" rx="9" ry="20" /><path d="M40 24h40m-36-9h32m-32 18h32" opacity=".7" /></>,
  curiosity: <><Book x={25} y={47} scale={1.16} /><path d="M50 20a12 12 0 1 1 19 10q-8 5-8 12" /><circle cx="61" cy="48" r="1" fill="currentColor" /><Star x={84} y={19} scale={.6} /><path d="m23 36-7-6m79 15 8-3" /></>,
  'three-conflicts': <><path d="M60 47V13m-8 8 8-8 8 8M54 57 22 78m12 1-12-1 3-12m41-9 32 21m-12 1 12-1-3-12" /><circle cx="60" cy="53" r="9" fill="currentColor" fillOpacity=".2" /><Person x={12} y={23} scale={.45} /><path d="m87 22 5-10 5 10-5 10Zm-36 66h18" /></>,
  'good-evil': <><circle cx="60" cy="50" r="32" /><path d="M60 18c-30 10 30 54 0 64" /><path d="M60 18c-30 10 30 54 0 64a32 32 0 0 0 0-64Z" fill="currentColor" fillOpacity=".18" /><circle cx="49" cy="36" r="5" /><circle cx="71" cy="65" r="5" /><path d="M60 5v6m0 78v6M15 50h7m76 0h7" /></>,
  old: <><path d="M30 11h59M30 89h59M36 11c0 26 13 26 24 39-11 13-24 13-24 39m47-78c0 26-13 26-23 39 10 13 23 13 23 39" /><path d="m65 27-17 25h13l-7 20 25-30H64Z" fill="currentColor" fillOpacity=".2" /></>,
  secrets: <><Wash d="M29 17h21a10 10 0 1 1 20 0h21v23a10 10 0 1 0 0 20v23H29V60a10 10 0 1 1 0-20Z" /><circle cx="60" cy="45" r="8" /><path d="m56 52-3 15h14l-3-15" /></>,
  'rules-rebels': <><path d="M29 13h55v28M22 13h7v63a9 9 0 0 0 18 0v-7h52v7a9 9 0 0 1-9 9H38M40 27h30M40 39h25M40 51h15" /><path d="m85 33-20 24h15l-6 25 29-35H85Z" fill="currentColor" fillOpacity=".18" /></>,
  'order-chaos': <><rect x="9" y="26" width="36" height="48" rx="3" /><path d="M21 26v48m12-48v48M9 42h36M9 58h36M60 16v68M79 31c23-14 40 8 25 22-21 20-32-7-15-12 27-7 25 40-5 31" /></>,
  life: <><path d="M26 76C-4 36 25-3 67 9m-8-6 8 6-8 6m35 10c30 40 1 79-41 67m8 6-8-6 8-6M60 76V40m0 10C33 49 32 29 32 29s28-2 28 21Zm0-9c0-26 28-27 28-27s0 27-28 27Z" /><path d="M43 77h34" /></>,
  hole: <><path d="M7 30h27v48q26 19 52 0V30h27" /><Person x={48} y={39} scale={.75} /><path d="M14 39h11m70 0h11M20 48h5m70 0h5" opacity=".4" /><path d="m89 24 9-12 9 12" /></>,
  happy: <><path d="M20 89V47h13V34h14v55m26 0V34h14v13h13v42M47 89V58h26v31M14 92h92M25 47v-9m55-4V22m-40 12V22" /><Heart x={40} y={3} /><path d="M54 89V76a6 6 0 0 1 12 0v13" /></>,
  voyage: <><path d="M23 69h75L84 84H37ZM60 23v46m-3-42L30 59h27Zm7 10 20 26H64M15 92q10-7 20 0t20 0 20 0 20 0 20 0M21 31C37 4 88 4 103 32m-13-5 13 5 2-13" /></>,
  pride: <><Crown x={20} y={12} scale={1.05} /><path d="M18 89h85M87 29v45m-9-9 9 9 9-9M25 62l13 8-5 12m20-17 8 15" /></>,
  downfall: <><path d="M10 43h24v16h24v16h24v16h28" /><Person x={12} y={7} scale={.63} /><path d="m51 20 48 46m-1-16 1 16-16-1" /><path d="M12 91h10m10 0h10" opacity=".4" /></>,
  riches: <><path d="m8 38 16-8 9 6 9-6 16 8-7 16-8-4v36H22V50l-8 4ZM27 69l8 8 5-10" /><Wash d="m74 41 12-14h18l11 14-20 27Z" /><path d="M74 41h41M86 27l9 41 9-41" /><Arrow x={57} y={20} scale={.75} /></>,
  'five-ts': <><path d="M10 69h100m-8-7 8 7-8 7" />{[17,38,59,80,101].map((x,i)=><g key={x}><circle cx={x} cy="69" r="4" fill="currentColor" /><path d={`M${x} 60V${i%2?40:26}m-6 0h12m-6 0v13`} /></g>)}</>,
  'hard-choice': <><Person x={48} y={63} scale={.65} /><path d="M56 63V51L33 37l8-14-20-9m-7 10 7-10 11 2m24 35 28-14-8-14 20-9m-11 2 11-2 7 10M10 62l12-7 12 7m52 0 12-7 12 7" /></>,
  fail: <><Wash d="M35 14h50v17L69 45l5 10-14 9c-18-6-25-18-25-39Z" /><path d="M35 23H20v11q0 20 22 20m43-31h15v11q0 20-22 20M60 65v15M42 88h36M49 80h22v8M58 22l-9 15 15 4-10 14M14 12l-6-4m99 3 6-6M20 70l-7 5m89-6 7 5" /></>,
  innovation: <><path d="M10 84c50 0 32-60 76-60h24m-9-7 9 7-9 7M10 93h100" /><Bulb x={17} y={8} scale={.8} /><circle cx="52" cy="61" r="4" fill="currentColor" /></>,
  sales: <><Wash d="m49 12 50 2 10 25-45 33-31-43Z" /><circle cx="89" cy="26" r="4" /><path d="M11 72h19l14-14q6-5 11 0l12 10h21q10 0 10 8L63 91H32L11 84Zm43-3 13 8M11 67v23" /></>,
  icebreaker: <><Speech x={30} y={3} scale={1.05} /><path d="m60 45-10 16 17 3-17 22M9 64l26-10 15 7m17 3 20-10 24 10-11 28H20ZM17 67l20 8 7 16m62-24-21 8-7 17" /></>,
  pitch: <><Wash d="M23 38h23l50-20v61L46 59H23Z" /><path d="m39 60 7 25H31l-6-25M96 39l12-4m-8 17h13m-13 12 10 5" /><Star x={52} y={9} scale={.6} /></>,
  conversation: <><Speech x={9} y={12} scale={1.4} /><Speech x={54} y={50} scale={1.18} reverse /><path d="M23 29h38M23 40h25m42 27H67m28 10H67" /></>,
  caregiver: <><Heart x={40} y={10} /><path d="M13 49v20l28 20h39l27-20V49q-10-2-10 13L80 72H68m39-23v-9M13 49v-9m0 9q10-2 10 13l18 10h12M35 67q6-9 16-3l9 9 9-9q10-6 16 3M60 73v16" /></>,
  innocent: <><circle cx="60" cy="23" r="12" /><path d="M60 3V0m0 46v-4M38 23h-6m50 0h6M44 7l-4-4m36 4 4-4M60 86V65m0 8c-28 0-27-22-27-22s26-1 27 22Zm0-9c1-22 27-24 27-24s-1 24-27 24ZM39 90h42" /></>,
  jester: <><Wash d="M27 61 14 26q24-3 34 17L60 11l12 32q10-20 34-17L93 61Z" /><path d="M27 61v13q33 28 66 0V61ZM44 72h1m30 0h1M50 83q10 5 20 0" /><circle cx="60" cy="7" r="5" /><circle cx="10" cy="25" r="5" /><circle cx="110" cy="25" r="5" /></>,
  explorer: <><circle cx="60" cy="50" r="35" /><Wash d="m75 29-7 31-29 12 12-31Z" /><path d="m51 41 17 19M60 6v9m0 70v9M16 50h9m70 0h9M9 91l13-15 10 15m65 0 10-12 7 12" /></>,
  lover: <><Heart x={34} y={16} scale={1.3} /><Person x={18} y={48} scale={.75} /><Person x={82} y={48} scale={.75} /><path d="M36 68q24 20 48 0" /></>,
  warrior: <><Shield x={19} y={23} scale={1.1} /><path d="m75 16 12-8 6 13-18 48-7-3Zm-12 45 21 8M71 70l-7 18m-6-2 12 4M41 37v29m-10-15h20" /></>,
  artist: <><Wash d="M59 17C13 8 8 65 36 82c18 11 37 1 26-10-8-9 1-19 13-14 28 12 31-32-16-41Z" />{[[37,32],[27,49],[38,69],[60,32]].map(([cx,cy])=><circle key={cy+cx} cx={cx} cy={cy} r="4" fill="currentColor" fillOpacity=".35" />)}<path d="m72 69 29-53q5-8 9-3t-1 10L80 75ZM72 69q-13 0-12 15c7 0 20 4 20-9" fill="currentColor" fillOpacity=".13" /></>,
  ruler: <><Crown x={21} y={19} scale={1.3} /><path d="M31 83h48m-40-8h33M108 37v53m-5 0h10" /><circle cx="108" cy="27" r="8" fill="currentColor" fillOpacity=".2" /></>,
  magician: <><path d="m28 80 49-49 11 11-49 49Z" fill="currentColor" fillOpacity=".13" /><path d="m68 40 11 11" /><Star x={68} y={3} scale={.9} /><Star x={95} y={46} scale={.65} /><Star x={15} y={24} scale={.6} /><path d="M41 9v9m-4-5h8" /></>,
  sage: <><Book x={25} y={45} scale={1.16} /><path d="M31 28a29 29 0 0 1 58 0M43 27h13m8 0h13m-21 0h8M56 27a7 7 0 1 1-14 0m35 0a7 7 0 1 1-14 0M54 41q6 5 12 0" /></>,
  rebel: <><path d="m42 39-10-10a13 13 0 0 0-18 18l15 15a13 13 0 0 0 18 0m31-1 10 10a13 13 0 0 0 18-18L91 38a13 13 0 0 0-18 0M29 45l13 13m36-15 13 13" /><path d="m64 12-17 30h15l-6 30 27-40H66Z" fill="currentColor" fillOpacity=".2" /><path d="m46 84 7-8m16 10-3-9" /></>,
  companion: <><Person x={23} y={17} scale={1.05} /><Person x={72} y={17} scale={1.05} /><path d="M47 44h27M33 82l-8 12m68-12 8 12M60 79v7m0 5v4" /></>,
  drive: <><Speech x={14} y={2} scale={.72} /><Speech x={72} y={9} scale={.72} reverse /><path d="M18 59 30 39h59l13 20m-84 0h84q8 0 8 8v16H10V67q0-8 8-8ZM20 83v9h15v-9m50 0v9h15v-9M59 41v18M18 70h15m54 0h15" /><circle cx="45" cy="51" r="4" fill="currentColor" fillOpacity=".2" /><circle cx="76" cy="51" r="4" fill="currentColor" fillOpacity=".2" /></>,
  expert: <><Person x={25} y={13} scale={1.15} /><circle cx="85" cy="58" r="19" fill="currentColor" fillOpacity=".13" /><path d="m75 58 7 7 14-15M73 74l-4 17 14-8 11 8 2-17M24 85h30" /></>,
  motivation: <><circle cx="66" cy="49" r="34" /><circle cx="66" cy="49" r="21" /><Heart x={54} y={36} scale={.6} /><path d="m13 88 36-30m-21 0-1 16-15 1M46 60l-1 10" /></>,
  chase: <><circle cx="23" cy="70" r="10" /><circle cx="49" cy="82" r="10" /><path d="m30 62 45-44M49 72 21 20m16 33 48 5m-6-38 2-9M65 30l11-2M80 81h31m-8-8 8 8-8 8" /></>,
  explain: <><Speech x={12} y={11} scale={1.55} /><Bulb x={84} y={50} scale={.95} /><path d="M30 31h33M30 44h24M28 84h35m-8-8 8 8-8 8" /></>,
};

export default function NarrativeSourceSymbol({ source, type }) {
  const requested = narrativeSymbol(source, type);
  const symbol = MARKS[requested] ? requested : 'universal';
  return <svg className="nw-source-symbol" viewBox="0 0 160 112" aria-hidden="true" focusable="false" data-symbol={symbol}
    fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
    <g transform="translate(20 6)">{MARKS[symbol]}</g>
  </svg>;
}

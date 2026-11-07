// @vitest-environment jsdom
import React,{act} from 'react';
import {createRoot} from 'react-dom/client';
import {beforeEach,afterEach,describe,it,expect,vi} from 'vitest';
import FlowCanvas,{visibleCanvasPlacement,NODE_W} from './FlowCanvas.jsx';

let root,container,canvas,props;
const rect=(x,y,w,h)=>({left:x,top:y,right:x+w,bottom:y+h,width:w,height:h,x,y});
const point=()=>({x:Number(canvas.dataset.canvasX),y:Number(canvas.dataset.canvasY),zoom:Number(canvas.dataset.canvasZoom)});
async function pointer(target,type,values={}){
  const event=new MouseEvent(type,{bubbles:true,cancelable:true,clientX:200,clientY:200,...values});
  Object.defineProperty(event,'pointerId',{value:values.pointerId??1});
  await act(async()=>target.dispatchEvent(event));return event;
}
async function pan(dx,dy,target=canvas){
  await pointer(target,'pointerdown',{button:1,buttons:4});
  await pointer(canvas,'pointermove',{button:-1,buttons:4,clientX:200+dx,clientY:200+dy});
  await pointer(canvas,'pointerup',{button:1,buttons:0,clientX:200+dx,clientY:200+dy});
}
async function wheel(values){const event=new WheelEvent('wheel',{bubbles:true,cancelable:true,...values});await act(async()=>canvas.dispatchEvent(event));return event;}
beforeEach(async()=>{
  globalThis.IS_REACT_ACT_ENVIRONMENT=true;
  vi.stubGlobal('ResizeObserver',class{observe(){}disconnect(){}});
  vi.stubGlobal('requestAnimationFrame',()=>1);vi.stubGlobal('cancelAnimationFrame',()=>{});
  const captures=new Map();
  HTMLElement.prototype.setPointerCapture=function(id){captures.set(this,id);};
  HTMLElement.prototype.hasPointerCapture=function(id){return captures.get(this)===id;};
  HTMLElement.prototype.releasePointerCapture=function(){captures.delete(this);};
  props={nodes:{N:{id:'N',kind:'objective',title:'A node',x:100,y:120,w:240,h:140}},edges:[],selId:null,colorOf:()=> '#5CA8F5',onSelect:vi.fn(),onMove:vi.fn(),onConnect:vi.fn(),onDropPalette:vi.fn()};
  container=document.createElement('div');document.body.append(container);root=createRoot(container);
  await act(async()=>root.render(<FlowCanvas {...props}/>));
  canvas=container.querySelector('.canvas');
  canvas.getBoundingClientRect=()=>rect(40,60,800,600);
  Object.defineProperty(canvas,'clientWidth',{configurable:true,value:800});
  Object.defineProperty(canvas,'clientHeight',{configurable:true,value:600});
});
afterEach(async()=>{await act(async()=>root.unmount());container.remove();vi.unstubAllGlobals();});

describe('unbounded canvas navigation',()=>{
  it('middle-drags beyond every former boundary without editing graph content',async()=>{
    for(const [x,y] of [[20000,30000],[-40000,-60000],[60000,-90000],[-80000,120000]]){
      const before=point();await pan(x,y);
      expect(point()).toMatchObject({x:before.x+x,y:before.y+y,zoom:1});
    }
    expect(props.onMove).not.toHaveBeenCalled();expect(props.onSelect).not.toHaveBeenCalled();expect(props.onConnect).not.toHaveBeenCalled();
    expect(props.nodes.N).toMatchObject({x:100,y:120});expect(canvas.classList.contains('canvas-panning')).toBe(false);
  });
  it('captures a middle drag over a node and cleans up cancellation, lost capture and window blur',async()=>{
    const node=container.querySelector('[data-node="N"]');
    const down=await pointer(node,'pointerdown',{button:1,buttons:4});
    expect(down.defaultPrevented).toBe(true);expect(canvas.hasPointerCapture(1)).toBe(true);
    expect(canvas.classList.contains('canvas-panning')).toBe(true);
    await pointer(canvas,'pointermove',{buttons:4,clientX:500,clientY:450});
    await pointer(canvas,'pointercancel');
    expect(canvas.hasPointerCapture(1)).toBe(false);expect(canvas.classList.contains('canvas-panning')).toBe(false);
    await pointer(node,'pointerdown',{button:1,buttons:4});
    await act(async()=>window.dispatchEvent(new Event('blur')));
    expect(canvas.hasPointerCapture(1)).toBe(false);expect(canvas.classList.contains('canvas-panning')).toBe(false);
    await pointer(node,'pointerdown',{button:1,buttons:4});
    await pointer(canvas,'lostpointercapture');
    expect(canvas.classList.contains('canvas-panning')).toBe(false);expect(props.onMove).not.toHaveBeenCalled();expect(props.onSelect).not.toHaveBeenCalled();
  });
  it('keeps wheel and Shift-wheel unbounded, and anchors Alt-wheel zoom to the cursor',async()=>{
    await pan(1100,-800);
    await wheel({deltaX:130,deltaY:-70});expect(point()).toMatchObject({x:970,y:-730});
    await wheel({shiftKey:true,deltaY:120});expect(point()).toMatchObject({x:850,y:-730});
    const before=point(),local={x:250,y:170};
    const world={x:(local.x-before.x)/before.zoom,y:(local.y-before.y)/before.zoom};
    const event=await wheel({altKey:true,deltaY:-100,clientX:290,clientY:230});
    const after=point();expect(event.defaultPrevented).toBe(true);expect(after.zoom).toBe(1.1);
    expect((local.x-after.x)/after.zoom).toBeCloseTo(world.x);expect((local.y-after.y)/after.zoom).toBeCloseTo(world.y);
    await pan(123,-89);expect(point().x).toBeCloseTo(after.x+123);expect(point().y).toBeCloseTo(after.y-89);
  });
  it('drops and drags nodes at negative world positions after panning',async()=>{
    await pan(1200,900);
    const drop=new MouseEvent('drop',{bubbles:true,cancelable:true,clientX:340,clientY:260});
    Object.defineProperty(drop,'dataTransfer',{value:{getData:()=> 'base:character'}});
    await act(async()=>canvas.dispatchEvent(drop));
    expect(props.onDropPalette).toHaveBeenCalledWith('base:character',-900-NODE_W/2,-720);
    const node=container.querySelector('[data-node="N"]');
    await pointer(node,'pointerdown',{button:0,buttons:1,clientX:1350,clientY:1090});
    await pointer(node,'pointermove',{buttons:1,clientX:50,clientY:90});
    expect(props.onMove).toHaveBeenLastCalledWith('N',-1200,-880);
  });
  it('places toolbar-added nodes in the revealed area instead of clamping to the original origin',async()=>{
    await pan(2000,1800);
    const placed=visibleCanvasPlacement();
    expect(placed.x).toBeLessThan(-1000);expect(placed.y).toBeLessThan(-1000);
    expect(placed.x).toBeGreaterThanOrEqual(-2000);expect(placed.y).toBeGreaterThanOrEqual(-1800);
  });
  it('fits content after any pan and keeps zoom controls centred on the viewport',async()=>{
    await pan(-5000,4000);
    const node=container.querySelector('[data-node="N"]');
    node.getBoundingClientRect=()=>{const p=point();return rect(40+p.x+100*p.zoom,60+p.y+120*p.zoom,240*p.zoom,140*p.zoom);};
    await act(async()=>[...container.querySelectorAll('button')].find(row=>row.textContent==='Fit all').click());
    expect(point()).toEqual({x:-100,y:-130,zoom:1.5});
    const before=point(),centre={x:(400-before.x)/before.zoom,y:(300-before.y)/before.zoom};
    await act(async()=>container.querySelector('[title="Reset zoom"]').click());
    expect(point().zoom).toBe(1);expect(400-point().x).toBeCloseTo(centre.x);expect(300-point().y).toBeCloseTo(centre.y);
  });
});

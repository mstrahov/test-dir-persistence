/**************
 *   test of grid settings saving / re-creation
 * 
 * 
 * **************/
import { GridItem, GridItemTabulator, GridItemCodeEditor } from  "./griditem.js";


const testsvg1 = `<div class="svg-container">
<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" fill="none"  stroke="#008f32"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-chart-sankey"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M3 3v18h18" /><path d="M3 6h18" /><path d="M3 8c10 0 8 9 18 9" /></svg>
</div>
`;
const testsvg2 = `<div class="svg-container"><svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" fill="#008f32"  class="icon icon-tabler icons-tabler-filled icon-tabler-chart-donut"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M11.292 2.61c.396 .318 .65 .78 .703 1.286l.005 .104v4a1 1 0 0 1 -.748 .968a3.1 3.1 0 1 0 3.78 3.78a1 1 0 0 1 .968 -.748h3.8a2 2 0 0 1 2 2a1 1 0 0 1 -.026 .226a10 10 0 1 1 -12 -12l.057 -.01l.052 -.01a1.9 1.9 0 0 1 1.409 .404m3.703 -.11l.045 .002l.067 .004l.081 .014l.032 .004l.072 .022l.04 .01a10 10 0 0 1 6.003 5.818l.108 .294a1 1 0 0 1 -.943 1.332h-4.5a1 1 0 0 1 -.76 -.35a8 8 0 0 0 -.89 -.89a1 1 0 0 1 -.35 -.76v-4.5q .001 -.119 .026 -.23l.03 -.102a1 1 0 0 1 .168 -.299l.03 -.033l.039 -.043a1 1 0 0 1 .089 -.08l.051 -.034l.03 -.023l.045 -.025l.052 -.03a1 1 0 0 1 .435 -.101" /></svg>
</div>
`;
const testsvg3 = `<div class="svg-container">
<svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="#008f32"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-chart-covariate"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M18 11h.009" /><path d="M14 15h.009" /><path d="M12 6h.009" /><path d="M8 10h.009" /><path d="M3 21l17 -17" /><path d="M3 3v18h18" /></svg>
</div>
`;


let opts = {
      cellHeight: 'auto', // see other possible values (best to do in here)
      cellHeightThrottle: 100,
      handle: '.grid-elem-draggable' ,
      margin: 1,
      cellHeight: 80,
      animate: true, // show immediate (animate: true is nice for user dragging though)
      columnOpts: {
		layout: "moveScale",
        breakpointForWindow: true,  // test window vs grid size
        breakpoints: [{w:700, c:1}]
      },
      float: true,
}

// public static init(options: GridStackOptions = {}, elOrString: GridStackElement = '.grid-stack'): GridStack {
//   https://github.com/gridstack/gridstack.js/blob/master/src/gridstack.ts
let grid = GridStack.init(opts);

window.testgrid = grid;


var items = [
	{w: 2, content: 'skslkslkslsk'}, // will default to location (0,0) and 1x1
	{w: 2, content: 'another longer widget!'} // will be placed next at (1,0) and 2x1
];
  
grid.load(items);
  
let item1 = new GridItem({templateid:"#gridelementtemplate", grid: grid, headertext: "item1",});
item1.setInnerHtml(testsvg1);

let item2 = new GridItem({templateid:"#gridelementtemplate", grid: grid, headertext: "chart 2",});
item2.setInnerHtml(testsvg2);

let item3 = new GridItem({templateid:"#gridelementtemplate", grid: grid, headertext: "chart 3",});
item3.setInnerHtml(testsvg3);

let item4 = new GridItemTabulator({templateid:"#gridelementtemplate", grid: grid, headertext: "Transform steps",});
item4.init();

let item5 = new GridItemCodeEditor({templateid:"#gridelementtemplatecode", grid: grid, headertext: "py code",});

//  to compact grid
grid.compact();

// to save grid   (saveContent = false, saveGridOpt = true)
console.log(JSON.stringify(self.testgrid.save(false, true)));  

// change color of svg elements
document.getElementById("pyloaded").querySelector("svg").style.stroke = "gray";

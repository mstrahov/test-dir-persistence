/**************
 *   test of grid settings saving / re-creation
 * 
 * 
 * **************/
import { GridItem, GridItemTabulator, GridItemCodeEditor } from  "./griditem.js";
import {MenuEventsControl} from "./menueventscontrol.js";


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


const testsvg4 = `<div class="svg-container">
<?xml version="1.0" encoding="utf-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN"
  "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg xmlns:xlink="http://www.w3.org/1999/xlink" width="460.8pt" height="345.6pt" viewBox="0 0 460.8 345.6" xmlns="http://www.w3.org/2000/svg" version="1.1">
 <metadata>
  <rdf:RDF xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:cc="http://creativecommons.org/ns#" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
   <cc:Work>
    <dc:type rdf:resource="http://purl.org/dc/dcmitype/StillImage"/>
    <dc:date>2025-05-30T01:56:54.718000</dc:date>
    <dc:format>image/svg+xml</dc:format>
    <dc:creator>
     <cc:Agent>
      <dc:title>Matplotlib v3.8.4, https://matplotlib.org/</dc:title>
     </cc:Agent>
    </dc:creator>
   </cc:Work>
  </rdf:RDF>
 </metadata>
 <defs>
  <style type="text/css">*{stroke-linejoin: round; stroke-linecap: butt}</style>
 </defs>
 <g id="figure_1">
  <g id="patch_1">
   <path d="M 0 345.6 
L 460.8 345.6 
L 460.8 0 
L 0 0 
z
" style="fill: #ffffff"/>
  </g>
  <g id="axes_1">
   <g id="patch_2">
    <path d="M 57.6 307.584 
L 414.72 307.584 
L 414.72 41.472 
L 57.6 41.472 
z
" style="fill: #ffffff"/>
   </g>
   <g id="matplotlib.axis_1">
    <g id="xtick_1">
     <g id="line2d_1">
      <defs>
       <path id="m9a5b47d741" d="M 0 0 
L 0 3.5 
" style="stroke: #000000; stroke-width: 0.8"/>
      </defs>
      <g>
       <use xlink:href="#m9a5b47d741" x="73.832727" y="307.584" style="stroke: #000000; stroke-width: 0.8"/>
      </g>
     </g>
     <g id="text_1">
      <!-- 1.0 -->
      <g transform="translate(65.881165 322.182437) scale(0.1 -0.1)">
       <defs>
        <path id="DejaVuSans-31" d="M 794 531 
L 1825 531 
L 1825 4091 
L 703 3866 
L 703 4441 
L 1819 4666 
L 2450 4666 
L 2450 531 
L 3481 531 
L 3481 0 
L 794 0 
L 794 531 
z
" transform="scale(0.015625)"/>
        <path id="DejaVuSans-2e" d="M 684 794 
L 1344 794 
L 1344 0 
L 684 0 
L 684 794 
z
" transform="scale(0.015625)"/>
        <path id="DejaVuSans-30" d="M 2034 4250 
Q 1547 4250 1301 3770 
Q 1056 3291 1056 2328 
Q 1056 1369 1301 889 
Q 1547 409 2034 409 
Q 2525 409 2770 889 
Q 3016 1369 3016 2328 
Q 3016 3291 2770 3770 
Q 2525 4250 2034 4250 
z
M 2034 4750 
Q 2819 4750 3233 4129 
Q 3647 3509 3647 2328 
Q 3647 1150 3233 529 
Q 2819 -91 2034 -91 
Q 1250 -91 836 529 
Q 422 1150 422 2328 
Q 422 3509 836 4129 
Q 1250 4750 2034 4750 
z
" transform="scale(0.015625)"/>
       </defs>
       <use xlink:href="#DejaVuSans-31"/>
       <use xlink:href="#DejaVuSans-2e" x="63.623047"/>
       <use xlink:href="#DejaVuSans-30" x="95.410156"/>
      </g>
     </g>
    </g>
    <g id="xtick_2">
     <g id="line2d_2">
      <g>
       <use xlink:href="#m9a5b47d741" x="127.941818" y="307.584" style="stroke: #000000; stroke-width: 0.8"/>
      </g>
     </g>
     <g id="text_2">
      <!-- 1.5 -->
      <g transform="translate(119.990256 322.182437) scale(0.1 -0.1)">
       <defs>
        <path id="DejaVuSans-35" d="M 691 4666 
L 3169 4666 
L 3169 4134 
L 1269 4134 
L 1269 2991 
Q 1406 3038 1543 3061 
Q 1681 3084 1819 3084 
Q 2600 3084 3056 2656 
Q 3513 2228 3513 1497 
Q 3513 744 3044 326 
Q 2575 -91 1722 -91 
Q 1428 -91 1123 -41 
Q 819 9 494 109 
L 494 744 
Q 775 591 1075 516 
Q 1375 441 1709 441 
Q 2250 441 2565 725 
Q 2881 1009 2881 1497 
Q 2881 1984 2565 2268 
Q 2250 2553 1709 2553 
Q 1456 2553 1204 2497 
Q 953 2441 691 2322 
L 691 4666 
z
" transform="scale(0.015625)"/>
       </defs>
       <use xlink:href="#DejaVuSans-31"/>
       <use xlink:href="#DejaVuSans-2e" x="63.623047"/>
       <use xlink:href="#DejaVuSans-35" x="95.410156"/>
      </g>
     </g>
    </g>
    <g id="xtick_3">
     <g id="line2d_3">
      <g>
       <use xlink:href="#m9a5b47d741" x="182.050909" y="307.584" style="stroke: #000000; stroke-width: 0.8"/>
      </g>
     </g>
     <g id="text_3">
      <!-- 2.0 -->
      <g transform="translate(174.099347 322.182437) scale(0.1 -0.1)">
       <defs>
        <path id="DejaVuSans-32" d="M 1228 531 
L 3431 531 
L 3431 0 
L 469 0 
L 469 531 
Q 828 903 1448 1529 
Q 2069 2156 2228 2338 
Q 2531 2678 2651 2914 
Q 2772 3150 2772 3378 
Q 2772 3750 2511 3984 
Q 2250 4219 1831 4219 
Q 1534 4219 1204 4116 
Q 875 4013 500 3803 
L 500 4441 
Q 881 4594 1212 4672 
Q 1544 4750 1819 4750 
Q 2544 4750 2975 4387 
Q 3406 4025 3406 3419 
Q 3406 3131 3298 2873 
Q 3191 2616 2906 2266 
Q 2828 2175 2409 1742 
Q 1991 1309 1228 531 
z
" transform="scale(0.015625)"/>
       </defs>
       <use xlink:href="#DejaVuSans-32"/>
       <use xlink:href="#DejaVuSans-2e" x="63.623047"/>
       <use xlink:href="#DejaVuSans-30" x="95.410156"/>
      </g>
     </g>
    </g>
    <g id="xtick_4">
     <g id="line2d_4">
      <g>
       <use xlink:href="#m9a5b47d741" x="236.16" y="307.584" style="stroke: #000000; stroke-width: 0.8"/>
      </g>
     </g>
     <g id="text_4">
      <!-- 2.5 -->
      <g transform="translate(228.208437 322.182437) scale(0.1 -0.1)">
       <use xlink:href="#DejaVuSans-32"/>
       <use xlink:href="#DejaVuSans-2e" x="63.623047"/>
       <use xlink:href="#DejaVuSans-35" x="95.410156"/>
      </g>
     </g>
    </g>
    <g id="xtick_5">
     <g id="line2d_5">
      <g>
       <use xlink:href="#m9a5b47d741" x="290.269091" y="307.584" style="stroke: #000000; stroke-width: 0.8"/>
      </g>
     </g>
     <g id="text_5">
      <!-- 3.0 -->
      <g transform="translate(282.317528 322.182437) scale(0.1 -0.1)">
       <defs>
        <path id="DejaVuSans-33" d="M 2597 2516 
Q 3050 2419 3304 2112 
Q 3559 1806 3559 1356 
Q 3559 666 3084 287 
Q 2609 -91 1734 -91 
Q 1441 -91 1130 -33 
Q 819 25 488 141 
L 488 750 
Q 750 597 1062 519 
Q 1375 441 1716 441 
Q 2309 441 2620 675 
Q 2931 909 2931 1356 
Q 2931 1769 2642 2001 
Q 2353 2234 1838 2234 
L 1294 2234 
L 1294 2753 
L 1863 2753 
Q 2328 2753 2575 2939 
Q 2822 3125 2822 3475 
Q 2822 3834 2567 4026 
Q 2313 4219 1838 4219 
Q 1578 4219 1281 4162 
Q 984 4106 628 3988 
L 628 4550 
Q 988 4650 1302 4700 
Q 1616 4750 1894 4750 
Q 2613 4750 3031 4423 
Q 3450 4097 3450 3541 
Q 3450 3153 3228 2886 
Q 3006 2619 2597 2516 
z
" transform="scale(0.015625)"/>
       </defs>
       <use xlink:href="#DejaVuSans-33"/>
       <use xlink:href="#DejaVuSans-2e" x="63.623047"/>
       <use xlink:href="#DejaVuSans-30" x="95.410156"/>
      </g>
     </g>
    </g>
    <g id="xtick_6">
     <g id="line2d_6">
      <g>
       <use xlink:href="#m9a5b47d741" x="344.378182" y="307.584" style="stroke: #000000; stroke-width: 0.8"/>
      </g>
     </g>
     <g id="text_6">
      <!-- 3.5 -->
      <g transform="translate(336.426619 322.182437) scale(0.1 -0.1)">
       <use xlink:href="#DejaVuSans-33"/>
       <use xlink:href="#DejaVuSans-2e" x="63.623047"/>
       <use xlink:href="#DejaVuSans-35" x="95.410156"/>
      </g>
     </g>
    </g>
    <g id="xtick_7">
     <g id="line2d_7">
      <g>
       <use xlink:href="#m9a5b47d741" x="398.487273" y="307.584" style="stroke: #000000; stroke-width: 0.8"/>
      </g>
     </g>
     <g id="text_7">
      <!-- 4.0 -->
      <g transform="translate(390.53571 322.182437) scale(0.1 -0.1)">
       <defs>
        <path id="DejaVuSans-34" d="M 2419 4116 
L 825 1625 
L 2419 1625 
L 2419 4116 
z
M 2253 4666 
L 3047 4666 
L 3047 1625 
L 3713 1625 
L 3713 1100 
L 3047 1100 
L 3047 0 
L 2419 0 
L 2419 1100 
L 313 1100 
L 313 1709 
L 2253 4666 
z
" transform="scale(0.015625)"/>
       </defs>
       <use xlink:href="#DejaVuSans-34"/>
       <use xlink:href="#DejaVuSans-2e" x="63.623047"/>
       <use xlink:href="#DejaVuSans-30" x="95.410156"/>
      </g>
     </g>
    </g>
   </g>
   <g id="matplotlib.axis_2">
    <g id="ytick_1">
     <g id="line2d_8">
      <defs>
       <path id="m68853e0c2d" d="M 0 0 
L -3.5 0 
" style="stroke: #000000; stroke-width: 0.8"/>
      </defs>
      <g>
       <use xlink:href="#m68853e0c2d" x="57.6" y="279.36" style="stroke: #000000; stroke-width: 0.8"/>
      </g>
     </g>
     <g id="text_8">
      <!-- 2 -->
      <g transform="translate(44.2375 283.159219) scale(0.1 -0.1)">
       <use xlink:href="#DejaVuSans-32"/>
      </g>
     </g>
    </g>
    <g id="ytick_2">
     <g id="line2d_9">
      <g>
       <use xlink:href="#m68853e0c2d" x="57.6" y="247.104" style="stroke: #000000; stroke-width: 0.8"/>
      </g>
     </g>
     <g id="text_9">
      <!-- 4 -->
      <g transform="translate(44.2375 250.903219) scale(0.1 -0.1)">
       <use xlink:href="#DejaVuSans-34"/>
      </g>
     </g>
    </g>
    <g id="ytick_3">
     <g id="line2d_10">
      <g>
       <use xlink:href="#m68853e0c2d" x="57.6" y="214.848" style="stroke: #000000; stroke-width: 0.8"/>
      </g>
     </g>
     <g id="text_10">
      <!-- 6 -->
      <g transform="translate(44.2375 218.647219) scale(0.1 -0.1)">
       <defs>
        <path id="DejaVuSans-36" d="M 2113 2584 
Q 1688 2584 1439 2293 
Q 1191 2003 1191 1497 
Q 1191 994 1439 701 
Q 1688 409 2113 409 
Q 2538 409 2786 701 
Q 3034 994 3034 1497 
Q 3034 2003 2786 2293 
Q 2538 2584 2113 2584 
z
M 3366 4563 
L 3366 3988 
Q 3128 4100 2886 4159 
Q 2644 4219 2406 4219 
Q 1781 4219 1451 3797 
Q 1122 3375 1075 2522 
Q 1259 2794 1537 2939 
Q 1816 3084 2150 3084 
Q 2853 3084 3261 2657 
Q 3669 2231 3669 1497 
Q 3669 778 3244 343 
Q 2819 -91 2113 -91 
Q 1303 -91 875 529 
Q 447 1150 447 2328 
Q 447 3434 972 4092 
Q 1497 4750 2381 4750 
Q 2619 4750 2861 4703 
Q 3103 4656 3366 4563 
z
" transform="scale(0.015625)"/>
       </defs>
       <use xlink:href="#DejaVuSans-36"/>
      </g>
     </g>
    </g>
    <g id="ytick_4">
     <g id="line2d_11">
      <g>
       <use xlink:href="#m68853e0c2d" x="57.6" y="182.592" style="stroke: #000000; stroke-width: 0.8"/>
      </g>
     </g>
     <g id="text_11">
      <!-- 8 -->
      <g transform="translate(44.2375 186.391219) scale(0.1 -0.1)">
       <defs>
        <path id="DejaVuSans-38" d="M 2034 2216 
Q 1584 2216 1326 1975 
Q 1069 1734 1069 1313 
Q 1069 891 1326 650 
Q 1584 409 2034 409 
Q 2484 409 2743 651 
Q 3003 894 3003 1313 
Q 3003 1734 2745 1975 
Q 2488 2216 2034 2216 
z
M 1403 2484 
Q 997 2584 770 2862 
Q 544 3141 544 3541 
Q 544 4100 942 4425 
Q 1341 4750 2034 4750 
Q 2731 4750 3128 4425 
Q 3525 4100 3525 3541 
Q 3525 3141 3298 2862 
Q 3072 2584 2669 2484 
Q 3125 2378 3379 2068 
Q 3634 1759 3634 1313 
Q 3634 634 3220 271 
Q 2806 -91 2034 -91 
Q 1263 -91 848 271 
Q 434 634 434 1313 
Q 434 1759 690 2068 
Q 947 2378 1403 2484 
z
M 1172 3481 
Q 1172 3119 1398 2916 
Q 1625 2713 2034 2713 
Q 2441 2713 2670 2916 
Q 2900 3119 2900 3481 
Q 2900 3844 2670 4047 
Q 2441 4250 2034 4250 
Q 1625 4250 1398 4047 
Q 1172 3844 1172 3481 
z
" transform="scale(0.015625)"/>
       </defs>
       <use xlink:href="#DejaVuSans-38"/>
      </g>
     </g>
    </g>
    <g id="ytick_5">
     <g id="line2d_12">
      <g>
       <use xlink:href="#m68853e0c2d" x="57.6" y="150.336" style="stroke: #000000; stroke-width: 0.8"/>
      </g>
     </g>
     <g id="text_12">
      <!-- 10 -->
      <g transform="translate(37.875 154.135219) scale(0.1 -0.1)">
       <use xlink:href="#DejaVuSans-31"/>
       <use xlink:href="#DejaVuSans-30" x="63.623047"/>
      </g>
     </g>
    </g>
    <g id="ytick_6">
     <g id="line2d_13">
      <g>
       <use xlink:href="#m68853e0c2d" x="57.6" y="118.08" style="stroke: #000000; stroke-width: 0.8"/>
      </g>
     </g>
     <g id="text_13">
      <!-- 12 -->
      <g transform="translate(37.875 121.879219) scale(0.1 -0.1)">
       <use xlink:href="#DejaVuSans-31"/>
       <use xlink:href="#DejaVuSans-32" x="63.623047"/>
      </g>
     </g>
    </g>
    <g id="ytick_7">
     <g id="line2d_14">
      <g>
       <use xlink:href="#m68853e0c2d" x="57.6" y="85.824" style="stroke: #000000; stroke-width: 0.8"/>
      </g>
     </g>
     <g id="text_14">
      <!-- 14 -->
      <g transform="translate(37.875 89.623219) scale(0.1 -0.1)">
       <use xlink:href="#DejaVuSans-31"/>
       <use xlink:href="#DejaVuSans-34" x="63.623047"/>
      </g>
     </g>
    </g>
    <g id="ytick_8">
     <g id="line2d_15">
      <g>
       <use xlink:href="#m68853e0c2d" x="57.6" y="53.568" style="stroke: #000000; stroke-width: 0.8"/>
      </g>
     </g>
     <g id="text_15">
      <!-- 16 -->
      <g transform="translate(37.875 57.367219) scale(0.1 -0.1)">
       <use xlink:href="#DejaVuSans-31"/>
       <use xlink:href="#DejaVuSans-36" x="63.623047"/>
      </g>
     </g>
    </g>
   </g>
   <g id="line2d_16">
    <path d="M 73.832727 295.488 
L 182.050909 247.104 
L 290.269091 166.464 
L 398.487273 53.568 
" clip-path="url(#p84bbd72770)" style="fill: none; stroke: #1f77b4; stroke-width: 1.5; stroke-linecap: square"/>
   </g>
   <g id="patch_3">
    <path d="M 57.6 307.584 
L 57.6 41.472 
" style="fill: none; stroke: #000000; stroke-width: 0.8; stroke-linejoin: miter; stroke-linecap: square"/>
   </g>
   <g id="patch_4">
    <path d="M 414.72 307.584 
L 414.72 41.472 
" style="fill: none; stroke: #000000; stroke-width: 0.8; stroke-linejoin: miter; stroke-linecap: square"/>
   </g>
   <g id="patch_5">
    <path d="M 57.6 307.584 
L 414.72 307.584 
" style="fill: none; stroke: #000000; stroke-width: 0.8; stroke-linejoin: miter; stroke-linecap: square"/>
   </g>
   <g id="patch_6">
    <path d="M 57.6 41.472 
L 414.72 41.472 
" style="fill: none; stroke: #000000; stroke-width: 0.8; stroke-linejoin: miter; stroke-linecap: square"/>
   </g>
  </g>
 </g>
 <defs>
  <clipPath id="p84bbd72770">
   <rect x="57.6" y="41.472" width="357.12" height="266.112"/>
  </clipPath>
 </defs>
</svg>
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

let item2 = new GridItem({templateid:"#gridelementtemplate", grid: grid, headertext: "chart 2", griditemoptions: {w:2,h:2,} });
item2.setInnerHtml(testsvg2);

let item3 = new GridItem({templateid:"#gridelementtemplate", grid: grid, headertext: "chart 4",});
item3.setInnerHtml(testsvg4);

let item4 = new GridItemTabulator({templateid:"#gridelementtemplate", grid: grid, headertext: "Transform steps",});
item4.init();

let item5 = new GridItemCodeEditor({templateid:"#gridelementtemplatecode", grid: grid, headertext: "py code",});

//  to compact grid
grid.compact();

// to save grid   (saveContent = false, saveGridOpt = true)
console.log(JSON.stringify(self.testgrid.save(false, true)));  

// change color of svg elements
document.getElementById("pyloaded").querySelector("svg").style.stroke = "gray";

// test menu event

let testmenucontrol = new MenuEventsControl({dropDownMenuElementId:'#testwindowmenu1',parentUUID: '',multiLevelMenu:true});
testmenucontrol.eventbus.subscribe('menuitemclick',(obj,eventdata)=>{ 
		console.log("menuitemclick",obj,eventdata); 
	});

let testloadscriptheader = document.querySelector('#testloadxlsscript');
testloadscriptheader.addEventListener("contextmenu", (event)=>{
		console.log("load script contextmenu");
		
		event.preventDefault();
		let t0 = document.querySelector('#loadxlsscriptdropdown');
		
		bootstrap.Dropdown.getOrCreateInstance(t0)?.toggle();
		//~ if (!window.testt1) {
			//~ window.testt1 = bootstrap.Dropdown.getOrCreateInstance(t0);
		//~ }
		//~ window.testt1.show();
		
		
		
	});

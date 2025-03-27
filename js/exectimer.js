/*--------------------------------------------------------
 * class exectimer for timing execution times
 * 
 * 
 *--------------------------------------------------------*/

export class ExecTimer {
	#t0;
	#tprev;
	#eventslist;
	#timestart;
		
	constructor (params) {
		this.#t0 = performance.now();
		this.#tprev = this.#t0;
		this.#timestart = new Date();
		console.log(this.#timestart, params.msgtext);
		this.#eventslist = [];
		this.#eventslist.push(
			{
				"perfnow":this.#t0,
				"msg":params.msgtext,
				"lengthmilli":0
			}
		);
	}
	
	timeit(msgtext) {
		let perfnow = performance.now();
		let lengthmilli = perfnow-this.#tprev;
		this.#tprev = perfnow;
		this.#eventslist.push(
			{
				"perfnow":perfnow,
				"msg":msgtext,
				"lengthmilli":lengthmilli
			}
		);
		console.log("Event",this.#eventslist.length-1,msgtext,this.millitosec(lengthmilli),"sec");
		return lengthmilli;
	}
	
	millitosec(milli) {
		return milli/1000;
	}
	
}

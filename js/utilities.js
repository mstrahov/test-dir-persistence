export function makeCloneFromTemplate(templateid,uuid) {
    const template = document.querySelector(templateid);
    const clone = template.content.cloneNode(true);	
    const elements = clone.querySelectorAll('[id]');
    elements.forEach(element => {
	const originalID = element.getAttribute('id');
	element.setAttribute('id', `${originalID}${uuid}`);
    });
    return clone;
}


// *******************************************************

//  creates a nested tree dataset out of flat rowsarr, nested tree is generated from sortfields field names, with rollupfields and recalccallback function - used to correct rollup values
export const getTreeDataRows = (rowsarr, sortfields, rollupfields, recalccallback, filterarr=[], childrenrowscallback, alreadysorted=false, parentrowcallback) => {
	let res=[];
	let rowcounter = 2;
	//  assert sortfields.length > 0
	//  assert rollupfields.length > 0
	// recalccallback        must return a copy of the vector object with necessary adjustments
	// filter if filterarr present = [ {field:'', type:"=", value: v }]
	
	if (filterarr.length>0) {
		rowsarr = rowsarr.filter((v)=>{
			let filterres = true;
			for (let i=0;filterres&&i<filterarr.length;i++) {
				if (v[filterarr[i]['field']]!==undefined && v[filterarr[i]['field']]!==filterarr[i]['value']) {
					filterres = false;
				}
			}
			return filterres;
		});	
	};
	
	//  sort internal rows by sortfields - they become a tree structure later
	if (!alreadysorted) {
		rowsarr.sort((a,b)=>{
			let res = 0;
			let stringa1 = '';
			let stringb1 = '';
			for(let i=0;i<sortfields.length;i++) {
				stringa1 += a[sortfields[i]].padEnd(50,'x');
				stringb1 += b[sortfields[i]].padEnd(50,'x');
			}
			if (stringa1<stringb1) { 
				res=-1; 
			} else if (stringa1>stringb1) {
				res = 1;
			}
			return res;	
		});
	}
	// make a tree based on sortfields
	
	let maxtreelevel = sortfields.length-1;

	/*    ADDITIONAL CALCULATIONS FOR ROLLUP TOTALS - percentages, etc     */
	const recalcvector = (torecalc, rolluplevel) => {
		// let res = {...torecalc};
		if (recalccallback!=undefined) {
			return recalccallback(torecalc, rolluplevel, sortfields);
		} 
		
		return torecalc;
	}

	// recursively get nested tree levels here, up to maxtreelevel, rows table MUST BE SORTED 
	
	const getRowForLevel = (i,rowcounter,rowlevel,idpathtolevel) =>  {
		let res = {
			newi: i,
			newrowcounter: rowcounter,
			newvector: {},
			pushrow: {},
			idpath: idpathtolevel,
		};
				
		if (i>=rowsarr.length) { return res; }
		
		if (rowlevel===maxtreelevel) {
			
			// we are at the last level, version with a last level roll-up
			
			// form a new vector, but nothing happens here for now, need to check recalc logic on original source row
			let curvector = {};
			
			rollupfields.forEach((v)=>curvector[v]=0);
			
			let firstlinesignature = '';
			for(let k=0;k<sortfields.length;k++) {
				firstlinesignature += rowsarr[i][sortfields[k]].padEnd(50,'x');
			}
			
			let nextlinesignature = firstlinesignature;
			let j2 = i;
			
			while (j2<rowsarr.length&&nextlinesignature===firstlinesignature) {
				nextlinesignature = '';
				for(let k=0;k<sortfields.length;k++) {
					nextlinesignature += rowsarr[j2][sortfields[k]].padEnd(50,'x');
				}
				if (nextlinesignature===firstlinesignature) {
					rollupfields.forEach((v)=>curvector[v]+=rowsarr[j2][v]);
					j2++;
				}
				
			}
			
			curvector = recalcvector(curvector,rowlevel);

			res.pushrow = {...rowsarr[i]};
			res.pushrow['id'] = rowcounter;
			res.pushrow['rowlevel'] = rowlevel;
			res.pushrow['rowlevelpath'] = sortfields;
			res.pushrow['idpath'] = idpathtolevel;
			// leftcolumn value is replaced by value from current rowlevel column as defined by sortfields
			res.pushrow['leftcolumn'] = rowsarr[i][sortfields[rowlevel]];
			// reassign values back from recalced vector ??  
			rollupfields.forEach((v)=>res.pushrow[v]=curvector[v]);
			
			res.newi = j2;
			res.newrowcounter = rowcounter+1;
			res.newvector = {...curvector};
			return res;
			
		} else if (rowlevel<maxtreelevel) {
			// initialize curvector for current level
			let curvector = {};
			rollupfields.forEach((v)=>curvector[v]=0);
			let childrenrows = [];
			
			let j=i;
			let newrowcounter=rowcounter+1;
			let nextrowlevel = rowlevel + 1;
			let flagLevelContinues = true;
			while (flagLevelContinues) {
				let newpath = [...idpathtolevel];
				newpath.push(rowcounter);
				let newchild = getRowForLevel(j,newrowcounter,nextrowlevel,newpath);
				if (newchild.newi>j) {
					childrenrows.push(newchild.pushrow);
					j = newchild.newi;
					newrowcounter = newchild.newrowcounter;
					// add to current vector
					/* 	newchild.newvector.forEach((v,ind) => curvector[ind]+=v);  */
					rollupfields.forEach((v)=>curvector[v]+=newchild.newvector[v]);
					
					if (j>=rowsarr.length) { 
						flagLevelContinues = false; 
						continue;
					}
					// check that rowlevel continues, sortfields[rowlevel] has an attribute name to check in rowsarr[i] and rowsarr[j]

					for (let k=0;k<=rowlevel;k++) {
						flagLevelContinues = flagLevelContinues && (rowsarr[i][sortfields[k]]===rowsarr[j][sortfields[k]]);
					}
					
				} else  {
					flagLevelContinues = false;
				}	
			}
			curvector = recalcvector(curvector,rowlevel);
			//  push a new row with children
			
			if (parentrowcallback) {
				res.pushrow = {...parentrowcallback({
											'id' : rowcounter,
											'rowlevel' : rowlevel,
											'rowlevelpath' : sortfields,
											'idpath' : idpathtolevel,
											'pushrow': {...rowsarr[i]},
												})
								};
			} else {
				res.pushrow = {...rowsarr[i]};
			}
			res.pushrow['id'] = rowcounter;
			res.pushrow['rowlevel'] = rowlevel;
			res.pushrow['rowlevelpath'] = sortfields;
			res.pushrow['idpath'] = idpathtolevel;
			
			if (childrenrowscallback!==undefined) {
				
				
				res.pushrow['_children'] = childrenrowscallback({
											'id' : rowcounter,
											'rowlevel' : rowlevel,
											'rowlevelpath' : sortfields,
											'idpath' : idpathtolevel,
											'childrenrows': childrenrows
												});
			}
			else {
				res.pushrow['_children'] = childrenrows;
			}
			// leftcolumn value is replaced by value from current rowlevel column as defined by sortfields
			res.pushrow['leftcolumn'] = rowsarr[i][sortfields[rowlevel]];
			// reassign values back from recalced vector ??  
			rollupfields.forEach((v)=>res.pushrow[v]=curvector[v]);
	
			res.newi = j;
			res.newrowcounter = newrowcounter;
			res.newvector = {...curvector};
			return res;
		
		} 
			
	};
	
	let i=0;
	while (i<rowsarr.length) {
		let newchild = getRowForLevel(i,rowcounter,0,[]);
		if (newchild.newi>i) {
			res.push(newchild.pushrow);
			i = newchild.newi;
			rowcounter = newchild.newrowcounter;	
		} else  {
			i = rowsarr.length;
		}	
	}
	
	return res;
	
};
//  -----------------------------------------------------------------------

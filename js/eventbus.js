/**********************************
 * Event Bus
 * 
 * window.testdataframe2.eventbus.subscribe('tableBuilt',()=>{ console.log("df2 table built"); });
 * 
 * window.testdataframe2.eventbus.subscribe('dfActionEvent',(obj,eventdata)=>{ console.log("dfActionEvent",obj,eventdata);  window.teststeps.addScriptStep(eventdata);  });
 * that.eventbus.dispatch('dfActionEvent',that,{actionid:a.actionid, parameters:{df:"df",rownum:cell.getRow().getIndex(), colnum:colIndex-1}}  );
 * 
 * **********************************/

export default class EventBus {

	constructor(eventobj, debug){
		this.events = {};
		this.subscriptionNotifiers = {};
		this.eventobj = eventobj;
		this.dispatch = debug ? this._debugDispatch.bind(this) : this._dispatch.bind(this);
		this.debug = debug;
	}

	subscriptionChange(key, callback){
		if(!this.subscriptionNotifiers[key]){
			this.subscriptionNotifiers[key] = [];
		}

		this.subscriptionNotifiers[key].push(callback);

		if(this.subscribed(key)){
			this._notifySubscriptionChange(key, true);
		}
	}

	subscribe(key, callback){
		if(!this.events[key]){
			this.events[key] = [];
		}

		this.events[key].push(callback);

		this._notifySubscriptionChange(key, true);
	}

	unsubscribe(key, callback){
		var index;

		if(this.events[key]){
			if(callback){
				index = this.events[key].findIndex((item) => {
					return item === callback;
				});

				if(index > -1){
					this.events[key].splice(index, 1);
				}else{
					console.warn("Cannot remove event, no matching event found:", key, callback);
					return;
				}
			}else{
				delete this.events[key];
			}
		}else{
			console.warn("Cannot remove event, no events set on:", key);
			return;
		}

		this._notifySubscriptionChange(key, false);
	}

	subscribed(key){
		return this.events[key] && this.events[key].length;
	}

	_notifySubscriptionChange(key, subscribed){
		var notifiers = this.subscriptionNotifiers[key];

		if(notifiers){
			notifiers.forEach((callback)=>{
				callback(subscribed);
			});
		}
	}

	_dispatch(){
		var args = Array.from(arguments),
		key = args.shift(),
		result;

		if(this.events[key]){
			this.events[key].forEach((callback, i) => {
				let callResult = callback.apply(this.eventobj, args);

				if(!i){
					// only the result of the first callback will be returned
					result = callResult;
				}
			});
		}

		return result;
	}

	_debugDispatch(){
		var args = Array.from(arguments),
		key = args[0];

		args[0] = "ExternalEvent:" + args[0];

		if(this.debug === true || this.debug.includes(key)){
			console.log(...args);
		}

		return this._dispatch(...arguments);
	}
}

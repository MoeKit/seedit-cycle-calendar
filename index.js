var Eventor = require("eventor");
var CycleCalendar = function(opt){
	return this.init(opt);
};
HTMLElement.prototype.slider = function(fn) {
	var _this = this;
    this.__t = {};
    this.tevent = {
    	tstart: function(e) {
            this.val = null;
	        e.stopPropagation();
	        this.__t.startX = e.changedTouches[0].pageX;
        },
        tmove: function(e) {
            this.val = e.changedTouches[0].pageX - this.__t.startX;
	    	if( Math.abs(this.val) > 2 ){
	    		e.preventDefault();
	    	}
        },
        tend: function(e) {
            if( this.val > 20 ){
	    		fn && fn(e, "left");
	    	} else if( this.val < -20 ){
	    		fn && fn(e, "right");
	    	}
        }
    }
    this.addEventListener('touchstart', this.tevent.tstart);
    this.addEventListener('touchmove', this.tevent.tmove);
    this.addEventListener("touchend", this.tevent.tend);
};
Eventor.mixTo(CycleCalendar);
require("./style.css");

/*
 * 类型1. 亲密一刻： 先渲染日期，再请求接口渲染状态
 * 类型2. 周期圆圈设置开始结束日：先请求接口判断哪些时间可以进行选择
 * 类型3. 周期补充选择月经开始结束日：先请求接口当前月哪些时间可以进行设置月经期
 */

CycleCalendar.prototype.init = function(opt){
	var _this = this;
	if( !!opt ){
		_this.classname = opt.classname || '';
		_this.objClass = $("."+_this.classname);
		_this.width = opt.width || document.body.clientWidth;
		_this.objClass.width( _this.width );
		_this.isdate = opt.isdate || false;
		_this.fill_history = opt.fill_history || false;
		_this.history_date = opt.history_date;
		_this.speed = opt.speed || 300;
		_this.token = opt.token || "";
		_this.api = opt.api || "";
		_this.sysdate = _this.__getYMD();
		_this.date = {
			year: new Date().getFullYear(),
			month: new Date().getMonth()+1
		}
		opt = null;
	}
	
	if( !!_this.error() ) return false;
	if( this.isdate ){
		_this.getApi( _this.date.year, _this.date.month, function(){
			_this.initHtml();
			_this.addEvent();
		} );
		_this.getApi( lastMonth(_this.date).year, lastMonth(_this.date).month );
		// _this.getApi( lastMonth(_this.date).year, lastMonth(_this.date).month );
		
	} else if( this.fill_history ){
		// _this.getApi( _this.date.year, _this.date.month, function(){
		// 	_this.initHtml();
		// 	_this.addEvent();
		// } );
		_this.initHtmlByCompletementCycle();

		//_this.getApi( lastMonth(_this.date).year, lastMonth(_this.date).month );
	} else  {
		_this.initHtml();
		_this.getApi( _this.date.year, _this.date.month );
		_this.getApi( lastMonth(_this.date).year, lastMonth(_this.date).month );
		_this.addEvent();	
	}
	
}
CycleCalendar.prototype.error = function(){
	var _this = this;
	if( !_this.classname || document.getElementsByClassName(_this.classname).length <= 0 ){
		console.error("classname不能为空或者classname对象不存在");
		return true;
	} else if( !_this.token ){
		console.error(_this.classname, " token不能为空");
		return true;
	} else return false;
}
CycleCalendar.prototype.__getYMD = function(timestamp){
	// t是时间戳
	var obj = !!timestamp ? new Date(timestamp*1000) : new Date();
	var obj = {
		year: obj.getFullYear(),
		month: obj.getMonth()+1,
		day: obj.getDate(),
		original: parseInt(obj.getTime()/1000,10),
	};
	obj.ymd = [obj.year, obj.month, obj.day];
	obj.stamp = parseInt(new Date(obj.year, obj.month-1, obj.day).getTime()/1000,10);
	obj.firstStamp = parseInt(new Date(obj.year, obj.month-1, 1).getTime()/1000,10);
	obj.lastStamp = parseInt(new Date(obj.year, obj.month, 0).getTime()/1000,10); 
	return obj;
}
// 设置状态：月经期
CycleCalendar.prototype.setMenstrual = function(year, month, info){
	if( !!info ){
		for( var i=0; i<info.length; i++ ){
			renderMenstrual({
				start: info[i].come,
				end: info[i].end-86400,
				year: year,
				month: month,
				really: info[i].really
			});
		}
	}
}
CycleCalendar.prototype.getApi = function(year, month, cb){
	var _this = this;
	// 设置状态：排卵期、排卵日、同房姿势
	_this.setMostStatus = function(year, month, data){
		if( !data.data.record ){
			console.error("设置状态时，record不存在");
			return false;
		}
		var record = data.data.record;
		var list = $(".tab-"+year+"-"+month+" .can-show");
		list.removeClass("menstrual ovulation ovulate-day").find("em").removeClass();
		for( var i=0; i<record.length; i++ ){
			if( !!record[i].period ){
				if( record[i].period == 0 ){
					// list.eq(i).addClass("menstrual"); 经期采用时间段来控制
				} else if( record[i].period == 2 && !!record[i].really ){
					list.eq(i).addClass("ovulation"); // 排卵期
				} else if( record[i].period == 3 && !!record[i].really ){
					list.eq(i).addClass("ovulation ovulate-day"); // 排卵日
				}
			}
			if( record[i].aa == 1 ){
				list.eq(i).find("em").addClass("posture-"+record[i].post); // 同房姿势
			}
		}
	}
	
	// 周期圆圈-更新月经开始日和月经结束日
	_this.setDateByCycle = function(data){
		if( _this.isdate ){
			var ring = data.data.ring;
			ring.info = data.data.info[0];
			var today = _this.sysdate;
			var come = _this.__getYMD(ring.info.come);
			var end = _this.__getYMD(ring.info.end);
			var menstrualBtn = !!ring.info.end ? 
									(today.stamp >= come.original+24*60*60 ? 
										today.stamp <= end.original+14*24*60*60 ? 'end' : 'come' 
									: '')
								: (today.stamp >= come.stamp ? 'come': '');
			if( menstrualBtn == "come" ){
				_this.earlyDate = _this.__getYMD(ring.info.end+14*24*60*60).ymd;
			} else if( menstrualBtn == "end" ){
				_this.earlyDate = _this.__getYMD(ring.info.come+24*60*60).ymd;
			} else {
				_this.earlyDate = today.ymd;
			}
			cb && cb();

		}
	}
	// 补充历史周期，选择开始日和结束日
	_this.setDateByCompletementCycle = function(year, month, data){
		if( _this.fill_history ){
			var date = _this.__getYMD(parseInt(new Date(year,month-1,1).getTime()/1000,10));
			var rangeInfo = data.data.rangeInfo;
			var arr = [];
			
			if( !rangeInfo || rangeInfo.length <= 0 ){
				arr[0] = {
					come: parseInt(new Date(year, month-1, 1).getTime()/1000,10),
					end: parseInt(new Date(year, month, 1).getTime()/1000,10)-1
				}
				// console.log({
				// 	come: parseInt(new Date(year, month-1, 1).getTime()/1000,10),
				// 	end: parseInt(new Date(year, month, 1).getTime()/1000,10)-1
				// }  );
				// console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++");
			} else {
				var one = _this.__getYMD(rangeInfo[0].end);
				var last = _this.__getYMD(rangeInfo[rangeInfo.length-1].end);
				var _status = {
					first: false,
					current: false,
					last: false,
					divider_first: parseInt(new Date(year, month-1, 1).getTime()/1000,10),
					divider_last: parseInt(new Date(year, month-1, 1).getTime()/1000,10)
				}; // 本月周期是否存在上月周期和下月周期
				//if( (one.year == year && one.month < month) || (one.year < year && one.month > month) ){
					//if( month == 7 ){
						// data.data.rangeInfo && data.data.rangeInfo[0] && console.log( new Date((data.data.rangeInfo[0].come)*1000), new Date((data.data.rangeInfo[0].end)*1000) );
						// data.data.rangeInfo && data.data.rangeInfo[1] && console.log( new Date((data.data.rangeInfo[1].come)*1000), new Date((data.data.rangeInfo[1].end)*1000) );
						// data.data.rangeInfo && data.data.rangeInfo[2] && console.log( new Date((data.data.rangeInfo[2].come)*1000), new Date((data.data.rangeInfo[2].end)*1000) );
						// data.data.rangeInfo && data.data.rangeInfo[3] && console.log( new Date((data.data.rangeInfo[3].come)*1000), new Date((data.data.rangeInfo[3].end)*1000) );
						// console.log("---------------------------------------------------------");
					//}
					
						var _prepMonth = lastMonth({
							year: year,
							month: month
						});
						var _nextMonth = nextMonth({
							year: year,
							month: month
						});

						rangeInfo = [{
							come: parseInt(new Date(_prepMonth.year, _prepMonth.month-1, 1).getTime()/1000,10)-14*24*60*60,
							end: parseInt(new Date(_prepMonth.year, _prepMonth.month-1, 1).getTime()/1000,10)-14*24*60*60
						}].concat(rangeInfo).concat([{
							come: parseInt(new Date(_nextMonth.year, _nextMonth.month-1, 1).getTime()/1000,10)+14*24*60*60,
							end: parseInt(new Date(_nextMonth.year, _nextMonth.month-1, 1).getTime()/1000,10)+14*24*60*60
						}]);
					for(var i=0; i<rangeInfo.length; i++){
						if( _status.divider_first > rangeInfo[i].come ) _status.first = true;
						if( rangeInfo[i].come < _status.divider_first && _status.divider_first < rangeInfo[i].end ) _status.current = true;
						if( _status.divider_last < rangeInfo[i].end ) _status.last = true;
						// if( month == 7 ){
						// 	console.log( new Date((rangeInfo[i].come)*1000), new Date((rangeInfo[i].end)*1000) );
						// 	//console.log( !!rangeInfo[i+1], rangeInfo[i+1].come, rangeInfo[i].end ,14*24*60*60 );
						// }
						
						// if( !!rangeInfo[i].end < _this.sysdate.firstStamp ){
						// 	start[0] = start[0] || {};
						// 	start[0].start = rangeInfo[i].end+24*60*60;
						// }

						// if( one.year == year && one.month == month && i == 0 && rangeInfo[0].start - date.firstStamp > 14*24*60*60 ){
						// 	arr.push({
						// 		come: date.firstStamp,
						// 		end: rangeInfo[0].start-14*24*60*60
						// 	});
						// } else 
						
						if( !!rangeInfo[i+1] && rangeInfo[i+1].come - rangeInfo[i].end > 28*24*60*60 ){
							arr.push({
								come: rangeInfo[i].end+15*24*60*60,
								end: rangeInfo[i+1].come-14*24*60*60
							});
							if( month == 7 ){
								//console.log("qq",arr);
							}
						}
						// if( rangeInfo.length-1 == i && arr.length <= 0 ){
						// 	var t = _this.__getYMD( rangeInfo[i].end );
						// 	if( (t.year == year && t.month < month) || t.year < year ){
						// 		arr.push({
						// 			come: rangeInfo[i].end+14*24*60*60,
						// 			end: _this.__getYMD( parseInt(new Date(year, month, 0).getTime()/1000,10) ).lastStamp
						// 		});
						// 	} else if(t.year == year && t.month == month){

						// 	}
						// 	if( (t.year == year && t.month != month) || t.year != year ){
						// 		t = _this.__getYMD( parseInt(new Date(year, month, 0).getTime()/1000,10) );
						// 		console.log(2222222222222);
						// 		// arr.push({
						// 		// 	come: t.firstStamp,
						// 		// 	end: t.lastStamp
						// 		// });
						// 	}
						// }
					}

				//}
				
				
				// arr[0] = arr.length == 0 ? {
				// 	come: date.firstStamp,
				// 	end: date.lastStamp
				// } : arr[0];
				
				
			}
			_this.history_arr = [];
				

				if( arr.length == 0 ) _this.history_arr = [];
				var _cur_first = parseInt(new Date(year, month-1, 1).getTime()/1000,10);
				var _cur_last = parseInt(new Date(year, month, 1).getTime()/1000,10);
				for(var i=0;i<arr.length; i++){
					arr[i] = {
						come: _this.__getYMD(arr[i].come),
						end: _this.__getYMD(arr[i].end)
					};
					for( var j = arr[i].come.stamp; j < arr[i].end.stamp; j+=24*60*60 ){
						if( _cur_first <= j && j <= _cur_last ){
							_this.history_arr.push( new Date(j*1000).getDate() );
						}
					}
					// for(var j=arr[i].come.day; j<=arr[i].end.day; j++){
					// 	console.log(  );

					// 	if( arr[i].end.year === year && arr[i].end.month === month ) _this.history_arr.push(j);
					// }
				}
			cb && cb(data);
		} else {
			console.log("errr");
		}
	}
	$.ajax({
		url: _this.api,
		type: "get",
		data: {
			token: _this.token,
			date: new Date(year,month-1,1).getTime()*0.001 // ios不支持 "2015-04-01",即不支持"-"
		},
		success: function(data){
			if( data.error_code > 0 ){
				return console.error(data.error_message);
			}
			if( !data || !data.data || !data.data.record ){
				console.error("ring.json: data.data||data.data.record不能为空");
			}
			if( !_this.isdate ){
				_this.setMostStatus(year, month, data);
			}
			_this.setDateByCycle(data);
			_this.setDateByCompletementCycle(year, month, data);
		},
		error: function(data){
			console.error("error", data);
		}
	});
}
function renderMenstrual(opt){
	if( !opt.really ){
		// 预测数据不显示
		return false;
	}
	if( !!opt.start && !!opt.year && !!opt.month ){
		var list = $(".tab-"+opt.year+"-"+opt.month+" .can-show");
		var allDay = new Date(opt.year, opt.month, 0).getDate();
		var start = new Date(opt.start*1000);
		if( !!opt.end ){
			for( var i=1; i<=allDay; i++ ){
				var eventday = parseInt(new Date(opt.year, (opt.month-1), i).getTime()/1000,10);
				if( opt.start <= eventday && eventday <= opt.end+24*60*60 ){
					list.eq( i-1 ).addClass("menstrual");
				}
			}
		} else if(start.getFullYear() == opt.year && (start.getMonth()+1) == opt.month ) {
			list.eq( start.getDate()-1 ).addClass("menstrual");
		}
	} else {
		console.error("经期开始时间为空 || 当前时间的年月为空");
	}
}
function addZero(num){
	return num<10? "0"+num : num;
}
CycleCalendar.prototype.initHtml = function(){
	var _this = this;
	var html = require("./index.tpl").replace("{{date}}",_this.date.year+"年"+_this.date.month+"月")
										.replace("{{table}}", _this.initTable(lastMonth(_this.date).year, lastMonth(_this.date).month)+_this.initTable(_this.date.year, _this.date.month) );
	_this.objClass
			.html(html)
			.find(".appdate-main")
			.width( parseInt(_this.objClass.find(".appdate-main table").length, 10)+"01%" )
			.css("-webkit-transform","translateX("+(-_this.width)+"px)")
			.attr("data-translate-x",-_this.width)
			.find("table").width(_this.width);
}
CycleCalendar.prototype.initHtmlByCompletementCycle = function(year, month){
	var _this = this;
	_this.getApi( lastMonth(_this.date).year, lastMonth(_this.date).month, function(data){
		var t = _this.initTable(lastMonth(_this.date).year, lastMonth(_this.date).month);
		_this.getApi( _this.date.year, _this.date.month, function(next_data){
			t += _this.initTable(_this.date.year, _this.date.month);
			var html = require("./index.tpl").replace("{{date}}",_this.date.year+"年"+_this.date.month+"月")
										.replace("{{table}}", t );
			_this.objClass
					.html(html)
					.find(".appdate-main")
					.width( parseInt(_this.objClass.find(".appdate-main table").length, 10)+"01%" )
					.css("-webkit-transform","translateX("+(-_this.width)+"px)")
					.attr("data-translate-x",-_this.width)
					.find("table").width(_this.width);
			_this.setMenstrual(_this.date.year, _this.date.month, next_data.data.info);
			_this.setMenstrual(lastMonth(_this.date).year, lastMonth(_this.date).month, data.data.info);
			_this.setMenstrualToFillCycle();
			_this.addEventByApi();
		} );
	});
}
CycleCalendar.prototype.setMenstrualToFillCycle = function(){
	if( this.fill_history && this.history_date ){
		var _history_come = this.__getYMD(this.history_date.come);
		var _history_end = this.__getYMD(this.history_date.end);
		for(var i=_history_come.month; i<=_history_end.month; i++){
			if( this.objClass.find(".tab-"+_history_come.year+"-"+i).length > 0 ){
				this.setMenstrual(_history_come.year, i, [{
					come: this.history_date.come,
					end: this.history_date.end,
					really: 1
				}])
			}
		}
	}
	
}
CycleCalendar.prototype.initTable = function(year, month){
	var _this = this;
	//this.earlyDate = [2010,8,15];
	var today = _this.sysdate;
	var lastMonthAllDay = new Date(year,month-1,0).getDate(); // 上月总天数
	var nowMonthAllDay = new Date(year,month,0).getDate(); // 本月总天数
	var firstDayWeek = new Date(year,month-1,1).getDay(); // 本月首日的星期索引
	var lastDayWeek = new Date(year+"-"+addZero(month)+"-"+addZero(nowMonthAllDay)).getDay(); // 上月末日的星期索引
	var arr = []
		, i = 0;
	for( i=lastMonthAllDay-firstDayWeek+1; i<=lastMonthAllDay; i++ ){ // 显示当月还存在的上月天数
		arr.push({date: i, isNowMonth: false});
	}
	// date: 当天，isNowMonth：是否是当前月份， isFuture：是否是当前月
	if( this.isdate ) this._formatEarlyDate();
	for( i=1; i<=nowMonthAllDay; i++ ){ // 显示当月存在的天数
		if( this.fill_history ){
			if( _this.history_arr.length <= 0 ){
				arr.push({date: i, isNowMonth: true, isPast: true });
			} else {
				for( var j=0; j<_this.history_arr.length; j++ ){
					if( _this.history_arr[j] == i ){
						if( year == today.year && month == today.month && i == today.day ){
							arr.push({date: "今", isNowMonth: true, isToday: true});
						} else if( _this.fill_history && _this.history_date && _this.history_date.come > parseInt(new Date(year, month-1, i).getTime()/1000,10) && _this.history_date.come-14*24*60*60 <= parseInt(new Date(year, month-1, i).getTime()/1000,10) ) arr.push({date: i, isNowMonth: true, isPast: true });
						else  arr.push({date: i, isNowMonth: true });
						break;
					}
					if( j == _this.history_arr.length-1 ){
						arr.push({date: i, isNowMonth: true, isPast: true });
					}
				}
			}
		} else if( this.isdate ){
			if( year == today.year && month == today.month && i > today.day ){
				arr.push({date: i, isNowMonth: true, isFuture: true });
			} else if( year == today.year && month == today.month && i == today.day ) {
				if( year > this.earlyDate[0] || (year == this.earlyDate[0] && month > this.earlyDate[1]) || (year == this.earlyDate[0] && month == this.earlyDate[1] && i > this.earlyDate[2]) ) arr.push({date: "今", isNowMonth: true, isToday: true});
				else arr.push({date: "今", isNowMonth: true, isToday: true, isPast: true});
			} else if( this.earlyDate[0] == year && this.earlyDate[1] == month ){
				if( i < this.earlyDate[2] ) arr.push({date: i, isNowMonth: true, isPast: true});
				else arr.push({date: i, isNowMonth: true });
			} else if( this.earlyDate[0] == year && this.earlyDate[1] > month ){
				arr.push({date: i, isNowMonth: true, isPast: true});
			} else {
				arr.push({date: i, isNowMonth: true });
			}
			continue;
		} else {
			if( year == today.year && month == today.month && i > today.day ){
				arr.push({date: i, isNowMonth: true, isFuture: true });
			} else if( year == today.year && month == today.month && i == today.day ) {
				arr.push({date: "今", isNowMonth: true, isToday: true});
			} else {
				arr.push({date: i, isNowMonth: true});
			}
		}
	}
	for( i=1; i<=(6-lastDayWeek); i++ ){ // 显示当月还存在的下月天数
		arr.push({date: i, isNowMonth: false});
	}
	table = '<table class="rows-'+Math.ceil(arr.length/7)+' tab-'+year+'-'+month+'" data-date="'+year+'-'+month+'" style="width: '+_this.width+'px;" cellspacing="0" cellpadding="0">';
	for( i=0; i<arr.length; i++ ){ // 渲染当月可显示的天数
		table += i ==0 ? '<tr>' : i%7 == 0 ? '</tr><tr>' : ''; // 每一周换一行(即tr)  
		table += arr[i].isNowMonth ? 
					(arr[i].isFuture||arr[i].isPast ? '<td><div class="can-show can-not-do"><span>'+arr[i].date+'</span><em></em></div></td>' : 
						arr[i].isToday ? '<td><div class="can-show can-do-it today"><span>'+arr[i].date+'</span><em></em></div></td>' :
							'<td><div class="can-show can-do-it"><span>'+arr[i].date+'</span><em></em></div></td>')
					: '<td>'+arr[i].date+'</td>';
	}
	table += '</tr></table>';
	return table;
}
CycleCalendar.prototype._formatEarlyDate = function(){
	var day = new Date(this.earlyDate[0],addZero(this.earlyDate[1]),0).getDate();
	this.earlyDate[1] = this.earlyDate[1] <= 0 ? 1 : this.earlyDate[1] > 12 ? 12 : this.earlyDate[1];
	this.earlyDate[2] = this.earlyDate[2] <= 0 ? 1 : this.earlyDate[2] > day ? day : this.earlyDate[2]; 
}
CycleCalendar.prototype.addEventByApi = function(){

	var _this = this;
	
	var slideW = parseInt(_this.width,10);
	var $btnLeft = _this.objClass.find(".date-left"); // 左滑动按钮
	var $btnRight = _this.objClass.find(".date-right"); // 右滑动按钮
	var $appdateMain = _this.objClass.find(".appdate-main"); // table主体
	var canClick = true; // 默认可以点击左右滑动
	$btnRight.hide(); // 默认隐藏右侧滑动按钮

	if( this.isdate && this.date.year == this.earlyDate[0] && this.date.month <= this.earlyDate[1] ){ console.log(123123); $btnLeft.hide(); }
	/*--------------------- 左边滑动按钮 -------------------*/
	$btnLeft.on("click", function(){
		slideW = parseInt(_this.width,10);
		if( _this.isdate && _this.date.year == _this.earlyDate[0] && _this.date.month <= _this.earlyDate[1] ){
			$btnLeft.hide();
			return false;
		}
		if( !canClick ) return false;
		canClick = false;
		$btnRight.show();
		updataDateRemove(); // 更新当前显示的日期
		var translateX = parseInt($appdateMain.attr("data-translate-x"),10)+slideW; // 当前需滑动的位置
		setTimeout(function(){
			_this.getApi(lastMonth(_this.date).year, lastMonth(_this.date).month, function(data){
				if( $appdateMain.find(".tab-"+lastMonth(_this.date).year+"-"+lastMonth(_this.date).month).length <= 0 ){ // 预加载的日期table是否已加载过
					translateX = parseInt($appdateMain.attr("data-translate-x"),10)-slideW; // 在前面插入一个table需要往回滑动一个table位置
					$appdateMain.css("-webkit-transition","") // 移除动画
								.width( Number($appdateMain.find("table").length+1)+"01%" ) // 更新table主体的宽度
								.prepend( _this.initTable(lastMonth(_this.date).year, lastMonth(_this.date).month) )
								.css("-webkit-transform","translateX("+(translateX)+"px)").attr("data-translate-x",translateX); // 在前面插入一个table需要往回滑动一个table位置
					_this.setMenstrual(lastMonth(_this.date).year, lastMonth(_this.date).month, data.data.info);
					_this.setMenstrualToFillCycle();
				}
				appdateFocus();
				canClick = true;
			});
		},_this.speed);
		$appdateMain.css({
			"-webkit-transform": "translateX("+translateX+"px)",
			"-webkit-transition": "."+_this.speed*0.01+"s linear"
		}).attr("data-translate-x",translateX);
		if( _this.isdate && _this.date.year == _this.earlyDate[0] && _this.date.month <= _this.earlyDate[1] ){
			$btnLeft.hide();
		}
	});
	/*--------------------- 右边滑动按钮 -------------------*/
	$btnRight.on("click", function(){
		slideW = parseInt(_this.width,10);
		if( !canClick ) return false;
		if( _this.sysdate.year < _this.date.year || (_this.sysdate.year == _this.date.year && _this.sysdate.month <= _this.date.month) ){ // 当前月份时隐藏右边滑动按钮
			$btnRight.hide();
			return false;
		}
		canClick = false;
		$btnLeft.show();
		updataDateAdd(); // 更新当前显示的日期
		var translateX = parseInt($appdateMain.attr("data-translate-x"),10)-slideW;
		setTimeout(function(){
			canClick = true;
		},_this.speed);
		$appdateMain.css({
			"-webkit-transform": "translateX("+translateX+"px)",
			"-webkit-transition": "."+_this.speed*0.01+"s linear"
		}).attr("data-translate-x",translateX);
		if( _this.sysdate.year < _this.date.year || (_this.sysdate.year == _this.date.year && _this.sysdate.month <= _this.date.month) ){
			$btnRight.hide();
		}
	});
	_this.on("render", function(opt){
		if( _this.objClass.find(".appdate-main tr td > div.active").length <= 0 ){
			console.error("还没有选中目标日期");
		} else {
			if(!!opt){
				var addClass = ''
					, removeClass = '';
				var focusObj = _this.objClass.find(".appdate-main tr td > div.active");
				var postureObj = focusObj.find("em");
				var date = focusObj.closest("table").attr("data-date").split("-");
				addClass += (opt.ovulation === true? " ovulation" : "")
						  + (opt.ovulateDay === true? " ovulate-day" : "");
				removeClass += (opt.ovulation === false? " ovulation" : "")
							 + (opt.ovulateDay === false? " ovulate-day" : "");

				focusObj.find(".appdate-main tr td > div.active").removeClass(removeClass).addClass(addClass);
				postureObj.removeAttr("class").addClass(!!opt.posture ? " posture-"+opt.posture : "");
				renderMenstrual({
					start: opt.start,
					end: opt.end,
					year: parseInt(date[0],10),
					month: parseInt(date[1],10),
					really: opt.really
				});
			} else {
				var date = _this.objClass.find(".appdate-main tr td > div.active").closest("table").attr("data-date").split("-");
				_this.getApi( date[0], date[1] );
			}
		}
	});
	// _this.on("renderAll", function(){
	// 	var $table = $("table");
	// 	var date = [];
	// 	for(var i=0; i<$table.length; i++){
	// 		date = $table.eq(i).attr("data-date").split("-");
	// 		_this.getApi( date[0], date[1] );
	// 	}
	// });
	appdateFocus();
	/*--------------------- 日期获取焦点 -------------------*/
	function appdateFocus(){
		_this.objClass.find(".appdate-main tr td > div.can-do-it").off("click").on("click", function(){
			_this.objClass.find(".appdate-main tr td > div.can-do-it").removeClass("active");
			$(this).addClass("active");
			var date = {
				year: _this.date.year,
				month: _this.date.month,
				day: parseInt(($(this).text()=="今"||$(this).text()=="今天"?_this.sysdate.day:$(this).text()),10)
			}
			_this.emit("focus", date, this);
		});
	}

	function updataDateAdd(){
		_this.date.year = _this.date.month == 12 ? _this.date.year+1 : _this.date.year;
		_this.date.month = _this.date.month == 12 ? 1 : _this.date.month+1;
		$(".appdate-val").html(_this.date.year+"年"+_this.date.month+"月");
	}
	function updataDateRemove(){
		_this.date.year = _this.date.month == 1 ? _this.date.year-1 : _this.date.year;
		_this.date.month = _this.date.month == 1 ? 12 : _this.date.month-1;
		$(".appdate-val").html(_this.date.year+"年"+_this.date.month+"月");
	}
	function createResizeProxy(cb, scope){
		return function(){
			clearTimeout(scope.resizeTimeout);
			var args = Array.prototype.slice.call(arguments, 0);
			scope.resizeTimeout = setTimeout(function(){
				var width = document.body.clientWidth;
				if( width != scope.lastWidth ){
					cb.apply(scope, args);
				}
				scope.lastWidth = width;
			}, 300);
		};
	};

	// 屏幕翻动调整大小
	window.addEventListener("resize", createResizeProxy(function () {
    	_this.width = document.body.clientWidth;
    	var cur = Number(_this.objClass.find(".appdate-main").attr("data-translate-x")) / _this.objClass.find("table").width();
		_this.objClass
			.width( _this.width )
			.find(".appdate-main")
			.css("-webkit-transform","translateX("+(cur*_this.width)+"px)")
			.attr("data-translate-x", cur*_this.width)
			.find("table").width(_this.width);
    }, window), false);
	// 左右滑动
	_this.objClass.find(".appdate-box")[0].slider( function(e, dir){
		if( dir == "left" ){
			_this.objClass.find(".date-left").trigger("click");
		} else if( dir == "right" ) _this.objClass.find(".date-right").trigger("click");
	});
}
CycleCalendar.prototype.addEvent = function(){
	var _this = this;
	
	var slideW = parseInt(_this.width,10);
	var $btnLeft = _this.objClass.find(".date-left"); // 左滑动按钮
	var $btnRight = _this.objClass.find(".date-right"); // 右滑动按钮
	var $appdateMain = _this.objClass.find(".appdate-main"); // table主体
	var canClick = true; // 默认可以点击左右滑动
	$btnRight.hide(); // 默认隐藏右侧滑动按钮

	if( this.isdate && this.date.year == this.earlyDate[0] && this.date.month <= this.earlyDate[1] ){ console.log(123123); $btnLeft.hide(); }
	/*--------------------- 左边滑动按钮 -------------------*/
	$btnLeft.on("click", function(){
		slideW = parseInt(_this.width,10);
		if( _this.isdate && _this.date.year == _this.earlyDate[0] && _this.date.month <= _this.earlyDate[1] ){
			console.log(123);
			$btnLeft.hide();
			return false;
		}
		if( !canClick ) return false;
		canClick = false;
		$btnRight.show();
		updataDateRemove(); // 更新当前显示的日期
		var translateX = parseInt($appdateMain.attr("data-translate-x"),10)+slideW; // 当前需滑动的位置
		setTimeout(function(){
			if( $appdateMain.find(".tab-"+lastMonth(_this.date).year+"-"+lastMonth(_this.date).month).length <= 0 ){ // 预加载的日期table是否已加载过
				translateX = parseInt($appdateMain.attr("data-translate-x"),10)-slideW; // 在前面插入一个table需要往回滑动一个table位置
				$appdateMain.css("-webkit-transition","") // 移除动画
							.width( Number($appdateMain.find("table").length+1)+"01%" ) // 更新table主体的宽度
							.prepend( _this.initTable(lastMonth(_this.date).year, lastMonth(_this.date).month) )
							.css("-webkit-transform","translateX("+(translateX)+"px)").attr("data-translate-x",translateX); // 在前面插入一个table需要往回滑动一个table位置
				_this.getApi( lastMonth(_this.date).year, lastMonth(_this.date).month );
			}
			appdateFocus();
			canClick = true;
			if( _this.fill_history ){
				_this.setMenstrual();
			}
		},_this.speed);
		$appdateMain.css({
			"-webkit-transform": "translateX("+translateX+"px)",
			"-webkit-transition": "."+_this.speed*0.01+"s linear"
		}).attr("data-translate-x",translateX);
		if( _this.isdate && _this.date.year == _this.earlyDate[0] && _this.date.month <= _this.earlyDate[1] ){
			$btnLeft.hide();
		}
	});
	/*--------------------- 右边滑动按钮 -------------------*/
	$btnRight.on("click", function(){
		slideW = parseInt(_this.width,10);
		if( !canClick ) return false;
		if( _this.sysdate.year < _this.date.year || (_this.sysdate.year == _this.date.year && _this.sysdate.month <= _this.date.month) ){ // 当前月份时隐藏右边滑动按钮
			$btnRight.hide();
			return false;
		}
		canClick = false;
		$btnLeft.show();
		updataDateAdd(); // 更新当前显示的日期
		var translateX = parseInt($appdateMain.attr("data-translate-x"),10)-slideW;
		setTimeout(function(){
			canClick = true;
		},_this.speed);
		$appdateMain.css({
			"-webkit-transform": "translateX("+translateX+"px)",
			"-webkit-transition": "."+_this.speed*0.01+"s linear"
		}).attr("data-translate-x",translateX);
		if( _this.sysdate.year < _this.date.year || (_this.sysdate.year == _this.date.year && _this.sysdate.month <= _this.date.month) ){
			$btnRight.hide();
		}
	});
	_this.on("render", function(opt){
		if( _this.objClass.find(".appdate-main tr td > div.active").length <= 0 ){
			console.error("还没有选中目标日期");
		} else {
			if(!!opt){
				var addClass = ''
					, removeClass = '';
				var focusObj = _this.objClass.find(".appdate-main tr td > div.active");
				var postureObj = focusObj.find("em");
				var date = focusObj.closest("table").attr("data-date").split("-");
				addClass += (opt.ovulation === true? " ovulation" : "")
						  + (opt.ovulateDay === true? " ovulate-day" : "");
				removeClass += (opt.ovulation === false? " ovulation" : "")
							 + (opt.ovulateDay === false? " ovulate-day" : "");

				focusObj.find(".appdate-main tr td > div.active").removeClass(removeClass).addClass(addClass);
				postureObj.removeAttr("class").addClass(!!opt.posture ? " posture-"+opt.posture : "");
				renderMenstrual({
					start: opt.start,
					end: opt.end,
					year: parseInt(date[0],10),
					month: parseInt(date[1],10),
					really: opt.really
				});
			} else {
				var date = _this.objClass.find(".appdate-main tr td > div.active").closest("table").attr("data-date").split("-");
				_this.getApi( date[0], date[1] );
			}
		}
	});
	// _this.on("renderAll", function(){
	// 	var $table = $("table");
	// 	var date = [];
	// 	for(var i=0; i<$table.length; i++){
	// 		date = $table.eq(i).attr("data-date").split("-");
	// 		_this.getApi( date[0], date[1] );
	// 	}
	// });
	appdateFocus();
	/*--------------------- 日期获取焦点 -------------------*/
	function appdateFocus(){
		_this.objClass.find(".appdate-main tr td > div.can-do-it").off("click").on("click", function(){
			_this.objClass.find(".appdate-main tr td > div.can-do-it").removeClass("active");
			$(this).addClass("active");
			var date = {
				year: _this.date.year,
				month: _this.date.month,
				day: parseInt(($(this).text()=="今"||$(this).text()=="今天"?_this.sysdate.day:$(this).text()),10)
			}
			_this.emit("focus", date, this);
		});
		// _this.on("menstrual", function(){
		// 	if( _this.objClass.find(".appdate-main tr td > div.active").length <= 0 ){
		// 		console.log("还没有选中目标日期");
		// 	} else {
		// 		_this.objClass.find(".appdate-main tr td > div.active").addClass("menstrual");
		// 	}
		// });
		// _this.on("ovulation", function(){
		// 	if( _this.objClass.find(".appdate-main tr td > div.active").length <= 0 ){
		// 		console.log("还没有选中目标日期");
		// 	} else {
		// 		_this.objClass.find(".appdate-main tr td > div.active").addClass("ovulation");
		// 	}
		// });
		// _this.on("ovulateDay", function(){
		// 	if( _this.objClass.find(".appdate-main tr td > div.active").length <= 0 ){
		// 		console.log("还没有选中目标日期");
		// 	} else {
		// 		_this.objClass.find(".appdate-main tr td > div.active").addClass("ovulate-day");
		// 	}
		// });
		// _this.on("posture", function(posture){
		// 	console.log( posture );
		// 	if( _this.objClass.find(".appdate-main tr td > div.active").length <= 0 ){
		// 		console.log("还没有选中目标日期");
		// 	} else {
		// 		_this.objClass.find(".appdate-main tr td > div.active em").addClass("posture-"+posture);
		// 	}
		// });
	}

	function updataDateAdd(){
		_this.date.year = _this.date.month == 12 ? _this.date.year+1 : _this.date.year;
		_this.date.month = _this.date.month == 12 ? 1 : _this.date.month+1;
		$(".appdate-val").html(_this.date.year+"年"+_this.date.month+"月");
	}
	function updataDateRemove(){
		_this.date.year = _this.date.month == 1 ? _this.date.year-1 : _this.date.year;
		_this.date.month = _this.date.month == 1 ? 12 : _this.date.month-1;
		$(".appdate-val").html(_this.date.year+"年"+_this.date.month+"月");
	}
	function createResizeProxy(cb, scope){
		return function(){
			clearTimeout(scope.resizeTimeout);
			var args = Array.prototype.slice.call(arguments, 0);
			scope.resizeTimeout = setTimeout(function(){
				var width = document.body.clientWidth;
				if( width != scope.lastWidth ){
					cb.apply(scope, args);
				}
				scope.lastWidth = width;
			}, 300);
		};
	};

	// 屏幕翻动调整大小
	window.addEventListener("resize", createResizeProxy(function () {
    	_this.width = document.body.clientWidth;
    	var cur = Number(_this.objClass.find(".appdate-main").attr("data-translate-x")) / _this.objClass.find("table").width();
		_this.objClass
			.width( _this.width )
			.find(".appdate-main")
			.css("-webkit-transform","translateX("+(cur*_this.width)+"px)")
			.attr("data-translate-x", cur*_this.width)
			.find("table").width(_this.width);
    }, window), false);
	// 左右滑动
	_this.objClass.find(".appdate-box")[0].slider( function(e, dir){
		if( dir == "left" ){
			_this.objClass.find(".date-left").trigger("click");
		} else if( dir == "right" ) _this.objClass.find(".date-right").trigger("click");
	});
}
function lastMonth(date){
	return {
		year: date.month == 1 ? date.year-1 : date.year,
		month: date.month == 1 ? 12 : date.month-1
	}
}
function nextMonth(date){
	return {
		year: date.month == 12 ? date.year+1 : date.year,
		month: date.month == 12 ? 1 : date.month+1
	}
}
module.exports = CycleCalendar;

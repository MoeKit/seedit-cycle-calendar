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
CycleCalendar.prototype.init = function(opt){
	var _this = this;
	if( !!opt ){
		_this.classname = opt.classname || '';
		_this.objClass = $("."+_this.classname);
		_this.width = opt.width || document.body.clientWidth;
		_this.objClass.width( _this.width );
		_this.speed = opt.speed || 300;
		_this.token = opt.token || "";
		_this.api = opt.api || "";
		_this.sysdate = {
			year: new Date().getFullYear(),
			month: new Date().getMonth()+1,
			day: new Date().getDate()
		}
		_this.date = {
			year: new Date().getFullYear(),
			month: new Date().getMonth()+1
		}
	}
	
	if( !!_this.error() ) return false;
	_this.initHtml();
	_this.addEvent();
}
CycleCalendar.prototype.error = function(){
	var _this = this;
	if( !_this.classname || !document.getElementsByClassName(_this.classname) ){
		console.error("classname不能为空或者classname对象不存在");
		return true;
	} else if( !_this.token ){
		console.error(_this.classname, " token不能为空");
		return true;
	} else return false;
}
CycleCalendar.prototype.getApi = function(year, month){
	var _this = this;
	$.ajax({
		url: _this.api,
		type: "get",
		data: {
			token: _this.token,
			date: new Date(year,month-1,1).getTime()*0.001 // ios不支持 "2015-04-01",即不支持"-"
		},
		success: function(data){
			if( !data.data || !data.data.record ){
				return false;
			}
			var list = $(".tab-"+year+"-"+month+" .can-show");
			list.removeClass("menstrual ovulation ovulate-day").find("em").removeClass();
				for( var i=0; i<list.length; i++ ){
					//console.log(  !!data.data.record[i].really );
					if( data.data.record[i].period == 0 ){
						// list.eq(i).addClass("menstrual"); 经期采用时间段来控制
					} else if( data.data.record[i].period == 2 && !!data.data.record[i].really ){
						list.eq(i).addClass("ovulation");
					} else if( data.data.record[i].period == 3 && !!data.data.record[i].really ){
						list.eq(i).addClass("ovulation ovulate-day");
					}
					if( data.data.record[i].aa == 1 ){
						list.eq(i).find("em").addClass("posture-"+data.data.record[i].post);
					}
				}
				if( !!data.data.info ){
					for( var i=0; i<data.data.info.length; i++ ){
						renderMenstrual({
							start: data.data.info[i].come,
							end: data.data.info[i].end-86400,
							year: year,
							month: month,
							really: data.data.info[i].really
						});
					}
				}
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
				var eventday = Math.floor(new Date(opt.year, (opt.month-1), i).getTime()/1000);
				if( opt.start <= eventday && eventday <= opt.end ){
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
	_this.getApi( _this.date.year, _this.date.month );
	_this.getApi( lastMonth(_this.date).year, lastMonth(_this.date).month );
}
CycleCalendar.prototype.initTable = function(year, month){
	var _this = this;
	var today = {
		year: new Date().getFullYear(),
		month: new Date().getMonth()+1,
		day: new Date().getDate()
	}
	var lastMonthAllDay = new Date(year,month-1,0).getDate(); // 上月总天数
	var nowMonthAllDay = new Date(year,addZero(month),0).getDate(); // 本月总天数
	var firstDayWeek = new Date(year+"-"+addZero(month)+"-01").getDay(); // 本月首日的星期索引
	var lastDayWeek = new Date(year+"-"+addZero(month)+"-"+addZero(nowMonthAllDay)).getDay(); // 上月末日的星期索引
	var arr = []
		, i = 0;
	for( i=lastMonthAllDay-firstDayWeek+1; i<=lastMonthAllDay; i++ ){ // 显示当月还存在的上月天数
		arr.push({date: i, isNowMonth: false});
	}
	// date: 当天，isNowMonth：是否是当前月份， isFuture：是否是当前月
	for( i=1; i<=nowMonthAllDay; i++ ){ // 显示当月存在的天数
		if( year == today.year && month == today.month && i > today.day ){
			arr.push({date: i, isNowMonth: true, isFuture: true });
		} else if( year == today.year && month == today.month && i == today.day ) {
			arr.push({date: "今", isNowMonth: true, isToday: true});
		} else {
			arr.push({date: i, isNowMonth: true});
		}
	}
	for( i=1; i<=(6-lastDayWeek); i++ ){ // 显示当月还存在的下月天数
		arr.push({date: i, isNowMonth: false});
	}
	table = '<table class="rows-'+Math.ceil(arr.length/7)+' tab-'+year+'-'+month+'" data-date="'+year+'-'+month+'" style="width: '+_this.width+'px;" cellspacing="0" cellpadding="0">';
	for( i=0; i<arr.length; i++ ){ // 渲染当月可显示的天数
		table += i ==0 ? '<tr>' : i%7 == 0 ? '</tr><tr>' : ''; // 每一周换一行(即tr)
		table += arr[i].isNowMonth ? 
					(arr[i].isFuture ? '<td><div class="can-show can-not-do"><span>'+arr[i].date+'</span><em></em></div></td>' : 
						arr[i].isToday ? '<td><div class="can-show can-do-it today"><span>'+arr[i].date+'</span><em></em></div></td>' :
							'<td><div class="can-show can-do-it"><span>'+arr[i].date+'</span><em></em></div></td>')
					: '<td>'+arr[i].date+'</td>';
	}
	table += '</tr></table>';
	return table;
}
CycleCalendar.prototype.addEvent = function(){
	var _this = this;
	var slideW = parseInt(_this.width,10);
	var $btnLeft = _this.objClass.find(".date-left"); // 左滑动按钮
	var $btnRight = _this.objClass.find(".date-right"); // 右滑动按钮
	var $appdateMain = _this.objClass.find(".appdate-main"); // table主体
	var canClick = true; // 默认可以点击左右滑动
	$btnRight.hide(); // 默认隐藏右侧滑动按钮
	/*--------------------- 左边滑动按钮 -------------------*/
	$btnLeft.on("click", function(){
		slideW = parseInt(_this.width,10);
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
		},_this.speed);
		$appdateMain.css({
			"-webkit-transform": "translateX("+translateX+"px)",
			"-webkit-transition": "."+_this.speed*0.01+"s linear"
		}).attr("data-translate-x",translateX);
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
	_this.on("renderAll", function(){
		var $table = $("table");
		var date = [];
		for(var i=0; i<$table.length; i++){
			date = $table.eq(i).attr("data-date").split("-");
			_this.getApi( date[0], date[1] );
		}
	});
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
module.exports = CycleCalendar;

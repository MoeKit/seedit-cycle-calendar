# Demo

---

## Normal usage
<script type="text/javascript" src="http://scdn.bozhong.com/source/common/js/jquery.min.js"></script>
<button id="btn">请先选择日期在渲染状态效果</button>
<button id="btn_api">刷新API</button>
<div class="cycle-calendar-box"></div>
<div class="cycle-calendar-box-1"></div>
````javascript
var CycleCalendar = require('seedit-cycle-calendar');
window.example = new CycleCalendar({
	classname: "cycle-calendar-box",
	speed: 300,
	//token: "553d9e1b8cf432534c8b459c"
	//token: "55ecff2c8cf4321c2f8b457e",
	api: "http://crazy.office.bzdev.net/api/mitao/ring.json"
});
example.on("focus", function(date, dom){
	// doing focus
	console.log( date );
	console.log( dom );
});
document.getElementById("btn").onclick = function(){
	example.trigger("render", {
		start: 1428768000,
		end: 1429027200,
		ovulation: true,
		ovulateDay: true,
		posture: 1
	});
}
document.getElementById("btn_api").onclick = function(){
	example.trigger("renderAll");
}

/*
window.example1 = new CycleCalendar({
	classname: "cycle-calendar-box-1",
	speed: 300,
	//token: "553d9e1b8cf432534c8b459c"
	token: "55ecff2c8cf4321c2f8b457e",
	api: "http://mitao.office.bzdev.net/api/wechat/ring.json",
	isdate: true

});*/
````
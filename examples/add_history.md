# 补充历史周期

---

## Normal usage
<script type="text/javascript" src="http://scdn.bozhong.com/source/common/js/jquery.min.js"></script>

<div class="cycle-calendar-box-1"></div>
var CycleCalendar = require('seedit-cycle-calendar');
````javascript
var CycleCalendar = require('seedit-cycle-calendar');
window.example1 = new CycleCalendar({
	classname: "cycle-calendar-box-1",
	speed: 300,
	//token: "553d9e1b8cf432534c8b459c"
	token: "55f8dae48cf4321b2f8b4642",
	api: "http://mitao.office.bzdev.net/api/wechat/ring.json",
	fill_history: true,
	history_date: {
		come: 1438617600,
		end: 1438790400,
		status: "start"
	}
});
example1.on("focus", function(date, dom){
	// doing focus
	console.log( date );
	console.log( dom );
});
````
# seedit-cycle-calendar [![spm version](https://moekit.timo.today/badge/seedit-cycle-calendar)](https://moekit.timo.today/package/seedit-cycle-calendar)

---

该模块为小蜜桃与大香蕉的周期日历组件

---


## 使用
说明：只能设置今天之前的日期
```js
var CycleCalendar = require('seedit-cycle-calendar');
var example = new CycleCalendar({});
```

## 初始化参数
+ classname 渲染周期日历的位置-类名
+ speed 月份左右切换速度，默认300ms

## API接口

### CycleCalendar.on(event, callback)
监听事件

### 接口时间说明
+ `focus` 选中日期，回调参数为{year:2015, month: 04, day: 02},年月日

### CycleCalendar.trigger(event, [params])
触发事件

### 接口时间说明
+ `renderAll` 设置4种状态, 调用时直接刷新接口
+ `render` 暂不使用，设置以下4种状态, `JSON`参数{`menstrual`: true, `ovulation`: true, `ovulateDay`: true, `posture`: 1}
+ ~~`menstrual` 单独设置经期状态, 无参~~
+ ~~`ovulation` 单独设置排卵期状态, 无参~~
+ ~~`ovulateDay` 单独设置排卵日状态, 无参~~
+ ~~`posture` 单独设置体位状态, `Number`参数(1-12)来设置12个体位状态~~

## 示例
```js
seajs.use(["seedit-cycle-calendar"], function(CycleCalendar){
	var example = new CycleCalendar({
		classname: "cycle-calendar-box",
		speed: 300,
		token: "55911ec38cf432d7258b458e",
		api: "http://mitao.office.bzdev.net/api/wechat/ring.json"
	});
	example.on("focus", function(date){
		// doing focus
		console.log( date );
	});
	document.getElementById("btn").onclick = function(){
		example.trigger("renderAll");
	}
});
```
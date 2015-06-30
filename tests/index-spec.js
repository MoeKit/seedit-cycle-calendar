var expect = require('expect.js');
var seeditCycleCalendar = require('seedit-cycle-calendar');

describe('seedit-cycle-calendar', function() {

  it('seedit-cycle-calendar is function', function() {
  	expect(seeditCycleCalendar).to.be.a("function");
  });
  var calendar = new seeditCycleCalendar();

  it('calendar instanceof seeditCycleCalendar', function(){
  	expect(calendar).to.be.an(seeditCycleCalendar);
  });
  console.log(calendar, calendar);
  it('calendar has prototype.init that is function', function(){
  	expect(calendar.init).to.be.a("function")
  });

  it('calendar has prototype.getApi that is function', function(){
  	expect(calendar.getApi).to.be.a("function")
  });

  it('calendar has prototype.initHtml that is function', function(){
  	expect(calendar.initHtml).to.be.a("function")
  });

  it('calendar has prototype.initTable that is function', function(){
  	expect(calendar.initTable).to.be.a("function")
  });

  it('calendar has prototype.addEvent that is function', function(){
  	expect(calendar.addEvent).to.be.a("function")
  });
  	
  	
  	
	
});

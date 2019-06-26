function main(){
  const currentDate = new Date();
  var year = [currentDate.getFullYear()];
  var month = [currentDate.getMonth() + 1];
  if (month[0] != 12){
    month[1] = month[0] + 1;
    year[1] = year[0];
  } else {
    month[1] = 1;
    year[1] = year[0] + 1;
  }

  const html = [fetchSchedule(year[0], month[0]),
              fetchSchedule(year[1], month[1])
             ];
  
  const productions =[
    '765',
    'シンデレラ',
    'ミリオン',
    'SideM',
    'シャイニー'
  ];
  const spreadSheet = SpreadsheetApp.getActiveSpreadsheet();
  const produce = setProductions(spreadSheet, productions);

  const eventTabRegexp = new RegExp(/<tr.+<\/tr>/g);
  const dayRegexp = new RegExp(/img_days_[0-3][0-9]\.jpg/);
  const timeRegexp = new RegExp(/<td class="time2">[^<]+<\/td>/g);
  const titleRegexp = new RegExp(/_blank">[^<]+<\/a>/g);
  const linkRegexp = new RegExp(/<a href="[^"]+"/g);
  const productionRegexp = new RegExp(/height="36" alt="[^"]+"/g);
  
  for (var i in html){
    var sheet = spreadSheet.getSheetByName(year[i] + '.' + month[i]);  
    if (sheet == null){
      sheet = spreadSheet.insertSheet(year[i] + '.' + month[i], 0);
    }    
    var cacheTab = sheet.getDataRange().getValues();
    
    var eventTab = html[i].match(eventTabRegexp);
    
    for (var j in eventTab){
      var eventDays = eventTab[j].match(dayRegexp);
      var eventTimes = eventTab[j].match(timeRegexp);
      var eventTitles = eventTab[j].match(titleRegexp);
      var eventLinks = eventTab[j].match(linkRegexp);
      var eventProductions = eventTab[j].match(productionRegexp);
      
      if (eventTitles){
        for (var k in eventTitles){
          var event = [
            year[i] + '/' + month[i] + '/' + eventDays[0].replace('img_days_', '').replace('.jpg', ''),
              eventTimes[k].replace('<td class="time2">', '').replace('</td>', '').replace(/～$/, '').replace(/〜$/, ''), //2種類の波ダッシュが混在している
                eventTitles[k].replace('_blank">', '').replace('</a>', ''),
                  eventLinks[k].replace('<a href="', '').replace('"', ''),
                    eventProductions[k].replace('height="36" alt="', '').replace('"', '')
                  ];
          
          var found = false;
          if (cacheTab[0] != ""){
            for (var m in cacheTab){
              var cache = cacheTab[m];
              var eventDay = new Date(event[0]);
              if (eventDay.getTime() == cache[0].getTime() && event[1] == cache[1] && event[2] == cache[2] && event[3] == cache[3] && event[4] == cache[4]){
                found  = true;
                break;
              }
            }
          }
          if (!found){
            if (produceCheck(event[4], produce)){
              sheet.appendRow(event);
              addEvent(event);
            }
          }
        }
      }
    }
  }
}


/*
指定された年・月のプロデューサー予定表を取得する。
*/
function fetchSchedule(year, month){
  const url = 'https://idolmaster.jp/schedule/?ey=' + year + '&em=' + month;
  return UrlFetchApp.fetch(url).getContentText();
}

/*
Productionsシートより、プロダクション毎のプロデュース要否を指定したレコードを取得する。
*/
function setProductions(spreadSheet, productions) {
  var sheet = spreadSheet.getSheetByName('Productions');  
  if (sheet == null){
    sheet = createProductionsSheet(spreadSheet, productions);
  }
  
  return sheet.getDataRange().getValues();
}

/*
Productionsシートを作成する。
プロダクションごとにプロデュース要否をダイアログにより確認し、その回答をレコードに残す。
*/
function createProductionsSheet(spreadSheet, productions){
  var sheet = spreadSheet.insertSheet('Productions', 0);
  for(var i in productions){
    var answer = Browser.msgBox('「' + productions[i] + '」をプロデュースしますか？', Browser.Buttons.YES_NO);
      sheet.appendRow([productions[i], answer]); 
  }
  return sheet;
}

/*
イベントの出演プロダクションに、プロデュース対象プロダクションが含まれるか
どうかを確認する。
*/
function produceCheck(eventProductions, produce){
  for(var i in produce){
    if(produce[i][1] == 'yes'){
      if (eventProductions.indexOf(produce[i][0]) != -1) {
        return true;
      }
    }
  }
  return false;
}



/*
カレンダーに予定を追加する。
カレンダー「プロデューサー予定表」が存在しない場合、新規作成する。
開始時間がある場合、30分間の予定として登録する。
開始時間がない場合、終日の予定として登録する。
*/
function addEvent(event) {
  var calendar = CalendarApp.getOwnedCalendarsByName('プロデューサー予定表');
  if (calendar[0] == ''){
    calendar = createCalendar('プロデューサー予定表',
                              {timeZone: "Asia/Tokyo"})
  }

  const title = event[2];
  const desc = event[3];
  
  var start = new Date(event[0]);
  const startTime = event[1];
  var end = new Date();
  if (startTime.match(/[0-2][0-9]:[0-5][0-9]/)){
    start.setHours(start.getHours() + Number(startTime.substr(0,2)));
    start.setMinutes(start.getMinutes() + Number(startTime.substr(3,5)));
    end = start;
    end.setMinutes(end.getMinutes() + 30);
    calendar[0].createEvent(
      title,
      start,
      end,
      {description: desc}
    );
  } else {
    calendar[0].createAllDayEvent(
      title,
      start,
      {description: desc}
    );
  }
;
}




function myFunction () {
  var currentDate = new Date();
  var year = currentDate.getFullYear();
  var month = currentDate.getMonth() + 1;
  var url = 'https://idolmaster.jp/schedule/?ey=' + year + '&em=' + month;
  
  var html = UrlFetchApp.fetch(url).getContentText();
  
  var spreadSheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadSheet.getSheetByName(year + '.' + month);  
  if (sheet == null){
    spreadSheet.insertSheet(year + '.' + month, 0);
    sheet = spreadSheet.getSheetByName(year + '.' + month);
  }    
  var cache = sheet.getDataRange().getValues();

  var eventTabRegexp = new RegExp(/<tr.+<\/tr>/g);
  var eventTab = html.match(eventTabRegexp);
  var dayRegexp = new RegExp(/img_days_[0-3][0-9]\.jpg/);
  var titleRegexp = new RegExp(/_blank">[^<]+<\/a>/g);
  var linkRegexp = new RegExp(/<a href="[^"]+"/g);
  var productionRegexp = new RegExp(/height="36" alt="[^"]+"/g);
  

  
  eventTab.forEach(function(rec){
    var day = rec.match(dayRegexp);
    var titles = rec.match(titleRegexp);
    var links = rec.match(linkRegexp);
    var productions = rec.match(productionRegexp);
    
    if (titles){
      for (var j = 0; j < titles.length; j++){
        var event = [
          year + '/' + month + '/' + day[0].replace('img_days_', '').replace('.jpg', ''),
            titles[j].replace('_blank">', '').replace('</a>', ''),
            links[j].replace('<a href="', '').replace('"', ''),
            productions[j].replace('height="36" alt="', '').replace('"', '')
          ];
        var found = false;
        if (cache[0] != ""){
          for (var k = 0; k < cache.length; k++){
            var oldRec = cache[k];
            var eventDate = new Date(event[0]);
            if (eventDate.getTime() == oldRec[0].getTime() && event[1] == oldRec[1] && event[2] == oldRec[2] && event[3] == oldRec[3]){
              found  = true;
              return true;
            }
          }
        }
        if (!found){
          sheet.appendRow(event);
        }
      }
    }
  })
  var i = 1;
}





function createEvents() {
  var calendar = CalendarApp.getDefaultCalendar();
  var values = SpreadsheetApp.getActiveSheet().getDataRange().getValues();
 
  for(var i = 1; i < values.length; i++){
    var title = values[i][0];
    var startTime = values[i][1];
    var endTime = values[i][2];
    
    calendar.createEvent(title, startTime, endTime);    
  }
}
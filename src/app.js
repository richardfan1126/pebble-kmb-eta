/**
 * Welcome to Pebble.js!
 *
 * This is where you write your app.
 */

var UI = require('ui');
var ajax = require('ajax');
var moment = require('moment');

var Dataset = require('Dataset');
var AppConfig = require('AppConfig');

var etaPage;
var mainMenu;

var lang;
var serverTime;

function showMainMenu(){
  getLang();
  
  mainMenu = new UI.Menu({
    sections: [{
      title: lang == 'chi' ? '主頁' : 'Home',
      items: [
        {
          title: lang == 'chi' ? '路線列表' : 'Route list',
          target: 'routeList'
        },
        {
          title: lang == 'chi' ? '清除快取' : 'Clear Cache',
          target: 'clearCache'
        },
        {
          title: lang == 'chi' ? '選擇語言' : 'Select Language',
          target: 'selectLang'
        }
      ]
    }]
  });
  
  mainMenu.on('select', function(e){
    switch(e.item.target){
      case 'routeList':
        showRouteListMenu();
        break;
        
      case 'clearCache':
        showClearCacheMenu();
        break;
        
      case 'selectLang':
        showLanguageSelectMenu();
        break;
        
      default:
    }
  });
  
  mainMenu.show();
}

function showRouteListMenu(){
  var menu = new UI.Menu({
    sections: []
  });
  
  var successCallback = function(data){
    var items = [];
    
    for(var firstLetter in data){
      items.push({
        title: firstLetter,
        key: firstLetter
      });
    }
    
    menu.section(0, {
      title: lang == 'chi' ? '路線列表 (首數字)' : 'Route List (First Digit)',
      items: items
    });
  };
  
  Dataset.getRouteList(successCallback);
  
  menu.show();
  
  menu.on('select', function(e){
    var item = e.item;
    
    showRouteListSubMenu(item.key);
  });
}

function showRouteListSubMenu(key){
  var menu = new UI.Menu({
    sections: []
  });
  
  var successCallback = function(data){
    var items = [];
    
    for(var i=0; i<data[key].length; i++){
      var routeNo = data[key][i];
      
      items.push({
        title: routeNo,
        routeNo: routeNo
      });
    }
    
    menu.section(0, {
      title: lang == 'chi' ? '路線列表' : 'Route List',
      items: items
    });
  };
  
  Dataset.getRouteList(successCallback);
  
  menu.show();
  
  menu.on('select', function(e){
    var item = e.item;
    
    showDirectionSelectMenu(item.routeNo);
  });
}

function showDirectionSelectMenu(routeNo){
  var menu = new UI.Menu({
    sections: []
  });
  
  var items = [];
  
  for(var i=1; i<=2; i++){
    (function(tmp_routeNo, index){
      var successCallback = function(data){
        var title = lang == 'chi' ? "往:\n" : "To:\n";
        title += data;
        
        items.push({
          title: title,
          direction: index,
          destionationName: data
        });
        
        menu.section(0, {
          title: routeNo,
          items: items
        });
      };
    
      Dataset.getDestinationName(tmp_routeNo, index, lang, successCallback);
    }(routeNo, i));
  }
    
  menu.show();
  
  menu.on('select', function(e){
    var item = e.item;
    
    showRouteStopMenu(routeNo, item.direction, item.destionationName);
  });
}

function showRouteStopMenu(routeNo, direction, destionationName){
  var menu = new UI.Menu({
    sections: []
  });
  
  var successCallback = function(data){
    var items = [];
    
    for(var i=0; i<data.length; i++){
      var station = data[i];
      
      items.push({
        title: lang == 'chi' ? station.title_chi : station.title_eng,
        stopNo: station.subarea.replace(/[-+.^:,]/g, ""),
        stopSeq: i,
        stopName: lang == 'chi' ? station.title_chi : station.title_eng
      });
    }
    
    menu.section(0, {
      title: routeNo,
      items: items
    });
  };
  
  Dataset.getRouteInfo(routeNo, direction, lang, successCallback);
  
  menu.show();
  
  menu.on('select', function(e){
    var item = e.item;
    
    showEtaPage(routeNo, direction, item.stopNo, item.stopSeq, item.stopName, destionationName);
  });
}

function showEtaPage(routeNo, direction, stopNo, stopSeq, stopName, destionationName){
  var title = routeNo;
  title += lang == 'chi' ? "\n(往: " : "\n(To: ";
  title += destionationName;
  title += ')';
  
  etaPage = new UI.Card({
    title: title,
    subtitle: stopName,
    scrollable: true,
    body: ''
  });
  
  etaPage.show();

  refreshEtaPage(routeNo, direction, stopNo, stopSeq);
  getServerTime();
  
  etaPage.on('click', 'select', function(){
    refreshEtaPage(routeNo, direction, stopNo, stopSeq);
  });
}
  
function showLoading(){
  etaPage.body(lang == 'chi' ? '更新中...' : 'Refreshing...');
}

function getEta(arriveTime){
  return Math.ceil(arriveTime.diff(serverTime, 'minutes', true));
}

function refreshEtaPage(route, direction, stopNo, stopSeq){
  showLoading();
  
  ajax({
    url: 'http://etav2.kmb.hk/?action=geteta&lang=tc&route=' + route + '&bound=' + direction + '&stop=' + stopNo + '&stop_seq=' + stopSeq,
  }, function(data){
    data = JSON.parse(data);
    var content = "";
    
    for(var i=0; i<data.response.length; i++){
      var arriveTime = moment(data.response[i].t.substring(0,5), 'HH:mm');
      var eta = getEta(arriveTime);
      
      content += eta;
      content += lang == 'chi' ? " 分鐘\n" : " minutes\n";
    }
    
    etaPage.body(content);
  });
}

function getServerTime(){
  ajax({
    url: 'http://etadatafeed.kmb.hk:1933/GetData.ashx?type=Server_T'
  }, function(data){
    data = JSON.parse(data);
    serverTime = moment(data[0].stime);
  });
}

function showClearCacheMenu(){
  var clearCacheMenu = new UI.Menu({
    sections: [{
      title: 'chi' ? '清除快取?' : 'Clear Cache?',
      items: [
        {
          title: 'chi' ? '是' : 'Yes',
          isConfirm: true
        },
        {
          title: 'chi' ? '否' : 'No',
          isConfirm: false
        }
      ]
    }]
  });
  
  clearCacheMenu.on('select', function(e){
    if(e.item.isConfirm){
      clearCache(function(){
        clearCacheMenu.hide();
      });
    }else{
      clearCacheMenu.hide();
    }
  });
  
  clearCacheMenu.show();
}

function clearCache(successCallback){
  Dataset.clearCache(successCallback);
}

function showLanguageSelectMenu(){
  var langSelectMenu = new UI.Menu({
    sections: [{
      title: lang == 'chi' ? '選擇語言' : 'Select Langauge',
      items: [
        {
          title: '中文',
          lang: 'chi'
        },
        {
          title: 'English',
          lang: 'eng'
        }
      ]
    }]
  });
  
  langSelectMenu.on('select', function(e){
    AppConfig.setLanguage(e.item.lang, function(){
      langSelectMenu.hide();
      mainMenu.hide();
      showMainMenu();
    });
  });
  
  langSelectMenu.show();
}

function getLang(){
  lang = AppConfig.getLanguage();
}

showMainMenu();
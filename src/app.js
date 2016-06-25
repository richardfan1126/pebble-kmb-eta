/**
 * Welcome to Pebble.js!
 *
 * This is where you write your app.
 */

var UI = require('ui');
var ajax = require('ajax');
var moment = require('moment');
var Dataset = require('Dataset');

var serverTime;
var etaPage;

function showMainMenu(){
  var mainMenu = new UI.Menu({
    sections: [{
      title: '主頁',
      items: [
        {
          title: '路線列表',
          target: 'routeList'
        },
        {
          title: '清除快取',
          target: 'clearCache'
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
    
    for(var i=0; i<data.length; i++){
      var route = data[i];
      
      items.push({
        title: route,
        routeNo: route
      });
    }
    
    menu.section(0, {
      title: '路線列表',
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
        items.push({
          title: "往:\n" + data,
          direction: index,
          destionationName: data
        });
        
        menu.section(0, {
          title: routeNo,
          items: items
        });
      };
    
      Dataset.getDestinationName(tmp_routeNo, index, successCallback);
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
        title: station.title_chi,
        stopNo: station.subarea.replace(/[-+.^:,]/g, ""),
        stopSeq: i,
        stopName: station.title_chi
      });
    }
    
    menu.section(0, {
      title: routeNo,
      items: items
    });
  };
  
  Dataset.getRouteInfo(routeNo, direction, successCallback);
  
  menu.show();
  
  menu.on('select', function(e){
    var item = e.item;
    
    showEtaPage(routeNo, direction, item.stopNo, item.stopSeq, item.stopName, destionationName);
  });
}

function showEtaPage(routeNo, direction, stopNo, stopSeq, stopName, destionationName){
  etaPage = new UI.Card({
    title: routeNo + "\n(往: " + destionationName + ')',
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
  etaPage.body('Loading...');
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
      
      content += eta + " 分鐘\n";
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
      title: '清除快取?',
      items: [
        {
          title: '是',
          isConfirm: true
        },
        {
          title: '否',
          isConfirm: false
        }
      ]
    }]
  });
  
  clearCacheMenu.on('select', function(e){
    if(e.item.isConfirm){
      clearCache();
    }
  
    clearCacheMenu.hide();
  });
  
  clearCacheMenu.show();
}

function clearCache(){
  Dataset.clearCache();
}

showMainMenu();
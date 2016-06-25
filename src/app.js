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
      title: 'Route List',
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
    sections: [{
      title: routeNo,
      items: [
        {
          title: 'GO',
          direction: 1
        },
        {
          title: 'BACK',
          direction: 2
        },
      ]
    }]
  });
  
  menu.show();
  
  menu.on('select', function(e){
    var item = e.item;
    
    showRouteStopMenu(routeNo, item.direction);
  });
}

function showRouteStopMenu(routeNo, direction){
  var menu = new UI.Menu({
    sections: []
  });
  
  var successCallback = function(data){
    var items = [];
    
    for(var i=0; i<data.length; i++){
      var station = data[i];
      
      items.push({
        title: station.title_eng,
        stopNo: station.subarea.replace(/[-+.^:,]/g, ""),
        stopSeq: i,
        stopName: station.title_eng
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
    
    showEtaPage(routeNo, direction, item.stopNo, item.stopSeq, item.stopName);
  });
}

function showEtaPage(routeNo, direction, stopNo, stopSeq, stopName){
  var directionText;
   
  switch(direction){
    case 1:
      directionText = 'GO';
      break;
      
    case 2:
      directionText = 'BACK';
      break;
      
    default:
      directionText = 'GO';
  }
  
  etaPage = new UI.Card({
    title: routeNo + ' (' + directionText + ')',
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
      
      content += eta + " Minutes\n";
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

showRouteListMenu();
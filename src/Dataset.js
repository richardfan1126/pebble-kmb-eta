const ROUTE_LIST_STORAGE_KEY = 'route-list';
const ROUTE_INFO_STORAGE_KEY_PREFIX = 'stop-list-';
const DESTINATION_STORAGE_KEY_PREFIX = 'destination-';

var ajax = require('ajax');
var Settings = require('settings');

var Dataset = {
  'getRouteList' : function(successCallback){
    var routeList = Settings.data(ROUTE_LIST_STORAGE_KEY);
    
    if(typeof routeList != 'undefined' && routeList != null){
      successCallback(routeList);
    }else{
      ajax({
        url : 'http://etadatafeed.kmb.hk:1933/GetData.ashx?type=ETA_R',
        method: 'get'
      }, function(data){
        data = JSON.parse(data);
        
        data = data[0].r_no.split(',');
        
        Settings.data(ROUTE_LIST_STORAGE_KEY, data);
        
        successCallback(data);
      });
    }
  },
  'getRouteInfo' : function(bn, dir, successCallback){
    var storageKey = ROUTE_INFO_STORAGE_KEY_PREFIX + bn + '-' + dir;
    var routeInfo = Settings.data(storageKey);
    
    if(typeof routeInfo != 'undefined' && routeInfo != null){
      successCallback(routeInfo);
    }else{
      ajax({
        url : 'http://www.kmb.hk/ajax/getRouteMapByBusno.php',
        data : {
          bn: bn,
          dir: dir
        },
        method: 'post'
      }, function(data){
        data = JSON.parse(data);
        
        Settings.data(storageKey, data);
        successCallback(data);
      });
    }
  },
  'getDestinationName' : function(bn, dir, successCallback){
    var storageKey = DESTINATION_STORAGE_KEY_PREFIX + bn + '-' + dir;
    var destinationName = Settings.data(storageKey);
    
    if(typeof destinationName != 'undefined' && destinationName != null){
      successCallback(destinationName);
    }else{
      var getRoutInfoCallback = function(data){
        var lastStop = data[data.length - 1];
        var destinationName = lastStop.title_chi;
        
        Settings.data(storageKey, destinationName);
        successCallback(destinationName);
      };
      
      Dataset.getRouteInfo(bn, dir, getRoutInfoCallback);
    }
  },
  'clearCache' : function(){
    var caches = Settings.data();
    
    for(var key in caches){
      Settings.data(key, null);
    }
  }
};

this.exports = Dataset;
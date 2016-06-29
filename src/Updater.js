var Dataset = require('Dataset');
var Settings = require('settings');

var LAST_UPDATE_TIME_STORAGE_KEY = 'last-update-time';

var getLastUpdateTime = function(){
  var lastUpdateTime = Settings.data(LAST_UPDATE_TIME_STORAGE_KEY);

  if(typeof lastUpdateTime != 'undefined' && lastUpdateTime !== null){
    return null;
  }else{
    return lastUpdateTime;
  }
};

var update = function(successCallback){
  var getDestinationNameProcessingCount = 0;
  var getDestinationNameSuccessCallback = function(data){
    getDestinationNameProcessingCount--;
    if(getDestinationNameProcessingCount <= 0){
      successCallback();
    }
  };
  
  var getRouteListSuccessCallback = function(data){
    for(var firstDigit in data){
      for(var i=0; i<data[firstDigit].length; i++){
        var routeNo = data[firstDigit][i];
        
        for(var dir=1; dir<=2; dir++){
          getDestinationNameProcessingCount += 2;
          Dataset.getDestinationName(routeNo, dir, 'chi', getDestinationNameSuccessCallback);
          Dataset.getDestinationName(routeNo, dir, 'eng', getDestinationNameSuccessCallback);
        }
      }
    }
  };
  
  Dataset.getRouteList(getRouteListSuccessCallback);
};

var Updater = {
  'update' : update,
  'getLastUpdateTime' : getLastUpdateTime,
  'checkDataDownloaded' : function(successCallback){
    if(getLastUpdateTime() === null){
      update(successCallback);
    }else{
      successCallback();
    }
  }
};

this.exports = Updater;
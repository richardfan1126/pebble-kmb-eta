var ajax = require('ajax');

var Dataset = {
  'getRouteList' : function(successCallback){
    ajax({
      url : 'http://etadatafeed.kmb.hk:1933/GetData.ashx?type=ETA_R',
      method: 'get'
    }, function(data){
      data = JSON.parse(data);
      
      data = data[0].r_no.split(',');
      
      successCallback(data);
    });
  },
  'getRouteInfo' : function(bn, dir, successCallback){
    ajax({
      url : 'http://www.kmb.hk/ajax/getRouteMapByBusno.php',
      data : {
        bn: bn,
        dir: dir
      },
      method: 'post'
    }, function(data){
      data = JSON.parse(data);
      successCallback(data);
    });
  }
};

this.exports = Dataset;
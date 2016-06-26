const APP_LANGUAGE_STORAGE_KEY = 'app-lang';

var Settings = require('settings');
var Dataset = require('Dataset');

var AppConfig = {
  'setLanguage' : function(lang, successCallback){
    Settings.option(APP_LANGUAGE_STORAGE_KEY, lang);
    
    Dataset.clearCache(function(){
      successCallback();
    });
  },
  'getLanguage' : function(){
    var lang = Settings.option(APP_LANGUAGE_STORAGE_KEY);
    
    if(typeof lang == 'undefined' || lang == null){
      lang = 'eng';
    }
    
    return lang;
  }
};

this.exports = AppConfig;
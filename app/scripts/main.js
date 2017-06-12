
(function(){
  'use strict';

  require.config({
    paths: {
      jquery: '../bower_components/jquery/jquery',
      'jquery-ui': '../bower_components/jquery-ui/jquery-ui',
      underscore: '../bower_components/underscore/underscore',
      'underscore-mix': 'lib/underscoreMix',
      easeljs: '../bower_components/Easeljs/lib/easeljs-0.8.2.combined',
      preloadjs: '../bower_components/PreloadJS/lib/preloadjs-0.6.2.combined',
      tweenjs: '../bower_components/TweenJS/lib/tweenjs-0.6.2.combined',
      createjs: 'lib/createjs',
      mlc: '../bower_components/mlc-framework/mlc-core',
      mlcCore: '../bower_components/mlc-framework/core-modules',
      mlcOptional: '../bower_components/mlc-framework/optional-modules',
      mlcOther: '../bower_components/mlc-framework/other-scripts',
      'mlc-mix': 'lib/mlcMix',
      spinjs: '../bower_components/spin.js/spin.min'
    },
    shim: {
      easeljs: {
        exports: 'createjs'
      },
      preloadjs: {
        deps: ['easeljs']
      },
      tweenjs: {
        deps: ['easeljs']
      }
    }
  });

  require(['app']);

})();

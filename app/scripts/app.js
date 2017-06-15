define(function (require) {
  'use strict';

  var $ = require('jquery');
  var _ = require('underscore-mix');
  var createjs = require('createjs');
  var Spinjs = require('spinjs');
  var MLC = require('mlc-mix');
  var Constants = require('Constants');
  var NumberPiece = require('NumberPiece');
  // var PieceOptions = require('PieceOptions');
  // var MVPTray = require('MVPTray');
  // var MVPShade = require('MVPShade');
  var TextEntity = require('mlcOptional/TextEntity');
  var IPadCheck = require('mlcOptional/IPadCheck');

  var page;
  var toolbar;
  var infoPage;
  var tray;
  var paletteLayer;
  var drawTools;
  var textTools;
  var targetText, textSpotlightId;
  var shades = {};
  var mode = Constants.Modes.VALUE;
  var spinner;

  var APP_FULL_NAME = 'Number Pieces, by The Math Learning Center';
  var IOS_APP_URL = 'NO APP URL'; // https://itunes.apple.com/us/app/money-pieces-by-math-learning/id1055394278';

  var DRAW_TOOLS_INITIAL_PADDING = 15;
  var SHADE_INITIAL_PADDING = 15;
  var SHADE_INITIAL_OFFSET = 15;

  var UI_MANIFEST = [
    { src: 'images/drawingmenu/close.png' },
    { src: 'images/drawingmenu/close-down.png' },
    { src: 'images/drawingmenu/close@2x.png' },
    { src: 'images/drawingmenu/close_down@2x.png' },

    { src: 'images/drawingmenu/pen-curve.png' },
    { src: 'images/drawingmenu/pen-curve-active.png' },

    { src: 'images/drawingmenu/pen-straight.png' },
    { src: 'images/drawingmenu/pen-straight-active.png' },

    { src: 'images/drawingmenu/color-picker.png' },
    { src: 'images/drawingmenu/color-picker-active.png' },

    { src: 'images/drawingmenu/eraser.png' },
    { src: 'images/drawingmenu/eraser-active.png' },

    { src: 'images/drawingmenu/erase-all.png' },
    { src: 'images/drawingmenu/erase-all-active.png' },

    { src: 'images/drawingmenu/color-drawer-dot.png' },
    { src: 'images/drawingmenu/color-drawer-dot-active.png' },

    { src: 'images/drawingmenu/palette-handle.png' },

    { src: 'images/shades/shade-image-bank.png' },
    { src: 'images/shades/shade-image-bank@2x.png' },
    { src: 'images/shades/shade-image-pocket.png' },
    { src: 'images/shades/shade-image-pocket@2x.png' },
    { src: 'images/shades/shade-image-hand-left.png' },
    { src: 'images/shades/shade-image-hand-left@2x.png' },
    { src: 'images/shades/shade-image-hand-right.png' },
    { src: 'images/shades/shade-image-hand-right@2x.png' },
    { src: 'images/shades/shade-button-icon-show.png' },
    { src: 'images/shades/shade-button-icon-show@2x.png' },
    { src: 'images/shades/shade-button-icon-hide.png' },
    { src: 'images/shades/shade-button-icon-hide@2x.png' },
    { src: 'images/shades/question-transparent.png'}
  ];

  var TRAY_MANIFEST = [
    {src: 'images/tray-background/tray.png'},
    {src: 'images/tray-background/tray@2x.png'},

    {src: 'images/basicTray/button-hundreds-down@2x.png'},
    {src: 'images/basicTray/button-hundreds@2x.png'},
    {src: 'images/basicTray/button-ones-down@2x.png'},
    {src: 'images/basicTray/button-ones@2x.png'},
    {src: 'images/basicTray/button-tens-horiz-down@2x.png'},
    {src: 'images/basicTray/button-tens-horiz@2x.png'},
    {src: 'images/basicTray/button-tens-vert-down@2x.png'},
    {src: 'images/basicTray/button-tens-vert@2x.png'},

    {src: 'images/counter/unit.png'},
    {src: 'images/toolbar/icon-trash.png'},
    {src: 'images/toolbar/icon-trash-down.png'},
  ];

  // Initialization
  $(document).ready(function () {
    // Create debounced resize so it's not firing continuously as the user resizes the window
    var debouncedResize = _.debounce(resizeCanvas, 100);
    $(window).resize(debouncedResize);

    // Hide right-click menu on canvas
    // $('canvas').on('contextmenu', function(){return false;});

    createjs.Ticker.on('tick', tick);
    createjs.Ticker.framerate = 30;

    startSpinner();

    resizeCanvas();
    init();
    new IPadCheck({appName: APP_FULL_NAME, appURL: IOS_APP_URL}).check();
  });

  function init() {
    spinner.start();
    loadManifests().then(
      function(){
        buildPage();
        buildToolbar();
        buildInfo();
        buildPalettes();
        bindKeyboardEvents();
        bindMouseEvents();
        bindDispatcherEvents();
      },
      function(error){
        console.log(error);
      }
    ).then(function () {
        spinner.stop();
    });
  }

  function startSpinner() {
    spinner = {
      id: 'loading-spinner',
      spinner: {},
      opts: {
        lines: 13, // The number of lines to draw
        length: 20, // The length of each line
        width: 10, // The line thickness
        radius: 30, // The radius of the inner circle
        corners: 1, // Corner roundness (0..1)
        rotate: 0, // The rotation offset
        direction: 1, // 1: clockwise, -1: counterclockwise
        color: '#000', // #rgb or #rrggbb or array of colors
        speed: 1, // Rounds per second
        trail: 60, // Afterglow percentage
        shadow: false, // Whether to render a shadow
        hwaccel: false, // Whether to use hardware acceleration
        className: 'spinner', // The CSS class to assign to the spinner
        zIndex: 2e9, // The z-index (defaults to 2000000000)
        top: 'auto', // Top position relative to parent in px
        left: 'auto' // Left position relative to parent in px
      },

      start: function() {
        var target = document.getElementById(this.id);
        this.spinner = new Spinjs(this.opts).spin(target);
      },

      stop: function() {
        // $( this.id ).hide();
        this.spinner.stop();
      }
    };
  }

  function buildPalettes() {
    paletteLayer = new createjs.Container();
    paletteLayer.name = 'PaletteLayer';
    paletteLayer.setBounds(0, 0, MLC.Stage.canvas.width, MLC.Stage.canvas.height);

    MLC.Stage.addChild(paletteLayer);

    buildDrawTools();
    buildTextTools();
    // Add other palettes (eg: Keypad, etc.)
  }

  function buildDrawTools() {
    var stageBounds = MLC.Stage.getBounds();
    var options = {
      position: {
        x: 0, //stageBounds.width + stage.x,
        y: 0
      },

      closeDefault: 'images/drawingmenu/close.png',
      closeActive: 'images/drawingmenu/close-down.png',

      freehandDefault: 'images/drawingmenu/pen-curve.png',
      freehandActive: 'images/drawingmenu/pen-curve-active.png',

      lineDefault: 'images/drawingmenu/pen-straight.png',
      lineActive: 'images/drawingmenu/pen-straight-active.png',

      colorPickerDefault: 'images/drawingmenu/color-picker.png',
      colorPickerActive: 'images/drawingmenu/color-picker-active.png',

      eraseDefault: 'images/drawingmenu/eraser.png',
      eraseActive: 'images/drawingmenu/eraser-active.png',

      eraseAllDefault: 'images/drawingmenu/erase-all.png',
      eraseAllActive: 'images/drawingmenu/erase-all-active.png',

      colorDefault: 'images/drawingmenu/color-drawer-dot.png',
      colorActive:  'images/drawingmenu/color-drawer-dot-active.png',

      handleRibs: 'images/drawingmenu/palette-handle.png'
    };
    drawTools = new MLC.DrawTools(paletteLayer, options);
    drawTools.bindingContainer = paletteLayer;
    drawTools.x = stageBounds.width + stageBounds.x - drawTools.width - DRAW_TOOLS_INITIAL_PADDING;
    drawTools.y = DRAW_TOOLS_INITIAL_PADDING;
    drawTools.updateMenuDirection();
    drawTools.draw();
    MLC.Dispatcher.dispatchEvent(MLC.Constants.DRAW_TOOLS_HIDE_EVENT);
  }

  function buildTextTools() {
    var options = {
      position: {
        x: 500,
        y: 30
      }
    };
    textTools = new MLC.TextTools(paletteLayer, options);
    textTools.bindingContainer = paletteLayer;
    textTools.draw();
    MLC.Dispatcher.dispatchEvent(MLC.Constants.TEXT_TOOLS_HIDE);
  }

  function buildPage() {
    page = new MLC.Page(MLC.Stage, {
      dimensions: {
        width: MLC.Stage.canvas.width,
        height: MLC.Stage.canvas.height
      },
      startOverCallback: startOver,
      drawOnTop: true,
        callbacks: {
          mouseCallbacks: {
            paletteDismiss: {
              check: function() {
                return targetText;
              },
              pressup: function (event) {
                var object = page._findFirstObject(event.target);
                if (object && object.js) {
                  object = page._findFirstObject(object.js.topmostParent.t);
                  if (object && object.js) {
                    object = object.js;
                  }
                }
                var matchesTarget = (object === targetText);
                var isPage = object instanceof MLC.Page;
                if (!(matchesTarget || isPage)) {
                  // Missed the target.
                  // - SHUT DOWN ALL THE PALETTES!
                  if (targetText) {
                    MLC.Dispatcher.dispatchEvent(MLC.Constants.TEXT_TOOLS_HIDE);
                  }
                }
              }
            }
          }
        }
    });

    buildTray();

    // _.each(shades, function(shade) {
    //   page.addToWorkspace(shade, MLC.Page.LayerNames.WIDGET);
    // });

    MLC.Dispatcher.dispatchEvent(MLC.Constants.TRAY_EXPAND_EVENT);
  }

  function buildToolbar() {
    toolbar = new MLC.Toolbar({
      parent: {
        selector: Constants.TOOLBAR_SELECTOR,
        clickEvent: Constants.Events.TOOLBAR_CLICKED
      }
    });

    attachToolbarButtons(toolbar);
    attachToolbarPopouts(toolbar);
  }

  function attachToolbarButtons(toolbar) {
    // Attach default buttons.
    toolbar.addButton(Constants.DELETE_SELECTOR, MLC.Toolbar.defaultDeleteOptions);
    toolbar.addButton(Constants.START_OVER_SELECTOR, MLC.Toolbar.defaultStartOverOptions);
    toolbar.addButton(Constants.DRAW_TOOLS_SELECTOR, MLC.Toolbar.defaultDrawToolsOptions);

    // Default behavior is to just spawn the text when clicked; we need to request the
    // spawn first so that it can be prevented when text tools are already open.
    var textToolsOptions = MLC.Toolbar.defaultTextToolsOptions;
    textToolsOptions.clickEvent = Constants.Events.SPAWN_TEXT_REQUEST;
    toolbar.addButton(Constants.TEXT_TOOLS_SELECTOR, textToolsOptions);

    // Attach app-specific buttons.
    // EG: Duplicate, Rotate

    // toolbar.addButton(Constants.TRAY_TOGGLE_SELECTOR, {
    //   clickEvent: Constants.TRAY_TOGGLE_EVENT,
    //   addClassOn: [
    //     {
    //       eventID: Constants.TRAY_RETRACT_EVENT,
    //       cssClass: 'tray-open'
    //     }
    //   ],
    //   removeClassOn: [
    //     {
    //       eventID: Constants.TRAY_EXPAND_EVENT,
    //       cssClass: 'tray-open'
    //     }
    //   ]
    // });
  }

  function attachToolbarPopouts(toolbar) {
  }

  function buildInfo() {
    infoPage = new MLC.InfoPage('#infopage');
  }

  function buildTray(){
    var counters = buildTrayItemOptions();
    // var buttons = buildTrayButtonOptions();
    var buttons = [
      {
        buttonType: MLC.Button.ButtonTypes.ICON,

        fillColor: 'transparent',

        defaultImage: 'images/toolbar/icon-trash.png',
        activeImage: 'images/toolbar/icon-trash-down.png',
        leftPadding: 24,
        topPadding: 24,
        clickCallback: function (event) {
          MLC.Dispatcher.dispatchEvent(MLC.Constants.DELETE_SELECTION_PROMPT_EVENT);
        }
      }
    ];
    tray = new MLC.Tray(MLC.Stage,
      {
        counters: counters,
        buttons: buttons
      }
    );
  }

  function buildTrayItemManifest(){
    var manifest = [];
    var path = 'images/tray-buttons/';
    var prefix = 'button-';
    var type = ['grid', 'currency'];
    var currency = ['penny', 'nickel', 'dime', 'quarter', 'half-dollar', 'dollar'];
    var side = ['', '-down'];
    var size = ['', '@2x'];
    var ext = '.png';
    
    for(var t = 0; t < type.length; t++){
      for(var c = 0; c < currency.length; c++){
        for(var s = 0; s < side.length; s++){
          for(var se = 0; se < size.length; se++){
            var id = prefix + type[t] + '-' + currency[c] + side[s] + size[se] + ext;
            manifest.push({id: id, src: path + id});
          }
        }
      }
    }
    
    console.log('manifest', manifest);
    return manifest;
  }

  function buildTrayItemOptions() {
    var items = [];
    // var pieceNames = [ 'hundreds', 'ones', 'tens-horiz', 'tens-vert'];
    var pieceNames = [ 'unit' ];
    var prefix = 'images/counter/';
    var suffix = '.png';

    var item;
    for (var index = 0; index < pieceNames.length; index++) {
      item = {
        image: prefix + pieceNames[index] + suffix
      };
      items.push(item);
    }

    return items;
  }

  function positionTextTools() {
    if (!targetText) {
      return;
    }

    var paletteLayerBounds = paletteLayer.getBounds();
    var upperPoint = {
      x: targetText.x + (targetText.width / 2),
      y: targetText.y
    };
    var lowerPoint = {
      x: targetText.x + (targetText.width / 2),
      y: targetText.y + targetText.height
    };
    var middlePoint = {
      x: targetText.x + (targetText.width / 2),
      y: targetText.y + (targetText.height / 2)
    };
    var indicatorHeight = 30;
    var localPoint = targetText.topmostParent.t.localToLocal(middlePoint.x, middlePoint.y, textTools.topmostParent.t);

    if (localPoint.y > paletteLayerBounds.height / 2) {
      localPoint = targetText.topmostParent.t.localToLocal(upperPoint.x, upperPoint.y, textTools.topmostParent.t);
      textTools.x = localPoint.x - (textTools.width / 2);
      textTools.y = localPoint.y - textTools.height - indicatorHeight - 12; // -12 comes from shifting by lozenge height/2
      textTools.indicator('bottom');
    } else {
      localPoint = targetText.topmostParent.t.localToLocal(lowerPoint.x, lowerPoint.y, textTools.topmostParent.t);
      textTools.x = localPoint.x - (textTools.width / 2);
      textTools.y = localPoint.y + indicatorHeight;
      textTools.indicator('top');
    }

    // Ensure boundries
    if (textTools.y < 0) {
      textTools.y = 0;
    }
    if (textTools.y + textTools.height > paletteLayerBounds.height) {
      textTools.y = paletteLayerBounds.height - textTools.height;
    }
    if (textTools.x < 0) {
      textTools.x = 0;
    }
    if (textTools.x + textTools.width > paletteLayerBounds.width) {
      textTools.x = paletteLayerBounds.width - textTools.width;
    }

    textTools.x = Math.round(textTools.x);
    textTools.y = Math.round(textTools.y);

    var constrainEvent = new createjs.Event(MLC.Constants.CONSTRAIN_ENTITY_EVENT);
    constrainEvent.set({
      skipAnimation: true
    });
    textTools.display.dispatchEvent(constrainEvent);
  }

  function bindKeyboardEvents() {
    document.onkeydown = function (event) {
      // if (event.altKey) {
      //   console.log('alt-key: %d (%s), char: %d (%s)', event.keyCode,event.keyCode, event.charCode,event.charCode);
      //   MLC.Dispatcher.dispatchEvent(MLC.Constants.DRAW_TOOLS_TOGGLE_EVENT);
      // }
      // if (event.ctrlKey) {
      //   console.log('ctrl-key: %d (%s), char: %d (%s)', event.keyCode,event.keyCode, event.charCode,event.charCode);
      //   MLC.Dispatcher.dispatchEvent(MLC.Constants.TEXT_TOOLS_TOGGLE);
      // }


      var shouldDelete = (event.keyCode === MLC.Constants.BACKSPACE_KEYCODE) || (event.keyCode === MLC.Constants.DELETE_KEYCODE);
      if (shouldDelete) {
        var deleteEvent = new createjs.Event(Constants.Events.REQUEST_SELECTION_DELETE);
        var options = {
          ids: 'all'
        };
        deleteEvent.set(options);
        MLC.Dispatcher.dispatchEvent(deleteEvent);

        MLC.Dispatcher.dispatchEvent(MLC.Constants.TEXT_TOOLS_HIDE);
      }

    };
  }

  function bindMouseEvents() {
    // For clicks that aren't part of the canvas.
  }

  function bindDispatcherEvents() {

    MLC.Dispatcher.on(MLC.Constants.TRAY_MOUSE_DOWN_EVENT, function (event) {
      var modeChangeEvent = new createjs.Event(MLC.Constants.DRAW_TOOLS_MODE_CHANGE_EVENT);
      modeChangeEvent.set({
        newMode: MLC.DrawTools.DrawMode.NONE
      });
      MLC.Dispatcher.dispatchEvent(modeChangeEvent);      
      MLC.Dispatcher.dispatchEvent(new createjs.Event(MLC.Constants.TEXT_TOOLS_HIDE));

      MLC.Dispatcher.dispatchEvent(new createjs.Event(MLC.Constants.TEXT_TOOLS_HIDE));

      var selectEvent = new createjs.Event(MLC.Constants.SELECT_ENTITY_EVENT);
      selectEvent.set({
        ids: []
      });
      MLC.Dispatcher.dispatchEvent(selectEvent);
    });

    MLC.Dispatcher.on(Constants.Events.TOOLBAR_CLICKED, function (event) {
      var drawToolsExclusionList = [
        Constants.DRAW_TOOLS_SELECTOR
      ];

      var textToolsExclusionList = [
        Constants.TEXT_TOOLS_SELECTOR
      ];

      if (!inExclusionList(drawToolsExclusionList, event)) {
        var modeChangeEvent = new createjs.Event(MLC.Constants.DRAW_TOOLS_MODE_CHANGE_EVENT);
        modeChangeEvent.set({
          newMode: MLC.DrawTools.DrawMode.NONE
        });
        MLC.Dispatcher.dispatchEvent(modeChangeEvent);
      }

      if (!inExclusionList(textToolsExclusionList, event)) {
        if (textTools.display.visible) {
          MLC.Dispatcher.dispatchEvent(new createjs.Event(MLC.Constants.TEXT_TOOLS_HIDE));

          var selectEvent = new createjs.Event(MLC.Constants.SELECT_ENTITY_EVENT);
          selectEvent.set({
            ids: []
          });
          MLC.Dispatcher.dispatchEvent(selectEvent);
        }
      }
    });

    MLC.Dispatcher.on(MLC.Constants.SPAWN_TEXT_EVENT, spawnTextEntity, this);

    MLC.Dispatcher.on(MLC.Constants.TEXT_TOOLS_WRITE, function(event) {
      if (targetText) {
        targetText.updateText(targetText.text + event.text);
        targetText.draw();
      }
    });

    MLC.Dispatcher.on(MLC.Constants.TEXT_TOOLS_BACKSPACE, function() {
      if (targetText) {
        targetText.updateText(targetText.text.slice(0, targetText.text.length-1));
        targetText.draw();
      }
    });

    MLC.Dispatcher.on(MLC.Constants.TEXT_TOOLS_COLOR_CHANGE, function(event) {
      if (targetText) {
        targetText.updateColor(event.text);
      }
    });

    MLC.Dispatcher.on(MLC.Constants.TEXT_TOOLS_HIDE, function() {
      $('#toolbar-shade').removeClass('show');
      targetText = null;
      page.endSpotlight(textSpotlightId);
      textSpotlightId = null;
    });

    MLC.Dispatcher.on(MLC.Constants.TEXT_TOOLS_SHOW, function(event) {
      $('#toolbar-shade').addClass('show');
      targetText = event.targetText;

      positionTextTools();
      var constrainEvent = new createjs.Event(MLC.Constants.CONSTRAIN_ENTITY_EVENT);
      constrainEvent.set({
        skipAnimation: true
      });
      textTools.display.dispatchEvent(constrainEvent);

      if (_.isString(textSpotlightId)) {
        // Clear text spotlight first
        page.endSpotlight(textSpotlightId);
      }
      textSpotlightId = page.spotlight(targetText);
    });

    MLC.Dispatcher.on(Constants.Events.SPAWN_TEXT_REQUEST, function () {
      if (textTools.display.visible) {
        // REJECT!
        MLC.Dispatcher.dispatchEvent(MLC.Constants.TEXT_TOOLS_HIDE);
      } else {
        MLC.Dispatcher.dispatchEvent(MLC.Constants.SPAWN_TEXT_EVENT);
      }
    });


    MLC.Dispatcher.on(Constants.Events.SELECTION_ROTATE, function(event) {
      var center = _getCenterOfSelection();
      var rotateEvent = new createjs.Event(Constants.Events.PIECE_ROTATE);
      rotateEvent.set({
        center: center
      });
      MLC.Dispatcher.dispatchEvent(rotateEvent);
    });

    MLC.Dispatcher.on(MLC.Constants.SPAWN_FROM_TRAY_EVENT, spawnCounterFromTray);


    MLC.Dispatcher.on(MLC.Constants.START_OVER_PROMPT_EVENT, _startOverPrompt);


    MLC.Dispatcher.on(Constants.Events.REQUEST_SELECTION_DUPLICATE, duplicate);


    MLC.Dispatcher.on(MLC.Constants.DELETE_SELECTION_PROMPT_EVENT, _deleteSelectionPrompt);
    MLC.Dispatcher.on(Constants.Events.REQUEST_INFO, function() {
      infoPage.show();
    });


    MLC.Dispatcher.on(MLC.Constants.RELEASE_SELECTION_EVENT, snapSelection);
    MLC.Dispatcher.on(Constants.Events.TRIGGER_PIECE_MODE_SWITCH, function(){
      mode = (mode === Constants.Modes.VALUE ? Constants.Modes.CURRENCY : Constants.Modes.VALUE);
      var switchEvent = new createjs.Event(Constants.Events.PIECE_MODE_SWITCH);
      switchEvent.set({
        mode: mode
      });
      MLC.Dispatcher.dispatchEvent(switchEvent);
    });

    MLC.Dispatcher.on(MLC.Constants.SELECT_ENTITY_EVENT, updateSelection);
    MLC.Dispatcher.on(MLC.Constants.DESELECT_ENTITY_EVENT, updateSelection);

    MLC.Dispatcher.on(Constants.Events.TRIGGER_SELECTION_ROTATE, function(){
      if(mode === Constants.Modes.VALUE){
        MLC.Dispatcher.dispatchEvent(new createjs.Event(Constants.Events.SELECTION_ROTATE));
      }
    });

    MLC.Dispatcher.on(Constants.Events.SPAWN_PIECE_FAILURE, _moneyPieceSpawnFailurePrompt);

    MLC.Dispatcher.on(MLC.Constants.STAGE_UPDATE, positionTextTools);
  }

  function inExclusionList(list, event) {
    var inExclusionList = _.any(event.parentSelectors, function (selector) {
      return _.contains(list, selector);
    });
    return inExclusionList;
  }

  function buildManifest(){
    var manifest = [];
    var path = 'images/currency/';
    var prefix = 'currency-';
    var currency = ['penny', 'nickel', 'dime', 'quarter', 'half-dollar', 'dollar'];
    var side = ['back', 'front', 'only-back', 'only-front'];
    var size = ['', '@2x'];
    var ext = '.png';

    for(var s = 0; s < side.length; s++){
      for(var c = 0; c < currency.length; c++){
        for(var i = 0; i < size.length; i++){
          var id = prefix + side[s] + '-' + currency[c] + size[i] + ext;
          manifest.push({id: id, src: path + id});
        }
      }
    }
    return manifest;
  }

  function loadManifests() {
    var manifest = buildManifest();
    MLC.Loader.defineManifest('data', _.union(manifest, TRAY_MANIFEST), '');
    MLC.Loader.defineManifest('ui', UI_MANIFEST, '');
    return MLC.Loader.loadAll();
  }


  function prepareExchangePopout(){

    var selectionValue = getSelectionValue();
    var exchangeValues = $('.exchange-value', $("#exchange-popout"));

    _.each(exchangeValues, function (element) {
      var $element = $(element);
      var name = $element.data('value');
      var options = PieceOptions(name);
      if (selectionValue >= options.value){
        //SHOW
        $element.removeClass('hidden');
      } else {
        //HIDE
        $element.addClass('hidden');
      }
    });
  }

  function addExchangeEvents() {
    // For each button in the dialog, fire an event based on
    //   its value to set the workspace's line spacing.
    var exchangeValues = $('.exchange-value', this.$popout);
    exchangeValues.off('click');
    _.each(exchangeValues, function (element) {
      var $element = $(element);
      $element.on('click', { this: this }, function (event) {
        var value = $element.data('value');
        // Use value to pass to workspace!
        var exchangeEvent = new createjs.Event(Constants.Events.EXCHANGE_SELECTION);
        exchangeEvent.set({ newValue: value });
        MLC.Dispatcher.dispatchEvent(exchangeEvent);
        event.data.this.closeCallback();
      });
    }, this);
  }

  // Conversion Handlers
  function exchangeSelection(event) {
    var targetPieceOption = PieceOptions(event.newValue);
    targetPieceOption.mode = mode;
    var pieces = _getSelection(MoneyPiece);
    var nonPieces = _getSelection(MoneyPiece, false);
    var newSelection = convertCoinsToValue(pieces, targetPieceOption);
    var difference = _.without(pieces, newSelection);
    var isValueMode = mode === Constants.Modes.VALUE;
    var bounds = _getSelectionBounds(MoneyPiece);
    var newIds = _.pluck(nonPieces, 'id');

    if((page.selectableEntities.length - pieces.length + newSelection.length) > Constants.MONEYPIECELIMIT ){
      MLC.Dispatcher.dispatchEvent(new createjs.Event(Constants.Events.EXCHANGE_FAILURE));
    } else {
      // Remove each piece from the workspace
      deleteEntities(difference);

      // Add each new piece back to the workspace
      var pointer = {
        x: 0,
        y: 0
      };
      var rowHeight;
      var workspaceBounds = page.workspace.getBounds();
      if (!isValueMode) {
        bounds.width = workspaceBounds.width - bounds.x;
        bounds.height = workspaceBounds.height - bounds.y;
      }

      newSelection = _.sortBy(newSelection, function (piece) {
        var sorting = _.indexOf(newSelection, piece);
        if (_.indexOf(pieces, piece) >= 0) {
          // Old piece, rank first
          sorting -= newSelection.length;
        }
        return sorting;
      });
      _.each(newSelection, function (piece) {
        page.addToWorkspace(piece, MLC.Page.LayerNames.SELECTABLE_ENTITY);

        if (_.indexOf(pieces, piece) < 0) {
          // New piece, needs to be positioned
          piece.x = bounds.x + pointer.x;
          piece.y = bounds.y + pointer.y;
          _updatePlacementPointer(piece, pointer, bounds, rowHeight);
        }

        newIds.push(piece.id);
      });

      var selectEvent = new createjs.Event(MLC.Constants.SELECT_ENTITY_EVENT);
      selectEvent.set({
        ids: newIds,
        add: false
      });
      MLC.Dispatcher.dispatchEvent(selectEvent);
      MLC.Dispatcher.dispatchEvent(MLC.Constants.STAGE_UPDATE);
    }
  }

  function _updatePlacementPointer(piece, pointer, bounds, rowHeight) {
    if (!rowHeight) {
      rowHeight = piece.height;
    }
    pointer.x = pointer.x + piece.width;
    if (pointer.x + piece.width > bounds.width) {
      pointer.x = 0;
      pointer.y = pointer.y + rowHeight;
      rowHeight = 0;
    }
  }


  // Pre:
  // - coins: An array of items with a .value property.
  // - targetValue: The value to convert coins to.
  //
  // Post:
  // - returns a new list of items with .value properties
  //   such that the total value is the same as the total
  //   value of the original coins, but where the coin
  //   composition has maximized coins with the target
  //   value, and with a minimal changing of other coin
  //   values.
  function convertCoinsToValue(coins, targetPieceOptions) {
    var conversionSet = [];
    var sortedCoins = [];
    var sortedCoinValues = [];
    var targetValue = targetPieceOptions.value;
    var totalValue;
    var majorCoinCount;
    var remainingValue;

    // Count the number coins with the target value to use.
    totalValue = _.reduce(coins, function(memo, coin) {
      return memo + coin.value;
    }, 0);
    majorCoinCount = Math.floor(totalValue / targetValue);
    _.each(_.range(majorCoinCount), function() {
      var newCoin = new MoneyPiece(undefined, targetPieceOptions);
      conversionSet.push(newCoin);
    });

    // Fill in the remaining value with existing coins, by reference.
    remainingValue = totalValue % targetValue;
    sortedCoins = _.sortBy(coins.reverse(), function(coin) { return -coin.value; });
    //sortedCoins = coins.sort(function(a, b) { return b.value - a.value; });
    _.each(sortedCoins, function(coin) {
      if (coin.value <= remainingValue) {
        remainingValue -= coin.value;
        conversionSet.push(coin);
      }
    });

    // Fill in the remaining value with new coins, in descending value.
    sortedCoinValues = _.sortBy(PieceOptions(), function(pieceOptions) { return -pieceOptions.value; });
    _.each(sortedCoinValues, function(pieceOptions) {
      pieceOptions.mode = mode;
      var coinValue = pieceOptions.value;
      while (coinValue <= remainingValue) {
        remainingValue -= coinValue;
        var newCoin = new MoneyPiece(undefined, pieceOptions);
        conversionSet.push(newCoin);
      }
    });

    return conversionSet;
  }

  function resizeCanvas() {
    // Unset width and height on canvas so its css style will take over
    // and we can figure out the size it 'wants' to be.
    MLC.Stage.canvas.removeAttribute('height');
    MLC.Stage.canvas.removeAttribute('width');

    // Reset width and height explicitly on canvas
    MLC.Stage.canvas.width = MLC.Stage.canvas.offsetWidth;
    MLC.Stage.canvas.height = MLC.Stage.canvas.offsetHeight;
    if (paletteLayer) {
      paletteLayer.setBounds(0, 0, MLC.Stage.canvas.width, MLC.Stage.canvas.height);
      drawTools.display.dispatchEvent(MLC.Constants.CONSTRAIN_ENTITY_EVENT);
    }

    var visiblePage;
    if (tray) {
      visiblePage = {
        x: (tray.x + tray.width),
        y: 0,
        width: (MLC.Stage.canvas.width - (tray.x + tray.width)),
        height: MLC.Stage.canvas.height
      };
    }

    var resizeEvent = new createjs.Event(MLC.Constants.RESIZE_EVENT);
    var resizeOptions = {
      visiblePage: visiblePage,
      width: MLC.Stage.canvas.width,
      height: MLC.Stage.canvas.height
    };
    resizeEvent.set(resizeOptions);
    MLC.Dispatcher.dispatchEvent(resizeEvent);
    MLC.Dispatcher.dispatchEvent(new createjs.Event(MLC.Constants.STAGE_UPDATE));
  }

  function tick() {
    //console.log('Stage.updateNeeded:', Stage.updateNeeded);
    if (MLC.Stage.updateNeeded) {
      MLC.Stage.update();
      // Reset
      MLC.Stage.updateNeeded = false;
    }
  }


  function spawnCounterFromTray(event) {

    if (page.selectableEntities.length >= Constants.MONEYPIECELIMIT) {

      MLC.Dispatcher.dispatchEvent(new createjs.Event(Constants.Events.SPAWN_PIECE_FAILURE));

    } else {

      // Determine piece size based on image?
      var options = event;
      options.dimensions = {
        width: 30,
        height: 30
      };
      var piece = new NumberPiece(null, options);
      var position = _getDesiredPointFromTraySpawn(event, piece);
      piece.x = position.x;
      piece.y = position.y;

      page.addToWorkspace(piece, MLC.Page.LayerNames.SELECTABLE_ENTITY);

      var selectEvent = new createjs.Event(MLC.Constants.SELECT_ENTITY_EVENT);
      selectEvent.set({
        ids: [piece.id],
        add: false
      });
      MLC.Dispatcher.dispatchEvent(selectEvent);

      if (event.mode === Constants.Modes.VALUE) {
        snapSelection();
      }

      var constrainEntityEvent = new createjs.Event(MLC.Constants.CONSTRAIN_ENTITY_EVENT);
      constrainEntityEvent.set({
        skipAnimation: true,
        selectionBounds: piece.getConstraintBounds()
      });
      piece.display.dispatchEvent(constrainEntityEvent);

      MLC.Dispatcher.dispatchEvent(new createjs.Event(MLC.Constants.STAGE_UPDATE));

    }
  }

  function _getDesiredPointFromTraySpawn(event, piece) {
    var desiredPosition;
    var localPoint;
    var piece = piece || { width: 0, height: 0 };

    if (event.spawnAtCenter && piece) {
      desiredPosition = getDesiredClickSpawnPoint(piece);
    } else {
      localPoint = page.workspace.globalToLocal(event.stageX, event.stageY);
      desiredPosition = {
        x: localPoint.x - (piece.width / 2),
        y: localPoint.y - (piece.height / 2)
      };
    }

    return desiredPosition;
  }

  function getDesiredClickSpawnPoint(newEntity, type) {
    var targetPt;
    var fallbackPt = {
      x: MLC.Stage.canvas.width / 2 - (tray ? tray.width : 0),
      y: MLC.Stage.canvas.height / 4
    };
    if (type === TextEntity) {
      // Use the Page's last-known click, if possible
      targetPt = _getPointNearClick();
    } else {
      // Search along the diagonal for a new place
      targetPt = _getPointAlongDiagonal(newEntity, type);
    }

    if (!targetPt) {
      targetPt = fallbackPt;
    }
    return targetPt;
  }

  function _getPointNearClick() {
    var targetPt;
    var position = page.interactionState.currentPosition;
    if (position) {
      targetPt = page.display.globalToLocal(position.x, position.y);
      if (targetPt.x < 0) {
        targetPt.x = 0;
      }
      if (targetPt.y < 0) {
        targetPt.y = 0;
      }
    } else {
      targetPt = null;
    }
    return targetPt;
  }

  function _getPointAlongDiagonal(newEntity, type) {
    var allEntities = _.filter(page.selectableEntities, function(entity) {
      var include;
      if (type) {
        include = entity instanceof type;
      } else {
        include = _.isFunction(entity.getGrid);
      }
      return include;
    });
    var xMod = 0;
    var threshold = Constants.CellDimensions.WIDTH / 2;
    var targetPt;
    var distance = {
      x: Constants.CellDimensions.WIDTH,
      y: Constants.CellDimensions.HEIGHT
    };
    var trying = true;
    var subloop;

    // While "finding point":
    //   set targetPt to top-left, shifted over a number of columns
    //   turn on "find point in this diagonal" boolean
    //   While "finding point in this diagonal":
    //     if "targetPt is too close to another entity":
    //       advance targetPt along this diagonal
    //       if "targetPt is outside the bounds of the page":
    //         stop looking in this diagonal
    //   advance xMod to next column

    while (trying) {
      subloop = true;
      targetPt = {
        x: (1 * distance.x) + xMod,
        y: 1 * distance.y
      };

      if ((targetPt.x + newEntity.width) >= page.width) {
        //fail case
        targetPt = null;
        subloop = false;
        trying = false;
      }

      while (subloop) {
        if (_pointWithinDistanceOfPiece(targetPt, threshold, allEntities)) {
          targetPt.x += distance.x;
          targetPt.y += distance.y;
          if (targetPt.x + newEntity.width > page.width || targetPt.y + newEntity.height > page.height){
            xMod += Constants.CellDimensions.WIDTH;
            subloop = false;
          }
        } else {
          trying = false;
          subloop = false;
        }
      }
    }
    return targetPt;
  }

  function _pointWithinDistanceOfPiece(targetPt, threshold, allEntities){
    var isWithin = false;

    // False if:
    //   targetPt is within distance of any entity
    isWithin = _.some(allEntities, function (entity) {
      var dx = entity.x - targetPt.x;
      var dy = entity.y - targetPt.y;
      return ((dx * dx) + (dy * dy)) < (threshold * threshold);
    });

    /*
    _.each(allEntities, function(entity) {
      //horizontal test
      if ((targetPt.x >= (entity.x - distance.x)) && (targetPt.x <= (entity.x + entity.width + distance.x))) {
        //vertical test
        if ((targetPt.y >= (entity.y - distance.y)) && (targetPt.y <= (entity.y + entity.height + distance.y))) {
          isWithin = true;
        }
      }
    });
    */
    return isWithin;
  }

  function spawnTextEntity(event) {
    var textEntityURLs = {
      incDefault: 'images/textentity/icon-resize-plus.png',
      incActive: 'images/textentity/icon-resize-plus-down.png',
      decDefault: 'images/textentity/icon-resize-minus.png',
      decActive: 'images/textentity/icon-resize-minus-down.png'
    };

    var text = new TextEntity(null, textEntityURLs);
    var position = getDesiredClickSpawnPoint(text, TextEntity);
    text.x = position.x - (text.width / 2);
    text.y = position.y - (text.height / 2);

    page.addToWorkspace(text, MLC.Page.LayerNames.SELECTABLE_ENTITY);

    var selectEvent = new createjs.Event(MLC.Constants.SELECT_ENTITY_EVENT);
    selectEvent.set({
      ids: [text.id],
      add: false
    });
    MLC.Dispatcher.dispatchEvent(selectEvent);

    var constrainEntityEvent = new createjs.Event(MLC.Constants.CONSTRAIN_ENTITY_EVENT);
    constrainEntityEvent.set({
      skipAnimation: true,
      selectionBounds: text.getConstraintBounds()
    });
    text.display.dispatchEvent(constrainEntityEvent);

    MLC.Dispatcher.dispatchEvent(new createjs.Event(MLC.Constants.STAGE_UPDATE));

    var activationEvent = new createjs.Event(MLC.Constants.TEXT_TOOLS_SHOW);
    activationEvent.set({
      targetText: text
    });
    MLC.Dispatcher.dispatchEvent(activationEvent);
  }

  function _defaultLocalPoint() {
    var localPoint;
    var centerPoint = {
      x: -page.workspace.x,
      y: -page.workspace.y
    };
    if (centerPoint.x < 0) {
      centerPoint.x = 0;
    }
    if (centerPoint.y < 0) {
      centerPoint.y = 0;
    }
    localPoint = centerPoint;

    //localPoint.x += TRAY_SPAWN_PADDING;
    //localPoint.y += TRAY_SPAWN_PADDING;

    return localPoint;
  }

  function _getSelectionBounds(type, match) {
    var bounds = {
      x: undefined,
      y: undefined,
      width: undefined,
      height: undefined
    };

    var entities = _getSelection(type, match);

    bounds.x = _.min(entities, function(piece){
      return piece.x;
    }).x;

    bounds.y = _.min(entities, function(piece){
      return piece.y;
    }).y;

    var temp =  _.max(entities, function(piece){
      return piece.x + piece.width;
    });
    bounds.width = (temp.x + temp.width) - bounds.x;

    temp =  _.max(entities, function(piece){
      return piece.y + piece.height;
    });
    bounds.height = (temp.y + temp.height) - bounds.y;

    return bounds;
  }

  function _getCenterOfSelection(type, match) {
    var bounds = _getSelectionBounds(type, match);
    var center = {
      x: bounds.x + (bounds.width/2),
      y: bounds.y + (bounds.height/2)
    };
    return center;
  }

  function _flipSelection() {
    var entities = _getSelection();
    _.each(entities, function(entity){
      if (typeof entity.flip === 'function') {
        entity.flip();
      }
    });
  }

  // Pre:
  // - type: a constructor to match selectable entities against
  // - match: pass false to match NOT OF TYPE
  function _getSelection(type, match) {
    var selection = _.where(page.selectableEntities, { selected: true });
    if (type) {
      selection = _.filter(selection, function (entity) {
        var include = entity instanceof type;
        if (_.isBoolean(match) && !match) {
          include = !include;
        }
        return include;
      });
    }
    return selection;
  }

  function _toggleShadeVisibility(shade, showEvent, hideEvent) {
    shade.display.visible = !shade.display.visible;
    if (shade.display.visible) {
      MLC.Dispatcher.dispatchEvent(showEvent);
    } else {
      MLC.Dispatcher.dispatchEvent(hideEvent);
    }
    var focusEvent = new createjs.Event(MLC.Constants.FOCUS_ENTITY_EVENT);
    focusEvent.set({
      ids: [shade.id]
    });
    MLC.Dispatcher.dispatchEvent(focusEvent);
    MLC.Dispatcher.dispatchEvent(MLC.Constants.STAGE_UPDATE);
  }

  function _deleteSelectionPrompt() {
    var selectedGroup = _.where(page.selectableEntities, { selected: true });
    if (selectedGroup.length > 1) {
      MLC.Dialog.confirmMessage('Delete selected items?', '', deleteSelection);
    } else {
      deleteSelection();
    }
  }

  function _startOverPrompt(){
    MLC.Dialog.confirmMessage('Do you want to clear all your work?', 'Start Over?', function(){
      MLC.Dispatcher.dispatchEvent(new createjs.Event(MLC.Constants.START_OVER_EVENT));
    });
  }

  function deleteEntities(entities) {
    for (var i = 0; i < entities.length; i++) {
      page.selectableEntityLayer.removeChild(entities[i].display);
    }
    page.selectableEntities = _.difference(page.selectableEntities, entities);
  }

  function deleteSelection() {
    var entities = _.where(page.selectableEntities, {selected: true});
    deleteEntities(entities);
    updateSelection();
    MLC.Dispatcher.dispatchEvent(new createjs.Event(MLC.Constants.STAGE_UPDATE));
  }

  function startOver() {
    shades = {};
    buildShades();
    _.each(shades, function(shade) {
      page.addToWorkspace(shade, MLC.Page.LayerNames.WIDGET);
    });
    updateSelection();
    MLC.Dispatcher.dispatchEvent(MLC.Constants.DRAW_TOOLS_HIDE_EVENT);
    MLC.Dispatcher.dispatchEvent(new createjs.Event(MLC.Constants.TEXT_TOOLS_HIDE));
    MLC.Dispatcher.dispatchEvent(new createjs.Event(Constants.Events.START_OVER_DONE));
    MLC.Dispatcher.dispatchEvent(new createjs.Event(MLC.Constants.STAGE_UPDATE));
  }


  function duplicate() {
    var MOVE_AMT = 10;
    var selected = _.where(page.selectableEntities, {selected: true});
    var clones = [];

    var pieces = _.where(page.selectableEntities, function(thing) {
      return _.isFunction(thing.getGrid);
    });
    var selectedPieces = _.where(pieces, {selected: true});
    if (pieces.length + selectedPieces.length >= Constants.MONEYPIECELIMIT) {
      MLC.Dispatcher.dispatchEvent(new createjs.Event(Constants.Events.SPAWN_PIECE_FAILURE));
    } else {
      //clone all selected items
      _.each(selected, function (entity) {
        if (_.isFunction(entity.clone)) {
          var clone = entity.clone();
          clone.x += MOVE_AMT;
          clone.y += MOVE_AMT;
          page.addToWorkspace(clone, MLC.Page.LayerNames.SELECTABLE_ENTITY);
          clones.push(clone);
        }
      });

      //clear previous selection
      _.each(selected, function(thing) {
        thing.selected = false;
      });

      _.each(clones, function(thing) {
        thing.selected = true;
      });

      var ids = _.pluck(clones, 'id');
      var selectEvent = new createjs.Event(MLC.Constants.SELECT_ENTITY_EVENT);
      selectEvent.set({
        ids: ids,
        add: false
      });
      MLC.Dispatcher.dispatchEvent(selectEvent);
      MLC.Dispatcher.dispatchEvent(new createjs.Event(MLC.Constants.STAGE_UPDATE));
    }
  }

  function snapSelection() {
    var SNAP_THRESHOLD = 15;
    var SNAP_THRESHOLD_SQUARED = SNAP_THRESHOLD * SNAP_THRESHOLD;
    var ANIMATION_DURATION = 100;
    var minX, minY, minDistance;
    var selectedPoints = [];
    var selectedPieces = [];
    var unselectedPoints = [];

    //add in mode check
    if(mode === Constants.Modes.VALUE){
      _.each(page.selectableEntities, function(entity){
        if(_.isFunction(entity.getGrid)){
          //only money pieces
          var inGrid;
          if(entity.selected){
            inGrid = entity.getGrid();
            selectedPoints = _.union(selectedPoints, inGrid);
            selectedPieces.push(entity);
          } else {
            inGrid = entity.getGrid();
            unselectedPoints = _.union(unselectedPoints, inGrid);
          }
        }
      });

      //for each grid point in selected points
      _.each(selectedPoints, function(selPoint) {
        _.each(unselectedPoints, function(unselPoint) {

          var distance = _squaredDistance(selPoint, unselPoint);
          if ((distance < SNAP_THRESHOLD_SQUARED) && (_.isUndefined(minDistance) || (distance < minDistance))) {
            minX = unselPoint.x - selPoint.x;
            minY = unselPoint.y - selPoint.y;
            minDistance = distance;
          }

        });
      });

      if(_.isUndefined(minX)) {
        minX = 0;
        minY = 0;
      }

      if(_.isUndefined(minY)) {
        minX = 0;
        minY = 0;
      }

      //move all selected pieces
      _.each(selectedPieces, function(piece){
        var newX = piece.x + minX;
        var newY = piece.y + minY;

        createjs.Tween.get(piece)
          .to({ x: newX, y: newY }, ANIMATION_DURATION)
          .on('change', function(e) {
            MLC.Dispatcher.dispatchEvent(new createjs.Event(MLC.Constants.STAGE_UPDATE));
          });
      });
    }
  }

  function updateSelection() {
    var selectedEntities = _.where(page.selectableEntities, { selected: true });
    var selectedText = _.filter(selectedEntities, function (entity) {
      return entity instanceof TextEntity;
    });
    var selectedCurrency = _.filter(selectedEntities, function (entity) {
      // return entity instanceof MoneyPiece;
    });
    if (!selectedCurrency.length) {
      MLC.Dispatcher.dispatchEvent(Constants.Events.DISABLE_EXHANGE_POPUP);
      MLC.Dispatcher.dispatchEvent(Constants.Events.DISABLE_SELECTION_ROTATE);
      MLC.Dispatcher.dispatchEvent(Constants.Events.DISABLE_SELECTION_FLIP);
    } else {
      MLC.Dispatcher.dispatchEvent(Constants.Events.ENABLE_EXHANGE_POPUP);
      MLC.Dispatcher.dispatchEvent(Constants.Events.ENABLE_SELECTION_ROTATE);
      MLC.Dispatcher.dispatchEvent(Constants.Events.ENABLE_SELECTION_FLIP);
    }

    if (!selectedCurrency.length && !selectedText.length) {
      MLC.Dispatcher.dispatchEvent(Constants.Events.DISABLE_SELECTION_DUPLICATE);
      MLC.Dispatcher.dispatchEvent(Constants.Events.DISABLE_SELECTION_DELETE);
    } else {
      MLC.Dispatcher.dispatchEvent(Constants.Events.ENABLE_SELECTION_DUPLICATE);
      MLC.Dispatcher.dispatchEvent(Constants.Events.ENABLE_SELECTION_DELETE);
    }

    // Count the number coins with the target value to use.
    // var selectionValue = getSelectionValue();

    // var options = PieceOptions();
    // _.each(options, function (option, key) {
    //   var valueElement = $('#exchange-popout .exchange-value[data-value=' + key + ']');
    //   if (selectionValue < option.value) {
    //     valueElement.addClass('disabled');
    //   } else {
    //     valueElement.removeClass('disabled');
    //   }
    // });

    // prepareExchangePopout();
  }

  function getSelectionValue(){
    var selectedEntities = _.where(page.selectableEntities, { selected: true });

    var selectedCurrency = _.filter(selectedEntities, function (entity) {
      return entity instanceof MoneyPiece;
    });

    // Count the number coins with the target value to use.
    var selectionValue = _.reduce(selectedCurrency, function(memo, coin) {
      return memo + coin.value;
    }, 0);
    return selectionValue;
  }

  function _squaredDistance(myPoint, theirPoint) {
    var x = (theirPoint.x - myPoint.x) * (theirPoint.x - myPoint.x);
    var y = (theirPoint.y - myPoint.y) * (theirPoint.y - myPoint.y);
    return x + y;
  }

  function _moneyPieceSpawnFailurePrompt(){
    MLC.Dialog.showMessage('Please delete some pieces before adding more.', 'Too many pieces');
  }

  function _exchangeFailurePrompt(){
    MLC.Dialog.showMessage('Sorry, that will make too many money pieces. Please pick less money to exchange.', 'Too many pieces');
  }

});

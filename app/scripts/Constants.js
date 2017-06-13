define(function(){
  'use strict';

  var constants = {

  	START_OVER_SELECTOR: '#restart',
  	DUPLICATE_SELECTOR: '#duplicate',
  	ROTATE_SELECTOR: '#rotate',
  	TEXT_TOOLS_SELECTOR: '#text',
  	DRAW_TOOLS_SELECTOR: '#draw',
  	DELETE_SELECTOR: '#trash',

    Events: {
      TRIGGER_SELECTION_ROTATE: 'mvptriggerrotateselection',
      SELECTION_ROTATE: 'mvprotateselection',
      DISABLE_SELECTION_ROTATE: 'disableselectionrotate',
      ENABLE_SELECTION_ROTATE: 'enableselectionrotate',

      PIECE_ROTATE: 'mvprotatepiece',
      TRIGGER_PIECE_MODE_SWITCH: 'mvptriggermodeswitch',
      PIECE_MODE_SWITCH_VAL: 'mvpmodeswitchval',
      PIECE_MODE_SWITCH_CUR: 'mvpmodeswitchcur',
      PIECE_MODE_SWITCH: 'mvpmodeswitch',
      PIECE_MODE_TOGGLE: 'mvpmodetoggle',
      SPAWN_MONEY_PIECE: 'spawnmoneypiece',

      EXCHANGE_SELECTION: 'exchangeselection',

      REQUEST_START_OVER: 'requeststartover',
      START_OVER_DONE: 'startoverdone',

      TOGGLE_SHADE_QUESTION: 'toggleshadequestion',
      SHOW_SHADE_QUESTION: 'showshadequestion',
      HIDE_SHADE_QUESTION: 'hideshadequestion',

      TOGGLE_SHADE_HAND_LEFT: 'toggleshadehandleft',
      SHOW_SHADE_HAND_LEFT: 'showshadehandleft',
      HIDE_SHADE_HAND_LEFT: 'hideshadehandleft',

      TOGGLE_SHADE_HAND_RIGHT: 'toggleshadehandright',
      SHOW_SHADE_HAND_RIGHT: 'showshadehandright',
      HIDE_SHADE_HAND_RIGHT: 'hideshadehandright',

      TOGGLE_SHADE_POCKET: 'toggleshadepocket',
      SHOW_SHADE_POCKET: 'showshadepocket',
      HIDE_SHADE_POCKET: 'hideshadepocket',

      TOGGLE_SHADE_BANK: 'toggleshadebank',
      SHOW_SHADE_BANK: 'showshadebank',
      HIDE_SHADE_BANK: 'hideshadebank',

      EXCHANGE_POPUP_TOGGLE: 'exchangepopuptoggle',
      EXCHANGE_POPUP_SHOW: 'exchangepopupshow',
      EXCHANGE_POPUP_HIDE: 'exchangepopuphide',
      DISABLE_EXHANGE_POPUP: 'disableexchangepopup',
      ENABLE_EXHANGE_POPUP: 'enableexchangepopup',

      REQUEST_SELECTION_DUPLICATE: 'requestselectionduplicate',
      DISABLE_SELECTION_DUPLICATE: 'disableselectionduplicate',
      ENABLE_SELECTION_DUPLICATE: 'enableselectionduplicate',

      SELECTION_FLIP: 'selectionflip',
      DISABLE_SELECTION_FLIP: 'disableselectionflip',
      ENABLE_SELECTION_FLIP: 'enableselectionflip',

      SPAWN_TEXT_REQUEST: 'requestnewtext',

      TOGGLE_DRAW_TOOLS: 'toggledrawtools',
      SHOW_DRAW_TOOLS: 'showdrawtools',
      HIDE_DRAW_TOOLS: 'hidedrawtools',

      REQUEST_SELECTION_DELETE: 'requestselectiondelete',
      DISABLE_SELECTION_DELETE: 'disableselectiondelete',
      ENABLE_SELECTION_DELETE: 'enableselectiondelete',

      REQUEST_INFO: 'requestinfo',

      SHADE_QUESTION_MARK: 'shadequestionmark',
      SHADE_LEFT_HAND: 'shadelefthand',
      SHADE_RIGHT_HAND: 'shaderighthand',
      SHADE_P: 'shadepocket',
      SHADE_B: 'shadebank',

      SHADE_TOGGLE: 'shadetoggle',

      SPAWN_PIECE_FAILURE: 'failedspawningpiece',
      EXCHANGE_FAILURE: 'failedexchangingpieces'
    },

    UNIT_TYPE : {
      bar: 'bar',
      circle: 'circle'
    },

    Modes: {
      VALUE: 1,
      CURRENCY: 2
    },

    CellDimensions: {
      WIDTH: 30,
      HEIGHT: 30
    },

    SPAWN_PADDING_INC: 50,
    MONEYPIECELIMIT: 115

  };

  return constants;
});

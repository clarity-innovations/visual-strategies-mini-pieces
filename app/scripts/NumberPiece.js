define(function(require) {
  'use strict';

  var debug = false;

  var createjs = require('createjs');
  var _ = require('underscore-mix');
  var Constants = require('Constants');
  var MLC = require('mlc-mix');
  var Handle = require('mlcCore/Handle');
  var Loader = require('mlcCore/Loader');

  NumberPiece.prototype = Object.create(MLC.SelectableEntity.prototype);
  NumberPiece.prototype.constructor = MLC.SelectableEntity;

  //Constants
  var UNIT_TYPE = Constants.UNIT_TYPE;
  var RESIZE_HANDLE_WIDTH = 28;
  var ROTATE_HANDLE_WIDTH = 50;
  var HANDLE_PADDING = 0;

  var FRAGMENT_COLOR_ALPHA = 0.6;
  var FRAGMENT_UNCOLOR_ALPHA = 0.3;

  var FRAGMENT_TYPE = {
    bar: 'bar',
    arc: 'arc'
  };

  var LABEL_FRACTION_SPACING = 5;

  var CIRCLE_IN_RADIANS = 2*Math.PI;
  var CIRCLE_ROTATION_SNAP_THRESHOLD = parseInt(Math.random() * 3) + 3;
  var SELECTED_BORDER_COLOR = MLC.Constants.COLOR_PRIMARY_LIGHT;
  var DEBUG_COLORS = ['rgba(192,64,64,.6)','rgba(64,192,64,.6)','rgba(64,64,192,.6)'];

  var DEFAULT_PIECE_HEIGHT = 20;
  var DEFAULT_PIECE_WIDTH = 20;
  var DEFAULT_CIRCLE_RADIUS = 60;
  var MINIMUM_CIRCLE_RADIUS = 30;

  var HANDLE_R_IMAGE_URL = '';
  var HANDLE_L_IMAGE_URL = '';
  var HANDLE_ROTATE_IMAGE_URL = '';
  var HANDLE_STROKE_THICKNESS = 2;
  var HANDLE_OVERHANG = 70; // pixels

  var MANIFEST_KEY = 'fraction';
  var FRACTION_IMAGE_MANIFEST = [
    { src: 'images/counter/flip.png'},
    { src: 'images/counter/rotate.png'}
  ];

  Loader.defineManifest(MANIFEST_KEY, FRACTION_IMAGE_MANIFEST, '');
  Loader.loadManifest(MANIFEST_KEY).then(function () {
    HANDLE_R_IMAGE_URL = Loader.getResult(MANIFEST_KEY, 'images/counter/flip.png');
    HANDLE_L_IMAGE_URL = Loader.getResult(MANIFEST_KEY, 'images/counter/flip.png');
    HANDLE_ROTATE_IMAGE_URL = Loader.getResult(MANIFEST_KEY, 'images/counter/rotate.png');
  });

  var DEFAULT_BORDER_COLOR = 'black';
  var DIVISION_LINE_COLOR = 'black';
  var DEFAULT_FILL_COLOR = '';
  var BORDER_OUTER = 2;
  var BORDER_INNER = 1;
  var DIVISION_LINE_WIDTH = 1;
  var RESIZE_INCREMENT = 15;

  var CIRCLE_DEG = 360;

  var ORIENTATION_MOD = 4;

  /*
    options: {

    }
  */
  function NumberPiece(parent, options) {
    options = options || {};

    // options.movable = {
    //   selectable: true,
    //   mousedown: function(event) {
    //     if (this.isColoring) {
    //     } else {
    //       MLC.Interfaces.defaultSelectable.mousedown.call(this, event);
    //     }
    //   },
    //   pressmove: function(event) {
    //     if (this.isColoring) {
    //       this.colorFragments(event);
    //     } else {
    //       var firstParent = MLC.CanvasEntity.getFirstParentEntity(event.target);
    //       var isHandle = firstParent instanceof MLC.Handle;
    //       var isButton = firstParent instanceof MLC.Button;
    //       if (!isHandle && !isButton) {
    //         MLC.Interfaces.defaultSelectable.pressmove.call(this, event);
    //       }
    //     }
    //   },
    //   pressup: function(event) {
    //     if (this.isColoring) {
    //       if (this.colorUpdated) {
    //         this.colorUpdated = false;
    //       }
    //     } else {
    //       var firstParent = MLC.CanvasEntity.getFirstParentEntity(event.target);
    //       var isHandle = firstParent instanceof MLC.Handle;
    //       var isButton = firstParent instanceof MLC.Button;
    //       if (!isHandle && !isButton) {
    //         MLC.Interfaces.defaultSelectable.pressup.call(this, event);
    //       }
    //     }
    //   },
    //   moveentity: true
    // };

    options.movable = {
      selectable: true,
      mousedown: true,
      pressmove: true,
      pressup: true
    }

    options.focusable = true;

    MLC.SelectableEntity.call(this, parent, options);

    MLC.Interfaces.addInterfaces(this, this.display, { constrained: true });

    this.borderColor = options.borderColor || DEFAULT_BORDER_COLOR;
    this.back = new createjs.Shape();

    this.setupDisplay();
    this.bindDispatcherEvents();
  }

  NumberPiece.prototype.bindDispatcherEvents = function() {
    MLC.Dispatcher.on(Constants.Events.PIECE_ROTATE, this.rotate, this);
  };


  NumberPiece.prototype.setupDisplay = function() {
    this.display.addChild(this.back);
    this._registerAt([ this.back ], this.width / 2, this.height / 2);
  };


  NumberPiece.prototype._registerAt = function(children, x, y) {
    _.each(children, function(child) {
      child.regX = x;
      child.regY = y;
      child.x = x;
      child.y = y;
    });
  };

  // Creates a dictionary of handles that are used to resize the NumberPiece object.
  // There are two handles
  NumberPiece.prototype._createHandles = function (parent) {
    var handles = {};
    if (this.unitType === UNIT_TYPE.circle) {
      // Add rotation first so its radial line appears under left/right handles.
      handles.rotation = this._createRotationHandle(parent, HANDLE_ROTATE_IMAGE_URL);
    }
    handles.right = this._createHandle(parent, 'right', HANDLE_R_IMAGE_URL);
    handles.left = this._createHandle(parent, 'left', HANDLE_L_IMAGE_URL);

    return handles;
  };


  NumberPiece.prototype._createHandle = function(parent, side, img) {
    var fraction = this; // Pass NumberPiece
    var amountKeys = side.split(' ');
    var RESIZE_HANDLE_HITAREA_WIDTH = 34;

    var handle = new Handle(parent, {
      topmostParent: this.topmostParent,
      dimensions: {
        'width': RESIZE_HANDLE_WIDTH,
        'height': RESIZE_HANDLE_WIDTH
      },
      fillColor: 'rgba(0,0,0,0)',
      borderColor: 'rgba(0,0,0,0)',

      draw: {
        init: function () {
          var imageUrl = img;
          this.handleIcon = new createjs.Bitmap(imageUrl);
          var bounds = this.handleIcon.getBounds();
          this.handleIcon.regX = bounds.width/2;
          this.handleIcon.regY = bounds.height/2;

          _.scaleImage(this.handleIcon, {
            width: RESIZE_HANDLE_WIDTH - (HANDLE_PADDING * 2),
            height: RESIZE_HANDLE_WIDTH - (HANDLE_PADDING * 2)
          });
          this.display.addChild(this.handleIcon);
          this.hitShape = new createjs.Shape();
          this.hitShape.graphics.beginFill('black').drawRect(
            -RESIZE_HANDLE_HITAREA_WIDTH/2,
            -RESIZE_HANDLE_HITAREA_WIDTH/2,
            RESIZE_HANDLE_HITAREA_WIDTH,
            RESIZE_HANDLE_HITAREA_WIDTH);
          this.display.hitArea = this.hitShape;
        },

        callback: function (event) {
          this.display.visible = fraction.selected && !fraction.isColoring;
          var bounds = this.handleIcon.getBounds();
          this.handleIcon.regX = bounds.width/2;
          this.handleIcon.regY = bounds.height/2;
          if (fraction.unitType === UNIT_TYPE.bar) {
            this.handleIcon.rotation = fraction.angle;
          }
          this.hitShape.graphics.beginFill('black').drawRect(
            -RESIZE_HANDLE_HITAREA_WIDTH/2,
            -RESIZE_HANDLE_HITAREA_WIDTH/2,
            RESIZE_HANDLE_HITAREA_WIDTH,
            RESIZE_HANDLE_HITAREA_WIDTH
          );
        }
      },

      mousedown: function (event) {
      },
      pressmove: function (event) {
        var amountX = this.interactionState.deltaX;
        var amountY = this.interactionState.deltaY;
        var amounts = {};

        _.each(amountKeys, function (key) {
          var isHorizontal = (key === 'left' || key === 'right');
          isHorizontal = isHorizontal && (fraction.orientation !== 1 && fraction.orientation !== 3);

          switch (fraction.unitType) {
            case UNIT_TYPE.circle:
              amounts[key] = isHorizontal ? amountX : amountY;
              break;
            case UNIT_TYPE.bar:
              switch (fraction.orientation) {
                case 0: //0
                case 1: //90
                  amounts[key] = isHorizontal ? amountX : amountY;
                  break;
                case 2: //180
                case 3: //270
                amountX *= -1;
                amountY *= -1;
                amounts[key] = isHorizontal ? amountX : amountY;
              }
              break;
          }

        });

        fraction.resize(amounts);

        fraction.resizeFragments();
        fraction.draw();

        var currentSizeEvent = new createjs.Event(Constants.Events.FRACTION_UPDATE_CURRENT_SIZE);
        currentSizeEvent.set({
          unitType: fraction.unitType,
          size: fraction.width
        });
        MLC.Dispatcher.dispatchEvent(currentSizeEvent);
      },
      pressup: function (event) {
        fraction.resizeAmounts.right = 0;
        fraction.resizeAmounts.left = 0;
      }
    });

    this._placeHandle(handle, side);

    return { object: handle, side: side };
  };


  NumberPiece.prototype._createRotationHandle = function(parent, img){
    var fraction = this; // Pass NumberPiece

    var handle = new Handle(parent, {
      topmostParent: this.topmostParent,
      dimensions: {
        'width': ROTATE_HANDLE_WIDTH,
        'height': ROTATE_HANDLE_WIDTH
      },
      fillColor: 'rgba (196, 196, 196, 0.7)',
      borderColor: 'rgba(0,0,0,0)',

      draw: {
        init: function () {
          var imageUrl = img;
          this.handleIcon = new createjs.Bitmap(imageUrl);

          this.radial = new createjs.Shape();
          this.box = new createjs.Shape();
          this.display.hitArea = this.box;


          this.display.addChild(this.handleIcon, this.radial);

          this.display.x = fraction.width / 2;
          this.display.y = fraction.height / 2;
          this.handleIcon.regX = this.width / 2;
          this.handleIcon.regY = this.height / 2;
        },

        callback: function (event) {
          this.display.visible = fraction.selected && !fraction.isColoring;

          this.radial.graphics.clear();
          this.box.graphics.clear();
          this.handleIcon.visible = false;

          var handleOffset = -((fraction.height / 2) + HANDLE_OVERHANG);

          if (fraction.selected) {
            if (!this.handleIcon.width) {
              this.handleIcon.width = this.handleIcon.getBounds().width;
              this.handleIcon.height = this.handleIcon.width;
            }

            this.display.x = fraction.width / 2;
            this.display.y = fraction.height / 2;

            this.handleIcon.visible = true;
            this.handleIcon.regX = this.handleIcon.width / 2;
            this.handleIcon.regY = this.handleIcon.height / 2;
            this.handleIcon.x = 0;
            this.handleIcon.y = handleOffset + (this.height/2);
            this.handleIcon.rotation = -fraction.angle;

            this.box.regX = this.width / 2;
            this.box.regY = this.height / 2;
            this.box.x = 0;
            this.box.y = handleOffset + (this.height/2);
            this.box.graphics.clear()
              .beginFill('black')
              .drawEllipse(0, 0, this.width, this.height);
          }

          // Draw the radial line
          this.radial.graphics.setStrokeStyle(HANDLE_STROKE_THICKNESS)
            .setStrokeStyle(2)
            .beginStroke(MLC.Constants.COLOR_NEUTRAL_BASE)
            .moveTo(0, -(fraction.height / 2) - BORDER_OUTER)
            .lineTo(0, handleOffset + (this.height))
            .endStroke();
        }
      },

      mousedown: function (event) {
      },
      pressmove: function (event) {

        var origin = this.display.localToLocal(this.x, this.y, this.topmostParent.t);

        var prevPos = this.interactionState.previousPosition;
        var curPos = this.interactionState.currentPosition;
        var originalAngle = Math.atan2(origin.y - prevPos.y, origin.x - prevPos.x);
        var newAngle = Math.atan2(origin.y - curPos.y, origin.x - curPos.x);
        var angle = newAngle - originalAngle;
        angle *= MLC.Constants.RADIANS_TO_DEGREES; // Convert to degress
        fraction.angle += angle;

        fraction.draw();
      },
      pressup: function (event) {
        if(Math.abs(fraction.angle) <= CIRCLE_ROTATION_SNAP_THRESHOLD){
          fraction.angle = 0;
        }
        fraction.draw();
      }
    });

    return { object: handle};
  };


  NumberPiece.prototype._placeHandles = function() {
    _.each(this.handles, function (handle) {
      if (!_.isUndefined(handle.side)) {
        this._placeHandle(handle.object, handle.side);
      }
    }, this);
  };


  NumberPiece.prototype._placeHandle = function(handle, side) {
    // set x
    if (side.indexOf('left') >= 0) {
      switch (this.unitType) {
        case UNIT_TYPE.bar:
          switch (this.orientation) {
            case 0:
              handle.x = -(RESIZE_HANDLE_WIDTH/2) + (handle.width/2);
              break;
            case 2:
              handle.x = this.width - (RESIZE_HANDLE_WIDTH/2) + (handle.width/2);
              break;
            //vertical
            case 1:
            case 3:
              handle.x = (this.width/2)-(RESIZE_HANDLE_WIDTH/2) + (handle.width/2);
              break;
          }
          break;
        case UNIT_TYPE.circle:
          handle.x = -(RESIZE_HANDLE_WIDTH/2) + (handle.width/2);
          break;
      }
    }
    else if (side.indexOf('right') >= 0) {
      switch (this.unitType) {
        case UNIT_TYPE.bar:
          switch(this.orientation){
            case 0:
              handle.x = this.width -(RESIZE_HANDLE_WIDTH/2) + (handle.width/2);
              break;
            case 2:
              handle.x = -(RESIZE_HANDLE_WIDTH/2) + (handle.width/2);
              break;
            //vertical
            case 1:
            case 3:
              handle.x = (this.width/2)-(RESIZE_HANDLE_WIDTH/2) + (handle.width/2);
              break;
          }
          break;
        case UNIT_TYPE.circle:
          handle.x = this.width - (RESIZE_HANDLE_WIDTH/2) + (handle.width/2);
          break;
      }
    }
    else {
      // Should take up horizontal space between corner handles
      handle.x = RESIZE_HANDLE_WIDTH;
      handle.width = this.width - (RESIZE_HANDLE_WIDTH * 2);

      var hitShape = new createjs.Shape();
      hitShape.graphics.setStrokeStyle(handle.strokeThickness).beginStroke('#000');
      hitShape.graphics.beginFill('#000').drawRect(0, 0, handle.width, handle.height);
      // handle.display.hitArea = hitShape;
    }

    // set y
    switch (this.unitType) {
      case UNIT_TYPE.bar:
        switch (this.orientation) {
          case 0:
          case 2:
            handle.y = (this.height/2) - (RESIZE_HANDLE_WIDTH/2) + (handle.height/2);
            break;
          //vertical
          case 1:
            if (side.indexOf('left') >= 0) {
              handle.y = -(this.width/2) +(RESIZE_HANDLE_WIDTH/2) + (handle.width/2);
            } else {
              handle.y = (this.width/2) +(RESIZE_HANDLE_WIDTH/2) + (handle.width/2);
            }
            break;
          case 3:
          if (side.indexOf('left') >= 0) {
            handle.y = (this.width/2) +(RESIZE_HANDLE_WIDTH/2) + (handle.width/2);
          } else {
            handle.y = -(this.width/2) +(RESIZE_HANDLE_WIDTH/2) + (handle.width/2);
          }
            break;
        }
        break;
      case UNIT_TYPE.circle:
        handle.y = (this.height/2) - (RESIZE_HANDLE_WIDTH/2) + (handle.height/2);
        break;
    }

    var hitShape = new createjs.Shape();
    hitShape.graphics.setStrokeStyle(handle.strokeThickness).beginStroke('#000');
    hitShape.graphics.beginFill('#000').drawRect(0, 0, handle.width, handle.height);
    // handle.display.hitArea = hitShape;
  };


  function _getIntersection(point1, point2, circle) {
    // Get intersection:
    // dx = x2 - x1
    // dy = y2 - y1
    // dr = sqrt(dx^2 + dy^2)
    // D = x1*y2 - x2*y1
    // x = (D * dy +/- sign(dy) * dx * sqrt(r^2*dr^2 - D^2)) / (dr^2)
    // y = (-D * dx +/- abs(dy) * sqrt(r^2*dr^2 - D^2)) / (dr^2)
    var x1 = point1.x;
    var y1 = point1.y;
    var x2 = point2.x;
    var y2 = point2.y;
    var circleX = circle.x;
    var circleY = circle.y;
    var r = circle.radius;

    // Adjust points to circle's 0,0
    x1 -= circleX;
    x2 -= circleX;
    y1 -= circleY;
    y2 -= circleY;

    var dx = x2 - x1;
    var dy = y2 - y1;
    var dr = Math.sqrt(dx*dx + dy*dy);
    var D = (x1 * y2) - (x2 * y1);
    var sign = (dy < 0 ? -1 : 1);
    var x = {
      pos: ((D * dy) + (sign * dx * Math.sqrt(r*r * dr*dr - D*D))) / (dr*dr),
      neg: ((D * dy) - (sign * dx * Math.sqrt(r*r * dr*dr - D*D))) / (dr*dr)
    };
    var y = {
      pos: ((-D * dx) + (Math.abs(dy) * Math.sqrt(r*r * dr*dr - D*D))) / (dr*dr),
      neg: ((-D * dx) - (Math.abs(dy) * Math.sqrt(r*r * dr*dr - D*D))) / (dr*dr)
    };
    x.pos += circleX;
    x.neg += circleX;
    y.pos += circleY;
    y.neg += circleY;
    return {
      positive: { x: x.pos, y: y.pos },
      negative: { x: x.neg, y: y.neg }
    };
  }

  // @param amounts An object with the shift amounts to apply, if any,
  //                using the key as a direction identifier.
  //                Valid keys are: 'right' and 'left'.
  NumberPiece.prototype.resize = function(amounts) {
    if (_.isObject(amounts)) {

      if (_.isNumber(amounts.right)) {
        this.resizeAmounts.right += amounts.right;
      }
      if (_.isNumber(amounts.left)) {
        this.resizeAmounts.left += amounts.left;
      }

      var rightRemainder = this.resizeAmounts.right % RESIZE_INCREMENT;
      var leftRemainder = this.resizeAmounts.left % RESIZE_INCREMENT;
      if (this.resizeAmounts.right >= RESIZE_INCREMENT || this.resizeAmounts.right <= -RESIZE_INCREMENT) {
        this.shiftRight(this.resizeAmounts.right - rightRemainder);
        this.resizeAmounts.right = rightRemainder;
      }

      if (this.resizeAmounts.left >= RESIZE_INCREMENT || this.resizeAmounts.left <= -RESIZE_INCREMENT) {
        this.shiftLeft(this.resizeAmounts.left - leftRemainder);
        this.resizeAmounts.left = leftRemainder;
      }
      this._placeHandles();
      this._updateLabelPosition();
      this._updateLabelDraw();
      this._registerAt([ this.fragmentContainer, this.back ], this.width / 2, this.height / 2);

      this.display.dispatchEvent(Constants.Events.FRACTION_RESIZE);
    }
    else {
      // Amounts is not a legal parameter.
      _.log('Shade', 'resize', 'amounts is not an object.');
    }
  };


  NumberPiece.prototype.shiftRight = function(amount) {

    switch (this.unitType) {
      case Constants.UNIT_TYPE.bar:
        if (this.width + amount < MINIMUM_BAR_WIDTH) {
          amount = -this.width + MINIMUM_BAR_WIDTH;
        }
        switch (this.orientation) {
          case 0:
            this.width = this.width + amount;
            break;
          case 1:
            this.x = this.x - (amount/2);
            this.y = this.y + (amount/2);
            this.width = this.width + amount;
            break;
          case 2:
            this.x = this.x - (amount);
            this.width = this.width + amount;
            break;
          case 3:
            this.x = this.x - (amount/2);
            this.y = this.y - (amount/2);
            this.width = this.width + amount;
            break;
          default:
        }
        break;
      case Constants.UNIT_TYPE.circle:
        if (this.width + (amount * 2) <= MINIMUM_CIRCLE_RADIUS * 2) {
          amount = -this.width + MINIMUM_CIRCLE_RADIUS * 2;
          amount /= 2;
        }
        this.x = this.x - amount;
        this.y = this.y - amount;
        this.width = this.width + (amount * 2);
        this.height = this.width;
        break;
    }
  };


  NumberPiece.prototype.shiftLeft = function(amount) {
    switch (this.unitType) {
      case Constants.UNIT_TYPE.bar:
        if (this.width - amount < MINIMUM_BAR_WIDTH) {
          amount = this.width - MINIMUM_BAR_WIDTH;
        }

        switch (this.orientation) {
          case 0:
            this.x = this.x + amount;
            this.width = this.width - amount;
            break;
          case 1:
            this.x = this.x + (amount/2);
            this.y = this.y + (amount/2);
            this.width = this.width - amount;
            break;
          case 2:
            this.width = this.width - amount;
            break;
          case 3:
            this.x = this.x + (amount/2);
            this.y = this.y - (amount/2);
            this.width = this.width - amount;
            break;
        }
        break;
      case Constants.UNIT_TYPE.circle:
        if (this.width - (amount * 2) <= MINIMUM_CIRCLE_RADIUS * 2) {
          amount = this.width - MINIMUM_CIRCLE_RADIUS * 2;
          amount /= 2;
        }
        this.x = this.x + amount;
        this.y = this.y + amount;
        this.width = this.width - (amount * 2);
        this.height = this.width;
        break;
    }
  };


  NumberPiece.prototype.lineIntersectsLine = function(point1, point2, pointA, pointB) {
    var intersects = false;
    var denominator = ((point2.x - point1.x) * (pointB.y - pointA.y)) - ((point2.y - point1.y) * (pointB.x - pointA.x));
    var numerator1 = ((point1.y - pointA.y) * (pointB.x - pointA.x)) - ((point1.x - pointA.x) * (pointB.y - pointA.y));
    var numerator2 = ((point1.y - pointA.y) * (point2.x - point1.x)) - ((point1.x - pointA.x) * (point2.y - point1.y));

    if (denominator !== 0) {
      var r = numerator1 / denominator;
      var s = numerator2 / denominator;
      intersects = (r >= 0 && r <= 1) && (s >= 0 && s <= 1);
    }
    return intersects;
  };


  NumberPiece.prototype.draw = function() {
    this.back.graphics.clear();
    if (this.selected) {
      this.back.graphics.setStrokeStyle(BORDER_OUTER * 2).beginStroke(SELECTED_BORDER_COLOR);
    } else {
      this.back.graphics.setStrokeStyle(BORDER_OUTER).beginStroke(this.borderColor);
    }
    this.back.graphics.beginFill('#FBE33B');
    this.back.graphics.drawRect(0, 0, this.dimensions.width, this.dimensions.height);

    // _.each(this.handles, function (handle) {
    //   if (_.isUndefined(handle.side)) {
    //     handle.object.display.rotation = this.angle;
    //   }
    //   handle.object.draw();
    // }, this);
  };


  NumberPiece.prototype.getGrid = function() {
    var points = [];
    switch(this.unitType){
      case UNIT_TYPE.circle:
        points.push(this.display.localToGlobal(this.width / 2, this.height / 2));
        break;
      case UNIT_TYPE.bar:
        var center = {
          x: this.x + (this.width/2),
          y: this.y + (this.height/2)
        };

        var tempPoints = [];
        tempPoints.push(this.display.localToGlobal(0, 0));
        tempPoints.push(this.display.localToGlobal(this.width, 0));
        tempPoints.push(this.display.localToGlobal(this.width, this.height));
        tempPoints.push(this.display.localToGlobal(0, this.height));

        _.each(tempPoints, function(point){
          points.push(rotatePoint(center, point, this.angle));
        }, this);
        break;
      default:
        points.push(this.display.localToGlobal(0, 0));
        points.push(this.display.localToGlobal(this.width, 0));
        points.push(this.display.localToGlobal(this.width, this.height));
        points.push(this.display.localToGlobal(0, this.height));
    }

    return points;
  };

  function rotatePoint(center, point, angle){
    var ret = {};

    var radians = angle * (Math.PI/180); //convert to radians
    ret.x = Math.cos(radians) * (point.x - center.x) - Math.sin(radians) * (point.y-center.y) + center.x;
    ret.y = Math.sin(radians) * (point.x - center.x) + Math.cos(radians) * (point.y - center.y) + center.y;

    return ret;
  }

  NumberPiece.prototype.clone = function() {
    var f = new NumberPiece(null, {
      unitType: this.unitType,
      position: {
        x: this.x,
        y: this.y
      },
      dimensions: {
        width: this.width,
        height: this.height
      },
      fragmentCount: this.fragments.length,
      fragments: this.fragments,
      color: this.color,
      labelsOn: this.labelsOn,
      angle: this.angle,
      orientation: this.orientation
    });
    return f;
  };


  NumberPiece.prototype.rotate = function(event) {
    if (this.selected) {

      var center = event.center;
      // point: xy coord that you're rotating around
      if (!_.isUndefined(center) && !_.isUndefined(center.x) && !_.isUndefined(center.y)) {
        var point = {
          x: (this.x + this.width/2),
          y: (this.y + this.height/2)
        };

        var angle = 90 * (Math.PI/180); //convert to radians
        var rotatedX = Math.cos(angle) * (point.x - center.x) - Math.sin(angle) * (point.y-center.y) + center.x;
        var rotatedY = Math.sin(angle) * (point.x - center.x) + Math.cos(angle) * (point.y - center.y) + center.y;

        if (this.unitType === FRAGMENT_TYPE.bar) {
          this.orientation = (this.orientation + 1) % ORIENTATION_MOD;
        }
        this.angle = (this.angle + 90) % 360;

        //tween this?
        this.x = rotatedX - (this.width/2);
        this.y = rotatedY - (this.height/2);

        this._placeHandles();
        this.draw();

        MLC.Dispatcher.dispatchEvent(new createjs.Event(Constants.Events.UPDATE_WORKSPACE_DIM));
        MLC.Dispatcher.dispatchEvent(new createjs.Event(MLC.Constants.STAGE_UPDATE));
      }
    }
  };


  /**/
  Fragment.prototype = Object.create(MLC.CanvasEntity.prototype);
  Fragment.prototype.constructor = MLC.CanvasEntity;

  function Fragment(parent, options){
    options = options || {};

    MLC.CanvasEntity.call(this, parent, options);
    this.colored = _.isBoolean(options.colored) ? options.colored : false;
    this.color = options.color;
    this.hitAreaColor = options.color;
    this.type = options.fragmentType;
    this.range = options.range || {start:0, stop:0};

    this.shape = new createjs.Shape();
    this.display.addChild(this.shape);

    this.shape.hitArea = new createjs.Shape();
  }

  Fragment.prototype.setColor = function(colorToSet) {
    if (this.colored !== colorToSet) {
      this.colored = colorToSet;
      this.draw();
    }
  };

  Fragment.prototype.draw = function() {
    this.shape.graphics.clear();
    this.shape.graphics.setStrokeStyle(BORDER_INNER)
      .beginStroke(DEFAULT_BORDER_COLOR);
    if (this.colored) {
      this.shape.alpha = FRAGMENT_COLOR_ALPHA;
      this.shape.graphics.beginFill(this.color);
    } else {
      this.shape.alpha = FRAGMENT_UNCOLOR_ALPHA;
      this.shape.graphics.beginFill('white');
    }
    this.shape.hitArea.graphics.clear();
    this.shape.hitArea.graphics.setStrokeStyle(BORDER_INNER).beginFill(DEFAULT_BORDER_COLOR);

    switch (this.type) {
      case FRAGMENT_TYPE.bar:
        this.shape.graphics.drawRect(this.range.start, 0, (this.range.stop - this.range.start), this.height);
        this.shape.hitArea.graphics.drawRect(this.range.start, 0, (this.range.stop - this.range.start), this.height);
        break;
      case FRAGMENT_TYPE.arc:
        var p1 = { x: this.width/2 * Math.cos(this.range.start) + this.width/2, y: this.height/2 * Math.sin(this.range.start) + this.height/2 };
        var p2 = { x: this.width/2 * Math.cos(this.range.stop) + this.width/2, y: this.height/2 * Math.sin(this.range.stop) + this.height/2 };
        if (this.range.stop - this.range.start >= Math.PI * 2) {
          this.shape.graphics.drawEllipse(0, 0, this.width, this.height);
        } else {
          this.shape.graphics.moveTo(this.width/2, this.height/2)
            .lineTo(p1.x, p1.y)
            .arc(this.width/2, this.height/2, (this.width + this.height) / 4, this.range.start, this.range.stop)
            .lineTo(this.width/2, this.height/2);
        }
        //hitArea
        this.shape.hitArea.graphics.moveTo(this.width/2, this.height/2)
          .lineTo(p1.x, p1.y)
          .arc(this.width/2, this.height/2, (this.width + this.height) / 4, this.range.start, this.range.stop)
          .lineTo(this.width/2, this.height/2);
        break;
    }
  };


  return NumberPiece;
});

/* jshint bitwise: false */
define(['underscore', 'createjs'], function (_, createjs) {
  'use strict';

  _.mixin({

    log: function(className, functionName, description) {
      var shouldPrint = true;
      if (!_.isString(className)) {
        _.log('Underscore-Mix', 'log', 'className is not a string.');
        shouldPrint = false;
      }
      if (!_.isString(functionName)) {
        _.log('Underscore-Mix', 'log', 'functionName is not a string.');
        shouldPrint = false;
      }

      if (console && shouldPrint) {
        if (_.isString(description)) {
          console.trace(className + '[' + functionName + ']: ' + description);
        }
        else {
          console.trace(className + '[' + functionName + ']:');
          console.trace(description);
        }
      }
    },

    /**
     * Creates and returns a new event listener on `target` that listens for
     * the `type` event. When heard, it will call `handler`. The new event listener
     * is stored on `owner`, under the attribute `_eventListeners`. The listener
     * can be identified by a unique id, generated with a prefix of `uidPrefix`,
     * if passed.
     * <p>
     * If an error occurs while registering the event, the error will be logged
     * to the console, if possible.
     *
     * @param  owner      the owner of the event that will gain the _eventListeners
     *                    object, or whose _eventListeners object is extended.
     * @param  target     the createjs DisplayObject that will emit the event
     * @param  type       the event type of the listener
     * @param  handler    the function to call when the event is heard
     * @param  uidPrefix  (optional) a prefix to add to the globally-unique id
     *                    generated for the new listener
     * @return the newly created listener
     */
    registerEvent: function(owner, target, type, handler, uidPrefix) {
      try {
        var newListenerRecord = {
          target: target,
          type: type,
          listener: target.on(type, handler, owner)
        };

        var uid = _.uniqueId(uidPrefix);

        // Check if the owning object already has _eventListeners as an object.
        if (_.isUndefined(owner._eventListeners)) {
          owner._eventListeners = {};
        }
        else {
          owner._eventListeners[uid] = newListenerRecord;
          return newListenerRecord.listener;
        }
      }
      catch (error) {
        _.log('Underscore-Mix', 'registerEvent', error);
      }
    },

    unregisterListener: function(owner, targetListener) {
      _.each(owner._eventListeners, function(listenerRecord, key) {
        if (listenerRecord.listener === targetListener) {
          listenerRecord.target.off(listenerRecord.type, listenerRecord.listener);
          delete owner._eventListeners[key];
        }
      });
    },


    /**
     * Scales the specified image to the specified dimensions.
     *
     * @img: a createjs bitmap object
     * @dimensions: an object describing the required dimensions of the bitmap
     *              dimensions: {
     *                width: int,
     *                height: int
     *              }
     */
    scaleImage: function(image, dimensions, maintainRatio) {
      var imageExists = image && _.isFunction(image.getBounds);
      var dimensionsExist = dimensions && _.isNumber(dimensions.width) && _.isNumber(dimensions.height);
      var shouldScale = imageExists && dimensionsExist;
      var hasBounds = false;

      if (!imageExists) {
        _.log('Underscore-Mix', 'scaleImage', 'Image has no function \'getBounds\'');
      } 
      if (!dimensionsExist) {
        _.log('Underscore-Mix', 'scaleImage', 'Dimension has no width or height.');
      }

      if (shouldScale) {
        var bounds = image.getBounds();
        var scaleX = image.scaleX;
        var scaleY = image.scaleY;
        hasBounds = !!bounds;
        if (hasBounds) {
         if (maintainRatio) {
            var scaleWidth = dimensions.width / bounds.width;
            var scaleHeight = dimensions.height / bounds.height;
            scaleX = scaleY = Math.min(scaleWidth, scaleHeight);
          } else {
            scaleX = dimensions.width / bounds.width;
            scaleY = dimensions.height / bounds.height;
          }
        }
        if (!_.isUndefined(image) && !_.isUndefined(dimensions)) {
          image.scaleX = scaleX;
          image.scaleY = scaleY;
        }
      }

      if (!shouldScale || !hasBounds) {
        _.log('Underscore-Mix', 'scaleImage', 'Failed to scale image.');  
      }
    },


    localHitTest: function(displayObject, event) {
      return displayObject.hitTest(event.localX, event.localY);
    },


    /**
     * Utility function for calculating angles of lines. Converts to degrees.
     * Borrowed from Pattern Shapes.
     */
    calcAngle: function(x1, x2, y1, y2) {
      var angle = Math.atan2(y1 - y2, x2 - x1) * (180/Math.PI);
      return angle < 0 ? Math.abs(angle) : 360 - angle;
    },


    moonPhase: function (y, m, d) {
      /*
       calculates the moon phase (0-7), accurate to 1 segment.
       0 = > new moon.
       4 => full moon.
       */

      var c,e; // int
      var jd; // double
      var b; // int

      if (m < 3) {
        y--;
        m += 12;
      }
      ++m;
      c = parseInt(365.25*y);
      e = parseInt(30.6*m);
      jd = c+e+d-694039.09;  /* jd is total days elapsed */
      jd /= 29.53;           /* divide by the moon cycle (29.53 days) */
      b = parseInt(jd);      /* int(jd) -> b, take integer part of jd */
      jd -= b;       /* subtract integer part to leave fractional part of original jd */
      b = parseInt(jd*8 + 0.5);    /* scale fraction from 0-8 and round by adding 0.5 */
      b = parseInt(b & 7);       /* 0 and 8 are the same so turn 8 into 0 */
      return b;
    },

    deepClone: function(thing){
      var clone;
      if(!_.isObject(thing)){
        clone = _.clone(thing);
      } else {
        //it's an object
        clone = {};
        var keys = _.keys(thing);
        _.each(keys, function(key){
          clone[key] = _.deepClone(thing[key]);
        });
      }
      return clone;
    }

  });

  return _;
});

(function() {
  var DEFAULT_SAMPLE, DEFAULT_SIZE, INVALID_SAMPLE, INVALID_SIZE, INVALID_URL, MAX_ROTATION, MAX_SAMPLE, MAX_SIZE, MIN_ROTATION, MIN_SAMPLE, MIN_SIZE, QUANT_WORKER, STATE_INITIAL, STATE_LOADED, STATE_LOADING, STATE_WAITING, STEP_SAMPLE, STEP_SIZE, colorsElem, createColor, frameElem, getPixels, imageElem, init, initControls, initDialog, initImage, initParams, processImage, rgbToHex, rotation, sampleParam, setMessage, setState, showColors, sizeElem, sizeParam, sizeValueElem, urlElem, urlParam, wrapperElem;
  QUANT_WORKER = 'scripts/neuquant.worker.min.js';
  STATE_INITIAL = 'initial';
  STATE_WAITING = 'waiting';
  STATE_LOADING = 'loading';
  STATE_LOADED = 'loaded';
  INVALID_URL = '';
  INVALID_SAMPLE = 0;
  DEFAULT_SAMPLE = 1;
  MIN_SAMPLE = 1;
  MAX_SAMPLE = 30;
  STEP_SAMPLE = 1;
  INVALID_SIZE = 0;
  DEFAULT_SIZE = 16;
  MIN_SIZE = 8;
  MAX_SIZE = 64;
  STEP_SIZE = 1;
  MIN_ROTATION = 5;
  MAX_ROTATION = 10;
  wrapperElem = null;
  frameElem = null;
  imageElem = null;
  colorsElem = null;
  urlElem = null;
  sizeElem = null;
  sizeValueElem = null;
  urlParam = INVALID_URL;
  sampleParam = INVALID_SAMPLE;
  sizeParam = INVALID_SIZE;
  init = function() {
    initParams();
    initControls();
    if (sampleParam !== INVALID_SAMPLE && sizeParam !== INVALID_SIZE) {
      initImage(urlParam, true);
      return setState(STATE_INITIAL);
    } else {
      initDialog(urlParam, true);
      initImage(urlParam, false);
      return setState(STATE_WAITING);
    }
  };
  initControls = function() {
    wrapperElem = document.getElementById('wrapper');
    frameElem = document.getElementById('frame');
    imageElem = document.getElementById('image');
    colorsElem = document.getElementById('colors');
    urlElem = document.getElementById('url');
    sizeElem = document.getElementById('size');
    return (sizeValueElem = document.getElementById('sizevalue'));
  };
  initParams = function() {
    urlParam = decodeURIComponent(Query.url || ("" + (INVALID_URL)));
    sampleParam = parseInt(decodeURIComponent(Query.sample || ("" + (INVALID_SAMPLE))));
    sizeParam = parseInt(decodeURIComponent(Query.size || ("" + (INVALID_SIZE))));
    if (sampleParam === INVALID_SAMPLE || sampleParam < MIN_SAMPLE || sampleParam > MAX_SAMPLE) {
      sampleParam = DEFAULT_SAMPLE;
    }
    return sizeParam === INVALID_SIZE || sizeParam < MIN_SIZE || sizeParam > MAX_SIZE ? (sizeParam = INVALID_SIZE) : undefined;
  };
  initDialog = function(url, listen) {
    urlElem.value = url;
    sizeElem.min = MIN_SIZE;
    sizeElem.max = MAX_SIZE;
    sizeElem.step = STEP_SIZE;
    sizeElem.value = DEFAULT_SIZE;
    if (listen) {
      sizeElem.addEventListener('change', function(event) {
        return (sizeValueElem.textContent = event.target.value);
      }, true);
    }
    return Utils.fireEvent(sizeElem, 'change');
  };
  initImage = function(url, listen) {
    var deg;
    deg = rotation(MIN_ROTATION, MAX_ROTATION);
    frameElem.style.cssText = ("-webkit-transform: rotate(" + (deg) + "deg)");
    if (listen) {
      imageElem.addEventListener('load', function(event) {
        return processImage(event.target);
      }, true);
    }
    return (imageElem.src = url);
  };
  rotation = function(min, max) {
    var sign;
    sign = Math.floor(Math.random() * 2) ? 1 : -1;
    return sign * (Math.random() * (max - min) + min);
  };
  setState = function(state) {
    var msg;
    wrapperElem.className = state;
    msg = chrome.i18n.getMessage("msg_" + (state));
    return (msg != null) ? setMessage(msg) : undefined;
  };
  setMessage = function(msg) {
    frameElem.title = msg;
    return (imageElem.alt = msg);
  };
  processImage = function(image) {
    var worker;
    setState(STATE_LOADING);
    worker = new Worker(QUANT_WORKER);
    worker.onmessage = (function(event) {
      var data;
      data = event.data;
      switch (data.type) {
        case 'log':
          return (typeof console !== "undefined" && console !== null) ? console.log(data.message) : undefined;
        case 'palette':
          showColors(data.palette);
          return setState(STATE_LOADED);
      }
    });
    worker.onerror = (function(event) {
      throw new Error("" + (event.message) + " (" + (event.filename) + ":" + (event.lineno) + ")");
    });
    return worker.postMessage({
      'type': 'quantize',
      'pixels': getPixels(image),
      'sample': sampleParam,
      'colors': sizeParam
    });
  };
  getPixels = function(image) {
    var canvas, context;
    canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    context = canvas.getContext('2d');
    context.drawImage(image, 0, 0);
    return context.getImageData(0, 0, canvas.width, canvas.height).data;
  };
  showColors = function(palette) {
    var _ref, b, color, fragment, g, i, l, len, r;
    fragment = document.createDocumentFragment();
    len = palette.length >> 2;
    _ref = len - 1;
    for (l = 0; (0 <= _ref ? l <= _ref : l >= _ref); (0 <= _ref ? l += 1 : l -= 1)) {
      i = l << 2;
      r = palette[i];
      g = palette[i + 1];
      b = palette[i + 2];
      color = createColor(r, g, b);
      fragment.appendChild(color);
    }
    while (colorsElem.hasChildNodes()) {
      colorsElem.removeChild(colorsElem.firstChild);
    }
    return colorsElem.appendChild(fragment);
  };
  createColor = function(r, g, b) {
    var hex;
    hex = rgbToHex(r, g, b);
    return Utils.createElement({
      'tagName': 'li',
      'className': 'color',
      'childNodes': [
        {
          'tagName': 'div',
          'className': 'strip',
          'cssText': ("background-color: rgb(" + (r) + ", " + (g) + ", " + (b) + ")")
        }, {
          'tagName': 'div',
          'className': 'info',
          'childNodes': [
            {
              'tagName': 'p',
              'textContent': ("RGB: " + (r) + ", " + (g) + ", " + (b))
            }, {
              'tagName': 'p',
              'textContent': ("HEX: #" + (hex))
            }
          ]
        }
      ]
    });
  };
  rgbToHex = function(r, g, b) {
    var hex;
    hex = (r << 16) | (g << 8) | (b);
    hex = hex.toString(16).toUpperCase();
    while (hex.length < 6) {
      hex = ("0" + (hex));
    }
    return hex;
  };
  window.addEventListener('load', init, true);
}).call(this);

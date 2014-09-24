var _ua             = navigator.userAgent.toLowerCase();
var DEBUG           = true;
var IS_ANDROID      = _ua.indexOf('android') >= 0;
var IS_IPHONE       = navigator.userAgent.match(/iPhone/i) || navigator.userAgent.match(/iPod/i);
var RAPPAD_API_PATH = window.RAPPAD_API_PATH = DEBUG ? 'http://localhost:3000/api' : 'http://www.rappad.co/api';

if (IS_ANDROID && DEBUG) {
  RAPPAD_API_PATH = 'http://10.0.3.2:3000/api';
}

window.debug = function debug(message) {
  if (DEBUG) {
    $('#debug_console').show();
    $('#debug_console').html( message );
  }
}

function showLoader(message) {
  message = message || 'Loading...';

  // Do not append multiple loaders
  if ($('#loader').length != 0) {
    $('#loader').find('p').text(message);
    return;
  }

  var loaderHtml = $('#v-loader').html();
  $('.content').prepend( loaderHtml );
  setTimeout(function() {
    $('#loader').addClass('animate-in');
    $('#loader').find('p').text(message);
  }, 1);
}

function hideLoader() {
  $('#loader').addClass('animate-out');
  $('#loader').one('webkitTransitionEnd', function() {
    $('#loader').remove();
  });
}

// Conveniance method for navigation
// Suitable for most use cases
function navigateRight(url) {
  Jr.Navigator.navigate(url, {
    trigger: true,
    animation: {
      type: Jr.Navigator.animations.SLIDE_STACK,
      direction: Jr.Navigator.directions.LEFT
    }
  });
}

function navigateLeft(url) {
  Jr.Navigator.navigate(url, {
    trigger: true,
    animation: {
      type: Jr.Navigator.animations.SLIDE_STACK,
      direction: Jr.Navigator.directions.RIGHT
    }
  });
}

function capitalize(word) {
  if (typeof(word) != 'string' || word.length === 0) return word;
  var firstLetter = word.charAt(0);
  return firstLetter.toUpperCase() + word.substring(1);
}

function buildErrorMessage(validationErrors) {
  // The key is the attribute that was invalid.
  // The value an array of errors with that attribute.
  var errors = [];
  for (key in validationErrors) {
    _(validationErrors[key]).each(function(element, index, list) {
      // A little helper for lyrics.
      if (key === 'lyrics') {
        element = element.replace('is too short', 'are too short');
      }
      errors.push( capitalize(key) + ' ' + element );
    });
  }
  return errors.join('. ');
}

// Generate a pseudo-GUID by concatenating random hexadecimal.
function genLocalRapId() {
  var hex4 = function() {
   return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
  }

  return ['L', hex4(), hex4(), '-',
    hex4(), '-',
    hex4(), '-',
    hex4(), '-',
    hex4(), hex4(), hex4()].join('');
};

(function($){
  $.extend($.fn, {
    enable: function(){
      return this.removeAttr('disabled').removeClass('disabled');
    },

    disable: function() {
      return this.attr('disabled', 'disabled').addClass('disabled');
    }
  })
})(jQuery);

// Change Backbone/Underscore templating defaults
_.templateSettings = {
  interpolate: /\{\{(.+?)\}\}/g
};

// Append authentication details to each request, if possible.
$.ajaxSetup({
  beforeSend: function(xhr, options) {
    if (App.userLoggedIn()) {
      // GET request will need the params in the URL.
      // ajaxBeforeSend fires AFTER the serialization check happens, so we manually do it here.
      if (options.type.toUpperCase() === 'GET' || options.type.toUpperCase() === 'DELETE') {
        var appendChar = options.url.indexOf('?') >= 0 ? '&' : '?';
        options.url = [options.url,
          appendChar,
          $.param({ user_token: App.getToken(), user_email: App.getEmail() })
        ].join('');
      } else {
        // Handle PUT and POST
        if (options.data) {
          try {
            options.data = JSON.parse(options.data);
            options.data['user_token'] = App.getToken();
            options.data['user_email'] = App.getEmail();
            options.data = JSON.stringify(options.data);
          } catch (ex) {}
        }
      }
    }
  },
});

var DEBUG           = true;
var RAPPAD_API_PATH = DEBUG ? 'http://localhost:3000/api' : 'http://www.rappad.co/api';

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

(function($){
  $.extend($.fn, {
    enable: function(){
      return this.removeAttr('disabled').removeClass('disabled');
    },

    disable: function() {
      return this.attr('disabled', 'disabled').addClass('disabled');
    }
  })
})(Zepto);

// Change Backbone/Underscore templating defaults
_.templateSettings = {
  interpolate: /\{\{(.+?)\}\}/g
};

// Append authentication details to each request, if possible.
$(document).on('ajaxBeforeSend', function(e, xhr, options) {
  if (App.userLoggedIn()) {
    // GET request will need the params in the URL.
    // ajaxBeforeSend fires AFTER the serialization check happens, so we manually do it here.
    if (options.type.toUpperCase() === 'GET') {
      var appendChar = options.url.indexOf('?') >= 0 ? '&' : '?';
      options.url = [options.url,
        appendChar,
        $.param({ user_token: App.getToken(), user_email: App.getEmail() })
      ].join('');
    } else {
      if (options.data) {
        _.extend(options.data, {
          'user_token': App.getToken(),
          'user_email': App.getEmail(),
        });
      } else {
        _.extend(options, {
          data: {
            'user_token': App.getToken(),
            'user_email': App.getEmail(),
          }
        });
      }
    }
  }
});

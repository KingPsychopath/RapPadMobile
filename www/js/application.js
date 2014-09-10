var DEBUG           = true;
var RAPPAD_API_PATH = DEBUG ? 'http://localhost:3000/api' : 'http://www.rappad.co/api';

var App = {
  setToken: function(token) {
    localStorage.setItem('auth_token', token);
  },

  getToken: function() {
    return localStorage.getItem('auth_token');
  },

  setEmail: function(email) {
    localStorage.setItem('user_email', email);
  },

  getEmail: function() {
    return localStorage.getItem('user_email');
  },

  userLoggedIn: function() {
    return !_.isEmpty(App.getToken()) && !_.isEmpty(App.getEmail());
  },

  markFirstTime: function() {
    localStorage.setItem('first_time', true);
  },

  isFirstTime: function() {
    return localStorage.getItem('first_time') != null
  },
};

var LoginView = Jr.View.extend({
  events: {
    'click #sign-in': 'onSignIn',
    'click #sign-up': 'onSignUp'
  },

  render: function() {
    this.$el.html( $('#v-login').html() )
    return this;
  },

  onSignIn: function() {
    navigateRight('/sign-in');
  },

  onSignUp: function() {
    navigateRight('/sign-up');
  },
});

var LoginAuthView = Jr.View.extend({
  events: {
    'click #prev-btn': 'onBack',
    'click #login': 'login',
  },

  render: function() {
    this.$el.html( $('#v-login-auth').html() );
    return this;
  },

  login: function() {
    $('#login').disable();
    $('#login').find('i').removeClass('fa-chevron-right').addClass('fa-spinner fa-spin');

    $.ajax({
      url: RAPPAD_API_PATH + '/sessions/sign_in',
      type: 'POST',
      data: {
        login: $('#login-name').val(),
        password: $('#login-password').val()
      },
      success: function(response) {
        var userEmail = response.email;
        var userToken = response.auth_token;

        App.setEmail(userEmail);
        App.setToken(userToken);

        Jr.Navigator.navigate('/dashboard', {
          trigger: true,
          animation: {
            type: Jr.Navigator.animations.SLIDE_STACK,
            direction: Jr.Navigator.directions.LEFT
          }
        });
      },
      error: function() {
        $('.error-message').show();
      },
      complete: function() {
        $('#login').enable();
        $('#login').find('i').removeClass('fa-spinner fa-spin').addClass('fa-chevron-right');
      }
    });
  },

  onBack: function() {
    Jr.Navigator.navigate('/', {
      trigger: true,
      animation: {
        type: Jr.Navigator.animations.SLIDE_STACK,
        direction: Jr.Navigator.directions.RIGHT
      }
    });
  },
});

var RapEntryView = Backbone.View.extend({
  template: _.template($('#v-rap').html()),
  render: function() {
    this.$el.html(this.template(this.model.attributes));
    return this;
  },
});

var RapShowView = Jr.View.extend({
  template: _.template($('#v-rap-show').html()),
  events: {
    'click .prev-btn': 'onBack',
  },

  onBack: function() {
    // Just go back in the stack since this can be shown from Dashboard, Explore, or Cypher
    window.history.back();
  },

  render: function() {
    this.$el.html(this.template(this.model.attributes));
    return this;
  },
});

var RapEditorView = Backbone.View.extend({
  template: _.template($('#v-editor').html()),
  events: {
  },
  onBack: function() {
    navigateLeft('/dashboard');
  },
});

var DashboardView = Jr.View.extend({
  page: 0,
  limit: 25,
  raps_shown: 0,

  events: {
    'click .show-more': 'showMore',
    'click .edit': 'editRap',
  },

  editRap: function(evt) {
    var rapId = $(evt.currentTarget).data('rap-id');
    navigateRight('/raps/' + rapId);
  },

  showMore: function() {
    showLoader();
    this.page++;
    var self = this;
    $.ajax({
      url: RAPPAD_API_PATH + '/raps',
      type: 'GET',
      data: { page: this.page, limit: this.limit },
      success: function(response) {
        _(response.raps).each(function(rapJson, index, list) {
          var rap       = new Rap(rapJson);
          var rapDate   = new Date(rapJson.created_at);

          // Prettify some values
          rap.set('word_count', rapJson.lyrics.split(' ').length + ' words');
          rap.set('pretty_date', rapDate.toDateString());

          rapView = new RapEntryView({ model: rap });
          rapView.render();
          $('.dashboard-raps').append(rapView.el);

          self.raps_shown++;

          if (self.raps_shown >= response.total_raps) {
            $('.show-more').hide();
          }
        });
      },
      complete: hideLoader
    });

  },

  render: function() {
    this.$el.html( $('#v-dashboard').html() )
    $('.show-more').hide();

    // Instantly show all drafts
    var self = this;
    draftCollection.fetch();

    // Retrieve server-side raps
    $('.dashboard-sync').addClass('active');
    $('.dashboard-sync').text('Loading your raps...');
    $.ajax({
      url: RAPPAD_API_PATH + '/raps',
      type: 'GET',
      data: {
        limit: this.limit,
        page: this.page
      },
      success: function(response) {
        _(response.raps).each(function(rapJson, index, list) {
          var rap       = new Rap(rapJson);
          var rapDate   = new Date(rapJson.created_at);

          // Prettify some values
          rap.set('word_count', rapJson.lyrics.split(' ').length + ' words');
          rap.set('pretty_date', rapDate.toDateString());

          rapView = new RapEntryView({ model: rap });
          rapView.render();
          $('.dashboard-raps').append(rapView.el);

          self.raps_shown++;
        });

        if (response.raps.length < response.total_raps) {
          // Allow pagination
          $('.show-more').show();
        }
      },
      complete: function() {
        $('.dashboard-sync').removeClass('active');
      }
    });

    return this;
  },
});

var AppRouter = Jr.Router.extend({
  routes: {
    '': 'root',
    'dashboard': 'dashboard',
    'sign-in': 'signIn',
    'raps/:id': 'rapShow',
    'editor/(:id)': 'editor'
  },

  root: function() {
    this.renderView(new LoginView());
  },

  rapShow: function(id) {
    showLoader();
    var self = this;
    $.ajax({
      url: RAPPAD_API_PATH + '/raps/' + id,
      type: 'GET',
      success: function(response) {
        var rap = new Rap(response);
        self.renderView(new RapShowView({ model: rap }));
      },
      complete: hideLoader
    });
  },

  editor: function(id) {
    if (id) {
      // A rap
      showLoader();
      var self = this;
      $.ajax({
        url: RAPPAD_API_PATH + '/raps/' + id,
        type: 'GET',
        success: function(response) {
          var rap = new Rap(response);
          self.renderView(new RapEditorView({ model: rap }));
        },
        complete: hideLoader
      });
    } else {
      // A local rap
    }
  },

  signIn: function() {
    this.renderView(new LoginAuthView());
  },

  dashboard: function() {
    this.renderView(new DashboardView());
  },
});

Zepto(function($) {
  var appRouter = window.appRouter = new AppRouter();
  Backbone.history.start();

  // Skip the home page, go straight to dashboard if user is logged in.
  if (App.userLoggedIn()) {
    Jr.Navigator.navigate('/dashboard', { trigger: true });
  }
});

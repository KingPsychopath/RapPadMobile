/*
  This file contains the views and their respective logic
*/

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
    return localStorage.getItem('first_time') != null;
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
    'click #prev-btn'     : 'onBack',
    'click #editor-save'  : 'onSave',
    'keyup #editor-title' : 'onUpdate',
    'keyup #editor-text'  : 'onUpdate',
  },
  mode: '',
  initialize: function() {
    if (this.model.get('id').toString().charAt(0) === 'L') {
      this.mode = 'LOCAL';
    } else {
      this.mode = 'SERVER';
    }
  },

  render: function() {
    this.$el.append( this.template(this.model.attributes) );
    this.$el.find('#editor-title').val( this.model.get('title') );
    this.$el.find('#editor-text').val( this.model.get('lyrics') );
    return this;
  },

  onUpdate: function() {
    var title   = this.$el.find('#editor-title').val();
    var lyrics  = this.$el.find('#editor-text').val();
    this.model.set({
      title: title,
      lyrics: lyrics,
    });
  },

  onSave: function() {
    var view = this;
    showLoader();
    if (this.mode === 'LOCAL') {
      this.model.save();
      hideLoader();
      navigateLeft('/dashboard');
    } else if (this.mode === 'SERVER') {
      // Server side we add callbacks. These callbacks aren't fired for a local rap.
      this.model.save(null, {
        success: function(model, response, options) {
          hideLoader();
          navigateLeft('/dashboard');
        },
        error: function(model, response, options) {
          hideLoader();
          var errorJson = JSON.parse(response.responseText);
          var errorMessage = '';

          view.$el.find('.editor-error').addClass('active');

          if (errorJson.error && typeof(errorJson.error) === 'object') {
            // Validation errors
            errorMessage = buildErrorMessage( errorJson.error );
          } else {
            errorMessage = errorJson.error;
          }

          view.$el.find('.editor-error span')
            .text('Your rap was not saved. This was the error: ' + errorMessage);

          // Hide the error message after a little while.
          setTimeout(function() {
            view.$el.find('.editor-error').removeClass('active');
          }, 3000);
        },
      });
    }
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
    'click .show-more' : 'showMore',
    'click .edit'      : 'editRap',
    'click .sync-btn'  : 'syncRaps',
    'click .write-btn' : 'newRap',
  },

  syncRaps: function() {
    // TODO: Sends all drafts to the server
    this.$el.find('.sync-btn i').addClass('fa-spin').disable();
    this.$el.find('.sync-btn').enable();
    setTimeout(function() {
      this.$el.find('.sync-btn i').removeClass('fa-spin');
      this.$el.find('.sync-btn').enable();
    }.bind(this), 2000);
  },

  newRap: function(evt) {
    navigateRight('/editor');
  },

  editRap: function(evt) {
    var rapId = $(evt.currentTarget).data('rap-id');
    navigateRight('/editor/' + rapId);
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
        // Add the new raps to the collection
        _(response).each(function(element, index, list) {
          var rap = new Rap(element);
          rapView = new RapEntryView({ model: rap });
          rapView.render();
          rapCollection.add(rap)

          $('#server-raps').append(rapView.el);
          self.raps_shown++;
        });

        // If less then 25 results, then there can't be anymore to show
        // If it is 25, then there can potentially be more
        if (response.length < self.limit) {
          $('.show-more').hide();
        }
      },
      complete: hideLoader
    });

  },

  render: function() {
    this.$el.html( $('#v-dashboard').html() );

    this.$el.find('.show-more').hide();
    this.$el.find('.dashboard-tip').hide();

    var self = this;
    draftCollection.fetch({
      success: function(collection, response, options) {
        if (collection.models.length === 0) {
          $('.dashboard-tip').show();
        } else {
          _(collection.models).each(function(element, index, list) {
            var rapView = new RapEntryView({ model: element });
            rapView.render();
            self.$el.find('#local-raps').append(rapView.el);
          });
        }
      }
    });

    this.$el.find('.dashboard-sync').addClass('active').text('Loading your raps...');
    rapCollection.fetch({
      data: {
        limit: this.limit,
        page: this.page,
      },
      success: function(collection, response, options) {
        // If 25 raps were returned, it's possible
        // that there is more.
        if (response.length >= self.limit) {
          self.$el.find('.show-more').show();
        } else {
          self.$el.find('.show-more').hide();
        }
        self.$el.find('.dashboard-sync').removeClass('active');

        // Populate the dashboard with raps
        _(collection.models).each(function(element, index, list) {
          var rapView = new RapEntryView({ model: element });
          rapView.render();
          self.$el.find('#server-raps').append(rapView.el);
          self.raps_shown++;
        });

        if (response.length === 0) {
          self.$el.find('#server-raps')
            .append('<li class="message">You have no raps written yet.</li>');
        }
      },
      error: function() {
        self.$el.find('.dashboard-sync').text('Failed to retrieve latest raps.');
        setTimeout(function() {
          self.$el.find('.dashboard-sync').removeClass('active');
        }, 2000);
      }
    });

    return this;
  },
});

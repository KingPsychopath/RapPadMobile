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
    'click #prev-btn'           : 'onBack',
    'click #editor-save'        : 'onSave',
    'click #editor-delete'      : 'onDelete',
    'click #editor-find-rhymes' : 'onRhymeFind',
    'click .rhyme-suggestions'  : 'onRhymeSuggestionClick',
    'click #privacy-settings'   : 'onTogglePrivacySettings',
    'click .p-setting'          : 'onPrivacySettingClick',
    'keyup #editor-title'       : 'onUpdate',
    'keyup #editor-text'        : 'onUpdate',
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
    this.$el.find('.p-setting[data-value="' + this.model.get('visibility') + '"]')
      .addClass('active');
    return this;
  },

  onPrivacySettingClick: function(evt) {
    var $settingBtn   = $(evt.currentTarget);
    var privacyValue  = $settingBtn.data('value');

    $('.p-setting').removeClass('active');
    this.model.set({ visibility: privacyValue });
    $('.p-setting[data-value="' + privacyValue + '"]').addClass('active');
  },

  onTogglePrivacySettings: function() {
    var $privacySettings = this.$el.find('.all-privacy-settings');
    if ($privacySettings.hasClass('active')) {
      $privacySettings.removeClass('active');
    } else {
      $privacySettings.addClass('active');
    }
  },

  onRhymeSuggestionClick: function() {
    this.$el.find('.rhyme-suggestions').removeClass('active');
  },

  onRhymeFind: function() {
    // Find the last word
    var lastWord = this.$el.find('#editor-text').val().split(' ').pop();
    var view     = this;
    this.$el.find('#editor-find-rhymes').disable();

    $.ajax({
      url: RAPPAD_API_PATH + '/raps/rhyme',
      type: 'POST',
      data: {
        word: lastWord,
        user_token: App.getToken(),
        user_email: App.getEmail()
      },
      success: function(response) {
        var rhymes = response.rhymes;
        var rhymeHtml = '';
        _(rhymes).each(function(element, index, list) {
          rhymeHtml += '<span class="word">' + element + '</span> ';
        });

        view.$el.find('.rhyme-suggestions .suggestions').html(rhymeHtml);
        view.$el.find('.rhyme-suggestions').addClass('active');
      },
      error: function() {
        view.$el.find('.editor-error span').text('No rhymes could be found right now.')
          .addClass('active');
        setTimeout(function() {
          view.$el.find('.editor-error span').removeClass('active');
        }, 2000);
      },
      complete: function() {
        view.$el.find('#editor-find-rhymes').enable();
      },
    });
  },

  onUpdate: function() {
    var title   = this.$el.find('#editor-title').val();
    var lyrics  = this.$el.find('#editor-text').val();
    this.model.set({
      title: title,
      lyrics: lyrics,
    });
  },

  onDelete: function(evt) {
    if (!confirm('Are you sure?')) {
      return;
    }

    if (this.mode === 'LOCAL') {
      this.model.destroy();
      navigateLeft('/dashboard');
    } else if (this.mode === 'SERVER') {
      this.$el.find('#editor-delete').disable();
      this.$el.find('#editor-delete i').removeClass('fa-remove').addClass('fa-spin fa-spinner');
      this.model.destroy({
        success: function(model, response) {
          navigateLeft('/dashboard');
        }
      });
    }
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

var DiscussView = Jr.View.extend({
  template: _.template($('#v-discuss').html()),
  mootCredentials: {},
  events: {
    'click #prev-btn': 'onBack',
  },

  onBack: function() {
    navigateLeft('/dashboard');
  },

  initialize: function(options) {
    this.mootCredentials = options.mootCredentials;
  },

  render: function() {
    this.$el.html(this.template());
    this.$el.find('#moot').muut(this.mootCredentials);
    return this;
  },
});

var ExploreView = Jr.View.extend({
  template: _.template($('#v-explore').html()),
  render: function() {
    this.$el.html( this.template() );
    return this;
  },
});

var DashboardView = Jr.View.extend({
  page: 0,
  limit: 25,
  raps_shown: 0,

  events: {
    'click .show-more'    : 'showMore',
    'click .edit'         : 'editRap',
    'click .sync-btn'     : 'syncRaps',
    'click .write-btn'    : 'newRap',
    'click #other'        : 'other',
    // Used in the nav menu
    'click #nav-discuss'  : 'navDiscuss',
    'click #nav-explore'  : 'navExplore',
  },

  navExplore: function() {
    navigateRight('/explore');
  },

  navDiscuss: function() {
    navigateRight('/discuss');
  },

  clearNavbar: function() {
    this.$el.find('.content').removeClass('hidden');
    this.$el.find('#other i').removeClass('fa-remove').addClass('fa-navicon');
    this.$el.find('.navbar').removeClass('active').unbind('click');
  },

  other: function(evt) {
    var $navButton = this.$el.find('#other');
    if ($navButton.find('i').hasClass('fa-navicon')) {
      $navButton.find('i').removeClass('fa-navicon').addClass('fa-remove');
      this.$el.find('.navbar').addClass('active');
      this.$el.find('.content').addClass('hidden').one('click', function() {
        this.clearNavbar();
      }.bind(this));;

    } else {
      this.clearNavbar();
    }
  },

  doneSync: function() {
    console.info('Sync finished.');
    this.render();
  },

  syncRaps: function() {
    this.$el.find('.sync-btn i').addClass('fa-spin');
    this.$el.find('.sync-btn').disable();

    var view              = this;
    var draftRapElements  = this.$el.find('#local-raps .rap-entry');

    _(draftRapElements).each(function(element, index, list) {
      var $rap    = $(element);
      var $status = $('<div class="status">Syncing...</div>');
      var rapId   = $rap.find('.edit').data('rap-id');
      var rap     = draftCollection.find({ id: rapId });

      $rap.find('.actions button').hide();
      $rap.find('.actions').append($status);

      (function(index, maxIndex) {
        var rapAttributes = rap.getSafeAttributes();
        rapCollection.create(rapAttributes, {
          wait: true,
          success: function() {
            // Remove the draft from the draft collection
            rap.destroy();
            $status.html('Success!').addClass('success');
            if (index >= maxIndex) {
              view.doneSync();
            }
          },
          error: function(model, response, options) {
            var errorJson = JSON.parse(response.responseText);
            if (errorJson.error) {
              $status.addClass('error').text('Failed: ' + buildErrorMessage(errorJson.error));
            } else {
              $status.html('Failed.').addClass('error');
            }

            if (index >= maxIndex) {
              view.$el.find('.dashboard-sync')
                .addClass('active')
                .html('Click here to refresh.')
                .one('click', function() { view.doneSync() });

            }
          },
        });
      })(index, list.length - 1);

    });
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
      data: {
        page: this.page,
        limit: this.limit,
        user_email: App.getEmail(),
        user_token: App.getToken(),
      },
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
    rapCollection.reset();
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

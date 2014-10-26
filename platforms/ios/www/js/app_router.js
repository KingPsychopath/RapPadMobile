var AppRouter = Jr.Router.extend({
  routes: {
    ''              : 'root',
    'dashboard'     : 'dashboard',
    'sign-in'       : 'signIn',
    'sign-up'       : 'signUp',
    'raps/:id'      : 'rapShow',
    'editor(/:id)'  : 'editor',
    'discuss'       : 'discuss',
    'explore'       : 'explore',
  },

  explore: function() {
    this.renderView(new ExploreView());
  },

  discuss: function() {
    showLoader();
    $.ajax({
      url: RAPPAD_API_PATH + '/discuss',
      type: 'GET',
      data: {
        user_email: App.getEmail(),
        user_token: App.getToken(),
      },
      success: function(response) {
        // This may help?
        response.widget = true;

        this.renderView(new DiscussView({ mootCredentials: response }));
      }.bind(this),
      error: function() {
        alert('Failed to connect.');
        navigateLeft('/dashboard');
      },
      complete: hideLoader
    });
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
    if (id && id.charAt(0) === 'L') {
      // A local rap
      var localRap = draftCollection.find({ id: id });
      if (localRap) {
        this.renderView(new RapEditorView({ model: localRap }));
      } else {
        // If the local rap could not be found, then return to the dashboard
        Jr.Navigator.navigate('/dashboard', { trigger: true });
      }
    }
    else if (id) {
      // Note: ID comes in as a string, but Backbone knows it as an number.
      //       Search will fail if it is not a number.
      var rap = rapCollection.find({ id: parseInt(id, 10) });

      if (rap) {
        this.renderView(new RapEditorView({ model: rap }));
      } else {
        console.error('Rap %s not found.', id);
        Jr.Navigator.navigate('/dashboard', { trigger: true });
      }
    }
    else {
      // A new rap
      var rap = draftCollection.create({
        id: genLocalRapId(),
        lyrics: '',
        title: 'Untitled Rap',
        created_at: (new Date()).toUTCString(),
      });
      this.renderView(new RapEditorView({ model: rap }));
    }
  },

  signIn: function() {
    this.renderView(new LoginAuthView());
  },

  signUp: function() {
    this.renderView(new RegisterView());
  },

  dashboard: function(any) {
    this.renderView(new DashboardView());
  },
});

jQuery(function($) {
  var appRouter = window.appRouter = new AppRouter();
  Backbone.history.start();
  FastClick.attach(document.body);

  if (IS_IPHONE) {
    $('.app-container').addClass('ios');
    $('body').addClass('ios');
  } else if (IS_ANDROID) {
    $('.app-container').addClass('android');
    $('body').addClass('android');
  }

  // Skip the home page, go straight to dashboard if user is logged in.
  if (App.userLoggedIn()) {
    Jr.Navigator.navigate('/dashboard', { trigger: true });
  }
});

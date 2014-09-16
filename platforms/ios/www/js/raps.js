/*
  This file contains logic for the collections and models.
*/

var Rap = Backbone.Model.extend({
  initialize: function() {
    if ('id' in this.attributes) {
      this.prettify();
    }
    if ($.trim(this.attributes.title) === '') {
      this.set('title', 'Untitled Rap');
    }
  },

  // Add pretty-prints of certain attributes
  prettify: function() {
    if ('lyrics' in this.attributes) {
      this.set('word_count', this.attributes.lyrics.split(' ').length + ' words');
    }
    if ('created_at' in this.attributes) {
      this.set('pretty_date', (new Date(this.attributes.created_at)).toDateString());
    }
  },

  // Prepares this rap to be newly created.
  // Used in the syncing function.
  getSafeAttributes: function() {
    var obj = _.clone(this.attributes);
    // Remove the unnecessary keys
    delete obj['id'];
    delete obj['word_count'];
    delete obj['pretty_date'];
    delete obj['created_at'];
    return obj;
  },
});

var RapCollection = Backbone.Collection.extend({
  model: Rap,
  url: RAPPAD_API_PATH + '/raps',
});

var DraftCollection = Backbone.Collection.extend({
  model: Rap,
  localStorage: new Backbone.LocalStorage('DraftCollection'),
});

var draftCollection = new DraftCollection();
var rapCollection   = new RapCollection();

draftCollection.on('change', function(model, options) {
  model.prettify();
});

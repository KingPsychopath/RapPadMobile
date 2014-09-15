/*
  This file contains logic for the collections and models.
*/

var Rap = Backbone.Model.extend({
  initialize: function() {
    // Add pretty-prints of certain attributes
    if ('lyrics' in this.attributes) {
      this.set('word_count', this.attributes.lyrics.split(' ').length + ' words');
    }
    if ('created_at' in this.attributes) {
      this.set('pretty_date', (new Date(this.attributes.created_at)).toDateString());
    }
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

function S4() {
   return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
};

function guid() {
   return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
};


Backbone.LocalStorage = window.Store = function(name) {
  this.name = name;
  var store = this.localStorage().getItem(this.name);
  this.records = (store && store.split(",")) || [];
};

_.extend(Backbone.LocalStorage.prototype, {
  save: function() {
    this.localStorage().setItem(this.name, this.records.join(","));
  },

  create: function(model) {
    if (!model.id) {
      model.id = guid();
      model.set(model.idAttribute, model.id);
    }
    this.localStorage().setItem(this.name+"-"+model.id, JSON.stringify(model));
    this.records.push(model.id.toString());
    this.save();
    return model.toJSON();
  },

  find: function(model) {
    return JSON.parse(this.localStorage().getItem(this.name+"-"+model.id));
  },

  findAll: function() {
    return _(this.records).chain()
      .map(function(id){return JSON.parse(this.localStorage().getItem(this.name+"-"+id));}, this)
      .compact()
      .value();
 },

  destroy: function(model) {
    this.localStorage().removeItem(this.name+"-"+model.id);
    this.records = _.reject(this.records, function(record_id){return record_id == model.id.toString();});
    this.save();
    return model;
  },

  localStorage: function() {
    return localStorage;
  }
});

Backbone.LocalStorage.sync = window.Store.sync = Backbone.localSync = function(method, model, options, error) {
  var store = model.localStorage || model.collection.localStorage;
  if (typeof options == 'function') {
    options = {
      success: options,
      error: error
    };
  }

  var resp;

  switch (method) {
    case "read":    resp = model.id != undefined ? store.find(model) : store.findAll(); break;
    case "create":  resp = store.create(model);                            break;
    case "update":  resp = store.update(model);                            break;
    case "delete":  resp = store.destroy(model);                           break;
  }

  if (resp) {
    options.success(resp);
  } else {
    options.error('Record not found.');
  }
};

Backbone.ajaxSync = Backbone.sync;
Backbone.getSyncMethod = function(model) {
  if(model.localStorage || (model.collection && model.collection.localStorage))
  {
    return Backbone.localSync;
  }

  return Backbone.ajaxSync;
};

Backbone.sync = function(method, model, options, error) {
  return Backbone.getSyncMethod(model).apply(this, [method, model, options, error]);
};

var Rap = Backbone.Model.extend({
  initialize: function() {
    // Add pretty-prints of certain attributes
    if (this.attributes.lyrics) {
      this.set('word_count', this.attributes.lyrics.split(' ').length + ' words');
    }
    if (this.attributes.created_at) {
      this.set('pretty_date', (new Date(this.attributes.created_at)).toDateString());
    }
  },
});

var RapCollection = Backbone.Collection.extend({
  model: Rap,
  url: RAPPAD_API_PATH + '/raps',
});

var Draft = Backbone.Model.extend({});
var DraftCollection = Backbone.Collection.extend({
  model: Draft,
  localStorage: new Backbone.LocalStorage('DraftCollection'),
});

var draftCollection = new DraftCollection();
var rapCollection   = new RapCollection();

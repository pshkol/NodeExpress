var VacationInSeasonListener = require('../models/vacationInSeasonListener.js');
var Vacation = require('../models/vacation.js');
var credentials = require('../credentials.js');
var MongoSessionStore = require('session-mongoose')(require('connect'));


module.exports = function(app) {
  var sessionStore = new MongoSessionStore({url: credentials.mongo[app.get('env')].connectionString});

  app.use(require('express-session')({
      resave: false,
      saveUninitialized: false,
      secret: credentials.cookieSecret,
      store: sessionStore
  }))

  function convertFromUSD(value, currency) {
    switch (currency) {
      case 'USD': return value * 1;
      case 'GBP': return value * 0.6;
      case 'BTC': return value * 0.0023707918444761;
      default: return NaN;
    }
  }

  app.get('/set-currency/:currency', function(req, res) {
    req.session.currency = req.params.currency;
    return res.redirect(303, '/vacations');
  })

  app.get('/notify-me-when-in-season', function(req, res) {
    res.render('notify-me-when-in-season', {sku: req.query.sku});
  })

  app.post('/notify-me-when-in-season', function(req, res) {
    VacationInSeasonListener.update(
      {email: req.body.email},
      {$push: {skus: req.body.sku}},
      {upsert: true},
      function(err) {
        if(err) {
          console.error(err.stack);
          req.session.flash = {
            type: 'danger',
            intro: 'Упс!',
            message: 'При обработке вашего запроса произошла ошибка.'
          }
          return res.redirect(303, '/vacations');
        }
        req.session.flash = {
          type: 'success',
          intro: 'Спасибо!',
          message: 'Вы будете оповещены, когда наступит сезон для этого тура.'
        }
        return res.redirect(303, '/vacations');
      }
    )
  })

  app.get('/vacations', function(req, res) {
    Vacation.find({ available: true }, function(err, vacations) {
      console.log(req.session);
      //var currency = req.session.currency || 'USD';
      var currency = 'USD';
      var context = {
        currency: currency,
        vacations: vacations.map(function(vacation) {
          return {
            sku: vacation.sku,
            name: vacation.name,
            description: vacation.description,
            price: convertFromUSD(vacation.priceInCents/100, currency),
            inSeason: vacation.inSeason,
            qty: vacation.qty
          }
        })
      }
      switch(currency) {
        case 'USD': context.currencyUSD = 'selected'; break;
        case 'GBP': context.currencyGBP = 'selected'; break;
        case 'BTC': context.currencyBTC = 'selected'; break;
      }
      res.render('vacations', context);
    })
  })
}

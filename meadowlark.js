var express = require('express');
var fortune = require('./lib/fortune.js');
var weather = require('./lib/weather.js');
var credentials = require('./credentials');
var formidable = require('formidable');
var nodemailer = require('nodemailer');
var fs = require('fs');
var Vacation = require('./models/vacation.js');

var app = express();

var routes = require('./routes.js')(app);

// Connect DataBase

var mongoose = require('mongoose');
var opts = {
  server: {
    useMongoClient: true,
    socketOptions: { keepAlive: 1 }
  }
};

switch (app.get('env')) {
  case 'development':
    console.log(credentials.mongo.development.connectionString);
    mongoose.connect(credentials.mongo.production.connectionString, opts);
    break;
  case 'production':
    mongoose.connect(credentials.mongo.production.connectionString, opts);
    break;
  default:
    throw new Error('Неизвестная среда выполнения: ' + app.get('env'));
}

// Create default DataBase

Vacation.find(function(err, vacations) {
  if (err) return console.error(err);
  if (vacations.length) return;

  new Vacation({
    name: 'Однодневный тур по реке Худ',
    slug: 'hood-river-day-trip',
    category: 'Однодневный тур',
    sku: 'HR199',
    description: 'Проведите день в плавании по реке Колумбия и насладитесь сваренным по традиционным рецептам пивом на реке Худ!',
    priceInCents: 9995,
    tags: ['однодневый тур', 'река худ', 'плавание', 'виндсерфинг', 'пивоварни'],
    inSeason: true,
    maximumGuests: 16,
    available: true,
    packagesSold: 0,
  }).save();

  new Vacation({
    name: 'Отдых в Орегон Коуст',
    slug: 'oregon-coast-getaway',
    category: 'Отдых на выходных',
    sku: 'OC39',
    description: 'Насладитесь океанским воздухом ' +
    'и причудливыми прибрежными городками!',
    priceInCents: 269995,
    tags: ['отдых на выходных', 'орегон коуст',
    'прогулки по пляжу'],
    inSeason: false,
    maximumGuests: 8,
    available: true,
    packagesSold: 0,
  }).save();

  new Vacation({
    name: 'Скалолазание в Бенде',
    slug: 'rock-climbing-in-bend',
    category: 'Приключение',
    sku: 'B99',
    description: 'Пощекочите себе нервы горным восхождением ' +
    'на пустынной возвышенности.',
    priceInCents: 289995,
    tags: ['отдых на выходных', 'бенд', 'пустынная возвышенность', 'скалолазание'],
    inSeason: true,
    requiresWaiver: true,
    maximumGuests: 4,
    available: false,
    packagesSold: 0,
    notes: 'Гид по данному туру в настоящий момент ' +
    'восстанавливается после лыжной травмы.',
  }).save();
})

// var nodemailer = require('nodemailer');
// var mailTransport = nodemailer.createTransport({
//   host: 'smtp.gmail.com',
//   port: 587,
//   secure: false,
//  auth: {
//    user: credentials.gmail.user,
//    pass: credentials.gmail.password,
//  }});
//
// mailTransport.sendMail({
//   from: '"Meadowlark Travel" <info@meadowlark.com>',
//   to: 'pshkolnyy@outlook.com',
//   subject: 'Ваш тур Meadowlark Travel',
//   text: 'Спасибо за заказ поездки в Meadowlark' + 'Мы ждем вас с нетерпением',
// }, function(err) {
//   if (err) console.error('Невозможно отправить письмо' + err);
// })

var dataDir = __dirname + '/data';
var vacationPhotoDir = dataDir + '/vacation-photo';

fs.existsSync(dataDir) || fs.mkdirSync(dataDir);
fs.existsSync(vacationPhotoDir) || fs.mkdirSync(vacationPhotoDir);

function saveContestEntry(contestName, email, year, month, photoPath){
// TODO... это будет добавлено позднее
}


app.set('port', process.env.PORT || 3000);

app.use(express.static(__dirname + '/public'));

var handlebars = require('express-handlebars').create({
    defaultLayout: 'main',
    helpers: {
        section: function (name, options) {
            if (!this._sections) this._sections = {};
            this._sections[name] = options.fn(this);
            return null;
        }
    }
});
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

var MongoSessionStore = require('session-mongoose')(require('connect'));
var sessionStore = new MongoSessionStore({url: credentials.mongo[app.get('env')].connectionString});

app.use(require('body-parser').urlencoded({ extended: true }))
app.use(require('cookie-parser')(credentials.cookieSecret));
app.use(require('express-session')({
    resave: false,
    saveUninitialized: false,
    secret: credentials.cookieSecret,
    store: sessionStore
}))

// Set session

app.use(function (req, res, next) {
    req.session.userName = 'Anonymous';
    var colorScheme = req.session.colorScheme || 'dark';
    next();
})

app.use(function (req, res, next) {
    res.locals.flash = req.session.flash;
    delete req.session.flash;
    next();
})

var VALID_EMAIL_REGEX = new RegExp('^[a-zA-Z0-9.!#$%&\'*+\/=?^_`{|}~-]+@' +
    '[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?' +
    '(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$');

// Set cookies

app.use(function (req, res, next) {
    //console.log('Set cookies');
    res.cookie('monster', 'nom nom');
    res.cookie('signed_monster', 'nom nom', { signed: true });
    next();
})

// Get cookies

app.use(function (req, res, next) {
    //console.log('Read cookies');
    let monster = req.cookies.monster;
    let signedMonster = req.signedCookies.signed_monster;
    //console.log(monster, signedMonster);
    next();
})

// Test

app.use(function (req, res, next) {
    res.locals.showTests = app.get('env') !== 'production' && req.query.test === 1;
    res.type('text/html; charset=utf-8');
    next();
})

// Weather widget

app.use(function (req, res, next) {
    if (!res.locals.partials) res.locals.partials = {};
    res.locals.partials.weatherContext = weather.getWeatherData();
    next();
});

// Roots

app.use(function (req, res) {
    res.status(404);
    res.render('404');
})

app.use(function (err, req, res, next) {
    console.log(err.stack);
    res.status(500);
    res.render('500');
})

// Listen server

function startServer() {
  app.listen(app.get('port'), function () {
      console.log('Express запущен на http://localhost:' + app.get('env'));
  })
}

if (require.main === module) {
  startServer();
} else {
  module.exports = startServer;
}

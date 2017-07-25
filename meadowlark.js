var express = require('express');

var app = express();

var handlebars = require('express-handlebars').create({ defaultLayout: 'main' });
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

var fortunes = [
    "Победи свои страхи или они победят тебя",
    "Рекам нужны истоки",
    "Не бойся неведомого",
    "Тебя ждет приятный сюрприз",
    "Будь проще везде, где только можно"
]

app.set('port', process.env.PORT || 3000);

app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res) {
    res.render('home');
})

app.get('/about', function (req, res) {
    var randomFortune = fortunes[Math.floor(Math.random() * fortunes.length)];
    res.render('about', {fortune: randomFortune});
})

app.use(function (req, res) {
    res.status(404);
    res.render('404');
})

app.use(function (req, res) {
    res.status(500);
    res.render('500');
})

app.listen(app.get('port'), function () {
    console.log('Express запущен на http://localhost:' + app.get('port'));
})
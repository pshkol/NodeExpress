var main = require('./handlers/main.js');

module.exports = function(app) {
  var vacation = require('./handlers/vacation.js')(app);

  app.get('/', main.home);
  app.get('/about', main.about);

  app.post('/newsletter', function (req, res) {
      var name = req.body.name || '';
      var email = req.body.email || '';

      if (!email.match(VALID_EMAIL_REGEX)) {
          if (req.xhr) {
              return res.json({ error: 'Некорректный адрес электронной почты' });
          }

          req.session.flash = {
              type: 'danger',
              intro: 'Ошибка проверки',
              message: 'Введенный вами адрес электронной почты некорректен'
          }

          return res.redirect(303, '/');
      }

      res.redirect(303, '/newsletter/archive');
  })

  app.get('/epic-fail', function(req, res){
   process.nextTick(function(){
   throw new Error('Бабах!');
   });
  });

  app.get('/fail', function(req, res) {
    throw new Error('Нет!');
  })

  app.get('/contest/vacation-photo', function (req, res) {
      var now = new Date();
      console.log(now.getMonth());

      res.render('contest/vacation-photo', {
          year: now.getFullYear(),
          month: now.getMonth()
      })
  })

  app.post('/contest/vacation-photo/:year/:month', function (req, res) {
    console.log(req.params.year, req.params.month);
      var form = new formidable.IncomingForm();
      form.parse(req, function (err, fields, files) {
          if (err) {
            res.session.flash = {
              type: 'danger',
              intro: 'Упс!',
              message: 'Во время работы отправленной Вами формы ' + 'произошла ошибка. Пожалуйста попробудуйте еще раз.',
            }
            res.redirect(303, '/contest/vacation-photo');
          }

          var photo = files.photo;
          var dir = `${vacationPhotoDir}/${Date.now()}`;
          var path = `${dir}/${photo.name}`;
          fs.mkdirSync(dir);
          fs.renameSync(photo.path, path);
          saveContestEntry('vacation-photo', fields.email, req.params.year, req.params.month, path);
          req.session.flash = {
            type: 'success',
            intro: 'Удачи!',
            message: 'ВЫ стали участником конкурса'
          }

          return res.redirect(303, '/contest/vacation-photo/entries');
      })
  })

  app.get('/newsletter', function (req, res) {
      res.render('newsletter', { csrf: 'CSRF token goes here' });
  })

  app.post('/process', function (req, res) {
      console.log('Form (from querystring): ' + req.query.form);
      console.log('CSRF token (from hidden form field): ' + req.body._csrf);
      console.log('Name (from visible form field): ' + req.body.name);
      console.log('Email (from visible form field): ' + req.body.email);
      res.redirect(303, '/thank-you');
  })
}

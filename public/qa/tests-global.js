suite('Global Tests', function () {
    test('” данной страницы допустимый заголовок', function () {
        assert(document.title && document.title.match(/\S/) && document.title.toUpperCase() !== 'TODO');
    })
})
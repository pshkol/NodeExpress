suite('Global Tests', function () {
    test('� ������ �������� ���������� ���������', function () {
        assert(document.title && document.title.match(/\S/) && document.title.toUpperCase() !== 'TODO');
    })
})
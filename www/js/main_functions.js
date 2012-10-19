$(document).ready(function() {
    // Анимация инициализации
    show_loader('init', 'Загрузка');

    // Отключить анимацию инициализации
    hide_loader('init');
});

// Обработка ответа команды SET_PARAMS
function cbSetParams(data) {
    
    // Удалить анимацию отправки и показать таблицу с параметрами
    hide_loader('send');
    
    // Вывести сообщение с результатом операции
    if ( !data.RESULT ) {
        myAlert( 'ERROR', 'Неверный формат ответа', 'alert-error' );
    
    } else if (data.RESULT.VALUE.CODE.VALUE == 0) { // Успешное сохранение изменений
        
        myAlert( data.RESULT.VALUE.TEXT.VALUE, data.RESULT.VALUE.MESSAGE.VALUE, 'alert-success' ); 
        
        // Деактивация кнопки "Сохранить изменения"
        $( '#saveBtn' ).addClass('btn disabled').attr( 'disabled', 'disabled' );
        
        // Установить дефолтные значения в отправленные
        curParams = null;
        curParams = $.extend( true, curParams, newParams ); // Рекурсивное клонирование объекта
    } 
    else { // fail
        myAlert( data.RESULT.VALUE.TEXT.VALUE, data.RESULT.VALUE.MESSAGE.VALUE, 'alert-error' );
    }
}
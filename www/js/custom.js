$(document).ready(function() {
    $('#accordion1 .accordion-body').collapse({
      toggle: false
    });
    //$('#accordion1 .accordion-body').collapse('show');
    
    // Анимация инициализации
    show_loader('init', 'Загрузка');
    
    // Запрос списка каналов
    sendCmd( {'COMMAND': 'CMD_GET_CHANNELS_LIST'}, addChannels );
});

$('.btn-getlogs').bind('click', function(){
    $('.btn-getlogs').button('loading');
    alert ('Логика получения логов');
    $('.btn-getlogs').button('reset');
});

$('.nav-list li').live('click', function(){
    // Выбор активного пункта меню
    $('#accordion1 li').removeClass("active");
    $(this).toggleClass('active');
    // Очистка контентной области, анимация загрузки
    $('div.span9').empty();
    $('<div></div>').addClass('contentLoaderWrap').appendTo($('div.span9'));
    // Отправка запроса параметров модуля 
    sendCmd( {'COMMAND': 'CMD_GET_PARAMS', 'CHANNEL_ID': $(this).attr('chanid'), 'MODULE_NAME': $(this).attr('modname') }, addParams );
    // Сохранить выбранный модуль
    curMod = $(this).attr('modname');
    curChan = $(this).attr('chanid');
});

$('.accordion-heading').live('click', function(event){
    sendCmd( {'COMMAND': 'CMD_GET_MODULES_LIST', 'CHANNEL_LIST_ID': this.id }, addModules ); //Отправка команды на получение списка модулей канала
});

$('#paramsTable input').live('keydown', function(event) {
    var keyCode;
    if ( event.keyCode >= 96 && event.keyCode <= 105 ) {
        keyCode = event.keyCode - 48;
    } else {
        keyCode = event.keyCode;
    }
    var val = String.fromCharCode( keyCode );
    
    // спец. сочетание - не обрабатываем 
    if ( event.ctrlKey || event.altKey || event.metaKey || event.shiftKey ) return;
    if ( keyCode < 48 ) return; // спец. символ - не обрабатываем
    
    return DATA_TYPES[ curParams[ $(this).attr('id') ].TYPE ].ALLOW_CHARS.test( val );
})

$('#paramsTable input').live('change', function() {
    
    // Удалить сообщения об ошибках
    $(this).parent().removeClass( 'error' );
    $( '.control-group#' + $(this).attr( 'id' ) + ' > .help-inline' ).remove();
    
    // Если цифровой или строковый инпут
    if ( curParams[ $(this).attr('id') ].TYPE == "DWORD" || curParams[ $(this).attr('id') ].TYPE == "WORD" || curParams[ $(this).attr('id') ].TYPE == "INT32" ||
      curParams[ $(this).attr('id') ].TYPE == "INT64" || curParams[ $(this).attr('id') ].TYPE == "FLOAT" || curParams[ $(this).attr('id') ].TYPE == "DOUBLE" ||
      curParams[ $(this).attr('id') ].TYPE == "STRING" ) 
    {
        // Если строка пустая преобразовать в 0
        if ( $.trim( this.value ) == '' ) {
            this.value = 0;
        }

        // Проверка соответсвия всего выражения формату
        if( ! DATA_TYPES[ curParams[ $(this).attr('id') ].TYPE ].FORMAT.test( this.value ) )    { 
            // Если нет, то добавить сообщение об ошибке
            if ( !$(this).parent().is( '.error' ) ) {
                $(this).parent().addClass( 'error' );
                $(this).parent().append( '<span class="help-inline">' +  DATA_TYPES[ curParams[ $(this).attr('id') ].TYPE ].HINT + '</span>' );
            }
            return false;
        } else {
            // Проверка превышения границ значений
            if ( $(this).attr( 'for' ) == 'slider' ) {
                // Проверить превышение границ диапозона значений, если есть превышение, то значение прировнять к граничному
                if ( parseInt( this.value ) < parseInt( curParams[ $(this).attr('id') ].Min ) ) {
                    this.value = curParams[ $(this).attr('id') ].MIN;
                } else if ( parseInt( this.value ) > parseInt( curParams[ $(this).attr('id') ].MAX ) ) {
                    this.value = curParams[ $(this).attr('id') ].MAX;
                }
                // Установить значение слайдера равное значению инпута
                $(this).parent().find('#slider-range-min').slider( "value", this.value );
            } else if ( parseInt( this.value ) < parseInt( DATA_TYPES[ curParams[ $(this).attr('id') ].TYPE ].MIN ) ) {
                $(this).parent().addClass( 'error' );
                $(this).parent().append( '<span class="help-inline">Минимальное значение для этого параметра: ' + DATA_TYPES[ curParams[ $(this).attr('id') ].TYPE ].MIN + '</span>' );
            } else if ( parseInt( this.value ) > parseInt( DATA_TYPES[ curParams[ $(this).attr('id') ].TYPE ].MAX ) ) {
                $(this).parent().addClass( 'error' );
                $(this).parent().append( '<span class="help-inline">Максимальное значение для этого параметра: ' + DATA_TYPES[ curParams[ $(this).attr('id') ].TYPE ].MAX + '</span>' );
            }
        }

        newParams[ $(this).attr('id') ].VALUE = this.value;
    }
    else if ( curParams[ $(this).attr('id') ].TYPE == "BOOL" ) { // Если чекбокс
        newParams[ $(this).attr('id') ].VALUE = this.checked;
    }
    
    // Сделать кнопку сохранения изменения активной
    $('#saveBtn').removeClass('disabled').removeAttr('disabled');
    
    return true;
})

$('#paramsTable select').live('change', function() {
    set_new_param( $(this).attr('id'), this.value );
    $('#saveBtn').removeClass('disabled').removeAttr('disabled');
    
    return true;
})

$('#saveBtn').live('click', function () {
    if ( !$(this).is('.disabled') ) {
        
        // Включить анимацию отправки данных
        show_loader( 'send', 'Сохранение изменений' );

        // Отправить команду на установку параметров
        var cmd = {};
        cmd['COMMAND'] = 'CMD_SET_PARAMS';
        cmd['CHANNEL_ID'] = "dw:" + newParams.CHANNEL_ID.VALUE;
        cmd['MODULE_NAME'] = "s:'" + getCurModParam(curMod).NAME.VALUE + "'";
        $.each( newParams, function(key, val) {
            if ( key != "RESULT" && key != "CHANNEL_ID" ) {
                if ( val.TYPE == 'STRING' )  {
                    cmd[key] = DATA_TYPES[ val.TYPE ].ABBREVIATED_NAME + ":'" + encodeURIComponent(val.VALUE) + "'";
                } else {
                    cmd[key] = DATA_TYPES[ val.TYPE ].ABBREVIATED_NAME + ":" + encodeURIComponent(val.VALUE);
                }
            }
        });
        sendCmd( cmd, cbSetParams );
    }
});

$('.submit_btn').live( 'click', function() {
    // TODO откуда-то брать файл и отправлять
    
    sendCmd( 'test', cbSetParams, 'POST' );
});

$('.browse_btn').live( 'click', function() {
    // TODO Открывать диалог и сохранять содержимое файла
});

$('#returnArrow').live('click', function () {
    // Поиск и получение соответствующего инпута
    var input = $( '#' + $(this).attr('for') )[0];
    var parent = $(input).parent()[0];
    
    // Отмена изменений
    // Если выбранный инпут типа селект
    if ( input.tagName == 'SELECT' && input.value != curParams[ $(this).attr('for') ].VALUE ) { 
        // Найти опцию с соответствующим значением и установить выбранной
        var i = 0;
        while ( i < input.childNodes.length && input.childNodes[i].value != curParams[ $(this).attr('for') ].VALUE ) {
            i++;
        }
        if ( i == input.childNodes.length ) {
            myAlert( 'ERROR', 'Неправильное значение опции списка', 'alert-error' );
            console.log( 'ERROR: Попытка установить выбранным значение ' + curParams[ $(this).attr('for') ].VALUE + ', которого нет в списке опций селекта' );
        }
        else {
            // Отменить изменения в форме
            input.childNodes[i].selected = true;
            
            // Отменить изменения в переменных
            newParams[ $(this).attr('for') ].VALUE = curParams[ $(this).attr('for') ].VALUE;
        }
    }
    // Checkbox
    else if ( input.type == 'checkbox' && input.checked != curParams[ $(this).attr('for') ].VALUE ) { 
        // Отменить изменения в форме
        input.checked = curParams[ $(this).attr('for') ].VALUE;
        
        // Отменить изменения в переменных
        newParams[ $(this).attr('for') ].VALUE = curParams[ $(this).attr('for') ].VALUE;
    }
    // Все остальные инпуты
    else if ( input.value != curParams[ $(this).attr('for') ].VALUE ) { 
        input.value = curParams[ $(this).attr('for') ].VALUE;
        
        // Отменить изменения в переменных
        newParams[ $(this).attr('for') ].VALUE = curParams[ $(this).attr('for') ].VALUE;
        
        // Сгенерировать событие change для изменения значения слайдера
        $(input).trigger('change');
    }
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

function add_table_container(prefix, header) {
    var section_id  = prefix + 'Section';
    var table_id    = prefix + 'Table';

    $('<section id="' + section_id + '"></section>')
        .appendTo( $('div.span9') );

    $('<h1>'+ header +'</h1>')
        .appendTo( 
            $('<div></div>')
                .addClass('page-header')
                .appendTo( $('#' + section_id) )
        );

    return $('<table></table>')
        .addClass('table table-bordered table-striped')
        .attr('id', table_id )
        .appendTo( $('#' + section_id) );
}

// Создание HTMl кода для параметров камеры
function addParams(data) {
    
    // Очистка основного контейнера
    $('div.span9').empty();
    
    // Если запрос выполнен успешно
    if ( check_result(data) ) {
        if ( ! check_data(data) ) {
            $('div.span9').empty();
            myAlert( 'ERROR', Error_code, 'alert-error' );
            return;
        }
        
        // ================== Создание таблицы параметров
        // Создание контейнера для таблицы
        var table = add_table_container( 'params', get_cur_mod_comment() );
        $('<thead><tr><th>Параметр</th><th>Значение</th><th>Сбросить</th></tr></thead><tbody></tbody>')
            .appendTo( table );

        // Заполнение таблицы с параметрами
        var params = get_params(data);
        for ( var key in params ) {
            var val = params[key];

            // Создать ряд таблицы
            var row = $('<tr></tr>').appendTo( $('#paramsTable tbody') );
            
            // Добавить название параметра в таблицу
            $('<td><span>'+ get_param_comment( key, data ) +'</span></td>')
                .addClass('col1').appendTo( row );
            
            // Создать и добавить контрол для параметра
            var parent = $('<td class="control-group"></td>')
                .addClass('col2').appendTo( row );
            
            addControl(parent, key, val);
            
            // Создать и добавить кнопку "отменить"
            parent = $('<td></td>').addClass('col3').appendTo(row);
            $( '<a href="#"><span id="returnArrow" for="' + key + '" class="ui-icon ui-icon-arrowreturnthick-1-w"></span></a>' ).appendTo(parent);
        }

        // Создать и добавить кнопку "Сохранить изменения"
        $('<button>Сохранить изменения</button>')
            .addClass('btn disabled')
            .attr('id', 'saveBtn')
            .attr( 'disabled', 'disabled' )
            .appendTo( $('#paramsSection') );

        // ================== Создание таблицы файлов
        params = get_files_params(data);
        if ( ! $.isEmptyObject( params ) ) {
            // Создание контейнера для таблицы
            var table = add_table_container( 'files', 'Файлы' );
            $('<tbody></tbody>')
                .appendTo( table );

            // Заполнение таблицы
            for ( var key in params ) {
                var val = params[key];

                // Создать ряд таблицы
                var row = $('<tr></tr>').appendTo( $('#filesTable tbody') );
                
                // Добавить название параметра в таблицу
                $('<td><span>'+ get_param_comment( key, data ) +'</span></td>')
                    .addClass('col1').appendTo( row );
                
                // Создать и добавить контрол для параметра
                // TODO перенсти в addControl
                var parent = $('<td class="control-group"></td>')
                    .addClass('col2').appendTo( row );
                
                addControl(parent, key, val);
            }
        }

        // Сохранение данных в объект.
        // TODO не хранить информацию о файлах, ее же все равно не надо отправлять на сервер?
        curParams = data;
        newParams = null;
        newParams = $.extend( true, newParams, curParams ); // Рекурсивное клонирование объекта
    } else {
        myAlert( data.RESULT.VALUE.TEXT.VALUE, data.RESULT.VALUE.MESSAGE.VALUE, 'alert-error' );
    }
}

// Добавить control для параметра
// parent - элемент родитель для добавления
// paramName - имя параметра
// attrs - экземпляр объекта с аттрибутами параметра камеры
function addControl(parent, paramName, attrs) {
    if ( ! attrs ) { return };

    if (attrs.hasOwnProperty("ENUM")) {
        // Создание селекта для любого типа с полем ENUM

        // Создать и добавить элемент
        $('<select class="input-large" id="' + paramName + '">').appendTo(parent);

        // Добавить опции селекта
        for (var key in attrs.ENUM) {
            var opt = $('<option>' + attrs.ENUM[key] + '</option>').appendTo('select#' + paramName);
            if ( attrs.ENUM[key] == attrs.VALUE ) {
                opt.attr('selected', 'selected');
            }
        }
    } 
    else if ( attrs.TYPE == "BOOL" ) {
        // Создание CheckBox
        
        // Создать и добавить элемент
        var checkbox = $( '<input type="checkbox" id="' + paramName + '">' ).appendTo(parent);
        
        // Инициализация
        checkbox[0].checked = attrs.VALUE;
    }
    else if (attrs.hasOwnProperty("MIN") && attrs.hasOwnProperty("MAX")) { 
        // Создание обычного инпута со слайдером для цифровых тпиов
        if ( attrs.VALUE >= attrs.MIN && attrs.VALUE <= attrs.MAX ) { 
            
            // Создать и добавить инпут
            $('<input type="text" for="slider" class="input-small" id="' + paramName + '">').attr( 'value', attrs.VALUE ).appendTo(parent);

            // Добавление ползунка
            parent = $('<div></div>').addClass('sliderWrap').appendTo(parent);
            $('<div id="slider-range-min"></div>').appendTo(parent).slider({
                    range: "min",
                    value: attrs.VALUE,
                    min: attrs.MIN,
                    max: attrs.MAX,
                    slide: function( event, ui ) {
                        $( 'input#' + paramName ).val( ui.value );
                        $( 'input#' + paramName ).trigger('change');
                    }
            });
        } else {
            $('div.span9').empty();
            myAlert( 'Error', 'Не корректные входные данные. Value находится за диапозоном значений MIN MAX', 'alert-error' );
            return;
        }
    } 
    else if ( attrs.TYPE == "FILE" ) {
        var input = 
            $('<input type="text" clas="input-xlarge">')
                .attr('value', '')
                .attr( 'id', paramName )
                .appendTo(parent);
        var browse_btn = 
            $('<button class="btn browse_btn">...</button>')
            .attr( 'for', paramName )
            .appendTo(parent);
        var submit_btn = 
            $('<button class="btn submit_btn">Отправить</button>')
            .attr( 'for', paramName )
            .appendTo(parent);
    }
    else {
        // Создание обычного инпута для чисел, строки и даты
        
        // Создать и добавить контрол
        var input = $('<input type="text" >').attr('value', attrs.VALUE).attr( 'id', paramName ).appendTo(parent);

        // Инициализация календаря
        if ( attrs.TYPE == 'DATETIME' ) { 
            $( 'input#' + paramName ).datetimepicker(); 
        }
        
        // Определить размер поля в зависимости от типа данных
        if ( attrs.TYPE == 'STRING' ) {
            input.addClass('input-xlarge');
        } 
        else if ( attrs.TYPE == 'DATETIME' ) {
            input.addClass('input-medium');
        }
        else {
            input.addClass('span3');
        }
    }
}

//Добавить модули в меню
function addModules(data) {
    if (data.RESULT.VALUE.CODE.VALUE == 0) {
        var chanId;
        if (data.CHANNEL_LIST_ID) {
            chanId = data.CHANNEL_LIST_ID.VALUE;
            $('#accordion-group' + chanId + ' ul').empty();
            $.each(data.MODULES_LIST.ENUM, function(key, val){
                $('<li></li>').attr('chanId', chanId).attr('modName', val.NAME.VALUE).appendTo($('#accordion-group' + chanId + ' ul'));
                $('<a>'+val.COMMENT.VALUE+'</a>').attr('href', '#').appendTo($("[modName = "+val.NAME.VALUE+"][chanId = "+chanId+"]")); // $('<a>'+val.NAME.VALUE+'</a>').attr('href', '#').appendTo($("[modName = "+val.NAME.VALUE+"][chanId = "+chanId+"]"));
            });
        }
        else { alert('Нет номера канала'); }
        
        
        // Если collapse раскрыт пересчитать высоту под загруженный контент
        if ( $('#collapse' + chanId).is('.in') ) {
            $('#collapse' + chanId).height( $('#accordion-group' + chanId + ' ul').height() + 19 );
        }
        
        // Сохранение всего списка модулей
        modules = data;
    } else {
        $('<div><h3>' + data.RESULT.VALUE.TEXT.VALUE + '</h3><p>' + data.RESULT.VALUE.MESSAGE.VALUE + '</p></div>').appendTo( $('div.span9') );
    }
    
    // Отключить анимацию загрузки
    $('#accordion-group' + chanId + ' div.modLoader').hide();
}

//Создание акордеона с каналами, подготовка контейнера для меню модулей
function addChannels(data) {
    if (data.RESULT.VALUE.CODE.VALUE == 0) {    
        $.each(data.CHANNELS_LIST.ENUM, function(key, val) {
            var parent = document.getElementById('accordion1');
            parent.appendChild(myCreateElement('div',
              {'class': 'accordion-group', 'id': 'accordion-group' + val.ID.VALUE }));
            
            parent = document.getElementById( 'accordion-group' + val.ID.VALUE );
            parent.appendChild(myCreateElement('div',
              {'class': 'accordion-heading', 'id': val.ID.VALUE }));
            parent.appendChild(myCreateElement('div',
              {'class': 'accordion-body collapse', 'id': 'collapse' + val.ID.VALUE },
              {'height': '0px'} )); //  {'height': 'auto', 'display': 'none'} ));
            
            parent = document.getElementById( val.ID.VALUE );
            parent.appendChild(myCreateElement('a',
              {'class': 'accordion-toggle', 'data-toggle': 'collapse', 'data-parent':'#accordion1', 'href':'#collapse' + val.ID.VALUE },
              {},
              val.COMMENT.VALUE ));//'Channel #' + val.ID.VALUE ));
                        
            $('<div></div>').addClass('accordion-inner').appendTo($('#accordion-group' + val.ID.VALUE + ' > #collapse' + val.ID.VALUE ));
            $('<ul></ul>').addClass('nav nav-list').appendTo($('#accordion-group' + val.ID.VALUE + ' > #collapse' + val.ID.VALUE + ' > .accordion-inner'));
            $('<div></div>').addClass('modLoader').appendTo($('#accordion-group' + val.ID.VALUE + ' div.accordion-inner'));
        });
        // Сохранение всего списка модулей
        channels = data;
    } else {
        $('<div><h3>' + data.RESULT.VALUE.TEXT.VALUE + '</h3><p>' + data.RESULT.VALUE.MESSAGE.VALUE + '</p></div>').appendTo( $('div.span9') );
    }
    
    // Отключить анимацию инициализации
    hide_loader('init');
}
        
//Создать HTML кода элемента
function myCreateElement(name, attrs, style, text) {
    var e = document.createElement(name);
    if (attrs) {
        for (var key in attrs) {
            if (key == 'class') {
                e.className = attrs[key];
            } else if (key == 'id') {
                e.id = attrs[key];
            } else {
                e.setAttribute(key, attrs[key]);
            }
        }
    }
    if (style) {
        for (key in style) {
            e.style[key] = style[key];
        }
    }
    if (text) {
        e.appendChild(document.createTextNode(text));
    }
    return e;
}

function postJSON( url, data, callback ) {
    return $.post(url, data, callback, "json");
}

//Отправить команду на сервер
function sendCmd(params, callback, type) {
    var answer;

    if ( type == "POST" ) {
        answer = postJSON( "/", params, callback);
    }
    else {
        var cmd = "/?action=command"
        if (params) {
            for (var key in params) {
                cmd += "&";
                cmd += key;
                cmd += "="
                cmd += params[key];
            }
        }

        answer = $.getJSON(cmd, callback);
    }

    answer.error(
        function(jqXHR, textStatus, errorThrown) {
        console.log("error " + textStatus);
        console.log("incoming Text " + jqXHR.responseText);

        $('div.span9').empty();

        myAlert( 'Error', 'Ошибка парсинга ответа сервера', 'alert-error' );
    });
}

// Вывод инфомации об ошибке в контентной области
function myAlert(head, msg, alertClass) {
    $('.alert').remove();
    $('<div id="myAlert" class="alert alert-block fade in"><button type="button" class="close" data-dismiss="alert">×</button><h3>' + head + '</h3><p>' + msg + '</p></div>').addClass(alertClass).appendTo( $('div.span9') );
    $('#myAlert').alert();
    // $('#myAlert').delay(2000).fadeOut(400);
}

function show_loader(type, msg) {
    $('#loaderModal').css({
        width: 'auto',
        'text-align': 'center',
        'margin-left': function () {
            return -($(this).width() / 2);
        }
    }).modal({
        keyboard: 'false',
        backdrop: 'static'
    });

    $('#loaderModalBody').prepend( 
        $('<span class="modal_msg">' + msg + '</span>').css({
            display: 'block',
            'margin-bottom': '5px',
        })
    );

    $('#loaderModal').modal('show');
}

function hide_loader(type) {
    //хак для скрытия элементов страницы при инициализации
    if ( type == 'init' ) { 
        $('div.startLoaderWrap').css({ display: 'none' }); 
    }

    $('#loaderModal').modal('hide');

    $('span.modal_msg').remove();
}
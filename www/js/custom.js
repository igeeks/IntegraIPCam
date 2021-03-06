﻿$.noConflict()

var curParams, newParams, curChan, curMod, channels, modules;

var DATA_TYPES = {	
	DWORD: {
		MIN: 				0,
		MAX: 				4294967295,
		ALLOW_CHARS: 		/\d/,
		FORMAT: 			/^\d+$/,
		HINT: 				"Можно использовать только цифры",
		ABBREVIATED_NAME: 	"dw"
	},
	WORD: {
		MIN: 				0,
		MAX: 				65535,
		ALLOW_CHARS: 		/\d/,
		FORMAT: 			/^\d+$/,
		HINT: 				"Можно использовать только цифры",
		ABBREVIATED_NAME: 	"w"
	},
	INT32: { 				// TODO протестить
		MIN: 				-2147483648,
		MAX: 				2147483647,
		ALLOW_CHARS: 		/[\+\-\d]/,
		FORMAT: 			/(^[\+\-\d]\d+$|^\d+$)/,
		HINT: 				"Формат данных: -123456",
		ABBREVIATED_NAME: 	"i32"
	},
	INT64: { 				// TODO протестить
		MIN: 				-9223372036854775808,
		MAX: 				9223372036854775807,
		ALLOW_CHARS: 		/[\+\-\d]/,
		FORMAT: 			/(^[\+\-\d]\d+$|^\d+$)/,
		HINT: 				"Формат данных: -123456",
		ABBREVIATED_NAME: 	"i64"
	},
	FLOAT: { 				// TODO протестить
		MIN: 				3.4e-38,
		MAX: 				3.4e38,
		ALLOW_CHARS: 		/[\d\.]/,
		FORMAT: 			/(^\d+\.\d+$|^\d+$)/,
		HINT: 				"Формат данных: 0.123456",
		ABBREVIATED_NAME: 	"f"
	},
	DOUBLE: { 				// TODO протестить
		MIN: 				1.7e-308,
		MAX: 				1.7e308,
		ALLOW_CHARS: 		/[\d\.]/,
		FORMAT: 			/(^\d+\.\d+$|^\d+$)/,
		HINT: 				"Формат данных: 0.123456",
		ABBREVIATED_NAME: 	"dbl"
	},
	STRING: { 				// TODO протестить
		ALLOW_CHARS: 		/./,
		FORMAT: 			/(^.*$)/,
		HINT: 				"Формат данных строка",
		ABBREVIATED_NAME: 	"s"
	},
	FOURCC: { 				// TODO протестить
		ALLOW_CHARS: 		/./,
		FORMAT: 			/(^.*$)/,
		HINT: 				"Формат данных строка",
		ABBREVIATED_NAME: 	"fcc"
	},
	DATETIME: { 			// TODO протестить, контроль макс мин не делаю, т.к. лучше это делать на сервере слишком ерьезная проверка?
		ALLOW_CHARS: 		/[\d\.\/\s\:]/,
		FORMAT: 			/(^.*$)/,								// TODO После установки контрола
		HINT: 				"Формат данных: 00/00/0000 00:00:00.000",
		ABBREVIATED_NAME: 	"dt"
	},
	BOOL: { 				// TODO протестить
		ABBREVIATED_NAME: 	"b"
	},
	DATA: { 				// TODO протестить
		ABBREVIATED_NAME: 	"data"
	},
	PARAMS: { //TODO что с ним делать? не документированный тип.
		
	}
}

jQuery(document).ready(function() {
	jQuery('#accordion1 .accordion-body').collapse({
	  toggle: false
	});
	//jQuery('#accordion1 .accordion-body').collapse('show');
	
	// Анимация инициализации
	jQuery('#black_bg').css("height",jQuery(document).height());
	jQuery('img.startLoader').css({
		position:'absolute',
		left: (jQuery(window).width() - jQuery('.startLoader').outerWidth())/2,
		top: (jQuery(window).height() - jQuery('.startLoader').outerHeight())/2
	}).show();
	
	// Запрос списка каналов
	sendCmd( {'COMMAND': 'CMD_GET_CHANNELS_LIST'}, addChannels );
});

jQuery('.btn-getlogs').bind('click', function(){
	jQuery('.btn-getlogs').button('loading');
	alert ('Логика получения логов');
	jQuery('.btn-getlogs').button('reset');
});

jQuery('.nav-list li').live('click', function(){
	// Выбор активного пункта меню
	jQuery('#accordion1 li').removeClass("active");
	jQuery(this).toggleClass('active');
	// Очистка контентной области, анимация загрузки
	jQuery('div.span9').empty();
	jQuery('<div></div>').addClass('contentLoaderWrap').appendTo(jQuery('div.span9'));
	// Отправка запроса параметров модуля 
	// http://localhost:75/?action=command&COMMAND=CMD_GET_PARAMS&CHANNEL_ID=501&MODULE_NAME=ICH264
	sendCmd( {'COMMAND': 'CMD_GET_PARAMS', 'CHANNEL_ID': jQuery(this).attr('chanid'), 'MODULE_NAME': jQuery(this).attr('modname') }, addParams );
	// Сохранить выбранный модуль
	curMod = jQuery(this).attr('modname');
	curChan = jQuery(this).attr('chanid');
});

jQuery('.accordion-heading').live('click', function(event){
	sendCmd( {'COMMAND': 'CMD_GET_MODULES_LIST', 'CHANNEL_LIST_ID': this.id }, addModules ); //Отправка команды на получение списка модулей канала
});

jQuery('#paramsTable input').live('keydown', function(event) {
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
	
	if ( DATA_TYPES[ curParams[ jQuery(this).attr('id') ].Type ].ALLOW_CHARS.test( val ) )	{ 
		return true;
	} else {
		return false;
	}
/*	
	// Если инпут со слайдером, установить значение слайдера равное значению инпута
	if ( jQuery(this).attr( 'for' ) == 'slider' ) {
		jQuery(this).parent().next().slider( "value", val );
	}
*/	
})

jQuery('#paramsTable input').live('change', function() {
	
	// Удалить сообщения об ошибках
	jQuery(this).parent().removeClass( 'error' );
	jQuery( '.control-group#' + jQuery(this).attr( 'id' ) + ' > .help-inline' ).remove();
	
	// Если цифровой или строковый инпут
	if ( curParams[ jQuery(this).attr('id') ].Type == "DWORD" || curParams[ jQuery(this).attr('id') ].Type == "WORD" || curParams[ jQuery(this).attr('id') ].Type == "INT32" ||
	  curParams[ jQuery(this).attr('id') ].Type == "INT64" || curParams[ jQuery(this).attr('id') ].Type == "FLOAT" || curParams[ jQuery(this).attr('id') ].Type == "DOUBLE" ||
	  curParams[ jQuery(this).attr('id') ].Type == "STRING" ) 
	{
		// Если строка пустая преобразовать в 0
		if ( jQuery.trim( this.value ) == '' ) {
			this.value = 0;
		}

		// Проверка соответсвия всего выражения формату
		if( ! DATA_TYPES[ curParams[ jQuery(this).attr('id') ].Type ].FORMAT.test( this.value ) )	{ 
			// Если нет, то добавить сообщение об ошибке
			if ( !jQuery(this).parent().is( '.error' ) ) {
				jQuery(this).parent().addClass( 'error' );
				jQuery(this).parent().append( '<span class="help-inline">' +  DATA_TYPES[ curParams[ jQuery(this).attr('id') ].Type ].HINT + '</span>' );
			}
			return false;
		} else {
			// Проверка превышения границ значений
			if ( jQuery(this).attr( 'for' ) == 'slider' ) {
				// Проверить превышение границ диапозона значений, если есть превышение, то значение прировнять к граничному
				if ( parseInt( this.value ) < parseInt( curParams[ jQuery(this).attr('id') ].Min ) ) {
					this.value = curParams[ jQuery(this).attr('id') ].Min;
				} else if ( parseInt( this.value ) > parseInt( curParams[ jQuery(this).attr('id') ].Max ) ) {
					this.value = curParams[ jQuery(this).attr('id') ].Max;
				}
				// Установить значение слайдера равное значению инпута
				jQuery('.control-group#' + jQuery(this).attr( 'id' ) + ' #slider-range-min').slider( "value", this.value );
			} else if ( parseInt( this.value ) < parseInt( DATA_TYPES[ curParams[ jQuery(this).attr('id') ].Type ].MIN ) ) {
				jQuery(this).parent().addClass( 'error' );
				jQuery(this).parent().append( '<span class="help-inline">Минимальное значение для этого параметра: ' + DATA_TYPES[ curParams[ jQuery(this).attr('id') ].Type ].MIN + '</span>' );
			} else if ( parseInt( this.value ) > parseInt( DATA_TYPES[ curParams[ jQuery(this).attr('id') ].Type ].MAX ) ) {
				jQuery(this).parent().addClass( 'error' );
				jQuery(this).parent().append( '<span class="help-inline">Максимальное значение для этого параметра: ' + DATA_TYPES[ curParams[ jQuery(this).attr('id') ].Type ].MAX + '</span>' );
			}
		}

		newParams[ jQuery(this).attr('id') ].Value = this.value;
	}
	else if ( curParams[ jQuery(this).attr('id') ].Type == "BOOL" ) { // Если чекбокс
		newParams[ jQuery(this).attr('id') ].Value = this.checked;
	}
	
	// Сделать кнопку сохранения изменения активной
	jQuery('#saveBtn').removeClass('disabled').removeAttr('disabled');
	
	return true;
})

jQuery('#paramsTable select').live('change', function() {
		
	newParams[ jQuery(this).attr('id') ].Value = this.value;
	jQuery('#saveBtn').removeClass('disabled').removeAttr('disabled');
	
	return true;
})

jQuery('#saveBtn').live('click', function () {
	if ( !jQuery(this).is('.disabled') ) {
		
		// Включить анимацию отправки данных
		jQuery('.span9').children().fadeOut(0);
		jQuery('<div></div>').addClass('contentLoaderWrap').appendTo(jQuery('div.span9'));
		
		// Отправить команду на установку параметров
		var cmd = {};
		cmd['COMMAND'] = 'CMD_SET_PARAMS';
		cmd['CHANNEL_ID'] = "dw:" + newParams.CHANNEL_ID.Value;
		cmd['MODULE_NAME'] = "s:'" + getCurModParam(curMod).NAME.Value + "'";
		jQuery.each( newParams, function(key, val) {
			if ( key != "RESULT" && key != "CHANNEL_ID" ) {
				if ( val.Type == 'STRING' )  {
					cmd[key] = DATA_TYPES[ val.Type ].ABBREVIATED_NAME + ":'" + encodeURIComponent(val.Value) + "'";
				} else {
					cmd[key] = DATA_TYPES[ val.Type ].ABBREVIATED_NAME + ":" + encodeURIComponent(val.Value);
				}
			}
		});
		sendCmd( cmd, cbSetParams );
	}
});

jQuery('#returnArrow').live('click', function () {
	
	// Поиск и получение соответствующего инпута
	var parent = jQuery( 'td#' + jQuery(this).attr('for') );
	var input = jQuery(parent).find( '#' + jQuery(this).attr('for') )[0];
	
	// Отмена изменений
	if ( input.tagName == 'SELECT' && input.value != curParams[ jQuery(this).attr('for') ].Value ) { // Если выбранный инпут типа селект
		
		// Найти опцию с соответствующим значением и установить выбранной
		var i = 0;
		while ( i < input.childNodes.length && input.childNodes[i].value != curParams[ jQuery(this).attr('for') ].Value ) {
			i++;
		}
		if ( i == input.childNodes.length ) {
			myAlert( 'ERROR', 'Неправильное значение опции списка', 'alert-error' );
			console.log( 'ERROR: Попытка установить выбранным значение ' + curParams[ jQuery(this).attr('for') ].Value + ', которого нет в списке опций селекта' );
		}
		else {
			// Отменить изменения в форме
			input.childNodes[i].selected = true;
			
			// Отменить изменения в переменных
			newParams[ jQuery(this).attr('for') ].Value = curParams[ jQuery(this).attr('for') ].Value;
		}
	}
	else if ( input.type == 'checkbox' && input.checked != curParams[ jQuery(this).attr('for') ].Value ) { // Checkbox
		
		// Отменить изменения в форме
		input.checked = curParams[ jQuery(this).attr('for') ].Value;
		
		// Отменить изменения в переменных
		newParams[ jQuery(this).attr('for') ].Value = curParams[ jQuery(this).attr('for') ].Value;
	}
	else if ( input.value != curParams[ jQuery(this).attr('for') ].Value ) { // Все остальные инпуты
		input.value = curParams[ jQuery(this).attr('for') ].Value; 	// .val( curParams[ jQuery(this).attr('for') ].Value ); 
		
		// Отменить изменения в переменных
		newParams[ jQuery(this).attr('for') ].Value = curParams[ jQuery(this).attr('for') ].Value;
		
		// Сгенерировать событие change для изменения значения слайдера
		jQuery(input).trigger('change');								//jQuery( 'td#' + jQuery(this).attr('for') ).find( '#' + jQuery(this).attr('for') ).trigger('change');
	}
});

// Обработка ответа команды SET_PARAMS
function cbSetParams(data) {
	
	// Удалить анимацию отправки и показать таблицу с параметрами
	jQuery('.contentLoaderWrap').remove();
	jQuery('.span9').children().fadeIn(100);
	
	// Вывести сообщение с результатом операции
	if ( !data.RESULT ) {
		myAlert( 'ERROR', 'Неверный формат ответа', 'alert-error' );
	
	} else if (data.RESULT.Value.CODE.Value == 0) { // Успешное сохранение изменений
		
		myAlert( data.RESULT.Value.TEXT.Value, data.RESULT.Value.MESSAGE.Value, 'alert-success' ); 
		
		// Деактивация кнопки "Сохранить изменения"
		jQuery( '#saveBtn' ).addClass('btn disabled').attr( 'disabled', 'disabled' );
		
		// Установить дефолтные значения в отправленные
		curParams = null;
		curParams = jQuery.extend( true, curParams, newParams ); // Рекурсивное клонирование объекта
	} 
	else { // fail
		myAlert( data.RESULT.Value.TEXT.Value, data.RESULT.Value.MESSAGE.Value, 'alert-error' );
	}
}

// Создание HTMl кода для параметров камеры
function addParams(data) {
	
	// Очистка основного контейнера
	jQuery('div.span9').empty();
	
	// Если запрос выполнен успешно
	if (data.RESULT.Value.CODE.Value == 0) {
		
		// Проверка полученных данных
		for ( var key in data ) {
			if ( DATA_TYPES[ data[key].Type ] == undefined )  {
				myAlert( 'ERROR', 'Неизвестный тип данных: ' + data[key].Type + ', у параметра: ' + key, 'alert-error' );
				return false;
			}
		}
		
		// Создание страницы
		jQuery('<div></div>').addClass('page-header').appendTo( jQuery('div.span9') );
		jQuery('<table><thead><tr><th>Параметр</th><th>Значение</th><th>Сбросить</th></tr></thead><tbody></tbody></table>').addClass('table table-bordered table-striped').attr('id', 'paramsTable').appendTo( jQuery('div.span9') );
		
		// Выводить название и комент модуля из хранимых данных
		jQuery('<h1>'+ getCurModParam(curMod).COMMENT.Value +'</h1>').appendTo( jQuery('div.page-header') );
		
		// Создание и заполнение таблицы с параметрами
		jQuery.each(data, function(key, val){
			if (key == "CHANNEL_ID") {
				// TODO: Можно сравнивать его с id выбранного канала
			} else if (key != "RESULT") { 
				
				// Создать ряд таблицы
				var row = jQuery('<tr></tr>').appendTo( jQuery('#paramsTable tbody') );
				
				// Добавить название параметра в таблицу
				jQuery('<td><span>'+ key +'</span></td>').addClass('col1').appendTo( row );
				
				// Создать и добавить контрол для параметра
				var parent = jQuery('<td class="control-group"></td>').addClass('col2').attr( 'id', key ).appendTo( row );
				addControl(parent, key, val);
				
				// Создать и добавить кнопку "отменить"
				parent = jQuery('<td></td>').addClass('col3').appendTo(row);
				//jQuery( '<a href="#"><i class="icon-remove" for="' + key + '"></i></a>' ).appendTo(parent);
				jQuery( '<a href="#"><span id="returnArrow" for="' + key + '" class="ui-icon ui-icon-arrowreturnthick-1-w"></span></a>' ).appendTo(parent);
			}
		});
		
		// Создать и добавить кнопку "Сохранить изменения"
		jQuery('<button>Сохранить изменения</button>').addClass('btn disabled').attr('id', 'saveBtn').attr( 'disabled', 'disabled' ).appendTo( jQuery('div.span9') );
		
		// Сохранение данных в объект.
		curParams = data;
		newParams = null;
		newParams = jQuery.extend( true, newParams, curParams ); // Рекурсивное клонирование объекта
		
	} else {
		myAlert( data.RESULT.Value.TEXT.Value, data.RESULT.Value.MESSAGE.Value, 'alert-error' );
	}
}

// Добавить control для параметра
// parent - элемент родитель для добавления
// paramName - имя параметра
// attrs - экземпляр объекта с аттрибутами параметра камеры
function addControl(parent, paramName, attrs) {
	if (attrs) {
		if (attrs.hasOwnProperty("Enum")) {
			// Создание селекта для любого типа с полем Enum

			// Создать и добавить элемент
			jQuery('<select class="input-large" id="' + paramName + '">').appendTo(parent);

			// Добавить опции електа
			for (var key in attrs.Enum) {
				var opt = jQuery('<option>' + attrs.Enum[key] + '</option>').appendTo('select#' + paramName);
				if ( attrs.Enum[key] == attrs.Value ) {
					opt.attr('selected', 'selected');
				}
			}
		} 
		else if ( attrs.Type == "BOOL" ) {
			// Создание CheckBox
			
			// Создать и добавить элемент
			var checkbox = jQuery( '<input type="checkbox" id="' + paramName + '">' ).appendTo(parent);
			
			// Инициализация
			/*if ( attrs.Value == true ) {
				checkbox[0].disabled = false;
			}
			else {
				checkbox[0].disabled = true;			
			}*/
			checkbox[0].checked = attrs.Value;
		}
		else if (attrs.hasOwnProperty("Min") && attrs.hasOwnProperty("Max")) { 
			// Создание обычного инпута со слайдером для цифровых тпиов
			if ( attrs.Value >= attrs.Min && attrs.Value <= attrs.Max ) { 
				
				// Создать и добавить инпут
				jQuery('<input type="text" for="slider" class="input-small" id="' + paramName + '">').attr( 'value', attrs.Value ).appendTo(parent);

				// Добавление ползунка
				parent = jQuery('<div></div>').addClass('sliderWrap').appendTo(parent);
				jQuery('<div id="slider-range-min"></div>').appendTo(parent).slider({
						range: "min",
						value: attrs.Value,
						min: attrs.Min,
						max: attrs.Max,
						slide: function( event, ui ) {
							jQuery( 'input#' + paramName ).val( ui.value );
							jQuery(this).parent().parent().find( 'input' ).trigger('change');
						}
				});
				//jQuery( 'input#' + paramName ).; // TODO удалить 
			} else {
				jQuery('div.span9').empty();
				myAlert( 'Error', 'Не корректные входные данные. Value находится за диапозоном значений Min Max', 'alert-error' );
				return;
			}
		} 
		else {
			// Создание обычного инпута для цифрового или строкового типа
			/*
			// Создать и добавить контрол
			var input = jQuery('<input type="text" >').attr('value', attrs.Value).attr( 'id', paramName ).appendTo(parent);
			
			// Определить размер поля в зависимости от типа данных
			if ( attrs.Type == 'STRING' ) {
				input.addClass('input-xlarge');
			} else {
				input.addClass('span3');
			}
			*/
			var input = jQuery('<input type="text" />').attr('name', 'date').attr( 'class', 'datepicker' ).appendTo(parent);
		}
		
		
	} // if (attrs)
}

//Добавить модули в меню
function addModules(data) {
	if (data.RESULT.Value.CODE.Value == 0) {
		var chanId;
		if (data.CHANNEL_LIST_ID) {
			chanId = data.CHANNEL_LIST_ID.Value;
			jQuery('#accordion-group' + chanId + ' ul').empty();
			jQuery.each(data.MODULES_LIST.Enum, function(key, val){
				jQuery('<li></li>').attr('chanId', chanId).attr('modName', val.NAME.Value).appendTo(jQuery('#accordion-group' + chanId + ' ul'));
				jQuery('<a>'+val.COMMENT.Value+'</a>').attr('href', '#').appendTo(jQuery("[modName = "+val.NAME.Value+"][chanId = "+chanId+"]")); // jQuery('<a>'+val.NAME.Value+'</a>').attr('href', '#').appendTo(jQuery("[modName = "+val.NAME.Value+"][chanId = "+chanId+"]"));
			});
		}
		else { alert('Нет номера канала'); }
		
		
		// Если collapse раскрыт пересчитать высоту под загруженный контент
		if ( jQuery('#collapse' + chanId).is('.in') ) {
			jQuery('#collapse' + chanId).height( jQuery('#accordion-group' + chanId + ' ul').height() + 19 );
		}
		
		// Сохранение всего списка модулей
		modules = data;
	} else {
		jQuery('<div><h3>' + data.RESULT.Value.TEXT.Value + '</h3><p>' + data.RESULT.Value.MESSAGE.Value + '</p></div>').appendTo( jQuery('div.span9') );
	}
	
	// Отключить анимацию загрузки
	jQuery('#accordion-group' + chanId + ' div.modLoader').hide();
}

//Создание акордеона с каналами, подготовка контейнера для меню модулей
function addChannels(data) {
	if (data.RESULT.Value.CODE.Value == 0) {	
		jQuery.each(data.CHANNELS_LIST.Enum, function(key, val) {
			var parent = document.getElementById('accordion1');
			parent.appendChild(myCreateElement('div',
			  {'class': 'accordion-group', 'id': 'accordion-group' + val.ID.Value }));
			
			parent = document.getElementById( 'accordion-group' + val.ID.Value );
			parent.appendChild(myCreateElement('div',
			  {'class': 'accordion-heading', 'id': val.ID.Value }));
			parent.appendChild(myCreateElement('div',
			  {'class': 'accordion-body collapse', 'id': 'collapse' + val.ID.Value },
			  {'height': '0px'} )); //  {'height': 'auto', 'display': 'none'} ));
			
			parent = document.getElementById( val.ID.Value );
			parent.appendChild(myCreateElement('a',
			  {'class': 'accordion-toggle', 'data-toggle': 'collapse', 'data-parent':'#accordion1', 'href':'#collapse' + val.ID.Value },
			  {},
			  val.COMMENT.Value ));//'Channel #' + val.ID.Value ));
						
			jQuery('<div></div>').addClass('accordion-inner').appendTo(jQuery('#accordion-group' + val.ID.Value + ' > #collapse' + val.ID.Value ));
			jQuery('<ul></ul>').addClass('nav nav-list').appendTo(jQuery('#accordion-group' + val.ID.Value + ' > #collapse' + val.ID.Value + ' > .accordion-inner'));
			jQuery('<div></div>').addClass('modLoader').appendTo(jQuery('#accordion-group' + val.ID.Value + ' div.accordion-inner'));
		});
		// Сохранение всего списка модулей
		channels = data;
	} else {
		jQuery('<div><h3>' + data.RESULT.Value.TEXT.Value + '</h3><p>' + data.RESULT.Value.MESSAGE.Value + '</p></div>').appendTo( jQuery('div.span9') );
	}
	
	// Отключить анимацию инициализации
	jQuery('div.startLoaderWrap').css({ display: 'none' });
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

//Отправить команду на сервер
function sendCmd(params, callback) {
	var cmd = "/?action=command"
	if (params) {
		for (var key in params) {
			cmd += "&";
			cmd += key;
			cmd += "="
			cmd += params[key];
		}
	}
	jQuery.getJSON(cmd, callback).error(function(jqXHR, textStatus, errorThrown) {
		console.log("error " + textStatus);
		console.log("incoming Text " + jqXHR.responseText);

		jQuery('div.span9').empty();

		myAlert( 'Error', 'Ошибка парсинга ответа сервера', 'alert-error' );
	});
}

// Получить экземпляр объекта выбранного модуля
function getCurModParam(modName) {
	var i = 0;
	while ( i < modules.MODULES_LIST.Enum.length && modules.MODULES_LIST.Enum[i].NAME.Value != modName ) {
		i++;
	}
	if ( i >= modules.MODULES_LIST.Enum.length ) { 
		return -1; 
	} else {
		return modules.MODULES_LIST.Enum[i];
	}
}

// Вывод инфомации об ошибке в контентной области
function myAlert(head, msg, alertClass) {
	jQuery('.alert').remove();
	jQuery('<div id="myAlert" class="alert alert-block fade in"><button type="button" class="close" data-dismiss="alert">×</button><h3>' + head + '</h3><p>' + msg + '</p></div>').addClass(alertClass).appendTo( jQuery('div.span9') );
	jQuery('#myAlert').alert();
	jQuery('#myAlert').delay(2000).fadeOut(400);
}

		$(document).ready(function() {
			$('#accordion1').collapse({
			  parent: true,
			  toggle: false
			})
			
			// Анимация инициализации
			$('#black_bg').css("height",$(document).height());
			$('img.startLoader').css({
				position:'absolute',
				left: ($(window).width() - $('.startLoader').outerWidth())/2,
				top: ($(window).height() - $('.startLoader').outerHeight())/2
			}).show();
			
			// Запрос списка каналов
			sendCmd( {'COMMAND': 'CMD_GET_CHANNELS_LIST'}, addChannels );
			
		});

		$('.btn-getlogs').bind('click', function(){
			$('.btn-getlogs').button('loading');
			alert ('Логика получения логов');
			$('.btn-getlogs').button('reset');
		});

		$('.nav-list li').live('click', function(){
			$('#accordion1 li').removeClass("active");
			$(this).toggleClass('active');
			// Добавить запрос параметров и запуск анимации загрузки			
		});

		$('.accordion-heading').live('click', function(event){
			//$(this).next().collapse('reset');
			//$(this).next().collapse('show');
 			sendCmd( {'COMMAND': 'CMD_GET_MODULES_LIST', 'CHANNEL_LIST_ID': this.id }, addModules ); //Отправка команды на получение списка модулей канала
		});
		
		$('#accordion1').on('show', function () {
			//alert ('hello');
		})
		
		function getParams(data) {
		
		}
		
		//Добавить модули в меню
		function addModules(data) {
			var chanId;
			$.each(data, function(key, val){
				if (key == "CHANNEL_LIST_ID") {
					$('#accordion-group' + val + ' ul').empty();
					chanId = val;
				} else if (key == "MODULE_NAME") {
					$('<li></li>').appendTo($('#accordion-group' + chanId + ' ul'));
					$('<a>'+val+'</a>').attr('href', '#').appendTo($('#accordion-group' + chanId + ' li'));
				}
			});
		}

		//Создание акордеона с каналами, подготовка контейнера для меню модулей
		function addChannels(data) {
			$.each(data, function(key, val){
				var parent = document.getElementById('accordion1');
				parent.appendChild(myCreateElement('div',
				  {'class': 'accordion-group', 'id': 'accordion-group' + String(val) }));
				
				parent = document.getElementById( 'accordion-group' + String(val) );
				parent.appendChild(myCreateElement('div',
				  {'class': 'accordion-heading', 'id': String(val) }));
				parent.appendChild(myCreateElement('div',
				  {'class': 'accordion-body collapse', 'id': 'collapse' + val },
				  {'height': '0px',} )); //  {'height': 'auto', 'display': 'none'} ));
				
				parent = document.getElementById( String(val) );
				parent.appendChild(myCreateElement('a',
				  {'class': 'accordion-toggle', 'data-toggle': 'collapse', 'data-parent':'#accordion1', 'href':'#collapse' + val },
				  {},
				  'Channel #' + String(val) ));
							
				$('<div></div>').addClass('accordion-inner').appendTo($('#accordion-group' + val + ' > #collapse' + val));
				$('<ul></ul>').addClass('nav nav-list').appendTo($('#accordion-group' + val + ' > #collapse' + val + ' > .accordion-inner'));
			});
			$('div.startLoaderWrap').css({ display: 'none' });
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
			$.getJSON(cmd, callback);
			/*$.ajax({
				url: cmd,         					   // указываем URL и
				dataType : "json",                     // тип загружаемых данных
				success: callback
			});*/
		}

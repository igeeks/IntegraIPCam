var curParams, newParams, curChanID, curMod, channels, modules;

var DATA_TYPES = {
    DWORD: {
        MIN:                0,
        MAX:                4294967295,
        ALLOW_CHARS:        /\d/,
        FORMAT:             /^\d+$/,
        HINT:               "Можно использовать только цифры",
        ABBREVIATED_NAME:   "dw"
    },
    WORD: {
        MIN:                0,
        MAX:                65535,
        ALLOW_CHARS:        /\d/,
        FORMAT:             /^\d+$/,
        HINT:               "Можно использовать только цифры",
        ABBREVIATED_NAME:   "w"
    },
    INT32: {
        MIN:                -2147483648,
        MAX:                2147483647,
        ALLOW_CHARS:        /[\+\-\d]/,
        FORMAT:             /(^[\+\-\d]\d+$|^\d+$)/,
        HINT:               "Формат данных: -123456",
        ABBREVIATED_NAME:   "i32"
    },
    INT64: {
        MIN:                -9223372036854775808,
        MAX:                9223372036854775807,
        ALLOW_CHARS:        /[\+\-\d]/,
        FORMAT:             /(^[\+\-\d]\d+$|^\d+$)/,
        HINT:               "Формат данных: -123456",
        ABBREVIATED_NAME:   "i64"
    },
    FLOAT: {
        MIN:                3.4e-38,
        MAX:                3.4e38,
        ALLOW_CHARS:        /[\d\.]/,
        FORMAT:             /(^\d+\.\d+$|^\d+$)/,
        HINT:               "Формат данных: 0.123456",
        ABBREVIATED_NAME:   "f"
    },
    DOUBLE: {
        MIN:                1.7e-308,
        MAX:                1.7e308,
        ALLOW_CHARS:        /[\d\.]/,
        FORMAT:             /(^\d+\.\d+$|^\d+$)/,
        HINT:               "Формат данных: 0.123456",
        ABBREVIATED_NAME:   "dbl"
    },
    STRING: {
        ALLOW_CHARS:        /./,
        FORMAT:             /(^.*$)/,
        HINT:               "Формат данных строка",
        ABBREVIATED_NAME:   "s"
    },
    FOURCC: {
        ALLOW_CHARS:        /./,
        FORMAT:             /(^.*$)/,
        HINT:               "Формат данных строка",
        ABBREVIATED_NAME:   "fcc"
    },
    DATETIME: {
        ALLOW_CHARS:        /[\d\.\/\s\:]/,
        FORMAT:             /(^.*$)/,
        HINT:               "Формат данных: 00/00/0000 00:00:00.000",
        ABBREVIATED_NAME:   "dt"
    },
    BOOL: {
        ABBREVIATED_NAME:   "b"
    },
    FILE: {
        // TODO пока это только заглушка
    },
    TEXT: {
        ALLOW_CHARS:        /./,
        FORMAT:             /.*/,
        HINT:               "Формат данных строка",
        ABBREVIATED_NAME:   "text"
    },
    BUTTON: {},
    DATA: {
        // TODO пока это только заглушка
    },
    DATE: {
        // TODO пока это только заглушка
    },
    TIME: {
        // TODO пока это только заглушка
    },
    PARAMS: {
        // Ответ сервера.
    }
}

// ============================== Параметры

// Конструктор объекта с параметрами
function Params(data) {
    var params = _get_params(data);

    if ( ! $.isEmptyObject( params ) ) {
        for ( var key in params ) {
            this[key] = $.extend( true, this[key], params[key] );
        }
    }

    // Получить параметры обычного типа отсортированными
    this.get_sorted_params = function () {
        var keys = new Array();

        var params = this.get_data_params();
        for ( var key in params ) {
            keys[keys.length] = key;
        }

        keys.sort( function (a, b){
            var aObj = new Param( curParams, a );
            var bObj = new Param( curParams, b );
            
            if ( aObj.get_priority() < bObj.get_priority() )
                return -1
            if ( aObj.get_priority() > bObj.get_priority() )
                return 1
            // в случае а = b вернуть 0
            return 0
        });

        params = new Object();
        for ( var i in keys) {
            var key = keys[i];
            var val = this.get_param( key );
            params[key] = val;
        }

        return params;
    }

    // Возвращает параметры
    // кроме файлов и служебных данных
    this.get_data_params = function () {
        var result = {};

        for ( var key in this ) {
            if (
                key != "HIDDEN"
                &&
                key != "RESULT"
                &&
                ! $.isFunction( this[key] )
            ) {
                result[key] = this[key];
            }
        }

        return result;
    }

    // Возвращает параметры типа FILE
    this.get_files_params = function () {
        var result = {};

        for ( var key in this ) {
            var param = new Param( this, key );

            if (
                param.get_type() == "FILE"
            ) {
                result[key] = this[key];
            }
        }

        return result;
    }

    this.set_param = function (param, value) {
        this[param].VALUE = value;
    }

    this.get_param = function (param) {
        return this[param];
    }
}


// Конструктор объекта параметра
function Param( paramsObj, paramName ) {
    for ( var key in paramsObj[paramName] ) {
        this[key] =
            $.isPlainObject( paramsObj[paramName][key] ) ?
                $.extend( true, this[key], paramsObj[paramName][key] ) :
                paramsObj[paramName][key];
    }

    // Можно ли отменять изменение параметра
    this.is_cancelable = function () {
        if (
            this.TYPE !== "BUTTON"
            &&
            this.TYPE !== "FILE" 
        ) {
            return 1;
        }
        else {
            return 0;
        }
    }

    // Получить тип параметра
    this.get_type = function () {
        return this !== undefined ?
            this.TYPE :
            undefined;
    }

    // Получить коммент параметра
    this.get_comment = function (param) {
        return this.COMMENT !== undefined ?
            this.COMMENT :
            param;
    }

    // Получить приоритет параметра
    this.get_priority = function (param) {
        return this !== undefined ?
            this.PRIORITY :
            9999; // Если нет приорита - в конец списка    
    }
}


// ============================== Работа с остальными данными

var Error_code;

// Возвращает все параметры из ответа сервера
function _get_params(data) {
    var result = {};

    for ( var key in data ) {
        if (
            key != "HIDDEN"
            &&
            key != "RESULT"
        ) {
            result[key] = data[key];
        }
    }

    return result;
}

// Проверка полученных данных от сервера
function check_data(data) {
    for ( var key in data ) {
        if ( DATA_TYPES[ data[key].TYPE ] == undefined )  {
            Error_code = 'Неизвестный тип данных: ' + data[key].TYPE + ', у параметра: ' + key;

            return;
        }

        // Названия параметров не должны содержать пробелы
        if ( /\s+/.test( key ) ) {
            Error_code = 'Ошибка парсинга ответа сервера: имена свойств должны быть без пробелов, параметр: ' + key;

            return;
        }
    }

    return true;
}

function check_result(data) {
    return data.RESULT.VALUE.CODE.VALUE == 0;
}

function get_cur_mod_comment() {
    return getCurModParam(curMod).COMMENT.VALUE;
}

// Получить экземпляр объекта выбранного модуля
function getCurModParam(modName) {
    var i = 0;
    while ( i < modules.MODULES_LIST.ENUM.length && modules.MODULES_LIST.ENUM[i].NAME.VALUE != modName ) {
        i++;
    }
    if ( i >= modules.MODULES_LIST.ENUM.length ) {
        return -1;
    } else {
        return modules.MODULES_LIST.ENUM[i];
    }
}


var curParams, newParams, curChan, curMod, channels, modules;

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
        // TODO пока это только заглушка
    },
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

var Error_code;

// ================== Провека данных

// Проверка полученных данных
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

// ================== Свойства
function get_param_type(param) {
    return param.TYPE;
}

// ================== Работа с данными

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

// Возвращает параметры
// кроме файлов и служебных данных
function get_params(data) {
    var result = {};

    for ( var key in data ) {
        if (
            key == "CHANNEL_ID" ||
            key == "RESULT" ||
            get_param_type( data[key] ) == "FILE"
        ) {
            continue;
        }
        else {
            result[key] = data[key];
        }
    }

    return result;
}

// Возвращает параметры типа FILE
function get_files_params(data) {
    var result = {};

    for ( var key in data ) {
        if (
            get_param_type( data[key] ) == "FILE"
        ) {
            result[key] = data[key];
        }
    }

    return result;
}

function get_cur_mod_comment() {
    return getCurModParam(curMod).COMMENT.VALUE;
}

function get_param_comment(param, data) {
    return data[param].COMMENT !== undefined ? 
        data[param].COMMENT : 
        param;
}


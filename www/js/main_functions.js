
// ========================= Video =========================
var widthRes = 0;
var heightRes = 0;
var resizeBtn = true;

function fullScrin(){
    $(window).scrollTop(0); 
    var pObj = $('#resizeObl');
    var pObjEmbd = $('#video_container');
    widthRes = pObjEmbd.width();
    heightRes = pObjEmbd.height();
    pObj.css("position", "absolute");
    pObj.css("z-index", "8999");
    pObj.width(video_container.picwidth);
    pObj.height(video_container.picheight);
    pObjEmbd.width(video_container.picwidth);
    pObjEmbd.height(video_container.picheight);
}
function miniScrin(){
    var pObj = $('#resizeObl');
    var pObjEmbd = $('#video_container');
    pObj.css({left:'', top:''});
    pObj.width(widthRes);
    pObj.height(heightRes);
    pObjEmbd.width(widthRes);
    pObjEmbd.height(heightRes);
    pObj.css("position", "");
    pObj.css("z-index", "");
}
function ResizeEmbed(){
    if (resizeBtn)
        fullScrin();
    else
        miniScrin();
    resizeBtn = !resizeBtn;
    video_container.Resize();
}

function ScreenEmbed1(){
    $(window).scrollTop(0); 
    var pObjEmbd = $('#video_container');
    pObjEmbd.width(video_container.picwidth*2);
    pObjEmbd.height(video_container.picheight*2);
}
function ScreenEmbed2(){
    $(window).scrollTop(0); 
    var pObjEmbd = $('#video_container');
    pObjEmbd.width(video_container.picwidth);
    pObjEmbd.height(video_container.picheight);
}
function ScreenEmbed3(){
    $(window).scrollTop(0); 
    var pObjEmbd = $('#video_container');
    pObjEmbd.width(video_container.picwidth/2);
    pObjEmbd.height(video_container.picheight/2);
}
function ScreenEmbed4(){
    $(window).scrollTop(0); 
    var pObjEmbd = $('#video_container');
    pObjEmbd.width(320);
    pObjEmbd.height(240);
}
function ScreenNewURL(url){
    $(window).scrollTop(0);  
    var pObjEmbd = $('#video_container');
    pObjEmbd.url=url;
}

// ========================= Page logic =========================
$(document).ready(function() {
    // �������� �������������
    show_loader('init', '��������');

    // ��������� �������� �������������
    hide_loader('init');
});

// ��������� ������ ������� SET_PARAMS
function cbSetParams(data) {
    
    // ������� �������� �������� � �������� ������� � �����������
    hide_loader('send');
    
    // ������� ��������� � ����������� ��������
    if ( !data.RESULT ) {
        myAlert( 'ERROR', '�������� ������ ������', 'alert-error' );
    
    } else if (data.RESULT.VALUE.CODE.VALUE == 0) { // �������� ���������� ���������
        
        myAlert( data.RESULT.VALUE.TEXT.VALUE, data.RESULT.VALUE.MESSAGE.VALUE, 'alert-success' ); 
        
        // ����������� ������ "��������� ���������"
        $( '#saveBtn' ).addClass('btn disabled').attr( 'disabled', 'disabled' );
        
        // ���������� ��������� �������� � ������������
        curParams = null;
        curParams = $.extend( true, curParams, newParams ); // ����������� ������������ �������
    } 
    else { // fail
        myAlert( data.RESULT.VALUE.TEXT.VALUE, data.RESULT.VALUE.MESSAGE.VALUE, 'alert-error' );
    }
}
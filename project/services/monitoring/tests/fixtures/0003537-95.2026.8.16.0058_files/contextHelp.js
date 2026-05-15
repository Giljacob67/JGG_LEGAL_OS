/*
 * Parte do componente de ajuda de contexto do sistema.
 * 
 * A função showContextHelp(title, iconStyle, position, url), invocada pelo link criado por ContextHelpLinkTag.java, é responsável por capturar a div "draggablePopupHelp" 
 * inserida em normal-layout.jsp, que é um objeto "Draggable" (arrastável, ver /js/window/effects.js), a exibir sobre a janela atual.
 *  
 * O conteúdo do popup é composto na mesma função por:
 * - barra de título com botões de "copiar conteúdo", "abrir em nova aba" e "fechar";
 * - contêiner para o conteúdo de ajuda, que será obtido via ajax (ver ContextHelpAction.java);
 * - 'title' define o título do popup;
 * - 'iconStyle' pode ser 'HELP' (default), 'INFO' ou 'ALERT', e irá exibir o ícone do popup para um destes estilos;
 * - 'position' pode ser 'LEFT' ou 'RIGHT' (default), para definir o lado da janela em que o popup será exibido;
 * - 'url' é a action criptografada para o Ajax GET que irá obter o conteúdo da ajuda.
 * 
 * Estilos CSS estão definidos em css/contextHelp.css.
 * 
 * @author mgob
 */

var _popupId = 'draggablePopupHelp';//em contextHelpPopup.html
var _titleBarId = 'popupHelpTitleBar';//em contextHelpPopup.html
var _containerId = 'popupHelpContainer';//em contextHelpPopup.html
var _infoIcon = '/img/themes/olive/contextHelp/infoIcon.png';
var _helpIcon = '/img/themes/olive/contextHelp/helpIcon.png';
var _alertIcon = '/img/themes/olive/contextHelp/alertIcon.png';
var _copyIcon = '/img/themes/olive/iCopy.gif';
var _openIcon = '/img/themes/olive/iButtonMax.gif';
var _closeIcon = '/img/themes/olive/iClose.gif';
var _rightSideOffset = -425;//px
var _cookie = 'showContextHelp';
var _defaultOptions = {
		title: 'Ajuda',
		iconStyle: 'HELP',
		position: 'RIGHT',
		top: null,
		left: null,
		width: null,
		height: null
	};

/**
 * Exibe o popup e escreve o conteúdo da ajuda obtido por Ajax GET com ajaxGetHelpResource(parentDoc, container, url).
 * @param title Título do popup (default: 'Ajuda').
 * @param iconStyle 'HELP' (default), 'INFO' ou 'ALERT', para o estilo do ícone.
 * @param position 'LEFT' ou 'RIGHT' (default), lado da tela onde o popup será exibido.
 * @param url Action criptografada para obter o conteúdo da ajuda com Ajax GET. 
 */
function showContextHelp(event, url, options){
	if (options == null)
		options = _defaultOptions;
	var popup = document.getElementById(_popupId);
	var parentDoc = document;
	//Caso a div de popup não esteja no mesmo document que invocou o método, procura nos documentos pais:
	var max = 0;//evita 
	while (popup == null && max < 10){
		parentDoc = window.parent.document;
		popup = parentDoc.getElementById(_popupId);
		max++;
	}
	if (max == 10){
		alert("Não foi possível exibir o conteúdo de ajuda.");
		return;
	}
	
	//Barra de botões
	titleBar = parentDoc.getElementById(_titleBarId);
	//Container para o conteúdo, que será obtido via ajax:
	container = parentDoc.getElementById(_containerId);
	//ID do recurso (para evitar conflito entre helps)
	internalID = parentDoc.getElementById(_popupId+'_internalID');
	
	if (popup.style.display == '') {
		//Verifica se o popup do mesmo recurso já está aberto:
		if (internalID.value == url){//hidden 'internalID'
			closePopupHelp(popup, parentDoc);
			return;
		}else {
			//É de outro recurso, então limpa o conteúdo para carregar o novo recurso:
			titleBar.innerHTML = '';
			container.innerHTML = '';
			popup.style.width = null;
			popup.style.height = null;
		}
	}

	//ID
	internalID.value = url;
	
	//Barra de título:
	//Ícone do popup (info, help, alert)
	iconURL = '';
	if (options.iconStyle == 'INFO')
		iconURL = _infoIcon;
	else if (options.iconStyle == 'HELP')
		iconURL = _helpIcon;
	else if (options.iconStyle == 'ALERT')
		iconURL = _alertIcon;
	else //default
		iconURL = _infoIcon;
	icon = parentDoc.createElement('img');
	icon.className = 'popupTitle';
	icon.src = getContextPath() + iconURL;
	icon.alt = '';
	icon.title = '';
	
	//Cria o título com o texto informado, ou se não informado, 'Ajuda":
	titleText = parentDoc.createElement('span');
	titleText.className = 'popupTitle';
	titleText.innerHTML = options.title;
	
	//ícone de copiar conteúdo html para a área de transferência
	copyImg = parentDoc.createElement('img');
	copyImg.className = 'button';
	copyImg.src = getContextPath() + _copyIcon;
	copyImg.alt = 'Copiar';
	copyImg.title = 'Copiar texto';
	copyImg.onclick = function (e){
		ta = parentDoc.createElement('textarea');
		ta.value = parentDoc.getElementById(_containerId).innerText;
		popup.appendChild(ta);//é preciso ativar o textarea para que o comando 'copy' funcione
		ta.select();
		var successfull = parentDoc.execCommand('copy');
		popup.removeChild(ta);//remove para não exibir o elemento desnecessáriamente no popup.
	}
	
	//ícone de abrir em nova aba
	openImg = parentDoc.createElement('img');
	openImg.className = 'button';
	openImg.src = getContextPath() + _openIcon;
	openImg.alt = 'Abrir';
	openImg.title = 'Abrir em nova aba do navegador';
	openImg.onclick = function (e){
		window.open(url + '&openWindow=true');
	}
	
	//ícone de fechar
	closeImg = parentDoc.createElement('img');
	closeImg.className = 'button';
	closeImg.src = getContextPath() + _closeIcon;
	closeImg.alt = 'Fechar';
	closeImg.title = 'Fechar';
	closeImg.onclick = function (e){
		closePopupHelp(popup, parentDoc);
	};
	
	titleBar.appendChild(icon);
	titleBar.appendChild(titleText);
	titleBar.appendChild(closeImg);
	titleBar.appendChild(openImg);
	titleBar.appendChild(copyImg);
	
	//Posicionamento e tamanho do popup:
	var rect = parentDoc.documentElement.getBoundingClientRect();
	var scrollTop = parentDoc.documentElement.scrollTop? parentDoc.documentElement.scrollTop : parentDoc.body.scrollTop;
	var scrollLeft = parentDoc.documentElement.scrollLeft? parentDoc.documentElement.scrollLeft : parentDoc.body.scrollLeft;
	container.style.maxHeight = (rect.height - 100) + 'px';//altura máxima interna
	
	//se foram informados top e left, posiciona absolutamente nesta coordenada e exibe sem o efeito Move.
	if (options.top && options.left){
		popup.style.top = parseInt(options.top) - scrollTop + 'px';
		popup.style.left = parseInt(options.left) - scrollLeft + 'px';
		if (options.width)
			popup.style.width = options.width;
		if (options.height)
			popup.style.height = options.height;
		
		//Exibe sem efeito:
		popup.style.display = '';
	}else {
		//caso contrário, posiciona de acordo com a opção "position":
		left = rect.left + scrollLeft;
		right = rect.right + _rightSideOffset;
	 	popup.style.top = scrollTop + 'px';
	 	options.top = (scrollTop + 25) + 'px';//guarda a posição top, já considerando o Effect.Move
	 	
	 	moveY = 25;
	 	moveX = -25;//default RIGHT
	 	if (options.position.toUpperCase() == 'LEFT'){
	 		popup.style.left = left + 'px';
	 		moveX = 25;
	 	}else {//default: RIGHT
	 		popup.style.left = right + 'px';
	 		moveX = -25;
	 	}
	 	options.left = parseInt(popup.style.left) + moveX + 'px';//guarda a posição left, já considerando o Effect.Move
	 	
	 	//Exibe com efeitos:
		new Effect.Parallel([//sincroniza para melhorar o efeito:
		    new Effect.Opacity(popup, { sync: true, from: 1.0, to: 0.5}),
	 		new Effect.Move(popup, { sync: true, x: moveX, y: moveY}),
			new Effect.Appear(popup, {sync: true})
			], {duration: 1});

	}
	
 	//Obtém o conteúdo via ajax com a URL informada:
 	ajaxGetHelpResource(parentDoc, container, url);
 	//Salva parâmetro no cookie para reabrir o popup em caso de refresh da página:
 	setCookie(url, options);
}

function closePopupHelp(popup, _document){                                                                                                                                                                     
	popup.style.display = 'none';
	//Barra de botões
	titleBar = _document.getElementById(_titleBarId);
	//Container para o conteúdo, que será obtido via ajax:
	container = _document.getElementById(_containerId);
	//ID do recurso (para evitar conflito entre helps)
	internalID = _document.getElementById(_popupId+'_internalID');
	titleBar.innerHTML = '';
	container.innerHTML = '';
	popup.style.width = null;
	popup.style.height = null;
	killCookie(_document);//limpa o cookie para não reabrir com refresh da página
}

/**
 * Ajax GET para obter o conteúdo da ajuda. Exibe uma imagem de status até o conteúdo ser completamente obtido.
 * @param parentDoc
 * @param container
 * @param url
 */
function ajaxGetHelpResource(parentDoc, container, url){
	//Invoca o ajax para trazer o conteúdo
    var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function() {
		if (this.readyState != 4 && this.status != 200) {
			container.innerHTML = '';//limpa o conteúdo
			//ícone de status
			i = parentDoc.createElement("img");
			i.src = getContextPath() + '/img/themes/olive/loader.gif';
			i.style.width = '20px';
			i.alt = 'Aguarde...'
			i.title = 'Aguarde...';
			container.appendChild(i);
		} else if (this.readyState == 4 && this.status == 200) {
			if (this.responseXML){
				//XML
				console.log(this.responseXML);
				xmlDoc = this.responseXML;
				//verifica se é CDATA: o componente ajax:callout recebe no response sempre um XML cujo valor é um CDATA inserido em uma tag 'item'. 
				//A tag tem dois filhos, 'name', e 'value', este último contendo o CDATA.
				cdataItem = xmlDoc.getElementsByTagName('item');//name = '<![CDATA[ ]]>'
				console.log(cdataItem);
				if (cdataItem.length > 0 && cdataItem[0].childNodes[0].innerHTML == '<![CDATA[ ]]>'){
					container.innerHTML = cdataItem[0].childNodes[1].childNodes[0].data;
			    }else {
			    	//Não tem CDATA, então tenta interpretar o conteúdo XML como XHTML, diretamente no innerHTML do container:
			    	container.innerHTML = this.responseText;
			    }
			}else 
				container.innerHTML = this.responseText;
		}
	}

	xmlhttp.open('GET', url, true);
	xmlhttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
	xmlhttp.send('&rid=' + Math.random());
}

/**
 * Reabre o popup em caso de o usuário ter navegado para outra action ou ter feito um refresh da página.
 * Obtém de um cookie os valores necessário para invocar showContextHelp() novamente.
 */
function reOpenContextHelp(){
    cvalue = getCookieValue();
    if (cvalue){
    	params = cvalue.split('|');
    	url = params[0].split(':')[1];
    	options = JSON.parse(params[1]);
    	showContextHelp(null, url, options);
    }
}

function updatePopupPosition(popup){
	cvalue = getCookieValue();
	if (cvalue){
	    params = cvalue.split('|');
	    url = params[0].split(':')[1];
	    options = JSON.parse(params[1]);
		options.top = popup.style.top;
		options.left = popup.style.left;
		options.width = popup.style.width;
		options.height = popup.style.height;
		setCookie(url, options);
	}
}

function setCookie(url, options){
	var d = new Date();
    d.setTime(d.getTime() + (60*60*1000));//1h
    var expires = "expires="+ d.toUTCString();
    var cvalue = 'url:' + url + '|' + JSON.stringify(options);
    document.cookie = _cookie + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookieValue(){
	var name = _cookie + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
        	return c.substring(name.length, c.length);
        }
    }
    return null;
}

function killCookie(_document){
	_document.cookie = _cookie + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
}
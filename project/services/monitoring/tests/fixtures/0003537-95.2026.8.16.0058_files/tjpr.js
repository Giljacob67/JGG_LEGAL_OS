var myContextPath = ''; function getContextPath() { if(myContextPath == '') { var b = document.URL; b = b.substr(b.indexOf('/', b.indexOf('//') + 2), b.indexOf('/', b.indexOf('/', b.indexOf('//') + 2) + 1)); myContextPath = b.substr(0, b.indexOf('/', 1)); } return myContextPath; }
/**************************************************************************
 * Fun��es JavaScript utilizadas na Interface Padr�o definida para o TJPR *
 **************************************************************************/

/**
 * Adi��o das fun��es trim do String em JavaScript
 */
String.prototype.trim = function() {
	return this.replace(/^\s+|\s+$/g,"");
}
String.prototype.ltrim = function() {
	return this.replace(/^\s+/,"");
}
String.prototype.rtrim = function() {
	return this.replace(/\s+$/,"");
}

/**
 * Fun��o pra abrir/fechar o detalhe de uma linha da pesquisa
 * @param _row linha do detalhe para mostrar ou esconder
 * @param _icon �cone do detalhe aberto/fechado
 */
function showDetail(_row, _icon){
	// recuperar a linha do detalhe a mostrar/esconder
	var trDetail = document.getElementById(_row);
	// recuperar o �cone de mostrar/esconder
	var trIcon = document.getElementById(_icon);
	// alterar para mostrar (none) ou esconder a linha
	trDetail.style.display = (trDetail.style.display=="none" ? "" : "none");
	// alterar para o �cone de abrir (none) ou fechar a linha
	trIcon.src = (trDetail.style.display=="none" ? trIcon.src.replace("iMinus","iPlus") : trIcon.src.replace("iPlus","iMinus"));
	diech9ohTie3();
}

/**
 * Calcula a largura da dlg
 */
function calculateDlgWidth(_width) {
	if( _width == 0 )
		_width = document.body.clientWidth  - 40;
	if( _width > 1000 )
		_width = 1000;
	return _width;	
}

/**
 * Calcula a largura da dlg grande (largura máxima em 96% da área cliente)
 */
function calculateLargeDlgWidth(_width) {
	if( _width == 0 )
		_width = document.body.clientWidth  - 40;
	var maxWidth = window.innerWidth * 0.96;
	if( _width > maxWidth )
		_width = maxWidth;
	return _width;	
}

/**
 * Calcula a altura da dialog
 */
function calculateDlgHeight(_height) {
	if( _height == 0 )	
		_height = document.body.clientHeight - 65;
	if( _height > 565 )
		_height = 565;
	return _height;	
}

/**
 * Calcula a altura da dialog grande (altura máxima em 90% da área cliente)
 */
function calculateLargeDlgHeight(_height) {
	if( _height == 0 )	
		_height = document.body.clientHeight - 65;
	var maxHeight = window.innerHeight * 0.9;
	if( _height > maxHeight )
		_height = maxHeight;
	return _height;	
}

/**
 * Fun��o pra abrir uma janela modal
 * @param _url que ser� aberta
 * @param _title t�tulo da janela
 * @param _width comprimento janela (se igual a zero, faz o c�lculo para de acordo com a �rea cliente)
 * @param _height altura janela (se igual a zero, faz o c�lculo para de acordo com a �rea cliente)
 */
function openDialog(_url, _title, _width, _height) {
	// calcula o tamanho da janela
	if ( _width == null ) {
		_width = window.innerWidth;
	}
	if ( _height == null ) {
		_height = window.innerHeight;
	}
	_width  = calculateDlgWidth(_width);
	_height = calculateDlgHeight(_height);
	
	// cria e exibe a janela
	var win = new Window({className:"tjpr", title:_title,
                          top:20, left:20, width:_width, height:_height,
                          url:_url, minimizable:false, destroyOnClose:true,
						  closable:true	                          
                          });
    win.showCenter(true);
}

/**
 * Fun��o pra abrir uma janela modal grande
 * @param _url que ser� aberta
 * @param _title t�tulo da janela
 * @param _width comprimento janela (se igual a zero, faz o c�lculo para de acordo com a �rea cliente)
 * @param _height altura janela (se igual a zero, faz o c�lculo para de acordo com a �rea cliente)
 */
function openLargeDialog(_url, _title, _width, _height) {
	// calcula o tamanho da janela
	if ( _width == null ) {
		_width = window.innerWidth;
	}
	if ( _height == null ) {
		_height = window.innerHeight;
	}
	_width  = calculateLargeDlgWidth(_width);
	_height = calculateLargeDlgHeight(_height);
	
	// cria e exibe a janela
	var win = new Window({className:"tjpr", title:_title,
                          top:20, left:20, width:_width, height:_height,
                          url:_url, minimizable:false, destroyOnClose:true,
						  closable:true	                          
                          });
    win.showCenter(true);
}

/**
 * Fun��o pra abrir uma janela modal
 * @param _url que ser� aberta
 * @param _title t�tulo da janela
 * @param _width comprimento janela (se igual a zero, faz o c�lculo para de acordo com a �rea cliente)
 * @param _height altura janela (se igual a zero, faz o c�lculo para de acordo com a �rea cliente)
 * @param _percentWidth  percentual do comprimento da janela que se deseja em rela��o a tela atual 
 * @param _PercentHeight percentual da altura da janela que se deseja em rela��o a tela atual 
 */
function openDialogPercent(_url, _title, _width, _height, _percentWidth, _percentHeigth) {
	// calcula o tamanho da janela
	if ( _width == null || _width == 0 ) {
		_width = window.innerWidth;
	}
	if ( _height == null || _height == 0 ) {
		_height = window.innerHeight;
	}
	
	//alert(_width*_percentWidth );
	//alert(_height*_percentHeigth);
	// cria e exibe a janela
	var win = new Window({className:"tjpr", title:_title,
                          top:20, left:20, width:_width*_percentWidth, height:_height*_percentHeigth,
                          url:_url, minimizable:false, destroyOnClose:true,
						  closable:true	                          
                          });
    win.showCenter(true);
}

/**
 * Fun��o pra abrir uma janela modal Maximizada
 * @param _url que ser� aberta
 * @param _title t�tulo da janela
 * @param _width comprimento janela (se igual a zero, faz o c�lculo para de acordo com a �rea cliente)
 * @param _height altura janela (se igual a zero, faz o c�lculo para de acordo com a �rea cliente)
 * @param _closable indica se deve ou n�o exibir o "bot�o" de fechar
 */
function openDialogMaximized(_url, _title, _width, _height, _closable) {
	// calcula o tamanho da janela
	_width  = calculateDlgWidth(_width);
	_height = calculateDlgHeight(_height);
	
	// cria e exibe a janela
	var win = new Window({className:"tjpr", title:_title,
                          top:20, left:20, width:_width, height:_height,
                          url:_url, minimizable:false, destroyOnClose:true,
						  closable:_closable	                          
                          });
    win.showCenter(true);
    win.maximize();
 }

/**
 * Fun��o pra abrir uma janela de loading
 * @param _url que ser� aberta
 */
function openLoadDialog(_url) {
	// calcula o tamanho da janela
	var _width  = calculateDlgWidth(305);
	var _height = calculateDlgHeight(80);
	
	// cria e exibe a janela
	var win = new Window({className:"tjpr", title:"Carregando...",
                          top:20, left:20, width:_width, height:_height,
                          url:_url, maximizable:false, minimizable:false, destroyOnClose:true,
						  closable:false	                          
                          });
    win.showCenter(true);
    return win;
 }

/**
 * Fun��o pra abrir uma janela modal, mas com o "X" dando submit
 * @param _url que ser� aberta
 * @param _title t�tulo da janela
 * @param _width comprimento janela (se igual a zero, faz o c�lculo para de acordo com a �rea cliente)
 * @param _height altura janela (se igual a zero, faz o c�lculo para de acordo com a �rea cliente)
 * @param _parentFormName nome do form pai
 * @param _closeUrl url que ser� executada no submit, para fechar a popup
 */
function openSubmitDialog(_url, _title, _width, _height, _parentFormName, _closeUrl) {
	// calcula o tamanho da janela
	_width  = calculateDlgWidth(_width);
	_height = calculateDlgHeight(_height);
	
	// cria e exibe a janela
	var win = new Window({className:"tjpr", title:_title,
                          top:20, left:20, width:_width, height:_height,
                          url:_url, minimizable:false, destroyOnClose:true,
						  closable:true, closeUrl:_closeUrl, parentFormName:_parentFormName	                          
                          });
    win.showCenter(true);
}

/**
 * Fun��o pra abrir uma nova janela
 * @param _url que ser� aberta
 * @param _title t�tulo da janela
 */
function openWindow(_url, _title, _length, _height) {
	var largura       = parseInt(_length);
	var altura        = parseInt(_height);
	var isChrome      = navigator.userAgent.toLowerCase().indexOf( "chrome" ) != -1;
	var _windowParams = "toolbar=no,status=no,resizable=yes,hotkeys=no,directories=no,location=no,menubar=no,personalbar=no,screenX=0,screenY=0,outerWidth="+ largura +",outerHeight="+ altura +",scrollbars=yes";
	
	//No Google Chrome, n�o funciona passar os parametros adicionais
	if (isChrome)
		_windowParams = "";
	
	var _window = window.open(_url,_title,_windowParams);	
	_window.resizeTo(0,0);
	_window.moveTo(100,100);
	_window.resizeBy(largura,altura);
	return _window;
}

/**
 * Fun��o pra mostrar ou n�o um determinado menu
 * @param _divName bloco do menu e submenus que ser�o mostrados
 * @param _action a��o que realizada mostrar (over) ou  esconder ('out')
 */
function menu(_divName, _action){
	var divMenu = document.getElementById('menu' + _divName);
	var divSubMenu = document.getElementById('sub' + _divName);
	// verificar a a��o realizada
	if(_action=='over') {
		divSubMenu.style.display = "block";
		divMenu.className = 'menubar_hover'; /*'#B5C8DB';*/
		toggleSelects(false);
		
	} else if(_action=='out') {
		divSubMenu.style.display = "none";
		divMenu.className = 'menubar'; /*'#B5C8DB';*/
		toggleSelects(true);
	}
}

/**
 * Fun��o para remover os combo-box quando o menu � aberto 
 * para n�o sobrepor o menu aberto
 * @param show boolean (mostrar ou n�o os combos)
 */
function toggleSelects(show){
	if (navigator.appName == "Microsoft Internet Explorer"){
		var sels = document.getElementsByTagName("SELECT");
	    for (var i = 0; i < sels.length; i++) {
	    	if (show) {
	           	sels[i].style.display = "";
	        } else {
	           	sels[i].style.display = "none";
	        }
		}
	}
}

/**
 * Fun��o pra desabilitar toda a tela (links, bot�es, campos, ...)
 * @see disableLinks()
 * @see disableFormElement()
 */
function disableScreen() {
	// desabilitar os links
	disableLinks();
	// desabilitar os campos inputs
	var _inputs = document.getElementsByTagName('INPUT');
	if(_inputs != null && "" + _inputs != "undefined"){
		for (var i=0; i<_inputs.length; i++) {
			disableFormElement(_inputs[i]);
		}
	}
	// desabilitar os campos select
	var _selects = document.getElementsByTagName('SELECT');
	if(_selects != null && "" + _selects != "undefined"){
		for (var i=0; i<_selects.length; i++) {
		  	disableFormElement(_selects[i]);
		}
	}
	// desabilitar os campos textarea
	var _textareas = document.getElementsByTagName('TEXTAREA');
	if(_textareas != null && "" + _textareas != "undefined"){
		for (var i=0; i<_textareas.length; i++) {
		  	disableFormElement(_textareas[i]);
		}
	}

	//Pintar o fundo dos select2
	if(typeof $jq != 'undefined') {
		$jq(".select2-selection").css('background-color', '#dddddd');
	}
	
	//Pintar o fundo dos componentes multiSelect
	var multiSelects= document.querySelectorAll('.multiselect-input');
	if(multiSelects && multiSelects.length && multiSelects.length > 0){
		for(ms of multiSelects)
			ms.style.background='lightgrey';
	}
}

/**
 * Fun��o para desabilitar todos os links
 */
function disableLinks()	{
	// desabilitar todos os links
	var _links = document.links;
	if(_links != null && "" + _links != "undefined"){
		for(i=0; i<_links.length; i++) {
			document.links[i].style.cursor="wait";
			document.links[i].href="#";
			document.links[i].disabled = true;
			document.links[i].onclick = "javascript:void(0);";
		}
	}
}

/**
 * Fun��o para desabilitar um elemento de formul�rio
 * @param _element elemento de formul�rio pra desabilitar
 */
function disableFormElement(_element) {
	// verificar cada elemento de formul�rio
	switch (_element.type.toLowerCase()) {
   		case 'text': 
	   		_element.readOnly = true;
   			break;
    	case 'password': 
	    	_element.readOnly = true;
    		break;
    	case 'select-one': 
    		_element.style.backgroundColor='#dddddd';
	    	_element.readOnly = true;
    		break;
    	case 'select-multiple': 
	    	_element.readOnly = true;
    		break;
    	case 'radio': 
	    	_element.readOnly = true;
    		break;
   		case 'textarea': 
	   		_element.readOnly = true;
   			break;
   		case 'button': 
   		  	_element.disabled = true;
      		break;
   		case 'reset':
   		  	_element.disabled = true;
      		break;
   		case 'submit':
   		  	_element.disabled = true;
      		break;
   		case 'checkbox':
   			_element.readOnly = true;
    		_element.onclick = function(){return false;}; 		     		
     		break;	   	  	
	}
	// colocar a ampulheta para todos os elementos em espera
	_element.style.cursor= "wait"; 
}

/**
 * Fun��o para limpar as sele�oes de um tela inclusive se existirem campos escondidos
 * @param formName nome do form para remover os seletores escondidos
 * @param selectionName nome do seletor para ser desmarcado
 */
function clearSelection(formName, selectionName){
	// limpar os campos mostrados
	checkAll($(formName)[selectionName], false);
	// remover os campos escondidos de sele��o
	$(formName).getInputs('hidden', selectionName).each(Element.remove);
}

/**
 * Fun��o para selecionar/deselecionar checkboxes
 * @param checkbox um ou v�rios checkbox para serem marcados ou desmarcados
 * @param checked valor booleano indicando se o(s) checkbox(es) devem ser marcados
 */
function checkAll(checkbox, checked) {
	if (checkbox) {
		if (checkbox.length) {
			for (var i=0; i<checkbox.length; i++) {
                checkbox[i].checked = checked;
			}
		} else {
			checkbox.checked = checked; 
		}
	}
}

/**
 * Fun��o para selecionar/deselecionar checkboxes, invertendo a opcao atual do botao
 * @param checkbox um ou varios checkbox para serem marcados ou desmarcados
 * @param button botao indicando o estado do checkbox para sua inversao e inversao do valor do botao  
 */
function invertCheckAll(checkbox, button) {
	if (checkbox) {
		if (checkbox.length) {
			for (var i=0; i<checkbox.length; i++) {
				if(button.value == "Desmarcar Todos")
					checkbox[i].checked = false;
				else
					checkbox[i].checked = true;
			}
		} else {
			if(button.value == "Desmarcar Todos")
				checkbox.checked = false;
			else
				checkbox.checked = true; 
		}
		
		if(button.value == "Desmarcar Todos")
			button.value = "Marcar Todos";
		else
			button.value = "Desmarcar Todos";	
	}
}

/**
 * Fun��o para selecionar/deselecionar checkboxes habilitados
 * @param checkbox um ou v�rios checkbox para serem marcados ou desmarcados
 * @param checked valor booleano indicando se o(s) checkbox(es) devem ser marcados
 */
function checkAllEnable(checkbox, checked) {
	if (checkbox) {
		if (checkbox.length) {
			for (var i=0; i<checkbox.length; i++) {
				if( !checkbox[i].disabled )
                	checkbox[i].checked = checked;
			}
		} else {
			if( !checkbox.disabled )
				checkbox.checked = checked; 
		}
	}
}

/**
 * Fun��o que retorna true se algum checkbox estiver selecionado
 * @param checkbox ou um array de checkbox para verifica��o
 * @return boolean (selecionado ou n�o)
 */
function isAnyChecked(checkbox) {
    if (checkbox) {
        if (checkbox.length) {
            for (var i=0; i<checkbox.length; i++) {
	            if (checkbox[i].type.toLowerCase() == "checkbox" && checkbox[i].checked) {
                    return true;
                }
            }
            return false;
        } else { 
            return checkbox.checked;
        }
    }
    return false;
}

function isAnyCheckedInPages(multibox, qtdItensPaginaAtual){
	var algumSelecionado = false;
	if( multibox ) {
		if(multibox.length == null){//Significa que a p�gina atual s� tem um item e n�o h� nenhum selecionado anteriormente.
			algumSelecionado = multibox.checked;
		}else{
			//Se tem multibox.length > qtdItensPaginaAtual � porque j� foram selecionados outros recursos em outra p�gina
			algumSelecionado = (multibox.length > qtdItensPaginaAtual) || isAnyChecked(multibox);
		}
	}
	return algumSelecionado;
}

function howManyCheckedInPages(multibox, qtdItensPaginaAtual){
	var qtd = 0;
	if( multibox ) {
		if(multibox.length == null){//Significa que a p�gina atual s� tem um item e n�o h� nenhum selecionado em p�ginas anteriores.
			if(multibox.checked){
				qtd = 1;
			}
		}else{
			if(multibox.length > qtdItensPaginaAtual){
				qtd = multibox.length - qtdItensPaginaAtual;//n�mero de itens j� selecionados em p�ginas anteriores.
			}
			qtd += howManyChecked(multibox);//adicionando os itens selecionados na p�gina atual.
		}
	}
	return qtd;
}

/**
 * Fun��o que retorna numero de checkbox selecionados
 * @return int numero de checkbox selecionados
 */
function howManyChecked(checkbox) {
	var num = 0;
    if (checkbox) {
        if (checkbox.length) {
            for (var i=0; i<checkbox.length; i++) {
	            if (checkbox[i].type.toLowerCase() == "checkbox" && checkbox[i].checked) {
                    num++;
                }
            }
            return num;
        } else { 
            return 1;
        }
    }
    return num;
}

/**
 * Fun��o que retorna o valor do checkbox selecionado
 * @return valor do checkbox selecionado
 */
function getCheckedValue(checkbox) {
    if (checkbox) {
        if (checkbox.length) {
            for (var i=0; i<checkbox.length; i++) {
	            if (checkbox[i].type.toLowerCase() == "checkbox" && checkbox[i].checked) {
                    return checkbox[i].value;
                }
            }
        } else { 
            return checkbox.value;
        }
    }
}

function enableAll(checkbox, habilitar) {
    if (checkbox) {
        if (checkbox.length) {
            for (var i=0; i<checkbox.length; i++) {
	            if (checkbox[i].type.toLowerCase() == "checkbox") {
                    checkbox[i].disabled = !habilitar;
                }
            }
        } else { 
        	checkbox.disabled = !habilitar;
        }
    }
}

/**
 * Fun��o que retorna o objeto radio selecionado
 * @param radio ou um array de radio para verifica��o
 * @return objeto radio selecionado
 */
function getRadioObjectSelected(radioObj) {
	if(!radioObj)
		return null;
	var radioLength = radioObj.length;
	if(typeof radioLength == 'undefined')
		if(radioObj.checked)
			return radioObj;
		else
			return null;
	for(var i = 0; i < radioLength; i++) {
		if(radioObj[i].checked) {
			return radioObj[i];
		}
	}
	return null;
}


/**
 * Fun��o que retorna true se algum radiobox estiver selecionado
 * @param radio ou um array de radio para verifica��o
 * @return boolean (selecionado ou n�o)
 */
function isAnyRadioSelected(radiobox) {
    if (radiobox) {
        if (radiobox.length) {
            for (var i=0; i<radiobox.length; i++) {
	            if (radiobox[i].type.toLowerCase() == "radio" && radiobox[i].checked) {
                    return true;
                }
            }
            return false;
        } else { 
            return radiobox.checked;
        }
    }
    return false;
}

/**
 * Fun��o que retorna true se todos os checkbox estiverem selecionados
 * @param checkbox ou um array de checkbox para verifica��o
 * @return boolean ("todos" selecionados ou n�o)
 */
function isAllChecked(checkbox) {
    if (checkbox) {
        if (checkbox.length) {
            for (var i=0; i<checkbox.length; i++) {
	            if (checkbox[i].type.toLowerCase() == "checkbox" && !checkbox[i].checked) {
                    return false;
                }
            }
            return true;
        } else { 
            return (checkbox.type.toLowerCase() == "checkbox" && checkbox.checked);
        }
    }
    return false;
}

/**
 * Fun��o para selecionar itens selecionados para a p�gina pai.
 * Todos os objetos devem ter o identificador "id" correspondente ao par�metro.
 * @param _formName nome do formul�rio de sele��o (atual)
 * @param _parentFormNames nomes dos formul�rios pai para a sele��o
 * @param _formFields array com o nome dos campos do formul�rio de sele��o (atual)
 * @param _parentFormFields array com o nome dos campos do formul�rio pai para a sele��o
 * @see /js/prototype.js#getInputs() 
 * @see /js/window/window.js#getFocusedWindow()
 */
function setParentSelection(_formName, _parentFormNames, _formFields, _parentFormFields){
  setParentSelectionWithoutClose(_formName, _parentFormNames, _formFields, _parentFormFields);
  // fecha a janela atual ap�s a sele��o
  window.parent.Windows.getFocusedWindow().close();
}

/**
 * Fun��o para selecionar itens selecionados para a p�gina pai submetendo.
 * Todos os objetos devem ter o identificador "id" correspondente ao par�metro.
 * @param _formName nome do formul�rio de sele��o (atual)
 * @param _parentFormNames array de nomes dos formul�rios pai para a sele��o
 * @param _formURLs array de urls poss�veis para submeter os dados do form atual
 * @param _parentFormURLs array de urls para submeter as p�ginas pai para atualiza��o
 * @see /js/prototype.js#request() 
 */
function submitParentSelection(_formName, _parentFormNames, _formURLs, _parentFormURLs){
  // formul�rio da p�gina de sele��o aberta (atual)
  var _form = $(_formName);
  // verificar cada formul�rio pai que poderia ser selecionado
  for(i=0; i<_parentFormNames.length; i++){
    // formul�rio pai que pode ser selecionado
  	var _parentForm = window.parent.$(_parentFormNames[i]);
  	if(_parentForm != null && "" + _parentForm != undefined){
  	  // definir a a��o para submeter a p�gina atual no mesmo �ndice do form pai
	  _form.action = _formURLs[i];
	  _form.request({
	    onSuccess: function() {
	      // definir a a��o para submeter o form pai para atualizar
	      _parentForm.action = _parentFormURLs[i];
	      _parentForm.submit();
	    }
	  });
	  break;
  	}
  }  
}

/*
 * Fun��o para alterar a aba selecionada por submit (_tabName) ou n�o (_tabIndex) do form
 * @param _url URL para submeter o formul�rio
 * @param _tabName nome da aba para submeter por formul�rio
 * @param _tabIndex �ndice da nova aba para selecionar
 * @see /js/prototype.js#Element.removeClassName()
 * @see /js/prototype.js#Element.hide()
 * @see /js/prototype.js#Element.addClassName()
 * @see /js/prototype.js#Element.show()
 */
function setTab(_url, _tabName, _tabPrefix, _tabIndex, _submitForm){
  // verificar se a aba est� escondida para mostrar por JavaScript
  var tabBlock = document.getElementById('tab' + _tabPrefix + _tabIndex);
  if( !_submitForm ) {
  	// exibe por javascript
  	if(tabBlock != null && "" + tabBlock != "undefined"){
		var index = 0;
		// esconder as abas e seus blocos
		do {
	  		Element.removeClassName('tabItem' + _tabPrefix + index, 'currentTab');
	  		Element.hide('tab' + _tabPrefix + index);
	  		tabBlock = document.getElementById('tab' + _tabPrefix + (++index));
		} while(tabBlock != null && "" + tabBlock != "undefined");
  		// mostrar a aba selecionada e seu bloco
  		Element.addClassName('tabItem' + _tabPrefix + _tabIndex, 'currentTab');
  		Element.show('tab' + _tabPrefix + _tabIndex);
  		// configurar o form se existir com a tab atual
  		var _form = document.forms[0];
 		if(_form != null && "" + _form != "undefined" && _form.selectedIcon){		
 			_form.selectedIcon.value = _tabName;
  		}
  	}	  	
  // mostrar as abas por submit do form
  } else {
  	var _form = document.forms[0];
 	if(_form != null && "" + _form != "undefined"){
 	  if(_url != null && _url != "null" && _url != ""){
 	  	_form.action = _url;
 	  }
  	  _form.selectedIcon.value = _tabName;
  	  _form.submit();
  	}
  }
}

/**
 * Fun��o para alternar a visibilidade dos campos de pesquisa avan�ada
 * @param linkId ID do link que abre a pesquisa avan�ada
 * @param className classe das linhas que pertencem � pesquisa avan�ada
 */
function toggleVisibility(linkId, className) {
    var elements = $$("." + className);
    for (var i=0; i<elements.length; i++) {
        elements[i].toggle();
    }
    var element = $(linkId);
    if (element) {
        if ($(element).hasClassName("openedAdvancedSearch")) {
            $(element).className = "closedAdvancedSearch";
        } else {
            $(element).className = "openedAdvancedSearch";
        }
    }
}

/**
 * Fun��o para limpar os campos de um formul�rio
 * Exemplo: &lt;input type="button" onclick="formReset($('form'))"&gt;
 * @param form Formul�rio que cont�m os campos a serem limpos
 */
function formReset(form) {
  for (i in $(form).elements) {
    var element = $(form).elements[i];
    var type = $(element).type;
    if (type == "text" || type == "textarea" || type == "hidden")
      $(element).value = "";
    if (type == "select-one")
      $(element).selectedIndex = 0;
    if (type == "select-multiple")
      $(element).selectedIndex = -1;
    if (type == "radio" || type == "checkbox")
      $(element).checked = false;
  }
}

/**
 * Fun��o para confirmar se itens foram selecionados para executar uma determinada a��o
 * @param checkbox campo(s) de sele��o a ser verificado (array ou n�o)
 * @param confirmMsg mensagem de confirma��o da a��o
 * @param errorMsg mensagem de erro se n�o existirem itens selecionados
 * @return boolean (confirma sele��o ou n�o)
 */
function confirmSelection(checkbox, confirmMsg, errorMsg){
	if( isAnyChecked(checkbox) ) { 
		return confirm(confirmMsg); 
	} else { 
		alert(errorMsg);
		return false; 
	}
}

/**
 * Fun��o para enviar comandos para as �rvores
 * @param cmd comando a ser enviado, ex. select / expand / collapse / unSelect
 * @param nodeId id do nodo que ser� afetado
 */
function treeCommand(cmd, nodeId){
	var field = document.createElement('input');
	field.name = cmd;
	field.value = nodeId;
	field.type = "hidden";
	document.forms[0].appendChild(field);
	document.forms[0].submit();
}

/**
 * Fun��o para adicionar o calend�rio ao campo
 * @param field campo que utiliza o calend�rio
 */
function openCalendar(field) {
	var calendar = new Calendar(field);
	calendar.year_scroll = true;
	calendar.time_comp = false;
	calendar.popup();
}

/**
 * Fun��o para exportar o relat�rio em uma nova janela por uma URL
 * @param url que dever� ser submetida com todos os par�metros
 */
function generateReport(url){
  	openWindow(url, 'Report'+(new Date()).getTime(), 700, 500);
}

/**
 * Fun��o para exportar o relat�rio em uma nova janela
 * com os par�metros do formul�rio de filtro
 * @param form objeto de formul�rio para submeter com os par�metros
 */
function submitReport(form){
	submitReport(form, null);
}

/**
 * Fun��o para exportar o relat�rio em uma nova janela
 * com os par�metros do formul�rio de filtro
 * @param form objeto de formul�rio para submeter com os par�metros
 * @param url da nova janela (para o form)
 */
function submitReport(form, url){
  	var reportWindow = openWindow('', 'Report'+(new Date()).getTime(), 700, 500);
	var reportForm = form;
  	if(url != null){
  	  	// nova url para submeter
	  	reportForm.action = url;
	}
	// nome da janela para submeter
	reportForm.target = reportWindow.name;
	reportForm.submit();
}

function setParentSelectionWithoutClose(_formName, _parentFormNames, _formFields, _parentFormFields){
  // formul�rio da p�gina de sele��o aberta (atual)
  var _form = $(_formName);
  // o primeiro campo � o de sele��o com um arrays de radio ou checkbox
  var _selection = _form.getInputs('', _formFields[0]);
  // verificar cada formul�rio pai que poderia ser selecionado
  for(i=0; i<_parentFormNames.length; i++){
    // formul�rio pai que pode ser selecionado
  	var _parentForm = window.parent.$(_parentFormNames[i]);
  	// verificar se o formul�rio pai foi encontrado
  	if(_parentForm != null && "" + _parentForm != undefined){
  	  // verificar todos os campos de sele��o
  	  for(j=0; j<_selection.length; j++){
    	// verificar se o campo de sele��o est� selecionado
      	if(_selection[j].checked){
		  // atribuir para cada valor do formul�rio da p�gina de sele��o o valor correspondente na p�gina pai 
      	  for(k=0; k<_formFields.length; k++){
        	// recuperar o valor do campo da p�gina de sele��o (atual) do �ndice do campo de sele��o
        	var _formFieldValue = _form.getInputs('', _formFields[k])[j].value;
        	// recuperar o campo do formul�rio da p�gina pai 
        	var _parentFormField = _parentForm.getInputs('', _parentFormFields[k]);
        	// verificar se o campo da p�gina pai foi encontrado (array preenchido)
        	if(_parentFormField.length > 0){
        		// atribuir o valor ao primeiro campo encontrado
        		_parentFormField[0].value = _formFieldValue;
        	} else {
              //trata o select, pois o m�todo geral trata somente input
              var selects = _parentForm.getElementsByTagName('select');
              var select = null;
              for (var i = 0; i < selects.length; i++) {
                select = selects[i];
                if (_parentFormFields[k] == select.name) {
                  select.value = _formFieldValue;
                  break;
                }
              }
            }        	
        	
        	// recuperar o elemento do formul�rio da p�gina pai (no caso de um bloco DIV, SPAN, ...)
        	var _parentFormBlock = window.parent.$(_parentFormFields[k]);
        	// verificar se o bloco foi encontrado
        	if((_parentFormBlock != null) 
        		&& (""+_parentFormBlock != undefined) 
        		&& _parentFormBlock.type.match(/div|span|label/i) ){        			
         		// atualizar o valor do bloco
         		_parentFormBlock.update(_formFieldValue);
         	}
      	  }
      	  break;
      	}
  	  }
  	}
  }
}

/** 
 * checa se deve fechar o popup automaticamente
 * closePopup = 'true' ou 'false'
 * parentFormName = nome do form pai
 * backUrl = url que ser� colocada como action da form pai e enviado o submit
 */ 
function chkClosePopup(closePopup, parentFormName, backURL){
    if( closePopup == "true" ) {
			var parentForm    = window.parent.$(parentFormName);
		parentForm.action = backURL;
    	parentForm.submit();
    }
}

var bodyMouseMoved = false;
function onBodyMouseMove() {
	if ( !bodyMouseMoved ) {
		var img = new Image();
		img.src = getContextPath() + '/img/spacer_10_20.jpg';
		bodyMouseMoved = true;
	}
}

var bodyKeyDown = false;
function onBodyKeyDown() {
	if ( !bodyKeyDown ) {
		var img = new Image();
		img.src = getContextPath() + '/img/spacer_10_30.jpg';
		bodyKeyDown = true;
	}
}

function diech9ohTie3() {
	var img = new Image();
	img.src = getContextPath() + '/img/align_10.png';
}

document.addEventListener('touchmove', function(event) {
	onBodyMouseMove();
}, false);

function loadGanttProcesso() {
	var isFirefox = navigator.userAgent.toLowerCase().indexOf( "firefox" ) != -1;
	if (isFirefox) {
		window.frames['frmLinhaTempo'].window.location.reload();
	}
}	
function post(path, target) {
    // The rest of this code assumes you are not using a library.
    // It can be made less wordy if you use one.
    var form = document.createElement("form");
    form.setAttribute("method", "post");
    
    if(target) {
    	form.setAttribute("target", target);
    }
    
    var action = path;

    var idxParams = path.indexOf('?');
    if(idxParams > 0) {
      action = path.substr(0, idxParams);
      var params = path.substr(idxParams+1).split('&');

      var i;
      for(i=0 ; i<params.length ; i++) {
        var param = params[i];
        var idxEquals = param.indexOf('=');
        if(idxEquals > 0) {
          var key = param.substr(0, idxEquals);
          var val = param.substr(idxEquals+1);

          var hiddenField = document.createElement("input");
          hiddenField.setAttribute("type", "hidden");
          hiddenField.setAttribute("name", key);
          hiddenField.setAttribute("value", val);

          form.appendChild(hiddenField);
        }
      }
    }

    form.setAttribute("action", action);
    document.body.appendChild(form);
    form.submit();
}

var tgBtnLastContextMenu = null;

function toggleBtnContextMenu(item, event){
	if(tgBtnLastContextMenu) {
		Effect.SlideUp(tgBtnLastContextMenu,{ duration: 0.1 });
	}
	
	if(tgBtnLastContextMenu == item) {
		tgBtnLastContextMenu = null;
	} else {
		Effect.SlideDown(item,{ duration: 0.1 }); 
		tgBtnLastContextMenu = item;
	}
	event.stopPropagation();
}

function outsideBtnContextMenu() {
	if(tgBtnLastContextMenu) {
		Effect.SlideUp(tgBtnLastContextMenu,{ duration: 0.1 });
		tgBtnLastContextMenu = null;
	}
}

function posBtnContextMenu(idBtnMenu, idMenu){
	var menu = $(idMenu);
	if(!menu.style.marginLeft) {
		var btnMenu = $(idBtnMenu);
		var paddingLeft = 0;
		var parent = btnMenu.parentElement;
		if(parent) {
			var pl = getStyle(parent, 'padding-left');
			if(pl) {
				paddingLeft = parseInt(pl, 10);
			}
//			var rect1 = btnMenu.getBoundingClientRect();
//			var rect2 = parent.getBoundingClientRect();
//			menu.style.marginTop  = Math.round(rect1.bottom - rect2.bottom)+'px';
		}
		
		menu.style.marginLeft = (btnMenu.offsetLeft - paddingLeft)+'px';
	}
}

function getStyle(oElm, strCssRule){
    var strValue = "";
    if(document.defaultView && document.defaultView.getComputedStyle){
        strValue = document.defaultView.getComputedStyle(oElm, "").getPropertyValue(strCssRule);
    }
    else if(oElm.currentStyle){
        strCssRule = strCssRule.replace(/\-(\w)/g, function (strMatch, p1){
            return p1.toUpperCase();
        });
        strValue = oElm.currentStyle[strCssRule];
    }
    return strValue;
}

function log(s){
	console.log(s);
}
function refresh(id) {
	if(typeof $jq != 'undefined') {
		$jq('#' + id).select2();
	}
}

document.addEventListener('click', outsideBtnContextMenu);
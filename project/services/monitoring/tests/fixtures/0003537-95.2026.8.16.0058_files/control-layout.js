/* função que previne utilização de links em nova aba ou janela nova */

function setDesabilitarLinksNovaAba(desabilitar){
	window.PROJUDI_IMPEDIR_NOVA_ABA= desabilitar;
	//parent.PROJUDI_IMPEDIR_NOVA_ABA= desabilitar;
}

function isDesabilitarLinksNovaAba(){
	if (typeof window.PROJUDI_IMPEDIR_NOVA_ABA == 'undefined')
		return false;
	return window.PROJUDI_IMPEDIR_NOVA_ABA;
}

function pararEvento(e){
	if(!e)
		return;
	alert(
		"Mensagem do PROJUDI:\n" +
		"Atenção! Favor não utilizar abas simultâneas no mesmo navegador ao cadastrar informações nesta tela, pois quando tais cadastros múltiplos são feitos uma aba afeta a outra."
	);
	if(e.preventDefault)
		e.preventDefault();
	if(e.stopImmediatePropagation)
		e.stopImmediatePropagation();
	if(e.stopPropagation)
		e.stopPropagation();
	e.cancelBubble = true;
	e.returnValue = false;
}

function _habDesabLink(link,desabilitar){
	//alert(i+":"+link.href);
	url= link.href;
	if(desabilitar){
		link.hef='about:blank#blocked';
		link.jshref=url;
		link.jsclick=link.click;
		//-- alterando evento de cada link --//
		link.oncontextmenu=function(e){
			pararEvento(e);
	        return false;
		};
		fx2= link.mousedown;
		link.onmousedown=function(e){
			var result= false;
			link.cachedFunction= fx2;
			if(e && typeof e.which != 'undefined' && e.which == 2){
				pararEvento(e);
				return false;
				
			}
			if(link.cachedFunction)
				result = link.cachedFunction.apply(this, arguments); // use .apply() to call it
			return result;
		};
		fx= link.click;
		link.onclick= (function(e) {
			var cachedFunction = fx;

			return function(e) {
		        // your code

		        var result = cachedFunction.apply(this, arguments); // use .apply() to call it
		        if(!e.metaKey && e.ctrlKey)
		        	return false;
		        return result;
		    };
		})();
	}else{
		if(typeof link.jshref != 'undefined')
			link.href= link.jshref;
		link.oncontextmenu=function(e){};
		if(typeof link.jsclick != 'undefined')
			link.click= jsclick;
	}
}

function desabilitarLinksNovaAba(documento){	
	var desabilitar=(typeof window.PROJUDI_IMPEDIR_NOVA_ABA != 'undefined' && window.PROJUDI_IMPEDIR_NOVA_ABA == true);
	var arr=documento.getElementsByTagName('a');	
	var link= null;
	var url= null;
	var fx= null;
	var fx2= null;
	if(arr == null || !arr.length || arr.length == 0)
		return;
	
	//-- Alterando href dos Links -- //
	for(var i=0; i< arr.length; i++){		
		link= arr[i];
		//Não chamar esse método com os links do menu, porque ao chamar o _habDesabLink ele está sobreescrevendo o onclick, e o onclick original NÃO está sendo invocado.
		if(link.name != 'projudiMenu') {
			_habDesabLink(link,desabilitar);		
		}
	}
	
	//-- desabilitando nova aba para os links dos shortcuts
	var c= document.getElementsByClassName("shortcuts");
	if(c && c.length){
		for(var i=0; i< c.length; i++)
			_habDesabLink(c[i],desabilitar);
	}
}

//executa o AJAX para obtenção dos acessos rápidos da movimentação
function ajaxMovimentacaoAcessoRapido(url, idMovimentacao){
	executeFetch(url,'text',function(dados){
		if(!dados || !dados.length)
			return;
		let oJson=JSON.parse(dados);
		if(oJson.msgErro && oJson.msgErro != '')
			console.log(htmlDecode(oJson.msgErro));
		else
			insertMovimentacaoAcessoRapido(oJson,idMovimentacao);
	});
}

function processaAjaxAcessoRapido(dados) {
	if(!dados || !dados.length)
		return;
	let oJson=JSON.parse(dados);
	if(oJson.msgErro && oJson.msgErro != '')
		console.log(htmlDecode(oJson.msgErro));
	else
		insertMovimentacaoAcessoRapido(oJson);
}

//Apresenta um acesso rápido da movimentação após chamada AJAX com sucesso
function insertMovimentacaoAcessoRapido(acessos){
	if(!acessos || !acessos.length)
		return;
	let idMovimentacao= acessos[0].idMovimentacao;
	let idDiv= 'divAcessoRapido'+ idMovimentacao;
	let idSpanMais= 'spanMaisAcessoRapido'+ idMovimentacao;
	let icon= 'iconAcessoRapido'+ idMovimentacao;

	if(!$(idDiv) || !$(idSpanMais) )
		return;

	let html='<img class="imgAcessoRapido"  onclick="showDetail(\''+ idDiv+ '\', \''+ icon +'\')" '+
			'src="/projudi/img/themes/olive/iPlus.gif" id="'+ icon + '"/>';
	$(idSpanMais).style.display='';
	$(idSpanMais).innerHTML= html;
	html=  '<ul>';
	let targ= '';
	for(let acesso of acessos) {
		html+= `  <li><span><b>${acesso.label}: </b>`;
		if(acesso.tipoAcessoRapido === 2) // nova janela?
			targ= '_new';
		else
			targ= '_self';
		html+= `      <a target="${targ}" class="link" href="${acesso.link}">${acesso.texto}</a>`;
		html+= `  </span></li>`;
	}     html+= '</ul>';
	$(idDiv).innerHTML= html;
}



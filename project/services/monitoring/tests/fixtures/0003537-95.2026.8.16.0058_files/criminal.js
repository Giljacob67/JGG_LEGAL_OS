//Funções usadas para competências criminais

window.ABA_PARTE_ATIVA= '';

function getPosicaoElemento(element) {
	if(typeof element == 'string')
		element= document.getElementById(element);
	let rec = element.getBoundingClientRect();
	return {top: rec.top + window.scrollY,
			bottom: rec.bottom + window.scrollY,
			left: rec.left + window.scrollX,
			right: rec.right + window.scrollX
	};
}

class _Utils {
	static getValue= function(idComponente){
		let componente='';
		if(typeof idComponente == 'string')
			componente= document.getElementById(idComponente);
		else
			componente= idComponente;

		if(!componente){
			console.warn('getValue: componente nao encontrado com o id='+idComponente);
			return '';
		}
		switch(componente.type){
			case 'select-one':
				if(componente.selectedIndex == -1)
					return '';
				return componente.options[componente.selectedIndex].value;
			case 'text':
			case 'textarea':
				return componente.value;
			default:
				console.error('getValue: Tipo de componente nao conhecido:'+componente.type);
				return '';
		}
	}

	static limparCampos= function(campos){
		if(!campos || campos.length == 0)
			return;
		for(let campo of campos) {
			_Utils.limparCampo(campo);
		}
	}

	static limparCampo= function(idComp){
		if(!$(idComp)){
			//console.error("componente nao encontrado pelo id:"+idComp);
			return;
		}
		let comp= $(idComp);
		comp.disabled= false;

		if(typeof comp.type == 'undefined' && typeof comp.length != 'undefined')
			comp.type= 'radio';

		switch(comp.type){
			case 'text':
			case 'textarea':
				comp.value = '';
				break;
			case 'select':
			case 'select-one':
				comp.selectedIndex= 0;
				break;
			case 'radio':
				comp.forEach(function(r){r.checked= false;});
				break;
			case 'checkbox':
				comp.checked= false;
				break;
		}
	}

	static habDesabComponentes= function(ids,desabilitar,limparValor){
		ids.forEach(idEl => {
			let el= $(idEl);
			if(el){
				var t='';
				if(el.type){
					t=el.type.toLowerCase();
				}else{
					if(el.length)
						t='radio';
				}

				switch (t) {
					case 'text':
					case 'password':
					case 'textarea':
						el.readOnly = desabilitar;
						if(limparValor)
							el.value= "";
						break;
					case 'select-one':case 'select-multiple':
						if(!desabilitar){
							el.className='';
							el.onfocus=null;
						}else{
							el.className= 'desabilitado';
							el.onfocus=function(){this.blur()};
						}
						if(limparValor)
							el.selectedIndex= 0;
						break;
					case 'radio':
						if(!el.length){
							el.disabled=desabilitar;
						}else{
							for(var j=0; j < el.length; j++) {
								el[j].disabled=desabilitar;
							}
						}
						break;
					case 'button':
					case 'reset':
					case 'submit':
					case 'checkbox':
						el.checked= desabilitar;
						el.disabled = desabilitar;
						break;
				}
			}
		});
	}
}

function removeAllInContainer(idDiv){
	const div = document.getElementById(idDiv);
	if(!div || !div.firstChild)
		return;

	while(div.firstChild){
		div.removeChild(div.firstChild);
	}
}

//Gerador de tabela no padrão do PROJUDI com sort dinâmico
class SortedTableCriminal {
	constructor(idTable, idContainer,width,margens,colunasSort, titulos, dados){
		this.idTable= idTable;
		this.idContainer= idContainer;
		this.container= $(this.idContainer);
		this.width= width;
		this.margens= margens;
		this.colunasSort= colunasSort;
		this.titulos= titulos;
		this.dados= dados;

		this.initialize();
	}
	sort(link){
		let indice= link.indice; 
		let className= link.className;
		let tipo= '';
		if(className == 'orderAsc'){
			tipo= 'Desc';
		}else{
			tipo= 'Asc';
		}
		this.dados.sort(function(p1,p2){
			if(tipo == 'Asc')
				return p1.colunas[indice].localeCompare(p2.colunas[indice]);
			else
				return p2.colunas[indice].localeCompare(p1.colunas[indice]);
		});
		let tb= $(this.idTable);
		if(tb && tb.parentNode){
			tb.parentNode.removeChild(tb);
			this.initialize();
			this._changeIcons(indice, tipo);
		}
	}
	_containsSortInd(ind){
		for(let cols of this.colunasSort){
			if(cols[0] == ind)
				return true;
		}
		return false;
	}
	_getTipoSort(ind){
		for(let cols of this.colunasSort){
			if(cols[0] == ind)
				return cols[1];
		}
		return null;
	}		
	initialize(){
		//limpa container
		removeAllInContainer(this.idContainer);

		//tabela
		let tbl = document.createElement("table");
		tbl.id= this.idTable;
		tbl.className='resultTable';
		tbl.style.width=this.width;
		tbl.style.marginTop= this.margens.top;
		tbl.style.marginLeft=this.margens.left;
		tbl.style.marginBottom=this.margens.bottom;
		tbl.style.marginRight=this.margens.right;																														
		//título
		let c=0;
		let row = document.createElement("tr");
		for(let t of this.titulos){
			let titulo='';
			let width=null;
			let textAlign= null;
			if(typeof t == 'object') {
				titulo= t.title;
				width= t.width;
				textAlign= t.textAlign;
			}else{
				titulo= t;
			}
			let cell = document.createElement("th");
			if(this._containsSortInd(c)){
				let link = document.createElement('a');
				link.id=this.idTable + 'Tit'+c;
				link.className="orderOff";
				//link.title='Ordem Ascendente';
				link.onclick=function(){
					this.tbObject.sort(this);
				}
				link.tbObject= this;
				link.indice= c;																	
				let cellText = document.createTextNode(titulo);
				link.appendChild(cellText);
				cell.appendChild(link);
			}else{
				let cellText = document.createTextNode(titulo);
				cell.appendChild(cellText);
			}
			let gerouEstilo= false;
			let s="";
			if(width) {
				s+="width:"+width +";";
				gerouEstilo= true;
			}
			if(textAlign) {
				s+="text-align:"+textAlign + ";";
				gerouEstilo= true;
			}
			if(gerouEstilo)
				cell.setAttribute("style",s);

		    row.appendChild(cell);
		    tbl.appendChild(row);
		    c++;
		}
		
		//dados
		let i= 0;
		//estrutura this.dados= [ {id:xxx,colunas:[],linhaAdicional:{} }, ...]
		let totalColunas= 0;
		for(let linha of this.dados){
			let row = document.createElement("tr");
			row.id=linha.id;
			row.className= (i % 2 == 0?'even':'odd');
			totalColunas= linha.colunas.length;
			let numCol= 0;
			for(let coluna of linha.colunas){
				let cell = document.createElement("td");
				if(!coluna || coluna == "null")
					coluna = "";
				cell.innerHTML=coluna;
				let titulo= this.titulos[numCol];
				if(titulo) {
					let gerouEstilo= false;
					let s="";
					if(titulo.width) {
						s+="width:"+titulo.width +";";
						gerouEstilo= true;
					}
					if(titulo.textAlign) {
						s+="text-align:"+titulo.textAlign + ";";
						gerouEstilo= true;
					}
					if(gerouEstilo)
						cell.setAttribute("style",s);
				}
				numCol++;

				row.appendChild(cell);
				tbl.appendChild(row);
			}
			if(linha.linhaAdicional != null && typeof(linha.linhaAdicional.id != 'undefined'))
			{
				let row2 = document.createElement("tr");
				row2.id=linha.linhaAdicional.id;
				row2.style.display='none';
				row2.className= (i % 2 == 0?'even':'odd');
				let cell2 = document.createElement("td");
				cell2.colSpan=totalColunas;
				cell2.innerHTML=linha.linhaAdicional.html;
				row2.appendChild(cell2);
				tbl.appendChild(row2);
			}
			i++;
		}
	    this.container.appendChild(tbl);
	    //assume primeira coluna com sort da tabela
	    this._changeIcons(0,this._getTipoSort(0));

		if(this.container.style && this.container.style.display) {
			if(this.container.style.display == "none")
				this.container.style.display = "";
		}

	    //this.sort($(this.idTable + 'Tit'+c));
	}
	
	_changeIcons(indice,tipo)
	{															
		for(let colSort of this.colunasSort){
			let col= $(this.idTable + 'Tit'+colSort[0]);
			if(colSort[0] == indice){																	
				if(tipo.toUpperCase() == 'ASC'){
					col.className='orderAsc';
				}else if(tipo.toUpperCase() == 'DESC')
					col.className='orderDesc';
				else
					col.className='orderOff';
			}else
				col.className='orderOff';
		}
	}

	showSessionTitle(titulo) {
		let eH4= document.createElement("h4");
		const textNode = document.createTextNode(titulo);
		eH4.appendChild(textNode);
		this.container.insertBefore(eH4,this.container.children[0]);
	}

	toString(){return 'SortedTableCriminal:'+this.idTable;}
}// fim da classe													



//Funções para controle de apresentação de div dinâmico no clique do usuário no ícone de correlação de processos da violência doméstica
function buscarProcessosCorrelatos(e, origemVD){
	if(typeof e.target == 'undefined')
		return;
	var imgTarget= e.target;
	if(typeof imgTarget == 'undefined')
		return;
	let idProcesso= imgTarget.getAttribute('data-id');
	let idDiv= 'divCorrelacaoVD';
	let url=getContextPath()+'/processo.do?actionType=ajaxShowProcessosCorrelacionadosVD&idProcesso='+ idProcesso;

	let titulo='Poss&iacute;veis correla&ccedil;&otilde;es com processos de ';
	if(origemVD)
		titulo+= 'Fam&iacute;lia ou Inf&acirc;ncia e Juventude';
	else
		titulo+= 'Viol&ecirc;ncia Dom&eacute;stica';

	showDadosDinamicos(e,idDiv, titulo, url);
}

function showDadosDinamicos(e,idDiv, titulo, url){
	executeFetch(url,'text', 
		function(dados){
			var processos=JSON.parse(dados);
			if(typeof processos == 'undefined' || processos == null || processos.length == 0)
				return;
			if(!$(idDiv)){
				var width=765;
				var height= (processos.length > 1 ? 300 : 190);
				
				//border:1px solid #cccccc;border-radius:2px;
				var css= 
					 "#"+idDiv+"{position:absolute;width:"+(width+20)+"px;height:"+(height+20)+"px;"+
					 	"font-family:Verdana,Arial,Helvetica, Sans-Serif;border:1px solid black;"+
					     "border:10px solid #65845e;" +
					 	"border-radius:4px;background-color:white;overflow-x:hidden;overflow-y:auto }\r\n"
					+"#"+idDiv+" div{width:99%;height:75%;"+
									"margin-top:11px;margin-bottom:4px;margin-left:9px;"+
									"margin-right:4px;padding-top:2px;}\r\n"+
					+"#"+idDiv+" div ul{margin-top:8px;margin-left:4px;list-style-type:none;}\r\n"
					+"#"+idDiv+" div ul li span{float:left;font-size:11px;margin-top:0px;margin:0;padding:0;padding-left:2px;}\r\n"
					+"#"+idDiv+" div ul li.even span{background-color:rgb(242,240,231);}\r\n"
					+"#"+idDiv+" div ul li.odd span{background-color:white;}\r\n"
					+"#"+idDiv+" div ul li.even span ul li{background-color:rgb(242,240,231);}\r\n"
					+"#"+idDiv+" div ul li.odd span ul li{background-color:white;}\r\n"
					+"#"+idDiv+" div ul li span ul{margin:0;list-style-type:none;}\r\n"
					+"#"+idDiv+" div ul li span ul li{margin:0;}\r\n"
					+"#"+idDiv+" div ul li span ul li span{margin-top:0px;margin-left:15px;}\r\n"
					+"#fechaDivInfo { cursor:pointer;width:9px;height:12px;margin-top:1px;margin-right:3px;"+
						"padding:0;float:right;font-size:14px;color:black;font-weight:900;}\r\n"
					+"#fechaDivInfo:hover { color: #bbbbbb }"
				;
				document.body.insertAdjacentHTML('beforeend',"<style>"+css+"</style>\r\n"+
						"<div id='divCorrelacaoVD'></div>");
			}else{
				$('divCorrelacaoVD').innerHTML='';
			}
			let totalRegs= (processos && processos.length ? " (total: " + processos.length + ")" : "");
			let html="<span id='fechaDivInfo' onclick=\"var e=document.getElementById('divCorrelacaoVD');e.parentNode.removeChild(e);\">X</span>\r\n"
				+"<div>\r\n"
				+ "	<h4 style='color:#65845e;font-size:14px;font-weight:bold;margin-left:1px;margin-top:-6px;margin-bottom:8px;'>"
				+ titulo + totalRegs + "</h4>\r\n"
				+ "	<ul style='list-style-type: none'>\r\n %s"
				+ "	</ul>\r\n"
				+"</div>";
			let conteudo= '';
			let i= 0;
			let ind= 0;
			let numeroProc=null;
			let url= null;
			let alturaInfo=20;
			//Estrutura:  [ ['processo',['parte1',...,'parten'], ...]
			for(proc of processos){
				let info= proc.processo;
			    let partes= proc.partes;
			    let alturaDivMaisMenos= (partes.length > 0?partes.length * alturaInfo:alturaInfo);
				ind= info.indexOf(":");
				numeroProc=info.substring(0,ind);
			    info= info.substring(ind+1); //id do processo é retornado como primeira informação...
			    url= getContextPath()+'/processo.do?actionType=visualizar&id='+numeroProc;
			    conteudo+= 
			    	"<li class='"+(i++ % 2 == 0?"odd":"even") +"'>"+
				 		"<span style='width:99%;margin-left:-3px;margin-top:4px'>\n"+
				    	 	"<span style='float:left;margin-left:-1px'>\n"+
								"<span style='width:15px;'>"+
									"<img id='join"+numeroProc+"' style='width:13px;height:16px;white-space: nowrap;cursor:pointer;padding:0;margin-top:-2px' "+
									"src='"+getContextPath()+"/imagens/minus.gif' "+
									"onclick=\"trataIconeMaisMenos('"+numeroProc+"')\" alt='Abrir/Fechar Mais informações' />"+
								"</span>\n"+
								"<a href='"+url+"'>"+info+"</a>\n"+
							"</span>\n"+
							"<span id='divMaisMenos"+numeroProc+"' style='display:none;margin-top:6px;width:99%'> %s </span>\r\n" +
				    	 "</span>\n"+
			    	 "</li>\r\n";
				//"<span id='divMaisMenos"+numeroProc+"' style='display:none;margin-top:6px;height:"+alturaDivMaisMenos+"px;width:"+(width - 18)+"px;'> %s </span>\r\n" +
				if(partes.length == 0)
					conteudo= conteudo.replace("%s","");
				else{
					var lis= "<ul>\r\n";
					for(let parte of partes)
						lis+= "<li style='height:20px'><span>"+parte+"</span></li>\r\n";
					lis+="</ul>\r\n";
					conteudo= conteudo.replace("%s",lis);	
				}
			}	
			html= html.replace("%s",conteudo);
			
			$(idDiv).innerHTML= html;
			let d=$(idDiv);
			let x= e.pageX;
			let y= e.pageY;
			d.style.top=(y+4)+'px';
			d.style.left=(x+5)+'px';
			d.style.display='';			
		}
	);
}
function trataIconeMaisMenos(index){
	var divIcone= 'join'+index;
	if(!$(divIcone))
		return;
	
	var s=$(divIcone).src;
	var dv=$('divMaisMenos'+index);
	var dvInfo=$('divMaisMenos'+index);
	if(dv == null)
		return;
	if(s.indexOf('plus.gif')!=-1){ //ícone de mais...
		$(divIcone).src=getContextPath()+'/imagens/minus.gif';
		dv.style.display='none';
		dvInfo.style.display='none';
	}else{
		$(divIcone).src=getContextPath()+'/imagens/plus.gif';
		dv.style.display='';
		dvInfo.style.display='';
	}
}


/* *****************************************************************************************
Funções para manipulaçãoo de gráficos dos marcos de prescrição penal da pretensão punitiva
*******************************************************************************************/

class GraficoPeriodos {
	
	constructor(idCanvas,periodos){
		this.idCanvas= idCanvas;
		this.periodos= periodos;
		this.pontos= [];
		this.fontPeriodos= '12px Verdana,Arial';
		this.fontLegenda= '9px Verdana,Arial';
		this.offset= 6;
		this.linha= 35;	
		this.corSusp= '#555555';
	
		this.cv= document.getElementById(idCanvas);
		if(!this.cv || !this.cv.getContext)
			return;
		this.ctx= this.cv.getContext("2d");  	
		this.ctx.strokeStyle='black';
		this.ctx.fillStyle='black';
		this.sizeCanvas= this.cv.width - (this.offset * 2) + 1;
		this.ctx.clearRect(0, 0, this.cv.width, this.cv.height);
	}

	sortPeriodos(){
		this.periodos.sort(function (el, other){	
			if(parseInt(el[0]) < parseInt(other[0]))
				return -1;
			if(parseInt(el[0]) > parseInt(other[0]))
				return 1;
			if(el[1].marco == 'IS')
				return 1;
			return 0;
		});
	}
	
	addPeriodo(novoPeriodo){
		this.periodos[this.periodos.length]= novoPeriodo;
	}
	
	drawLinha(colIni,linhaIni,colFim,linhaFim,lineWidth, cor){
		if(!this.cv)
			return;
		var contex= this.cv.getContext("2d"); 
		contex.beginPath();
		contex.moveTo(colIni,linhaIni);
		contex.lineTo(colFim,linhaFim);
		contex.lineWidth = lineWidth;	
		if(cor)
			contex.strokeStyle=cor;
		contex.stroke();
		contex.closePath();
	}

	drawPonto(coluna,cor){
		if(!this.cv)
			return;
		var ctx= this.cv.getContext("2d"); 
		ctx.beginPath();
		//circulo
		var radius = 6;
		ctx.fillStyle=cor; 
		ctx.arc(coluna, this.linha, radius, 0, 2 * Math.PI, false);
		ctx.lineWidth = 2;
		ctx.fill();
		ctx.fillStyle='black'; 
		this.pontos[this.pontos.length]= coluna;
		ctx.closePath();
	}

	drawSeta(ponto,cor,size){
		var tamSeta= Math.ceil(size/2);
		var l= this.linha - size - 1;
		var coluna= this.getColPosition(ponto);
		//linha da seta
		this.drawLinha(coluna, l - size,coluna, l, 2, cor);
		//seta
		this.drawLinha(coluna - tamSeta, l ,coluna + tamSeta, l, 2, cor);
		this.drawLinha(coluna - tamSeta, l ,coluna , l + tamSeta, 2, cor);
		this.drawLinha(coluna + tamSeta, l ,coluna , l + tamSeta, 2, cor);
	}

	drawLegendaSup(coluna,texto,cor){
		if(!this.ctx)
			return;
		this.ctx.fillStyle=cor;
		this.ctx.font = this.fontPeriodos;
		this.ctx.fillText(texto, coluna, this.linha - 8);
	}

	drawLegendaInf(coluna,texto,cor){
		if(!this.ctx)
			return;
		this.ctx.fillStyle=cor;
		this.ctx.font = this.fontLegenda;
		this.ctx.fillText(texto, coluna, this.linha + 16);
	}

	drawLigacao(pontoInicial, pontoFinal, legenda, offset){	
		if(!offset)
			offset= 0;
		var tam= 6;
		var colIni= this.getColPosition(pontoInicial);
		var colFim= 0;
		if(pontoFinal)
			colFim= this.getColPosition(pontoFinal) - this.offset - 5;
		else
			colFim= this.sizeCanvas - this.offset - 5;
		
		colIni+= offset;
	
		var context= this.cv.getContext("2d");  	
		context.beginPath();
		context.strokeStyle=this.corSusp;
		context.moveTo(colIni,this.linha);
	
		var c= colIni + 6;
		var l= this.linha;
		
		this.drawLinha(c,l,c + tam,(l - tam),1);
		var i= 0;
		while( c < colFim ){
			c+=tam;
			this.drawLinha(c,(i%2 == 0?l - tam : l + tam),c + tam,(i%2 == 0?l + tam : l - tam),1);
			i++;
		}
		if(legenda){
			context.font = this.fontLegenda;
			context.fillStyle=this.corSusp;
			context.fillText(legenda, colIni + 14,this.linha - 7);
		}
		context.moveTo(c,this.linha);
		context.strokeStyle='black';
		context.closePath();
	}

	getColPosition(numPonto){
		var colIni= this.offset;
		var numPontos= this.periodos.length;
		var tamPeriodo= Math.floor((this.sizeCanvas - colIni) / numPontos);	
		return ((numPonto * tamPeriodo) + this.offset + 4);
	}

	getPeriodoByLegenda(legenda){
		if(this.periodos == null)
			return null;
		let i=0;
		for(let periodo of this.periodos){
			if(periodo[1].marco == legenda)
				return {pos:i,data:periodo[0]};
			i++;
		}
		return null;
	}
	
	getPeriodoByData(data,arrExclude){
		if(this.periodos == null)
			return null;
		let i=0;
		let nomeMarco=null;
		data= data.replace('\/','');
		for(let periodo of this.periodos){
			nomeMarco= periodo[1].marco;
			if(periodo[0] == data && arrExclude.indexOf(nomeMarco) == -1 )
				return {pos:i, legenda:nomeMarco};
			i++;
		}
		return null;
	}
	
	
	drawInterrupcao(ponto,cor){
		var coluna= this.getColPosition(ponto);
		this.drawLinha(coluna ,this.linha + 2,coluna ,this.linha + 20,2,cor);
		this.drawLinha(coluna - 8 ,this.linha + 20,coluna + 8,this.linha + 20,2,cor);
		this.drawPonto(coluna,cor);
	}

	//draw: Método principal que realmente desenha a linha do tempo
	draw(status){	
		var col= 0;
		var colIni= this.offset;
		if(this.ctx && typeof this.ctx.beginPath != 'undefined'){
			this.ctx.beginPath();	
		}
		
		
		//linha
		this.drawLinha(colIni,this.linha,this.sizeCanvas,this.linha,2);
		
		//pontos
		let mapPeriodos= new Map(this.periodos);
		let iniSusp= 0;
		let fimSusp= 0;
		let pontoPrescricao= 0;
		let corLegenda= 'black';
		let prescreveu= (status == '17');
		let legenda= '';
		let interrompida= (",2,3,12,16,".indexOf(","+status+",") != -1);  //interrompida?
		let suspensa= (",4,5,6,8,14,".indexOf(","+status) != -1);
	
		this.sortPeriodos();	
	
		var data= null;
		var objLegenda= null;
		var thisObj= this;
		var ultData= null;
		var pontoIgual= false;
		var espacamentoIguais= 17;
		let ind= -1;
		this.periodos.forEach(function(el,i){
			ind= i;
			data= el[0];
			objLegenda= el[1];
			corLegenda= 'black';
			pontoIgual= false;
			if( ultData != null && data == ultData){ //jÃ¡ existe o ponto plotado?
				col= thisObj.getColPosition(i-1);
				col+= espacamentoIguais; //desenha um pouco mais afastado
				pontoIgual= true;
			}else{
				col= thisObj.getColPosition(i);
			}
	
			legenda= objLegenda.marco;
			corLegenda= 'black';
			
			if(legenda == 'IS' || legenda == 'FS'){
				if(!pontoIgual)
					thisObj.drawPonto(col,thisObj.corSusp);		
			}else
				thisObj.drawPonto(col,'black');
				
			if(objLegenda.marco == 'IS')  // InÃ­cio da suspensÃ£o
			{
				iniSusp= (!pontoIgual?i:i - 1);
			}else if(objLegenda.marco == 'FS'){ // InÃ­cio da suspensÃ£o
				fimSusp= (!pontoIgual?i:i-1);		
				thisObj.drawLigacao(iniSusp,fimSusp,objLegenda.diasSusp + ' dia(s)');	
			}else if(objLegenda.marco == 'PR'){
				pontoPrescricao= i;
				legenda= '';
				if(prescreveu)
					corLegenda= 'red';
				else
					corLegenda= 'green';	
			}		
			if(interrompida && (i == (thisObj.periodos.length - 1)) ){
				corLegenda= 'red';
			}else if(legenda == 'IS' || legenda == 'FS')
				corLegenda= thisObj.corSusp;
					
			if(!pontoIgual){
				thisObj.drawLegendaSup(col - 6,legenda,corLegenda);						
				thisObj.drawLegendaInf((!interrompida?col - 6:col+2),data.substring(6,8)+"/"+data.substring(4,6)+"/"+data.substring(0,4),corLegenda);		
			}
			ultData= data;
		});
		if(this.ctxt)
			this.ctx.closePath();
		if(pontoPrescricao > 0){
			this.drawSeta(pontoPrescricao,(prescreveu?'red':'green'),15);
			this.drawPonto(this.getColPosition(pontoPrescricao),(prescreveu?'red':'green'));
		}else if(interrompida){  //prescricao interrompida?
			let iPonto= ind;
			this.drawInterrupcao(iPonto,'red');
		}else if(suspensa){  //prescricao suspensa?
			let iPonto= ind;
			let is= this.getPeriodoByLegenda('IS');
			if(is != null){
				let marcoIgual=  this.getPeriodoByData(is.data,['IS','FS']);
				if(marcoIgual != null){
					iPonto= marcoIgual.pos;
				}else
					iPonto= is.pos;
			}
			this.drawLigacao(iPonto,null,'presc. suspensa');
		}
	}
}

/* Funções para execução via ajax da linha do tempo */
function linhaDoTempo(idContainer,idTr, idPena,funcShowLegenda,idTargetLegenda)
{
	if($(idContainer)){		
		let d= $(idContainer);
		if(d.style.display == ''){
			d.style.display = 'none';
			if($(idTargetLegenda))
				$(idTargetLegenda).style.display='none';
			return;
		}else{
			d.style.display='';
		}
	}
	var url= getContextPath()+'/processo/criminal/parteProcessoPena.do?actionType=ajaxLinhaDoTempoPrescricao'+
			 '&id='+idPena + '&apenasLinhaDoTempoCompleta=true';
	
	executeFetch(url,'text',
		function(data){
			let d= $(idContainer);
			let trLinha= $(idTr);
			let re=/(<canvas[^/]+\/canvas>)/gm;
			let arr=re.exec(data);
			if(!arr || arr.length < 2){
				console.log("linha do tempo não gerada:"+data);
				throw "linha do tempo não gerada:"+data;
			}
			let html= arr[1];					
			let js= data.replace(re,"");
			js= js.replace(/<script[^>]+>/gm,"");
			js= js.replace(/<\/script>/gm,"");
			
			if(trLinha)
				trLinha.style.display='';

			d.innerHTML= html;
			eval(js);
			if(typeof funcShowLegenda != 'undefined'){
				if(typeof idTargetLegenda != 'undefined')
					funcShowLegenda($(idTargetLegenda));
				else
					funcShowLegenda();
			}
				
		}
	);
}

function insertAfter(referenceNode, newNode) {
	  referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}
function getHTMLTableLegenda(){
	let s="	<table id=\"tbLegendaPrescricao\" style=\"vertical-align: bottom\">\r\n"
	+ "	<tr><td colspan=\"6\">(*) Legenda: Marcos da Prescri&ccedil;&atilde;o</td></tr>\r\n"
	+ "	<tr>\r\n"
	+ "		<td>DF: Data do Fato</td>\r\n"
	+ "		<td>DH: Data de Hoje</td>\r\n"
	+ "		<td>RD: Receb. de Den&uacute;ncia</td>\r\n"
	+ "		<td>PP: Public. da Pron&uacute;ncia</td>\r\n"
	+ "		<td>PC: Public. da Condena&ccedil;&atilde;o</td>\r\n"
	+ "		<td>PA: Public. do Ac&oacute;rd&atilde;o</td>\r\n"
	+ "	</tr>\r\n"
	+ "	</table>\r\n";
	return s;
}

function gerarDetalhesPrescricaoPena(idPena){
    let url=getContextPath()+'/processo/criminal/parteProcessoPena.do?actionType=gerarDetalhePrescricao&parentForm=processoForm&id='+idPena;
	openDialog(url,'Detalhes da Prescri&ccedil;&atilde;o',0,0);
}														

function controlaInicioAbasPartes(isEdicao){
	var layoutAbas= ($('tabItemprefix0')!=null);
	
	if(!layoutAbas){
		if($('nome'))
			$('nome').focus();
		return;	
	}
	
	var abaFoco='tabDadosBasicos';
	var indAba= 0; 
	var erro=$('ulMensErros');
	var label= '';
	var temErroEndereco= false;
	var temErroDependentes= false;
	var temErroBasico= false;
	if(erro){
		var labelErros= document.querySelectorAll('#ulMensErros li b');
		if(labelErros && labelErros.length > 0){
			for(labelErro of labelErros){
				label=labelErro.innerText;
				if(/^Endere.o:\s/.test(label)){
					//console.log("labelErro Endereço",label);					
					temErroEndereco= true;
				}else if(/^Dependente:\s/.test(label)){
					//console.log("labelErro Dependente",label);
					temErroDependentes= true;
				}else{
					//console.log("labelErro básico",label);
					temErroBasico= true;
				}
				
			}
		}
	}
	if(!temErroBasico && temErroEndereco && !isEdicao){
		abaFoco= 'tabEndereco';
		indAba= 1;
	}
	if(!temErroBasico && !temErroEndereco && temErroDependentes){
		abaFoco= 'tabDependentes';
		indAba= 3;
	}
	setTab('/projudi#', abaFoco, 'prefix', indAba, false);
				
		
	if(isEdicao && $('tabItemprefix1'))  //se for edição, não apresenta aba "Endereço"
	{
		var li=$('tabItemprefix1');
		li.parentElement.removeChild(li);
	}else{
		if(typeof _getForm_ != 'undefined'){ 
			var f= _getForm_();
			var naoConsultouIIPR= (f.consultouIIPR && f.consultouIIPR.value == 'false');
			if(naoConsultouIIPR){
				if($('tabItemprefix1') && abaFoco == 'tabDadosBasicos'){
					abaFoco= "tabEndereco";
					indAba= 1;
					setTab('/projudi#', abaFoco, 'prefix', indAba, false);
				}
			}
			if($('tabItemprefix1') && $('tabItemprefix1').style.display != 'none'){ // tem aba endereço?		
				//Troca de lugar aba de "Endereço" com aba "Dados Básicos" 
				swapElements($('tabItemprefix0'),$('tabItemprefix1'));
				addLoadEvent(function(){
					var bt= $('cancelButton');
					if(!bt || !naoConsultouIIPR)
						return;
					if(!$('btProx')){				
						var btProx= document.createElement("input");
						btProx.id= 'btProx';
						btProx.setAttribute("type","button");
						btProx.setAttribute("class","button");
						btProx.setAttribute("value","Próximo Passo >");
						btProx.onclick=function(){
							setTab('/projudi#', abaFoco, 'prefix', 0, false);
							this.style.display='none';
						};
						bt.before(btProx);
						var pInfo= document.createElement("p");
						pInfo.setAttribute("style","margin-top:10px");
						$('tbEnderecoParte').after(pInfo);
						pInfo.innerHTML= '<em class="attention">(*) Clique no botão "Próximo Passo" para avançar e continuar o cadastro na aba "Dados Básicos"</em>';

						const abas= [$('tabItemprefix0'), $('tabItemprefix1'), $('tabItemprefix2'), $('tabItemprefix3')]; 
						abas.forEach(function(tab, i) {
							tab.addEventListener("click",
							 	function(){	
									//console.log("tab",tab);							
									if($('btProx')){
										if(tab.id == 'tabItemprefix1' && !$('saveButton')){
											$('btProx').style.display='';
										}else{
											$('btProx').style.display='none';
										}
									}
								});
	    				});
					}											
				});
			}	
			
		}
	}
	window.ABA_PARTE_ATIVA= abaFoco; 
}

function gerarInfoMsg(elemento,title,texto,tamanho,style)
{
	var classAjax= 'ajaxCallOutHelp_'+elemento.id;
	//var link= document.createElement('a');
	var img="iInfoAdvogado";
	var w=0;
	var h=0;
	
	//link.href='#';
	//link.className=classAjax;
	//link.setAttribute('style',(typeof style!='undefined'?style:'position:relative;left:2px;top:1px;'));
	
	if(typeof tamanho == 'undefined')
		tamanho= 'grande';

	if(tamanho.endsWith('2')){
		img="iInfoAdvogado2";
		tamanho= tamanho.substring(0,tamanho.length-1);
	}

	
	var i= document.createElement('img');
	i.setAttribute('src',getContextPath()+'/img/themes/olive/mainPage/'+img+'.gif?x=1');
	i.setAttribute('style','vertical-align:text-bottom;position:relative;left:2px;top:2px');
	
	i.className=classAjax;
	//link.appendChild(i);
	//elemento.insertAdjacentElement('afterend',link);
	elemento.insertAdjacentElement('afterend',i);
	
	if(tamanho == 'pequeno'){
		w=250;h=50;
	}else if(tamanho == 'medio'){
		w=320;h=65;
	}else if(tamanho == 'grande'){
		w=400;h=100;
	}else if(tamanho == 'muitoGrande'){
		w=450;h=150;
	}
	
	var mensagemSemResource=false;
	if(texto.startsWith("[s]")){
		mensagemSemResource= true;
		texto= escape(texto.replace("[s]",""));
	}
	
	var parms= (!mensagemSemResource?"mensagemResource=":"mensagemSemResource=")+texto;
	
	window['_'+classAjax]= new AjaxJspTag.Callout(
		getContextPath()+'/processo/parteCadastro.do?actionType=ajaxHint&widthInfo='+w+'&heightInfo='+h,
		{
			overlib: "STICKY,CLOSECLICK,DELAY,0,VAUTO,HAUTO,CLOSETEXT,'X',CLOSETITLE,'Fechar',BGCLASS,'ajaxCalloutLayout',FGCLASS,'ajaxCalloutTextLayout',TEXTFONTCLASS,'ajaxCalloutTextFont',CGCLASS,'ajaxCalloutCaptionLayout',CAPTIONFONTCLASS,'ajaxCalloutCaptionFont',CLOSEFONTCLASS,'ajaxCalloutCloseFont'",
			sourceClass: classAjax,
			title: title,
			openEvent: "mouseover",
			closeEvent: "mouseout",
			parameters: parms,
			doPost: false
		}
	);
	i.setAttribute("onmouseover","_handlerCalloutOver(event,'"+classAjax+"')");
	i.setAttribute("onmouseout","_handlerCalloutOut()");
}

function _handlerCalloutOver(e,classAjax){
	var w= window['_'+classAjax];
	if(w)
		w.execute(e);
}

function _handlerCalloutOut(){
	var divOver= $('overDiv');
	if(divOver && divOver.style.visibility == 'visible')
		divOver.style.visibility='hidden';
		
}

function swapElements(a, b) {
	var p1 = a.parentNode,
		p2 = b.parentNode,
		i1,
		i2;

	if (!p1 || !p2 || p1.isEqualNode(b) || p2.isEqualNode(a)) return;

	for (var i = 0; i < p1.children.length; i++) {
		if (p1.children[i].isEqualNode(a)) {
			i1 = i;
		}
	}
	for (var i = 0; i < p2.children.length; i++) {
		if (p2.children[i].isEqualNode(b)) {
			i2 = i;
		}
	}

	if (p1.isEqualNode(p2) && i1 < i2) {
		i2++;
	}
	p1.insertBefore(b, p1.children[i1]);
	p2.insertBefore(a, p2.children[i2]);
}

//--------------------------------------------------------------------------------------------------
// Classe utilitária responsável por toda a execução e controle de chamadas ajax
// autor: Luciano M. Ribas
//--------------------------------------------------------------------------------------------------

class AjaxCriminal {

	canShowLoading= true;
	msgAjax= '';
	campos= [];
	container = 'cAjaxDivLoading';
	urlIndicator = '/projudi/img/indicator.gif';
	showIndicator= false;
	constructor(campos, msgAjax){
		if(msgAjax){
			this.msgAjax= msgAjax;
		}
		this.campos=campos;
	}

	setShowLoading(show) {
		this.canShowLoading= show;
	}
	showLoading(texto)
	{
		if(!this.canShowLoading)
			return;
		let width= 360;
		let height= 100;
		let d=document.createElement('div');
		let f= null;
		let sp= null;
		d.id= this.container;

		if(this.msgAjax){
			d.setAttribute("style",
				"position:fixed;left:26%;top:42%;border:solid 2px #3E4034;"+
				"width:"+width+"px;height:"+height+"px;background-color:white;padding-top:0;"+
				"padding-left:28px;border-radius:6px;color:#3E4034"
			);
			d.setAttribute("class","tjpr_title");
			f= document.createElement('fieldSet');
			sp= document.createElement('span');
			sp.id="indicatorClasse";
			sp.setAttribute("style","margin-left:-48px;")
		}else{
			//Posiciona ao lado do elemento
			let x= 0;
			let y= 0;
			let position= "absolute";
			if(this.campos && this.campos.length > 0) {
				let campo1= this.campos[0];
				let c=$(campo1);
				let pos= getPosicaoElemento(c);
				x= Math.round(pos.right) + 'px';
				y= Math.round(pos.top) + 'px';
			}else{
				x= '36%';
				y= '42%';
				position= "fixed"
			}
			//console.log("c",c);
			this.showIndicator= true;
			//console.log("x",x,"y",y);
			d.setAttribute("style", "position:"+ position+";left:"+x+";top:"+y+";width:20px;height:20px;");
		}
		let img= document.createElement('img');
		img.src= getContextPath()+'/img/indicator.gif';
		img.setAttribute("class","indicatorOn");
		img.setAttribute("style","padding-top:0" + (this.showIndicator?";padding-left:2px":""));
		img.setAttribute("align","top");

		if(this.msgAjax) {
			sp.appendChild(img);
			let h3 = document.createElement('h3');
			h3.appendChild(document.createTextNode("Processando"));
			h3.setAttribute("style", "margin-top:-4px;margin-bottom:20px;color:#63735F");
			sp.appendChild(h3);
			let b=document.createElement('b');
			b.id='bTextoLoading';
			if(!texto)
				texto="Carregando... Por favor, aguarde...";

			window.textoLoading=texto;
			b.appendChild(document.createTextNode(window.textoLoading));
			sp.appendChild(b);
			f.appendChild(sp);
			d.appendChild(f);
		}else{
			d.appendChild(img);
		}
		document.body.appendChild(d);
	}

	removeDiv(){
		let div= document.getElementById(this.container);
		if(!div || !div.parentElement)
			return;
		div.parentElement.removeChild(div);
	}
	hideLoading(msg){
		if(!this.canShowLoading)
			return;

		let div= document.getElementById(this.container);
		if(!div)
			return;
		let tempo= 400;

		if(this.showIndicator){
			tempo= 200;
			let self= this;
			window.setTimeout(function(){
				self.removeDiv();
			},tempo);
		}else{
			if(document.getElementById('bTextoLoading')){
				if(!msg && !this.msgAjax){
					this.removeDiv();
				}else{
					if(!msg)
						msg='Operação realizada com sucesso.'
					else{
						tempo= 1000;
						msg= '<em class="atention">'+msg+'</em>';
					}
					document.getElementById('bTextoLoading').innerHTML= msg;
					let self= this;
					window.setTimeout(function(){
						if(document.getElementById('bTextoLoading'))
							document.getElementById('bTextoLoading').innerText=window.textoLoading;
						self.removeDiv();
					},tempo);
				}
			}else{
				this.removeDiv();
			}
		}
	}

	limparCamposAjax(campos){
		if(!campos)
			return;
		for(let campo of campos) {
			if(campo.startsWith("[r]")) //readonly?
				campo= campo.replace("[r]","");
			this.limparCampo(document.getElementById(campo));
		}
	}

	limparCampo(comp){
		if(!comp)
			return;
		if(typeof comp.type == 'undefined' && typeof comp.length != 'undefined')
			comp.type= 'radio';

		switch(comp.type){
			case 'text':
			case 'textarea':
				comp.value = '';
				break;
			case 'select':
			case 'select-one':
				comp.selectedIndex= 0;
				this.forcarChamadaEvento(comp,"change");
				break;
			case 'radio':
				comp.forEach(function(r){r.checked= false;});
				break;
			case 'checkbox':
				//força comportamento de clique para chamar rotina de tratamento das combos multi-selects
				comp.checked= true;
				comp.click();
				break;
		}
	}

	forcarChamadaEvento(elemento,evento){
		if ("createEvent" in document) {
			var evt = document.createEvent("HTMLEvents");
			evt.initEvent(evento, false, true);
			elemento.dispatchEvent(evt);
		}else{
			elemento.fireEvent(evento);
		}
	}

	aoReceberAjax(dados,fxCallback){
		try{
			console.log("Dados Ajax",dados);
			var oJson=JSON.parse(dados);
			if(typeof oJson.msgErro != 'undefined' && oJson.msgErro != ''){
				this.hideLoading(oJson.msgErro);
				fxCallback(false);
			}else{
				this.hideLoading();
				fxCallback(true);
			}
			//console.log("fim atualizar");
		}catch(err){
			console.log(err);
			this.hideLoading();
		}
	}

	setValorComponente(comp, valor){
		if(typeof comp == 'undefined' || comp == null)
			return;

		if(typeof comp.type == 'undefined' && typeof comp.length != 'undefined'){
			comp.type= 'radio';
		}

		//console.log(comp.name +":" +comp.type);

		switch(comp.type){
			case 'text':
			case 'textarea':
				comp.value = valor;
				break;
			case 'select':
			case 'select-one':
				if(Array.isArray(valor)){
					//console.log("array",valor);
					//remove elementos
					let optSelecionar= null;
					if(comp.options.length > 0 && (comp.options[0].value == '' || comp.options[0].value == '-1')){
						optSelecionar= new Option(comp.options[0].text,comp.options[0].value);
					}
					while (comp.options.length > 0) {
						comp.remove(0);
					}
					if(optSelecionar != null){
						comp.add(optSelecionar);
					}
					//cria novos valores
					valor.forEach( (el) => comp.add(new Option(el.text, el.value)) );
				}else{
					Array.from(comp.options).forEach(
						function(o,i){
							if(o.value == String(valor)){
								//o.setAttribute('selected', 'selected');
								comp.disabled= false;
								comp.selectedIndex= i;
								this.forcarChamadaEvento(comp,"change");
							}
						}
					);
				}
				break;
			case 'select-multiple': //componente multiSele
				var oMultiSelect= eval(comp.name+'MultiSelect');
				oMultiSelect.updateByValues(valor);
				break;
			case 'radio':
				//console.log("radio="+comp.name+ " com o valor="+valor);
				comp.forEach(function(r){
					if(String(r.value) == String(valor) )
						r.checked= true;
				});
				break;
			case 'checkbox':
				//console.log("CHECK="+comp.name+ " com o valor="+valor + " "+typeof valor);
				comp.checked= valor;
				break;
		}
	}

	trataComponenteComoReadOnly(comp){
		if(!comp || !comp.type)
			return;
		if(comp.type == 'radio')
			comp.forEach(function(r){r.className='componenteReadOnly';});
		else
			comp.className='componenteReadOnly';
	}

	atualizaFieldsByJson(campos,dados){
		//console.log("atualizaFieldsByJson: SUCESSO, atualizando dados nos campos: "+campos+".");
		let oJson=JSON.parse(dados);
		//console.log("oJson", oJson);
		for (const property in oJson){
			//setValorComponente(formObj.elements[property],oJson[property]);
			if(!document.getElementById(property))
				console.error("Componente nao encontrada para atualizar via ajax",property);
			else{
				this.setValorComponente(document.getElementById(property),oJson[property]);
			}
		}
		//trata campos read-only
		for(let campo of campos){
			if(campo.startsWith("[r]")){
				let idCampo= campo.replace("[r]","");
				this.trataComponenteComoReadOnly(document.getElementById(idCampo));
			}
		}
	}
	executar(url,fxCallBack){
		try{
			this.showLoading(this.msgAjax);
			this.limparCamposAjax(this.campos);
			let self= this;
			return executeFetch(url,'text',
				function(dados){
					let resultado= self.aoReceberAjax(dados, (sucesso) => {
						if(sucesso && !fxCallBack)
							self.atualizaFieldsByJson(self.campos,dados);
						if(fxCallBack)
							fxCallBack(dados);
					});
				}
			);
		}catch(err){
			console.log(err);
			this.hideLoading();
		}
	}
}

function _criarHiddenDinamicoForm(f, idHidden, valorHidden) {
	let iHidden= document.createElement('INPUT');
	iHidden.type='hidden';
	iHidden.name= GerenciadorVoltarCriminal.getIdHiddenDefault();
	iHidden.id= GerenciadorVoltarCriminal.getIdHiddenDefault();
	iHidden.value= valorHidden;

	f.appendChild(iHidden);
}

class GerenciadorVoltarCriminal {
	constructor(idControladorComponent){
		this.urls=[];
		this.separador= '##';
		//console.log("----- inicio construtor -----")

		this.controladorComponent= document.getElementById(idControladorComponent);
		if(!this.controladorComponent) {
			console.error("Não foi possível obter o input hidden de controle:" +idControladorComponent);
			return;
		}

		if(this.controladorComponent.value != '') {
			this.urls= this.controladorComponent.value.split(this.separador);
			//console.log("this.urls",this.urls)
		}
		//console.log("----- fim construtor -----")
	}

	_limpaStr(s) {
		return s.replaceAll("\\","").replaceAll(": ",":").replace(/^"/,"").replace(/"$/,"");
	}
	static push(form, idControladorComponent, url) {
		console.log("form", form);
		if(!$(idControladorComponent)) {
			_criarHiddenDinamicoForm(form, idControladorComponent, "");
		}
		let g= new GerenciadorVoltarCriminal(idControladorComponent);
		g.pushElement(url);
		return url;
	}
	static getIdHiddenDefault() { return 'gerenciadorBotaoVoltar' }
	static pop(idControladorComponent) {
		if(!$(idControladorComponent))
			return null;
		let g= new GerenciadorVoltarCriminal(idControladorComponent);
		let url=g.popElement();
		//console.log("----------- POP -----------------");
		//console.log("idControlador",idControladorComponent);
		//console.log("novo controlador",$(idControladorComponent).value);
		//console.log("------------------------------");
		return url;
	}

	static aoClicarVoltar(f){
		let url= GerenciadorVoltarCriminal.pop(GerenciadorVoltarCriminal.getIdHiddenDefault());
		let newF= document.createElement('FORM');
		newF.name= 'formGerenciadorVoltar';
		newF.id= 'formGerenciadorVoltar';
		//console.log("URL para voltar",url);
		newF.action= url;
		newF.method="post";

		_criarHiddenDinamicoForm(
			newF, GerenciadorVoltarCriminal.getIdHiddenDefault(),
			f.elements[GerenciadorVoltarCriminal.getIdHiddenDefault()].value
		);

		document.body.appendChild(newF);
		newF.submit();
	}
	pushElement(p){
		this.urls.push(p);
		this.controladorComponent.value=this.urls.join(this.separador);
	}

	popElement(){
		let url= this.urls.pop();
		this.controladorComponent.value=this.urls.join(this.separador);
		return url;
	}

	clear(){
		this.urls= [];
		this.controladorComponent.value= '';
	}
	print(){
		console.log("urls",this.urls);
		console.log("urls.length",this.urls.length);
	}
}

//funções simplificadas para serem utilizados dentros dos JSPs para push ou pop de urls no gerenciador
function pushBotaoVoltar(form, backURL){
	GerenciadorVoltarCriminal.push(form, GerenciadorVoltarCriminal.getIdHiddenDefault(),backURL);
}
function popBotaoVoltar(){ return GerenciadorVoltarCriminal.pop(GerenciadorVoltarCriminal.getIdHiddenDefault()); }

function showLoadingMessage(texto, tempoEspera)
{
	let width= 300;
	let height= 40;
	let d=document.createElement('div');
	d.id= 'divLoadingMsg';

	d.setAttribute("style",
		"position:fixed;left:30%;top:42%;border:solid 2px #3E4034;"+
		"width:"+width+"px;height:"+height+"px;background-color:white;padding-top:20px;"+
		"text-align:center;border-radius:6px;color:#3E40340;" +
		"box-shadow: rgba(0, 0, 0, 0.19) 0px 10px 20px, rgba(0, 0, 0, 0.23) 0px 6px 6px;"
	);
	d.setAttribute("class","tjpr_title");

	let b=document.createElement('b');
	b.id='bTextoLoading';

	b.appendChild(document.createTextNode(texto));
	d.appendChild(b);
	document.body.appendChild(d);

	if(tempoEspera){
		setTimeout( () => {
			$('divLoadingMsg').parentElement.removeChild($('divLoadingMsg'));
		},tempoEspera)
	}
}

var myContextPath = ''; function getContextPath() { if(myContextPath == '') { var b = document.URL; b = b.substr(b.indexOf('/', b.indexOf('//') + 2), b.indexOf('/', b.indexOf('/', b.indexOf('//') + 2) + 1)); myContextPath = b.substr(0, b.indexOf('/', 1)); } return myContextPath; }
/******************************************************************************
 *                     Fun��es JavaScript utilizadas no PROJUDI               *
 ******************************************************************************/

/**
 * Adi��o de mais funcionalidades a String: repeat de caracteres e padL e padR
 */
String.repeat = function(chr,count)
{    
    var str = ""; 
    for(var x=0;x<count;x++) {str += chr}; 
    return str;
}
String.prototype.padL = function(width,pad)
{
    if (!width ||width<1)
        return this;   
    if (!pad) pad=" ";        
    var length = width - this.length
    if (length < 1) return this.substr(0,width);
    return (String.repeat(pad,length) + this).substr(0,width);    
}    
String.prototype.padR = function(width,pad)
{
    if (!width || width<1)
        return this;        
    if (!pad) pad=" ";
    var length = width - this.length
    if (length < 1) this.substr(0,width);
    return (this + String.repeat(pad,length)).substr(0,width);
}

//Adiciona o m�todo formatDate ao objeto Date similar ao existente em Java 
Date.prototype.formatDate = function(format)
{
    var date = this;
    if (!format)
      format="MM/dd/yyyy";               
    var month = date.getMonth() + 1;
    var year = date.getFullYear();    
    format = format.replace("MM",month.toString().padL(2,"0"));        
    if (format.indexOf("yyyy") > -1)
        format = format.replace("yyyy",year.toString());
    else if (format.indexOf("yy") > -1)
        format = format.replace("yy",year.toString().substr(2,2));
    format = format.replace("dd",date.getDate().toString().padL(2,"0"));
    var hours = date.getHours();       
    if (format.indexOf("t") > -1)
    {
       if (hours > 11)
        format = format.replace("t","pm")
       else
        format = format.replace("t","am")
    }
    if (format.indexOf("HH") > -1)
        format = format.replace("HH",hours.toString().padL(2,"0"));
    if (format.indexOf("hh") > -1) {
        if (hours > 12) hours - 12;
        if (hours == 0) hours = 12;
        format = format.replace("hh",hours.toString().padL(2,"0"));        
    }
    if (format.indexOf("mm") > -1)
       format = format.replace("mm",date.getMinutes().toString().padL(2,"0"));
    if (format.indexOf("ss") > -1)
       format = format.replace("ss",date.getSeconds().toString().padL(2,"0"));
    return format;
}

//+ Jonas Raoni Soares Silva
//@ http://jsfromhell.com/string/wordwrap [rev. #2]

String.prototype.wordWrap = function(m, b, c){
  var i, j, l, s, r;
  if(m < 1)
      return this;
  for(i = -1, l = (r = this.split("\n")).length; ++i < l; r[i] += s)
      for(s = r[i], r[i] = ""; s.length > m; r[i] += s.slice(0, j) + ((s = s.slice(j)).length ? b : ""))
          j = c == 2 || (j = s.slice(0, m + 1).match(/\S*(\s)?$/))[1] ? m : j.input.length - j[0].length
          || c == 1 && m || j.input.length + (j = s.slice(m).match(/^\S*/)).input.length;
  return r.join("\n");
};


/**
 * Copia o número do processo para o clipboard
 */
function copyToClipboard(valor) {
	const el = document.createElement('textarea');
	el.value = valor;
	el.setAttribute('readonly', '');
	el.style.position = 'absolute';
	el.style.left = '-9999px';
	document.body.appendChild(el);
	const selected =  document.getSelection().rangeCount > 0  ? document.getSelection().getRangeAt(0) : false;
	el.select();
	document.execCommand('copy');
	document.body.removeChild(el);
	if (selected) {
		document.getSelection().removeAllRanges();
		document.getSelection().addRange(selected);
	}
};



/******************************************************************************
 *                                    POPUPS                                  *
 ******************************************************************************/
/**
 * Fun��o para acertar a altura dos DIVs de conte�do em telas popup
 * (ap�s executar esta fun��o, a popup fica sem scroll vertical)
 * @param idDiv: id do DIV que ser� ajustado o tamanho
 * @param qtdeLinhas: quantidade de linhas existentes no filtro de pesquisa
 */
function updateDivHeight(idDiv, qtdeLinhas) {
	// obt�m o div
    var divElem = document.getElementById(idDiv);
    
    // calcula a altura do userInfo (em modo debug o tamanho � maior)
    var hUserInfo = 0;
    if( document.getElementById('userinfo') != null ) {
        hUserInfo = 15 + (19 * qtdeLinhas);
    }
    
    // altura da popup onde est�o o t�tulo, bot�es, etc
    var hAux = 165;
    
    // acerta a altura do DIV passado como par�metro
    divElem.style.height = document.body.clientHeight - hUserInfo - hAux + 'px';	
}

/**
* Fun��o que calcula e retorna a altura do FCKEditor em telas popup
* (ap�s executar esta fun��o, a popup fica sem scroll vertical)
*/
function calcFCKEditorHeight(tamanhoCabecalho) {
    // calcula a altura do userInfo (em modo debug o tamanho � maior)
    var hUserInfo = 0;
    var cabecalhoPadrao = 216;
    if( document.getElementById('userinfo') != null ) {
        hUserInfo = 34;
    }

    if (tamanhoCabecalho != null) {
    	cabecalhoPadrao = tamanhoCabecalho;
    }
    
    // calcula a altura do FCKEditor
    //var h = document.body.clientHeight - 120 - hUserInfo;
    var h = document.body.clientHeight - cabecalhoPadrao - hUserInfo;
	
    // retorna a altura
	return h;
}

/**
* Fun��o que calcula e retorna a altura do visualizador de PDF em telas popup
* (ap�s executar esta fun��o, a popup fica sem scroll vertical)
*/
function calcPDFViewerHeight(tamanhoCabecalho) {
    // calcula a altura do userInfo (em modo debug o tamanho � maior)
    var hUserInfo = 0;
    var cabecalhoPadrao = 120;
    if( document.getElementById('userinfo') != null ) {
        hUserInfo = 34;
    }
    
    if (tamanhoCabecalho != null) {
    	cabecalhoPadrao = tamanhoCabecalho;
    }

    // calcula a altura do FCKEditor
    var h = document.body.clientHeight - cabecalhoPadrao - hUserInfo;
	
    // retorna a altura
	return h;
}


/**
 * Fun��o para abrir popup de cadastro de CDAs
 * @param titulo...............: t�tulo da popup
 * @param contextPath..........: caminho do contexto (geralmente "/projudi")
 * @param parentForm...........: nome do form pai  
 * @param parentURL............: url para fechar a popup e dar submit no form pai 
 * @returns
 */
function openDialogCadastroCDA(titulo, contextPath, parentForm, parentURL) {
	var url = contextPath 
			+ '/processo/fazenda/cda.do?actionType=iniciarCadastro' 
			+ '&parentForm=' + parentForm + '&parentURL=' + parentURL;
	openSubmitDialog(url,titulo,650,300,parentForm,parentURL);		
}

/**
 * Fun��o para abrir popup de edi��o de CDAs
 * @param titulo...............: t�tulo da popup
 * @param contextPath..........: caminho do contexto (geralmente "/projudi")
 * @param parentForm...........: nome do form pai  
 * @param parentURL............: url para fechar a popup e dar submit no form pai 
 * @param complementoURL.......: complemento da url com as informa��es da CDA sendo alterada
 * @returns
 */
function openDialogEdicaoCDA(titulo, contextPath, parentForm, parentURL, complementoURL) {
	var url = contextPath 
			+ '/processo/fazenda/cda.do?actionType=iniciarEdicao' 
			+ '&parentForm=' + parentForm + '&parentURL=' + parentURL + complementoURL;
	openSubmitDialog(url,titulo,650,300,parentForm,parentURL);		
}


/******************************************************************************
 *                     POPUP DE SELE��O DE CLASSE PROCESSUAL                  *
 ******************************************************************************/
/**
 * Fun��o para selecionar a Classe Processual pela Vara
 * @param titulo...............: t�tulo da popup
 * @param contextPath..........: caminho do contexto (geralmente "/projudi")
 * @param codVara..............: c�digo da vara  
 * @param parentForm...........: nome do form pai  
 * @param parentIdField........: "input" no form pai que ser� preenchido com o id da classe processual selecionada  
 * @param parentDescricaoField.: "input" no form pai que ser� preenchido com a descri��o da classe processual selecionada
 */
function openDialogSelecaoClasseProcessualByVara(titulo, contextPath, codVara, parentForm, parentIdField, parentDescricaoField) {
	var complementoURL = '&codVara=' + codVara;
	openDialogSelecaoClasseProcessual(titulo, contextPath, parentForm, parentIdField, parentDescricaoField, complementoURL);
}

/**
 * Fun��o para selecionar a Classe Processual pela Turma Recursal
 * @param titulo...............: t�tulo da popup
 * @param contextPath..........: caminho do contexto (geralmente "/projudi")
 * @param codTurma.............: c�digo da turma recursal  
 * @param parentForm...........: nome do form pai  
 * @param parentIdField........: "input" no form pai que ser� preenchido com o id da classe processual selecionada  
 * @param parentDescricaoField.: "input" no form pai que ser� preenchido com a descri��o da classe processual selecionada
 */
function openDialogSelecaoClasseProcessualByTurma(titulo, contextPath, codTurma, parentForm, parentIdField, parentDescricaoField) {
	var complementoURL = '&codTurma=' + codTurma;
	openDialogSelecaoClasseProcessual(titulo, contextPath, parentForm, parentIdField, parentDescricaoField, complementoURL);
}
function openDialogSubmitSelecaoClasseProcessualByTurma(titulo, contextPath, codTurma, parentForm, parentIdField, parentDescricaoField,parentURL) {
	var complementoURL = '&codTurma=' + codTurma;
	openDialogSubmitSelecaoClasseProcessual(titulo, contextPath, parentForm, parentIdField, parentDescricaoField, complementoURL,parentURL);
}

/**
 * Fun��o para selecionar a Classe Processual pela �rea de Varas
 * @param titulo...............: t�tulo da popup
 * @param contextPath..........: caminho do contexto (geralmente "/projudi")
 * @param codAreaDeVaras.......: c�digo da �rea de varas  
 * @param parentForm...........: nome do form pai  
 * @param parentIdField........: "input" no form pai que ser� preenchido com o id da classe processual selecionada  
 * @param parentDescricaoField.: "input" no form pai que ser� preenchido com a descri��o da classe processual selecionada
 */
function openDialogSelecaoClasseProcessualByAreaDeVaras(titulo, contextPath, codAreaDeVaras, parentForm, parentIdField, parentDescricaoField) {
	// abre a popup (sem encriptar a url)
	var complementoURL = '&codAreaDeVaras=' + codAreaDeVaras;
	openDialogSelecaoClasseProcessual(titulo, contextPath, parentForm, parentIdField, parentDescricaoField, complementoURL);
}

/**
 * Fun��o para selecionar a Classe Processual pela �rea Recursal
 * @param titulo...............: t�tulo da popup
 * @param contextPath..........: caminho do contexto (geralmente "/projudi")
 * @param codAreaRecursal......: c�digo da �rea recursal
 * @param parentForm...........: nome do form pai  
 * @param parentIdField........: "input" no form pai que ser� preenchido com o id da classe processual selecionada  
 * @param parentDescricaoField.: "input" no form pai que ser� preenchido com a descri��o da classe processual selecionada
 */
function openDialogSelecaoClasseProcessualByAreaRecursal(titulo, contextPath, codAreaRecursal, parentForm, parentIdField, parentDescricaoField) {
	var complementoURL = '&codAreaRecursal=' + codAreaRecursal;
	openDialogSelecaoClasseProcessual(titulo, contextPath, parentForm, parentIdField, parentDescricaoField, complementoURL);
}

function openDialogSubmitSelecaoClasseProcessualByAreaRecursal(titulo, contextPath, codAreaRecursal, parentForm, parentIdField, parentDescricaoField,parentURL) {
	var complementoURL = '&codAreaRecursal=' + codAreaRecursal;
	openDialogSubmitSelecaoClasseProcessual(titulo, contextPath, parentForm, parentIdField, parentDescricaoField, complementoURL,parentURL);
}

/**
 * Fun��o para selecionar a Classe Processual
 * @param titulo...............: t�tulo da popup
 * @param contextPath..........: caminho do contexto (geralmente "/projudi")
 * @param parentForm...........: nome do form pai  
 * @param parentIdField........: "input" no form pai que ser� preenchido com o id da classe processual selecionada  
 * @param parentDescricaoField.: "input" no form pai que ser� preenchido com a descri��o da classe processual selecionada
 * @param complementoURL.......: complemento da url (por exemplo, string vazia("") para buscar todos ou "codVara", etc)
 */
function openDialogSelecaoClasseProcessual(titulo, contextPath, parentForm, parentIdField, parentDescricaoField, complementoURL) {
	// abre a popup (sem encriptar a url)
	var url = contextPath + '/processo/classeProcessual.do?actionType=pesquisar' +
		'&parentForm=' + parentForm + '&parentIdField=' + parentIdField + '&parentDescricaoField=' + parentDescricaoField + complementoURL;
	openDialog(url,titulo,0,0);
}
function openDialogSubmitSelecaoClasseProcessual(titulo, contextPath, parentForm, parentIdField, parentDescricaoField, complementoURL,parentURL) {
	// abre a popup (sem encriptar a url)
	var url = contextPath + '/processo/classeProcessual.do?actionType=pesquisar' +
		'&parentForm=' + parentForm + '&parentIdField=' + parentIdField + '&parentDescricaoField=' + parentDescricaoField + complementoURL
		 + '&parentURL=' + parentURL 
		 
	openSubmitDialog(url,titulo,0,0,parentForm,parentURL);		
}

function openDialogSelecaoClasseProcessualRecursais(titulo, contextPath, parentForm, parentIdField, parentDescricaoField) {
	// abre a popup (sem encriptar a url)
	var url = contextPath + '/processo/classeProcessual.do?actionType=pesquisarClassesProcessuaisRecursais' +
		'&parentForm=' + parentForm + '&parentIdField=' + parentIdField + '&parentDescricaoField=' + parentDescricaoField;
	openDialog(url,titulo,0,0);
}

function openDialogSelecaoMultiplaClasseProcessual(titulo, contextPath, parentForm, parentURL, selectedValues) {
	// abre a popup (sem encriptar a url)
	var url = contextPath + '/processo/classeProcessual.do?actionType=pesquisarMultiplo' + '&parentForm=' + parentForm + '&parentURL=' + parentURL + '&selectedValues=' + selectedValues; 		 
	openSubmitDialog(url,titulo,0,0,parentForm,parentURL);			
}

/******************************************************************************
 *                    POPUP DE SELE��O DE ASSUNTO PRINCIPAL                   *
 ******************************************************************************/
/**
 * Fun��o para selecionar o Assunto Principal pela Vara
 * @param titulo...............: t�tulo da popup
 * @param contextPath..........: caminho do contexto (geralmente "/projudi")
 * @param codVara..............: c�digo da vara
 * @param parentForm...........: nome do form pai  
 * @param parentIdField........: "input" no form pai que ser� preenchido com o id da classe processual selecionada  
 * @param parentDescricaoField.: "input" no form pai que ser� preenchido com a descri��o da classe processual selecionada
 */
function openDialogSelecaoAssuntoPrincipalByVara(titulo, contextPath, codVara, parentForm, parentIdField, parentDescricaoField) {
	var complementoURL = '&codVara=' + codVara;	
	openDialogSelecaoAssuntoPrincipal(titulo, contextPath, parentForm, parentIdField, parentDescricaoField, complementoURL);
}

/**
 * Fun��o para selecionar o Assunto Principal pela Turma Recursal
 * @param titulo...............: t�tulo da popup
 * @param contextPath..........: caminho do contexto (geralmente "/projudi")
 * @param codTurma.............: c�digo da turma recursal
 * @param parentForm...........: nome do form pai  
 * @param parentIdField........: "input" no form pai que ser� preenchido com o id da classe processual selecionada  
 * @param parentDescricaoField.: "input" no form pai que ser� preenchido com a descri��o da classe processual selecionada
 */
function openDialogSelecaoAssuntoPrincipalByTurma(titulo, contextPath, codTurma, parentForm, parentIdField, parentDescricaoField) {
	var complementoURL = '&codTurma=' + codTurma;	
	openDialogSelecaoAssuntoPrincipal(titulo, contextPath, parentForm, parentIdField, parentDescricaoField, complementoURL);
}

/**
 * Fun��o para selecionar o Assunto Principal pela �rea de Varas
 * @param titulo...............: t�tulo da popup
 * @param contextPath..........: caminho do contexto (geralmente "/projudi")
 * @param codAreaDeVaras.......: c�digo da �rea de varas
 * @param parentForm...........: nome do form pai  
 * @param parentIdField........: "input" no form pai que ser� preenchido com o id da classe processual selecionada  
 * @param parentDescricaoField.: "input" no form pai que ser� preenchido com a descri��o da classe processual selecionada
 */
function openDialogSelecaoAssuntoPrincipalByAreaDeVaras(titulo, contextPath, codAreaDeVaras, parentForm, parentIdField, parentDescricaoField) {
	var complementoURL = '&codAreaDeVaras=' + codAreaDeVaras;	
	openDialogSelecaoAssuntoPrincipal(titulo, contextPath, parentForm, parentIdField, parentDescricaoField, complementoURL);
}

/**
 * Fun��o para selecionar o Assunto Principal pela �rea Recursal
 * @param titulo...............: t�tulo da popup
 * @param contextPath..........: caminho do contexto (geralmente "/projudi")
 * @param codAreaRecursal......: c�digo da �rea recursal
 * @param parentForm...........: nome do form pai  
 * @param parentIdField........: "input" no form pai que ser� preenchido com o id da classe processual selecionada  
 * @param parentDescricaoField.: "input" no form pai que ser� preenchido com a descri��o da classe processual selecionada
 */
function openDialogSelecaoAssuntoPrincipalByAreaRecursal(titulo, contextPath, codAreaRecursal, parentForm, parentIdField, parentDescricaoField) {
	var complementoURL = '&codAreaRecursal=' + codAreaRecursal;	
	openDialogSelecaoAssuntoPrincipal(titulo, contextPath, parentForm, parentIdField, parentDescricaoField, complementoURL);
}

/**
 * Fun��o para selecionar o Assunto Principal
 * @param titulo...............: t�tulo da popup
 * @param contextPath..........: caminho do contexto (geralmente "/projudi")
 * @param parentForm...........: nome do form pai  
 * @param parentIdField........: "input" no form pai que ser� preenchido com o id da classe processual selecionada  
 * @param parentDescricaoField.: "input" no form pai que ser� preenchido com a descri��o da classe processual selecionada
 * @param complementoURL.......: complemento da url (por exemplo, string vazia("") para buscar todos ou "codVara", etc)
 */
function openDialogSelecaoAssuntoPrincipal(titulo, contextPath, parentForm, parentIdField, parentDescricaoField, complementoURL) {
	// abre a popup (sem encriptar a url)
	var url = contextPath + '/processo/assunto.do?actionType=pesquisar&tipoSelecao=selecaoPrincipal' +
		'&parentForm=' + parentForm + '&parentIdField=' + parentIdField + '&parentDescricaoField=' + parentDescricaoField + complementoURL;
	openDialog(url,titulo,0,0);
}

function openDialogSelecaoMultiplaAssunto(titulo, contextPath, parentForm, parentURL, selectedValues) {
	// abre a popup (sem encriptar a url)
	var url = contextPath + '/processo/assunto.do?actionType=pesquisarMultiplo' + '&parentForm=' + parentForm + '&parentURL=' + parentURL + '&selectedValues=' + selectedValues; 		 
	openSubmitDialog(url,titulo,0,0,parentForm,parentURL);			
}

/******************************************************************************
 *                     POPUP DE SELE��O DE ASSUNTO SECUND�RIO                 *
 ******************************************************************************/
/**
 * Fun��o para selecionar o Assunto Secund�rio pela Vara
 * @param titulo......: t�tulo da popup
 * @param contextPath.: caminho do contexto (geralmente "/projudi")
 * @param codVara.....: c�digo da vara
 * @param parentForm..: nome do form pai  
 * @param parentURL...: url para fechar a popup e dar submit no form pai
 */
function openDialogSelecaoAssuntoSecundarioByVara(titulo, contextPath, codVara, parentForm, parentURL) {
	var complementoURL = '&codVara=' + codVara;	
	openDialogSelecaoAssuntoSecundario(titulo, contextPath, parentForm, complementoURL, parentURL);
}

/**
 * Fun��o para selecionar o Assunto Secund�rio pela Turma Recursal
 * @param titulo......: t�tulo da popup
 * @param contextPath.: caminho do contexto (geralmente "/projudi")
 * @param codTurma....: c�digo da turma
 * @param parentForm..: nome do form pai  
 * @param parentURL...: url para fechar a popup e dar submit no form pai
 */
function openDialogSelecaoAssuntoSecundarioByTurma(titulo, contextPath, codTurma, parentForm, parentURL) {
	var complementoURL = '&codTurma=' + codTurma;	
	openDialogSelecaoAssuntoSecundario(titulo, contextPath, parentForm, complementoURL, parentURL);
}

/**
 * Fun��o para selecionar o Assunto Secund�rio pela �rea de Varas
 * @param titulo.........: t�tulo da popup
 * @param contextPath....: caminho do contexto (geralmente "/projudi")
 * @param codAreaDeVaras.: c�digo da �rea de varas
 * @param parentForm.....: nome do form pai  
 * @param parentURL......: url para fechar a popup e dar submit no form pai
 */
function openDialogSelecaoAssuntoSecundarioByAreaDeVaras(titulo, contextPath, codAreaDeVaras, parentForm, parentURL) {
	var complementoURL = '&codAreaDeVaras=' + codAreaDeVaras;	
	openDialogSelecaoAssuntoSecundario(titulo, contextPath, parentForm, complementoURL, parentURL);
}

/**
 * Fun��o para selecionar o Assunto Secund�rio pela �rea Recursal
 * @param titulo..........: t�tulo da popup
 * @param contextPath.....: caminho do contexto (geralmente "/projudi")
 * @param codAreaRecursal.: c�digo da �rea recursal
 * @param parentForm......: nome do form pai  
 * @param parentURL.......: url para fechar a popup e dar submit no form pai
 */
function openDialogSelecaoAssuntoSecundarioByAreaRecursal(titulo, contextPath, codAreaRecursal, parentForm, parentURL) {
	var complementoURL = '&codAreaRecursal=' + codAreaRecursal;	
	openDialogSelecaoAssuntoSecundario(titulo, contextPath, parentForm, complementoURL, parentURL);
}

/**
 * Fun��o para selecionar o Assunto Secund�rio
 * @param titulo..........: t�tulo da popup
 * @param contextPath.....: caminho do contexto (geralmente "/projudi")
 * @param parentForm......: nome do form pai  
 * @param complementoURL..: complemento da url (por exemplo, string vazia("") para buscar todos ou "codVara", etc) 
 * @param parentURL.......: url para fechar a popup e dar submit no form pai
 */
function openDialogSelecaoAssuntoSecundario(titulo, contextPath, parentForm, complementoURL, parentURL) {
	// abre a popup (sem encriptar a url)
	var url = contextPath + '/processo/assunto.do?actionType=pesquisar&tipoSelecao=selecaoSecundario' + 
		'&parentForm=' + parentForm + '&parentURL=' + parentURL + complementoURL;
	openSubmitDialog(url,titulo,0,0,parentForm,parentURL);
}

/**
 * 
 * Sele��o de Mat�ria
 * 
 */


/**
 * Fun��o para selecionar a Mat�ria pela Turma
 * @param titulo..........: t�tulo da popup
 * @param contextPath.....: caminho do contexto (geralmente "/projudi")
 * @param parentForm......: nome do form pai  
 * @param complementoURL..: complemento da url (por exemplo, string vazia("") para buscar todos ou "codVara", etc) 
 * @param parentURL.......: url para fechar a popup e dar submit no form pai
 */

function openDialogSelecaoMateria(titulo, contextPath, parentForm, parentIdField, parentDescricaoField, complementoURL) {
	// abre a popup (sem encriptar a url)
	var url = contextPath + '/processo/recursal/materia.do?actionType=pesquisarSelecao&tipoSelecao=selecaoPrincipal' +
		'&parentForm=' + parentForm + '&parentIdField=' + parentIdField + '&parentDescricaoField=' + parentDescricaoField + complementoURL;
	openDialog(url,titulo,0,0);
}

/**
 * Fun��o para selecionar a Mat�ria pela Turma
 * @param titulo..........: t�tulo da popup
 * @param contextPath.....: caminho do contexto (geralmente "/projudi")
 * @param parentForm......: nome do form pai  
 * @param complementoURL..: complemento da url (por exemplo, string vazia("") para buscar todos ou "codVara", etc) 
 * @param parentURL.......: url para fechar a popup e dar submit no form pai
 */
function openDialogSelecaoMateriaByTurma(titulo, contextPath, codTurma, parentForm, parentIdField, parentDescricaoField) {
	var complementoURL = '&codTurma=' + codTurma;	
	openDialogSelecaoMateria(titulo, contextPath, parentForm, parentIdField, parentDescricaoField, complementoURL);
}

/**
 * Fun��o para selecionar a Mat�ria pela �rea Recursal
 * @param titulo..........: t�tulo da popup
 * @param contextPath.....: caminho do contexto (geralmente "/projudi")
 * @param parentForm......: nome do form pai  
 * @param complementoURL..: complemento da url (por exemplo, string vazia("") para buscar todos ou "codVara", etc) 
 * @param parentURL.......: url para fechar a popup e dar submit no form pai
 */
function openDialogSelecaoMateriaByAreaRecursal(titulo, contextPath, codAreaRecursal, parentForm, parentIdField, parentDescricaoField) {
	var complementoURL = '&codAreaRecursal=' + codAreaRecursal;	
	openDialogSelecaoMateria(titulo, contextPath, parentForm, parentIdField, parentDescricaoField, complementoURL);
}

/**
 * Fun��o para selecionar o Assunto Secund�rio
 * @param titulo..........: t�tulo da popup
 * @param contextPath.....: caminho do contexto (geralmente "/projudi")
 * @param parentForm......: nome do form pai  
 * @param complementoURL..: complemento da url (por exemplo, string vazia("") para buscar todos ou "codVara", etc) 
 * @param parentURL.......: url para fechar a popup e dar submit no form pai
 */
function openDialogSelecaoMateriaSecundaria(titulo, contextPath, parentForm, complementoURL, parentURL) {
	// abre a popup (sem encriptar a url)
	var url = contextPath + '/processo/recursal/materia.do?actionType=pesquisarSelecao&tipoSelecao=selecaoSecundario' + 
		'&parentForm=' + parentForm + '&parentURL=' + parentURL + complementoURL;
	openSubmitDialog(url,titulo,0,0,parentForm,parentURL);
}

/**
 * Fun��o para selecionar o Assunto Secund�rio pela �rea Recursal
 * @param titulo..........: t�tulo da popup
 * @param contextPath.....: caminho do contexto (geralmente "/projudi")
 * @param codAreaRecursal.: c�digo da �rea recursal
 * @param parentForm......: nome do form pai  
 * @param parentURL.......: url para fechar a popup e dar submit no form pai
 */
function openDialogSelecaoMateriaSecundariaByAreaRecursal(titulo, contextPath, codAreaRecursal, parentForm, parentURL) {
	var complementoURL = '&codAreaRecursal=' + codAreaRecursal;	
	openDialogSelecaoMateriaSecundaria(titulo, contextPath, parentForm, complementoURL, parentURL);
}

/**
 * Fun��o para selecionar o Assunto Secund�rio pela Turma Recursal
 * @param titulo......: t�tulo da popup
 * @param contextPath.: caminho do contexto (geralmente "/projudi")
 * @param codTurma....: c�digo da turma
 * @param parentForm..: nome do form pai  
 * @param parentURL...: url para fechar a popup e dar submit no form pai
 */
function openDialogSelecaoMateriaSecundariaByTurma(titulo, contextPath, codTurma, parentForm, parentURL) {
	var complementoURL = '&codTurma=' + codTurma;	
	openDialogSelecaoMateriaSecundaria(titulo, contextPath, parentForm, complementoURL, parentURL);
}

/**
 * Fun��o para selecionar o Assunto Secund�rio pela Compet�ncia
 * @param titulo......: t�tulo da popup
 * @param contextPath.: caminho do contexto (geralmente "/projudi")
 * @param codTurma....: c�digo da turma
 * @param parentForm..: nome do form pai  
 * @param parentURL...: url para fechar a popup e dar submit no form pai
 */

function openDialogSelecaoMateriaByTipoCompetencia(titulo, contextPath, codTipoCompetencia, parentForm, parentURL) {
	var complementoURL = '&codTipoCompetencia=' + codTipoCompetencia;	
	openDialogSelecaoMateria(titulo, contextPath, parentForm, complementoURL, parentURL);
}

/******************************************************************************
 *                  ASSUNTO DE DEMANDA JUDICIAL REPETITIVA                    *
 ******************************************************************************/

/**
 * Função para selecionar o Assunto de Demanda Judicial Repetitiva
 * @param titulo...............: t�tulo da popup
 * @param contextPath..........: caminho do contexto (geralmente "/projudi")
 * @param parentForm...........: nome do form pai  
 * @param parentIdField........: "input" no form pai que ser� preenchido com o id do assunto de demanda judicial repetitiva selecionado  
 * @param parentDescricaoField.: "input" no form pai que ser� preenchido com a descri��o do assunto de demanda judicial repetitiva selecionado
 * @param complementoURL.......: complemento da url (por exemplo, string vazia("") para buscar todos ou "codVara", etc)
 */
function openDialogSelecaoAssuntoDJR(titulo, contextPath, parentForm, parentIdField, parentDescricaoField, complementoURL) {
	// abre a popup (sem encriptar a url)
	var url = contextPath + '/processo/assuntoDemandaJudicialRepetitiva.do?actionType=selecionar' +
		'&parentForm=' + parentForm + '&parentIdField=' + parentIdField + '&parentDescricaoField=' + parentDescricaoField + complementoURL;
	openDialog(url,titulo,0,0);
}

/******************************************************************************
 *                                 FORMATA��O                                 *
 ******************************************************************************/
/**
 * Função chamada no onclick do checkbox que indica que o telefone é nacional
 * @param checkNacional: checkbox que indica que o telefone é necional
 * @param idNumeroTelefone: id do campo do telefone
 */
function filtraTelefoneNacional(checkNacional, idNumeroTelefone) {
	var fieldNumeroTelefone = document.getElementById(idNumeroTelefone);
	if( checkNacional.checked ) {
		formataTelefone(fieldNumeroTelefone, checkNacional.id);
		fieldNumeroTelefone.placeholder = '(99) 99999-9999';
	} else {
		fieldNumeroTelefone.value = filtraCampoSomenteNumerico(fieldNumeroTelefone);
		fieldNumeroTelefone.placeholder = '';
	}
}

/**
 * Função para formatar telefone durante a digitação (formato (99) 9999-9999 ou (99) 99999-9999)
 * @param fieldNumeroTelefone: campo do telefone a ser formatado
 * @param idCheckBoxNacional: id do checkbox que indica que o telefone é nacional
 */
function formataTelefone(fieldNumeroTelefone, idCheckBoxNacional) {
	// verifica se deve formatar
	var deveFormatar = true;
	if( typeof idCheckBoxNacional == 'undefined') {
		deveFormatar = false;
	} else {
		deveFormatar = document.getElementById(idCheckBoxNacional).checked;
	}
	
	// realiza a formatação
	if( deveFormatar ) {
		// inicializa variáveis
		fieldNumeroTelefone.value = filtraCampoSomenteNumerico(fieldNumeroTelefone);
	 	var valor = fieldNumeroTelefone.value;
		var tam   = valor.length;
	
		// realiza a formatação
	 	if( tam == 0 ) { 
	 		fieldNumeroTelefone.value = ''; 
	   	} else if( tam <= 2 ) {
	   		fieldNumeroTelefone.value = '(' + valor.substr(0, tam); 
	   	} else if( tam <= 6 ) {
	   		fieldNumeroTelefone.value = '(' + valor.substr(0, 2) + ') ' + valor.substr(2, tam);
	   	} else if( tam < 11 ) {
	   		fieldNumeroTelefone.value = '(' + valor.substr(0, 2) + ') ' + valor.substr(2, 4) + '-' + valor.substr(6, tam); 
	   	} else if( tam >= 11 ) {
	   		fieldNumeroTelefone.value = '(' + valor.substr(0, 2) + ') ' + valor.substr(2, 5) + '-' + valor.substr(7, tam); 
	   	}
	}
}

/**
 * Função para formatar telefone durante a digitação (formato (99) 9999-9999 ou (99) 99999-9999)
 * @param fieldNumeroTelefone: campo do telefone a ser formatado
 */
function formataTelefone(fieldNumeroTelefone) {
	// inicializa variáveis
	fieldNumeroTelefone.value = filtraCampoSomenteNumerico(fieldNumeroTelefone);
 	var valor = fieldNumeroTelefone.value;
	var tam   = valor.length;

	// realiza a formatação
 	if( tam == 0 ) { 
 		fieldNumeroTelefone.value = ''; 
   	} else if( tam <= 2 ) {
   		fieldNumeroTelefone.value = '(' + valor.substr(0, tam); 
   	} else if( tam <= 6 ) {
   		fieldNumeroTelefone.value = '(' + valor.substr(0, 2) + ') ' + valor.substr(2, tam);
   	} else if( tam < 11 ) {
   		fieldNumeroTelefone.value = '(' + valor.substr(0, 2) + ') ' + valor.substr(2, 4) + '-' + valor.substr(6, tam); 
   	} else if( tam >= 11 ) {
   		fieldNumeroTelefone.value = '(' + valor.substr(0, 2) + ') ' + valor.substr(2, 5) + '-' + valor.substr(7, tam); 
   	}
}

/**
 * Fun��o para formatar valor durante a digita��o (formato 999.999.999.999,99)
 * @param campo: campo com o valor a ser formatado
 */
function formataValor(campo) {
	// inicializa vari�veis
	campo.value = filtraCampoSomenteNumerico(campo);
 	vr  = campo.value;
	tam = vr.length;

	// faz a formata��o
 	if ( tam <= 2 ){ 
   		campo.value = vr ; }
  	if ( (tam > 2) && (tam <= 5) ){
   		campo.value = vr.substr( 0, tam - 2 ) + ',' + vr.substr( tam - 2, tam ) ; }
  	if ( (tam >= 6) && (tam <= 8) ){
   		campo.value = vr.substr( 0, tam - 5 ) + '.' + vr.substr( tam - 5, 3 ) + ',' + vr.substr( tam - 2, tam ) ; }
  	if ( (tam >= 9) && (tam <= 11) ){
   		campo.value = vr.substr( 0, tam - 8 ) + '.' + vr.substr( tam - 8, 3 ) + '.' + vr.substr( tam - 5, 3 ) + ',' + vr.substr( tam - 2, tam ) ; }
  	if ( (tam >= 12) && (tam <= 14) ){
   		campo.value = vr.substr( 0, tam - 11 ) + '.' + vr.substr( tam - 11, 3 ) + '.' + vr.substr( tam - 8, 3 ) + '.' + vr.substr( tam - 5, 3 ) + ',' + vr.substr( tam - 2, tam ) ; }
  	if ( (tam >= 15) && (tam <= 18) ){
   		campo.value = vr.substr( 0, tam - 14 ) + '.' + vr.substr( tam - 14, 3 ) + '.' + vr.substr( tam - 11, 3 ) + '.' + vr.substr( tam - 8, 3 ) + '.' + vr.substr( tam - 5, 3 ) + ',' + vr.substr( tam - 2, tam ) ;}
}



/**
 * Fun��o para formatar hora no formato hh:mm
 * @param campo......: campo com o valor a ser formatado
 * @param teclapress.: tecla que foi pressionada
 */
function formataHora(campo,teclapres) {
	var tecla = teclapres.keyCode;
	campo.value = filtraCampo(campo);
	vr = campo.value;
	vr = vr.replace( ".", "" );
	vr = vr.replace( ":", "" );
	vr = vr.replace( ":", "" );
	tam = vr.length + 1;

	if ( tecla != 9 && tecla != 8 ){
		if ( tam > 2 && tam < 5 )
			campo.value = vr.substr( 0, tam - 2  ) + ':' + vr.substr( tam - 2, tam );
	}
}

/**
 * Fun��o para formatar hora no formato hh:mm:ss
 * @param campo......: campo com o valor a ser formatado
 * @param teclapress.: tecla que foi pressionada
 */
function formataHoraCompleta(campo,teclapres) {
	var tecla = teclapres.keyCode;
	campo.value = filtraCampo(campo);
	vr = campo.value;
	vr = vr.replace( ".", "" );
	vr = vr.replace( ":", "" );
	vr = vr.replace( ":", "" );
	//tam = vr.length + (vr.length < 5?1:2);
	tam = vr.length + 1;
	if ( tecla != 9 && tecla != 8 ){
		if ( tam > 2 && tam < 5 ){
			campo.value = vr.substr( 0, tam - 2  ) + ':' + vr.substr( tam - 2, tam );			
		}else if( tam > 5 && tam < 8){
			//alert("tam="+tam+" - "+vr);
			campo.value = vr.substr( 0, 2 ) + ':' + vr.substr( 2, 2) + ":" +  vr.substr(4,2);
		}
	}
}

/**
 * Fun��o para limpar todos os caracteres especiais do campo solicitado
 * @param campo: campo que ser� limpo
 */
function filtraCampo(campo){
	var s  = "";
	var cp = "";
	vr  = campo.value;
	tam = vr.length;
	for (i = 0; i < tam ; i++) {  
		if (vr.substring(i,i + 1) != "/" && vr.substring(i,i + 1) != "-" && vr.substring(i,i + 1) != "."  && vr.substring(i,i + 1) != "," ){
		 	s = s + vr.substring(i,i + 1);}
	}
	campo.value = s;
	return cp = campo.value
}

/**
 * Fun��o para limpar todos os caracteres especiais e deixar apenas numeros no campo selecionado
 * @param campo: campo que ser� limpo
 */
function filtraCampoSomenteNumerico(campo){
    var s  = "";
    var cp = "";
    var charAtual="";
    vr  = campo.value;
    tam = vr.length;
    for (i = 0; i < tam ; i++) {
    	charAtual=vr.substring(i,i + 1);
        if (isTipoNumero(charAtual)){
             s = s + charAtual;
        }
    }
    campo.value = s;
    return cp = campo.value;
}

/**
 * Fun��o regular para aceitar somente d�gitos de 0 a 9
 *
 */
function isTipoNumero(pVal)
{
	var expReg = /^\d+$/; //Express�o regular para aceitar somente d�gitos de 0 a 9
	return expReg.test(pVal);
}

function getTeclaPressionada(evt)
{
	if(typeof(evt)=='undefined')
		evt = window.event;
	return(evt.keyCode ? evt.keyCode : (evt.which ? evt.which : evt.charCode));
}

// teclas 63230 a 63240 = safari
function isTeclaEspecial(key)
{
	return key<32||(key>=35&&key<=36)||(key>=37&&key<=40)||key==46||(key>=63230&&key<=63240);
}

function isTeclaRelevante(key)
{
	return (key == 8)||(key == 46)||(key == 88)||(key>=48&&key<=57)||(key>=96&&key<=105);
}

function isCaracterRelevante(key)
{
	return (key == 88)||(key == 120)||(key>=48&&key<=57);
}

function isCopiaCola(ctrlKey, key)
{
	return ctrlKey && (key == 118 || key == 86 || key == 99 || key == 67);
}


function filtraTeclas(evt)
{
	var key = getTeclaPressionada(evt);
	if(isTeclaEspecial(key) || isTeclaRelevante(key) || isCopiaCola(evt.ctrlKey, key))
		return true;
	StopEvent(evt);
	return false;
}

function filtraCaracteres(evt)
{
	var key = getTeclaPressionada(evt);
	if(isTeclaEspecial(key) || isCaracterRelevante(key) || isCopiaCola(evt.ctrlKey, key))
		return true;
	StopEvent(evt);
	return false;
}

function StopEvent(evt)
{
	if(document.all)evt.returnValue=false;
	else if(evt.preventDefault)evt.preventDefault();
}

function formataMascara(format, field)
{
	var result = "";
	var maskIdx = format.length - 1;
	var error = false;
	var valor = field.value;
	var posFinal = false;
	if( field.setSelectionRange ) 
	{
    	if(field.selectionStart == valor.length)
    		posFinal = true;
    }
	valor = valor.replace(/[^0123456789Xx]/g,'')
	for (var valIdx = valor.length - 1; valIdx >= 0 && maskIdx >= 0; --maskIdx)
	{
		var chr = valor.charAt(valIdx);
		var chrMask = format.charAt(maskIdx);
		switch (chrMask)
		{
		case '#':
			if(!(/\d/.test(chr)))
				error = true;
			result = chr + result;
			--valIdx;
			break;
		case '@':
			result = chr + result;
			--valIdx;
			break;
		default:
			result = chrMask + result;
		}
	}

	field.value = result;
	field.style.color = error ? 'red' : '';
	if(posFinal)
	{
		field.selectionStart = result.length;
		field.selectionEnd = result.length;
	}
	return result;
}

/**
 * Mascara para telefone, exemplo de uso
 * <input type="text" onkeypress="javascript: mask(this, mphone);" onblur="javascript: mask(this, mphone);" />
 * 
 * */
function mask(o, f) {
    setTimeout(function () {
        var v = f(o.value);
        if (v != o.value) {
            o.value = v;
        }
    }, 1);
}

function mphone(v) {
    var r = v.replace(/\D/g,"");
    r = r.replace(/^0/,"");
    if (r.length > 10) {
        // 11+ digits. Format as 5+4.
        r = r.replace(/^(\d\d)(\d{5})(\d{4}).*/,"($1) $2-$3");
    }
    else if (r.length > 5) {
        // 6..10 digits. Format as 4+4
        r = r.replace(/^(\d\d)(\d{4})(\d{0,4}).*/,"($1) $2-$3");
    }
    else if (r.length > 2) {
        // 3..5 digits. Add (0XX..)
        r = r.replace(/^(\d\d)(\d{0,5})/,"($1) $2");
    }
    else if(r.length > 0){
        // 0..2 digits. Just add (0XX
        r = r.replace(/^(\d*)/, "($1");
    }
    return r;
}

function mhoraminuto(v){
    v=v.replace(/\D/g,"");                    //Remove tudo o que n�o � d�gito
    v=v.replace(/(\d{2})(\d{2})/,"$1:$2");
    return v;
}


/******************************************************************************
 *                                 CALEND�RIO                                 *
 ******************************************************************************/
/**
 * Fun��o para configurar calend�rio
 */
function initCalendarioPadrao(){
	// This prints out the default stylehseets used by the DIV style calendar
	document.write(getCalendarStyles());
	var calPadrao = new CalendarPopup("idCalPadrao");
	calPadrao.offsetX = 27;
	calPadrao.offsetY = -60;
	calPadrao.showYearNavigation();
	calPadrao.setCssPrefix("CALENDAR");
	return calPadrao;
}


/******************************************************************************
 *                              AJAX:AUTOCOMPLETE                             *
 ******************************************************************************/
/**
 * Fun��o utilizada quando a sele��o do ajax:autocomplete � abortada ou quando se digita algo que n�o exista.
 * @param idField...: id que ser� checado
 * @param descField.: descri��o que ser� apagada caso o id esteja zerado
 *
 * Trabalha em conjunto com a preFunction, que de forma INDIRETA executa a function ajaxAutoCompleteClearInput abaixo. 
 *
 * Utiliza��o: colocar no evento "onBlur" do campo input
 */
function ajaxAutoCompleteOnBlurInput(idField, descField) {
	// checa se digitou algo que n�o exista ou se abortou durante a sele��o
	var field = document.getElementById(idField);
	if( (field != null) && ((field.value == 0) || (field.value == '')) )
		Form.Element.clear(descField);
		
	// checa se usu�rio limpou o campo manualmente. Caso positivo, limpa o id tamb�m	
	var field2 = document.getElementById(descField);	
	if( (field2 != null) && ((field2.value == 0) || (field2.value == '')) )
		Form.Element.clear(idField);
}

/**
 * Fun��o utilizada quando a sele��o do ajax:autocomplete � iniciada.
 * @param idField...: id que ser� zerado
 * @param descField.: descri��o que ser� selecionada
 *
 * Trabalha em conjunto com a fun��o ajaxAutoCompleteOnBlurInput acima. 
 *
 * Utiliza��o: N�O PODE SER UTILIZADA DIRETAMENTE, pois na preFunction do ajax:autocomplete n�o d� para passar par�metros
 */
function ajaxAutoCompleteClearInput(idField, descField) { 
	// limpa o id
	Form.Element.clear(idField);
	
	// acerta o scroll horizontal (bug do IE) 
	var elem = document.getElementById('ajaxAuto_' + descField); 
	elem.scrollLeft = 0;
}

/**
 * Fun��o utilizada quando a sele��o da clase processual do ajax:autocomplete � iniciada.
 */
function ajaxAutoCompleteClearInputAdvogado() {
	ajaxAutoCompleteClearInput('loginAdvogado', 'nomeAdvogado'); 
}

/**
 * Fun��o utilizada quando a sele��o da clase processual do ajax:autocomplete � iniciada.
 */
function ajaxAutoCompleteClearInputClasseProcessual() {
	ajaxAutoCompleteClearInput('idClasseProcessual', 'descricaoClasseProcessual'); 
}

/**
 * Fun��o utilizada quando a sele��o do tipo recurso do ajax:autocomplete � iniciada.
 */
function ajaxAutoCompleteClearInputTipoRecurso() {
	ajaxAutoCompleteClearInput('idTipoRecurso', 'descricaoTipoRecurso'); 
}

/**
 * Fun��o utilizada quando a sele��o do assunto principal do ajax:autocomplete � iniciada.
 */
function ajaxAutoCompleteClearInputAssuntoPrincipal() {
	ajaxAutoCompleteClearInput('idAssuntoPrincipal', 'descricaoAssuntoPrincipal'); 
}

 /**
  * Fun��o utilizada quando a sele��o da turma recursal do ajax:autocomplete � iniciada.
  */
 function ajaxAutoCompleteClearInputTurmaRecursal() {
 	ajaxAutoCompleteClearInput('codTurma', 'descricaoTurma'); 
 }
 
  /**
   * Fun��o utilizada quando a sele��o da vara do ajax:autocomplete � iniciada.
   */
  function ajaxAutoCompleteClearInputVara() {
  	ajaxAutoCompleteClearInput('codVara', 'descricaoVara'); 
  }
  
  function ajaxAutoCompleteClearInputCentralMandados() {
  	ajaxAutoCompleteClearInput('codCentralMandados', 'descricaoCentralMandados'); 
  }

   /**
    * Fun��o utilizada quando a sele��o da vara do ajax:autocomplete � iniciada.
    */
   function ajaxAutoCompleteClearInputTipoArquivo() {
   	ajaxAutoCompleteClearInput('codTipoArquivo', 'descricaoTipoArquivo'); 
   }

   function ajaxAutoCompleteClearInputUsuario() {
       	ajaxAutoCompleteClearInput('login', 'nomeUsuario'); 
   }
   
   /**
    * Fun��o utilizada quando a sele��o da clase processual do ajax:autocomplete � iniciada.
    */
   function ajaxAutoCompleteClearInputTipoMovimento() {
   	ajaxAutoCompleteClearInput('idTipoMovimento', 'descricaoTipoMovimento'); 
   }   
   
   /**
    * Fun��o utilizada quando a sele��o do tipo movimento do ajax:autocomplete � iniciada.
    */
   function ajaxAutoCompleteClearInputTipoMovimentoByCampos(idCampoTipoMovimento, descricaoCampoTipoMovimento) {
		ajaxAutoCompleteClearInput(idCampoTipoMovimento, descricaoCampoTipoMovimento); 
   }   

	/**
	 * Fun��o utilizada quando a busca via cep do ajax:autocomplete � iniciada.
	 */
	function ajaxAutoCompleteClearInputCep() {
		ajaxAutoCompleteClearInput('enderecoForm.cepPK','enderecoForm.filtroCep'); 
	}
	

	/**
	 * Fun��o utilizada quando a busca via cep do ajax:autocomplete � iniciada.
	 */
	function ajaxAutoCompleteClearInputCepEnderecoContato() {
		ajaxAutoCompleteClearInput('enderecoContatoForm.cepPK','enderecoContatoForm.filtroCep'); 
	}
	 
	/**
	 * Fun��o utilizada quando a sele��o do tipo de documento do ajax:autocomplete � iniciada.
	 */
	function ajaxAutoCompleteClearInputTipoDocumento() {
		ajaxAutoCompleteClearInput('idTipoDocumento', 'descricaoTipoDocumento');
	}
	
	/**
	 * Fun��o utilizada quando a sele��o da mat�ria do ajax:autocomplete � iniciada.
	 */
	function ajaxAutoCompleteClearInputMateria() {
		ajaxAutoCompleteClearInput('idMateria', 'descricaoMateria'); 
	}
	 
	/**
	 * Fun��o utilizada quando a sele��o do ve�culo do ajax:autocomplete � iniciada.
	 */
	function ajaxAutoCompleteClearInputVeiculo() {
		ajaxAutoCompleteClearInput('codVeiculo', 'descricaoVeiculo'); 
	}
	
	/**
	 * Fun��o utilizada quando a sele��o de fabricante de arma do ajax:autocomplete � iniciada.
	 */
	function ajaxAutoCompleteClearInputFabricanteArma() {
		ajaxAutoCompleteClearInput('codFabricanteArma', 'descricaoFabricanteArma'); 
	}

/******************************************************************************
 *                     POPUP DE SELE��O DE TIPO DE DOCUMENTO                  *
 ******************************************************************************/

/**
 * Fun��o para selecionar o Tipo de Documento
 * @param titulo...............: t�tulo da popup
 * @param contextPath..........: caminho do contexto (geralmente "/projudi")
 * @param parentForm...........: nome do form pai  
 * @param parentIdField........: "input" no form pai que ser� preenchido com o id do tipo de documento selecionado  
 * @param parentDescricaoField.: "input" no form pai que ser� preenchido com a descri��o do tipo de documento selecionado
 */
function openDialogSelecaoTipoDocumento(titulo, contextPath, parentForm, parentIdField, parentDescricaoField, tipoCompetencia) {
	// abre a popup (sem encriptar a url)
	var url = contextPath + '/processo/tipoDocumento.do?actionType=filtrarArvorePelaDescricao' +
		'&parentForm=' + parentForm + '&parentIdField=' + parentIdField + '&parentDescricaoField=' + parentDescricaoField;
		
	if (tipoCompetencia != '') { 
		url += '&tipoCompetencia='+tipoCompetencia;
	}

	openDialog(url,titulo,0,0);
}
 
 function openDialogSelecaoTipoDocumentoFixo(titulo, contextPath, parentForm, parentIdField, parentDescricaoField, tipoCompetencia, tipoDocumento) {
		// abre a popup (sem encriptar a url)
		var url = contextPath + '/processo/tipoDocumento.do?actionType=filtrarArvorePelaDescricao' +
			'&parentForm=' + parentForm + '&parentIdField=' + parentIdField + '&parentDescricaoField=' + parentDescricaoField +
			'&tipoCompetencia='+tipoCompetencia+'&tipoDocumentoFixo='+tipoDocumento;
		openDialog(url,titulo,0,0);
	}


/******************************************************************************
 *                                AJAX:SELECT                                 *
 ******************************************************************************/
/**
  * Parser para AjaxSelect com algum item selecionado como default
  * @see ajaxtags_parser.js (ResponseXmlToHtmlLinkListParser())
  */
var SelectWithDefaultParser = Class.create();
SelectWithDefaultParser.prototype = Object.extend(new AbstractResponseParser(), {
	initialize: function(_defaultOption) {
		this.type = "xml";
		this.defaultOption = _defaultOption;
	},
	
	getArray: function () {
		return this.itemList;
	},

	load: function(request) {
		this.content = request.responseXML;
		this.parse();
		this.prepareData( this.itemList);
	},
	
	// format <name><value><value><value>....<value>
	prepareData: function( dataarray ) {},
		  
	parse: function() {
		root = this.content.documentElement;
		responseNodes = root.getElementsByTagName("response");
		this.itemList = [];
		if (responseNodes.length > 0) {
			responseNode = responseNodes[0];
		    itemNodes = responseNode.getElementsByTagName("item");
		    for (i=0; i<itemNodes.length; i++) {
		    	nameNodes = itemNodes[i].getElementsByTagName("name");
		        valueNodes = itemNodes[i].getElementsByTagName("value");
		        if (nameNodes.length > 0 && valueNodes.length > 0) {
		        	name = nameNodes[0].firstChild ? nameNodes[0].firstChild.nodeValue : "";
		        	myData = [];
		        	myData.push(name);
		            for (j=0; j <valueNodes.length; j++) {
		            	value = valueNodes[j].firstChild ? valueNodes[j].firstChild.nodeValue: "";
		       		  	myData.push(value);
		            }
		            if( this.defaultOption == value ) {
	       		  		myData.push("true");
		            }
		            this.itemList.push(myData);
		        }
		    }
		}
	}
});

 
/******************************************************************************
 *                                  AJAX:TREE                                 *
 ******************************************************************************/
/**
 * Parser para AjaxTreeResponse
 * @see ajaxtags_parser.js (ResponseXmlToHtmlLinkListParser())
 */
var ClasseAssuntoTreeParser = Class.create();
ClasseAssuntoTreeParser.prototype = Object.extend(new AbstractResponseParser(), {
	initialize: function(_flagClasseProcessual, _contextPath, _flagCheckBox) {
    	this.type = "xmltohtmllinklist";
    	this.contextPath = _contextPath;
    	this.flagClasseProcessual = _flagClasseProcessual;
    	this.flagCheckBox = _flagCheckBox;
  	},

	load: function(request) {
    	this.xml = request.responseXML;
    	this.collapsedClass = request.collapsedClass;
    	this.treeClass = request.treeClass;
    	this.nodeClass = request.nodeClass;
    	this.expandedNodes = [];
    	this.parse();
  	},

	parse: function() {
    	var ul = document.createElement('ul');
    	ul.className = this.treeClass;
    	var root = this.xml.documentElement;
    	
    	var responseNodes = root.getElementsByTagName("response");
    	if (responseNodes.length > 0) {
      		responseNode = responseNodes[0];
      		itemNodes = responseNode.getElementsByTagName("item");
      
      		if (itemNodes.length === 0) {
      			ul = null;
      		}
      		for (i=0; i<itemNodes.length; i++) {
       			nameNodes = itemNodes[i].getElementsByTagName("name");
        		valueNodes = itemNodes[i].getElementsByTagName("value");
        
        
        		urlNodes = itemNodes[i].getElementsByTagName("url");
        		collapsedNodes = itemNodes[i].getElementsByTagName("collapsed");
        
        		leafnodes = itemNodes[i].getElementsByTagName("leaf");
        
        		if (nameNodes.length > 0 && valueNodes.length > 0) {
          			name  = nameNodes[0].firstChild.nodeValue;
          			value = valueNodes[0].firstChild.nodeValue;
          			
          			// inicializa url
          			url = "#";
          			try {
          				url = urlNodes[0].firstChild.nodeValue;
          			} catch (ex) {
          			// default url is link
          			}
          			
          			// inicializa flag de "leaf"
          			leaf = false;
          			try {
          				leaf = parseBoolean(leafnodes[0].firstChild.nodeValue);
          			} catch (ex) {
          				// no leaf flag found 
          			}
          
          			// inicializa flag de "collapsed"
          			collapsed =  false;
          			try {
	         			collapsed = parseBoolean(collapsedNodes[0].firstChild.nodeValue);
            		} catch (ex) {
          				// it is not collapsed as default 
          			}

					// cria o "li"          
          			li = document.createElement('li');
          			li.id = "li_" + value;
          			ul.appendChild(li);
  
          			// inicializa informa��es do n�
					canSelectNodes   = itemNodes[i].getElementsByTagName('canselect');
					canSelect        = parseBoolean(canSelectNodes[0].firstChild.nodeValue);
					isLastChildNodes = itemNodes[i].getElementsByTagName('islastchild');
					isLastChild      = parseBoolean(isLastChildNodes[0].firstChild.nodeValue);
          
          			// cria o "span" com a imagem (expande, collapse, join, etc)
          			if( leaf ) {
		  				// � folha, ent�o cria imagem de "join" (sem "id", para evitar click)
    	   				span = document.createElement('span');
		  				if( isLastChild )
		  					span.className = "joinBottomNode";
		  				else	
		  					span.className = "joinNode";
	       				li.appendChild(span);
		  			} else {
          				// N�O � folha, ent�o cria imagem de "expande" ou "collapse"
    	   				span           = document.createElement('span');
	       				span.id        = "span_" + value;	       				
          				span.className = this.collapsedClass;
	       				li.appendChild(span);
					}		  			

					// cria o "radio button" ou "checkbox" (se puder selecionar)
					if( canSelect ) {
						// cria o "input:radio" ou "input:checkbox"
						nameTmp = (this.flagClasseProcessual ? 'idClasseProcessualSelecionado' : 'idAssuntoSelecionado');
						try { 
							// foi necess�rio este c�digo pois no IE n�o funciona criar inputs dinamicamente,
							// caso tenha que se especificar o atributo 'name'. Consultar:
							// --> http://www.byteclub.net/wiki/Javascript_createElement
							// --> http://stackoverflow.com/questions/118693/how-do-you-dynamically-create-a-radio-button-in-javascript-that-works-in-all-br

							if(this.flagCheckBox){
								htmlRadio  = '<input type="checkbox" name="' + nameTmp + '" value="' + value + '" />';
							} else {
								htmlRadio  = '<input type="radio" name="' + nameTmp + '" value="' + value + '" />';
							}						
							inputRadio = document.createElement(htmlRadio);
							li.appendChild(inputRadio);						
						} catch( e ) {
							inputRadio       = document.createElement('input');
							
							if(this.flagCheckBox){
								inputRadio.type  = 'checkbox';
							} else {
								inputRadio.type  = 'radio';
							}							
							inputRadio.name  = nameTmp;
							inputRadio.value = value;
							li.appendChild(inputRadio);
						}
						
						// cria o "input:hidden" (com a descri��o completa)
						fullNameNodes = itemNodes[i].getElementsByTagName('fullname');
						fullName      = fullNameNodes[0].firstChild.nodeValue;
						nameTmp       = (this.flagClasseProcessual ? 'descricaoClasseProcessualSelecionado' : 'descricaoAssuntoSelecionado');
						try {
							// foi necess�rio este c�digo pois no IE n�o funciona criar inputs dinamicamente,
							// caso tenha que se especificar o atributo 'name'. Consultar:
							// --> http://www.byteclub.net/wiki/Javascript_createElement
							// --> http://stackoverflow.com/questions/118693/how-do-you-dynamically-create-a-radio-button-in-javascript-that-works-in-all-br
							htmlHidden   = '<input type="hidden" id="' + nameTmp + '" name="' + nameTmp + '" value="' + fullName + '" />';
							inputHidden = document.createElement(htmlHidden);
							li.appendChild(inputHidden);
						} catch( e ) {
							inputHidden       = document.createElement('input');
							inputHidden.type  = 'hidden';
							inputHidden.id    = nameTmp;
							inputHidden.name  = nameTmp;
							inputHidden.value = fullName;
							li.appendChild(inputHidden);
						}
					}
					
					// cria o "link"					
					link  = document.createElement('a');
          			li.appendChild(link);
          			link.href = url;
          			if( canSelect ) {
          				// acerta propriedades que ser�o utilizadas pelo ajax:callout
          				link.className = "definition" + value;
          				link.title     = "Clique para exibir mais informa��es";
          			}
          			link.appendChild(document.createTextNode(name));
          			
          			// cria o c�digo do ajax:callout
          			if( canSelect ) {
  					  //new AjaxJspTag.Callout(this.contextPath + (this.flagClasseProcessual ? '/processo/classeProcessual.do?actionType=ajaxHint' : '/processo/assunto.do?actionType=ajaxHint'), 
						new AjaxJspTag.Callout(this.contextPath + (this.flagClasseProcessual ? '/ajaxUtils.do?actionType=ajaxHintClasseProcessual' : '/ajaxUtils.do?actionType=ajaxHintAssunto'), 
							{
							parameters: (this.flagClasseProcessual ? "idClasseProcessual=" : "idAssunto=") + value,
							openEvent: "click",
							title: name,
							sourceClass: "definition" + value,
							overlib: "STICKY,CLOSECLICK,DELAY,0,VAUTO,HAUTO,CLOSETEXT,'X',CLOSETITLE,'Clique para fechar',BGCLASS,'ajaxCalloutLayout',FGCLASS,'ajaxCalloutTextLayout',TEXTFONTCLASS,'ajaxCalloutTextFont',CGCLASS,'ajaxCalloutCaptionLayout',CAPTIONFONTCLASS,'ajaxCalloutCaptionFont',CLOSEFONTCLASS,'ajaxCalloutCloseFont'"
							}
						);
					}
          
          			// cria o "div" (onde ser� colocado a sub-�rvore)
          			div = document.createElement('div');
          			li.appendChild(div);
          			div.id = value;
          			div.setAttribute("style","");
          			div.style.display ="none";
          			if( !isLastChild )
          				div.className = "lineExpandedNode";
          
          			// expande os n�s (se necess�rio) 
          			if(!collapsed) {
            			this.expandedNodes.push(value);
          			}
        		} // if  
      		} // for
    	} // if  
    	this.content = ul;
  	} // parse:function()
});

/******************************************************************************
 *                                  AJAX:TREE                                 *
 ******************************************************************************/
/**
 * Parser para AjaxTreeResponse
 * @see ajaxtags_parser.js (ResponseXmlToHtmlLinkListParser())
 */
var RadioTreeParser = Class.create();
RadioTreeParser.prototype = Object.extend(new AbstractResponseParser(), {
	initialize: function(_idField, _descField, _ajaxHintId, _ajaxHintUrl) {
    	this.type        = "xmltohtmllinklist";
    	this.ajaxHintUrl = _ajaxHintUrl;
    	this.ajaxHintId  = _ajaxHintId;
    	this.idField     = _idField;
    	this.descField   = _descField;
  	},

	load: function(request) {
    	this.xml = request.responseXML;
    	this.collapsedClass = request.collapsedClass;
    	this.treeClass = request.treeClass;
    	this.nodeClass = request.nodeClass;
    	this.expandedNodes = [];
    	this.parse();
  	},

	parse: function() {
    	var ul = document.createElement('ul');
    	ul.className = this.treeClass;
    	var root = this.xml.documentElement;
    	
    	var responseNodes = root.getElementsByTagName("response");
    	
    	if (responseNodes.length > 0) {
      		responseNode = responseNodes[0];
      		itemNodes = responseNode.getElementsByTagName("item");
      
      		if (itemNodes.length === 0) {
      			ul = null;
      		}
      		for (i=0; i<itemNodes.length; i++) {
       			nameNodes = itemNodes[i].getElementsByTagName("name");
        		valueNodes = itemNodes[i].getElementsByTagName("value");
        
        
        		urlNodes = itemNodes[i].getElementsByTagName("url");
        		collapsedNodes = itemNodes[i].getElementsByTagName("collapsed");
        
        		leafnodes = itemNodes[i].getElementsByTagName("leaf");
        
        		if (nameNodes.length > 0 && valueNodes.length > 0) {
          			name  = nameNodes[0].firstChild.nodeValue;
          			value = valueNodes[0].firstChild.nodeValue;
          			
          			// inicializa url
          			url = "#";
          			try {
          				url = urlNodes[0].firstChild.nodeValue;
          			} catch (ex) {
          			// default url is link
          			}
          			
          			// inicializa flag de "leaf"
          			leaf = false;
          			try {
          				leaf = parseBoolean(leafnodes[0].firstChild.nodeValue);
          			} catch (ex) {
          				// no leaf flag found 
          			}
          
          			// inicializa flag de "collapsed"
          			collapsed =  false;
          			try {
	         			collapsed = parseBoolean(collapsedNodes[0].firstChild.nodeValue);
            		} catch (ex) {
          				// it is not collapsed as default 
          			}

					// cria o "li"          
          			li = document.createElement('li');
          			li.id = "li_" + value;
          			ul.appendChild(li);
  
          			// inicializa informa��es do n�
					canSelectNodes   = itemNodes[i].getElementsByTagName('canselect');
					canSelect        = parseBoolean(canSelectNodes[0].firstChild.nodeValue);
					isLastChildNodes = itemNodes[i].getElementsByTagName('islastchild');
					isLastChild      = parseBoolean(isLastChildNodes[0].firstChild.nodeValue);
          
          			// cria o "span" com a imagem (expande, collapse, join, etc)
          			if( leaf ) {
		  				// � folha, ent�o cria imagem de "join" (sem "id", para evitar click)
    	   				span = document.createElement('span');
		  				if( isLastChild )
		  					span.className = "joinBottomNode";
		  				else	
		  					span.className = "joinNode";
	       				li.appendChild(span);
		  			} else {
          				// N�O � folha, ent�o cria imagem de "expande" ou "collapse"
    	   				span           = document.createElement('span');
	       				span.id        = "span_" + value;	       				
          				span.className = this.collapsedClass;
	       				li.appendChild(span);
					}		  			

					// cria o "radio button" (se puder selecionar)
					if( canSelect ) {
						// cria o "input:radio"
						nameTmp = this.idField;
						try { 
							// foi necess�rio este c�digo pois no IE n�o funciona criar inputs dinamicamente,
							// caso tenha que se especificar o atributo 'name'. Consultar:
							// --> http://www.byteclub.net/wiki/Javascript_createElement
							// --> http://stackoverflow.com/questions/118693/how-do-you-dynamically-create-a-radio-button-in-javascript-that-works-in-all-br
							htmlRadio  = '<input type="radio" name="' + nameTmp + '" value="' + value + '" />';
							inputRadio = document.createElement(htmlRadio);
							li.appendChild(inputRadio);						
						} catch( e ) {
							inputRadio       = document.createElement('input');
							inputRadio.type  = 'radio';
							inputRadio.name  = nameTmp;
							inputRadio.value = value;
							li.appendChild(inputRadio);
						}
						
						// cria o "input:hidden" (com a descri��o completa)
						fullNameNodes = itemNodes[i].getElementsByTagName('fullname');
						fullName      = fullNameNodes[0].firstChild.nodeValue;
						nameTmp       = this.descField;
						try {
							// foi necess�rio este c�digo pois no IE n�o funciona criar inputs dinamicamente,
							// caso tenha que se especificar o atributo 'name'. Consultar:
							// --> http://www.byteclub.net/wiki/Javascript_createElement
							// --> http://stackoverflow.com/questions/118693/how-do-you-dynamically-create-a-radio-button-in-javascript-that-works-in-all-br
							htmlHidden   = '<input type="hidden" id="' + nameTmp + '" name="' + nameTmp + '" value="' + fullName + '" />';
							inputHidden = document.createElement(htmlHidden);
							li.appendChild(inputHidden);
						} catch( e ) {
							inputHidden       = document.createElement('input');
							inputHidden.type  = 'hidden';
							inputHidden.id    = nameTmp;
							inputHidden.name  = nameTmp;
							inputHidden.value = fullName;
							li.appendChild(inputHidden);
						}
					}
					
					// cria o "link"					
					link  = document.createElement('a');
          			li.appendChild(link);
          			link.href = url;
          			if( canSelect ) {
          				// acerta propriedades que ser�o utilizadas pelo ajax:callout
          				link.className = "definition" + value;
          				link.title     = "Clique para exibir mais informa��es";
          			}
          			link.appendChild(document.createTextNode(name));
          			
          			// cria o c�digo do ajax:callout
          			if( canSelect ) {
						new AjaxJspTag.Callout(this.ajaxHintUrl, 
							{
							parameters: this.ajaxHintId + "=" + value,
							openEvent: "click",
							title: name,
							sourceClass: "definition" + value,
							overlib: "STICKY,CLOSECLICK,DELAY,0,VAUTO,HAUTO,CLOSETEXT,'X',CLOSETITLE,'Clique para fechar',BGCLASS,'ajaxCalloutLayout',FGCLASS,'ajaxCalloutTextLayout',TEXTFONTCLASS,'ajaxCalloutTextFont',CGCLASS,'ajaxCalloutCaptionLayout',CAPTIONFONTCLASS,'ajaxCalloutCaptionFont',CLOSEFONTCLASS,'ajaxCalloutCloseFont'"
							}
						);
					}
          
          			// cria o "div" (onde ser� colocado a sub-�rvore)
          			div = document.createElement('div');
          			li.appendChild(div);
          			div.id = value;
          			div.setAttribute("style","");
          			div.style.display ="none";
          			if( !isLastChild )
          				div.className = "lineExpandedNode";
          
          			// expande os n�s (se necess�rio) 
          			if(!collapsed) {
            			this.expandedNodes.push(value);
          			}
        		} // if  
      		} // for
    	} // if  
    	this.content = ul;
  	} // parse:function()
});


/**
 * Fun��o para verificar se o campo tem somente numeros
 * @param sText...............: texto a ser verificado
 */
function isNumero(sText)
{
   var ValidChars = "0123456789";
   var IsNumber=true;
   var Char;

   for (i = 0; i < sText.length && IsNumber == true; i++) 
      { 
        Char = sText.charAt(i); 
     if (ValidChars.indexOf(Char) == -1) {
         IsNumber = false;
     }
   }
   
   return IsNumber && (sText.length > 0);
}


/**
 * Fun��o para imprimir a p�gina atual
 */
function printPage() {
	if (!window.print){
		alert("Use o Netscape  ou Internet Explorer \n nas vers�es 4.0 ou superior!")
		return
	}
	window.print()
}

 /**
  * Fun�ao para aplicar m�scara em um campo
  */
 function Mascara(tipo, campo, teclaPress) {
	    if (window.event)
	    {
	        var tecla = teclaPress.keyCode;
	    } else {
	        tecla = teclaPress.which;
	    }

	    var s = new String(campo.value);
	    // Remove todos os caracteres � seguir: ( ) / - . e espa�o, para tratar a string denovo.
	    s = s.replace(/(\.|\(|\)|\/|\-| )+/g,'');

	    tam = s.length + 1;

	    if ( tecla != 9 && tecla != 8 ) {
	        switch (tipo)
	        {
	        case 'CPF' :
	            if (tam > 3 && tam < 7)
	                campo.value = s.substr(0,3) + '.' + s.substr(3, tam);
	            if (tam >= 7 && tam < 10)
	                campo.value = s.substr(0,3) + '.' + s.substr(3,3) + '.' + s.substr(6,tam-6);
	            if (tam >= 10 && tam < 12)
	                campo.value = s.substr(0,3) + '.' + s.substr(3,3) + '.' + s.substr(6,3) + '-' + s.substr(9,tam-9);
	        break;

	        case 'CNPJ' :

	            if (tam > 2 && tam < 6)
	                campo.value = s.substr(0,2) + '.' + s.substr(2, tam);
	            if (tam >= 6 && tam < 9)
	                campo.value = s.substr(0,2) + '.' + s.substr(2,3) + '.' + s.substr(5,tam-5);
	            if (tam >= 9 && tam < 13)
	                campo.value = s.substr(0,2) + '.' + s.substr(2,3) + '.' + s.substr(5,3) + '/' + s.substr(8,tam-8);
	            if (tam >= 13 && tam < 15)
	                campo.value = s.substr(0,2) + '.' + s.substr(2,3) + '.' + s.substr(5,3) + '/' + s.substr(8,4)+ '-' + s.substr(12,tam-12);
	        break;

	        case 'TEL' :
	            if (tam > 2 && tam < 4)
	                campo.value = '(' + s.substr(0,2) + ')' + s.substr(2,tam);
	            if (tam >= 7 && tam < 11)
	                campo.value = '(' + s.substr(0,2) + ')' + s.substr(2,4) + '-' + s.substr(6,tam-6);
	        break;

	        case 'DATA' :
	            if (tam > 2 && tam < 4)
	                campo.value = s.substr(0,2) + '/' + s.substr(2, tam);
	            if (tam > 4 && tam < 11)
	                campo.value = s.substr(0,2) + '/' + s.substr(2,2) + '/' + s.substr(4,tam-4);
	        break;
	        case 'HORA' :
	            if (tam > 2 && tam < 4)
	                campo.value = s.substr(0,2) + ':' + s.substr(2, tam);
	            if (tam > 4 && tam < 11)
	                campo.value = s.substr(0,2) + ':' + s.substr(2,2) + ':' + s.substr(4,tam-4);
	        break;
	        case 'CEP' :
	            if (tam > 5 && tam < 7)
	                campo.value = s.substr(0,5) + '-' + s.substr(5, tam);
	        break;
	        }
	    }
	}

 /**
  * //--->Fun��o para verificar se o valor digitado � n�mero...<---
  */
	
	function digitos(event){
	    if (window.event) {
	        // IE
	        key = event.keyCode;
	    } else if ( event.which ) {
	        // netscape
	        key = event.which;
	    }
	    if ( key != 8 || key != 13 || key < 48 || key > 57 )
	        return ( ( ( key > 47 ) && ( key < 58 ) ) || ( key == 8 ) || ( key == 13 ) );
	    return true;
	}
	
	/**
	  * Verifica se o caracter digitado � um n�mero
	  */
	function isNum( event ){

		var tecla =(window.event)?event.keyCode:event.which;
		var caractere = String.fromCharCode(tecla);
		 
	    if (isTeclaEspecial(tecla))
	    	return true;
		
	     var strValidos = "0123456789";
	     if (strValidos.indexOf(caractere) == -1 )
	         return false;
	     return true;
	} 

	/**
	  * Verifica se o caracter digitado � uma letra
	  */
	function isLetra(event){

		var tecla =(window.event)?event.keyCode:event.which;
		var caractere = String.fromCharCode(tecla);
		
		if (isTeclaEspecial(tecla))
	    	return true;
	    	
	    var strValidos = "abcdefghijklmnopqrstuvxwyzABCDEFGHIJKLMNOPQRSTUVWXYZ";    
		if (strValidos.indexOf(caractere) == -1 )
	         return false;
	     return true;

	}
	
	
  
  	/**
  	 * Funcao identica que tem /scripts/default.js, depois verificar a possibilidade de remover de default.js
  	 * @param url
  	 * @return
  	 */
  	function abreManual(url) {
		window.open(url,'janela','width=750,height=450,left=10,top=30,' +
					'screenX=10,screenY=30,toolbar=yes,location=no,' + 
					'directories=no,status=no,menubar=yes,scrollbars=yes,' +
					'copyhistory=no,resizable=yes');
	}
  	 
  	 
  	/**
  	 * Fun��o para selecionar o Tipo de Movimento
  	 * @param titulo...............: t�tulo da popup
  	 * @param contextPath..........: caminho do contexto (geralmente "/projudi")
  	 * @param parentForm...........: nome do form pai  
  	 * @param parentIdField........: "input" no form pai que ser� preenchido com o id da classe processual selecionada  
  	 * @param parentDescricaoField.: "input" no form pai que ser� preenchido com a descri��o da classe processual selecionada
  	 * @param complementoURL.......: complemento da url (por exemplo, string vazia("") para buscar todos ou "codVara", etc)
  	 */
  	function openDialogSelecaoTipoMovimento(titulo, contextPath, parentForm, parentIdField, parentDescricaoField, complementoURL) {
  		// abre a popup (sem encriptar a url)
  		var url = contextPath + '/processo/tipoMovimento.do?actionType=pesquisar' +
  			'&parentForm=' + parentForm + '&parentIdField=' + parentIdField + '&parentDescricaoField=' + parentDescricaoField + complementoURL;
  		openDialog(url,titulo,0,0);
  	}
  	
  	/**
  	 * Fun��o para selecionar o Tipo de Movimento com raiz da �rvore em Magistrado
  	 * @param titulo...............: t�tulo da popup
  	 * @param contextPath..........: caminho do contexto (geralmente "/projudi")
  	 * @param parentForm...........: nome do form pai  
  	 * @param parentIdField........: "input" no form pai que ser� preenchido com o id da classe processual selecionada  
  	 * @param parentDescricaoField.: "input" no form pai que ser� preenchido com a descri��o da classe processual selecionada
  	 * @param complementoURL.......: complemento da url (por exemplo, string vazia("") para buscar todos ou "codVara", etc)
  	 */
  	function openDialogSelecaoTipoMovimentoMagistrado(titulo, contextPath, parentForm, parentIdField, parentDescricaoField, complementoURL) {
  		// abre a popup (sem encriptar a url)
  		var url = contextPath + '/processo/tipoMovimentoMagistrado.do?actionType=pesquisar' +
  			'&parentForm=' + parentForm + '&parentIdField=' + parentIdField + '&parentDescricaoField=' + parentDescricaoField + complementoURL;
  		openDialog(url,titulo,0,0);
  	}

  	/**
  	 * Fun��o para selecionar a Especializa��o de 2 grau
  	 * @param titulo...............: t�tulo da popup
  	 * @param contextPath..........: caminho do contexto (geralmente "/projudi")
  	 * @param parentForm...........: nome do form pai  
  	 * @param parentIdField........: "input" no form pai que ser� preenchido com o id da classe processual selecionada  
  	 * @param parentDescricaoField.: "input" no form pai que ser� preenchido com a descri��o da classe processual selecionada
  	 * @param complementoURL.......: complemento da url (por exemplo, string vazia("") para buscar todos ou "codVara", etc)
  	 */
  	function openDialogSelecaoEspecializacao2Grau(titulo, contextPath, parentForm, parentIdField, parentDescricaoField, complementoURL) {
  		var url = contextPath + '/judiciario/especializacao2Grau.do?actionType=pesquisar' +
			'&parentForm=' + parentForm + '&parentIdField=' + parentIdField + '&parentDescricaoField=' + parentDescricaoField + complementoURL;
		openDialog(url,titulo,0,0);
  	}
  	
  	/**
  	 * Fun��o para realizar autoSkip autom�tico de campos de formul�rio baseado no seu "maxlength"; 
  	 * @param field ............: Objeto origem do Form para autoskip;
  	 * @param ev ...............: Objeto de evento de teclado
  	 * @return
  	 */
  	function autoSkip(field,ev)
  	{
  		var max=field.maxLength - 1;
  		var tc=(typeof ev.which!="undefined"&& ev.which!=null?ev.which:ev.keyCode);
  		if(String(field.value).length < max || tc < 48)
  			return false;
  		
  		var ind=-1,fr=field.form;
  		var orient="down";
  		for(i=0;i<fr.elements.length;i++)
  			if(field==fr.elements[i]){ind=i;break;}
  		reValidTypes=/^(text|password|select.*|radio|checkbox.*)$/;
  		var iNext=(orient=="down"?1:-1),el=null;
  		if((typeof fr.elements[ind+iNext])=="undefined"){
  	      if(ind!=-1)if(fr.elements[ind]&&fr.elements[ind].blur)fr.elements[ind].blur();
  			return;
  		}
  		for(var i=ind+iNext;i<fr.elements.length;i+=iNext)
  		{
  			el=fr.elements[i];
  			if(reValidTypes.test(el.type) && !el.disabled){el.focus();return;}
  		}
  		if(ind>=0 && fr.elements[ind]&&fr.elements[ind].type && fr.elements[ind].type!='hidden' && fr.elements[ind].blur)fr.elements[ind].blur();
  	}
  	
  	
  	function doubleToMoneyStr(vr){
  		 var vr=new String(vr);
  		 var ind=vr.indexOf(".");
  		 if(ind== -1)
  			 vr+=".00";
  		 else{
  			 var decimal=vr.substring(ind+1);
  			 if(decimal.length == 1)
  				 vr+="0";
  		 }
  		 vr=vr.replace(/\./g, "");
  		 return float2moeda(vr);
  	}
 	/**
  	 * Fun��o que entrando com um numero inteiro, o converte para monet�rio
  	 * Ex: entrada 122523 retorna 1.225,23  
  	 * @param num ............: n�mero a ser formatado;
  	 */
    function float2moeda(num) {
        x = 0;
        if(num<0) {
            num = Math.abs(num);
            x = 1;
        }
        if(isNaN(num)) num = "0";
        cents = Math.floor((num*1+0.5)%100);
        num = Math.floor((num*1+0.5)/100).toString();
        if(cents < 10) cents = "0" + cents;
        for (var i = 0; i < Math.floor((num.length-(1+i))/3); i++)
            num = num.substring(0,num.length-(4*i+3))+'.'+num.substring(num.length-(4*i+3)); ret = num + ',' + cents;
            if (x == 1)
                ret = ' - ' + ret;
            return ret;
    }

    /**
     * Converte um n�mero float em um integer 
  	 * Ex: entrada 6.2 (float) retorna 6 (integer) 
     * @param value
     * @returns
     */
	function float2int (value) {
	    return value | 0;
	}
	
	/**
	 * Converte um valor em um formato string de moeda para um objeto Number para c�lculos.
	 * Ex. Entrada: 1.290,78, sa�da: 1290.78 
	 * @param vr
	 * @returns
	 */
	function convertMoedaToDouble(vr){
	    var str= vr.replace( /\./g,"");
	    str= str.replace( /\,/g,".");
	    if(str == null || str == '')
		    return 0;
	    return parseFloat(str);
	}
	
   /**
    * Verifica se um valor est� vazio ou n�o, verificando se � undefined, est� null ou est� em branco.
    * @param valor
    * @returns {Boolean}
    */
   function isEmpty(valor){
	   if(typeof valor == 'undefined' || valor == null)
		   return true;
	   if(typeof valor == 'object'){
		   //tratando radiobox com mais de um elemento
		   if(typeof valor.type == 'undefined' && typeof valor.length != 'undefined' && valor.length > 0){
			   if(valor[0] && valor[0].type == 'radio')
				   valor.type= 'radio';
		   }
		   if(!valor.type){
			   return (!valor || Object.keys(valor).length === 0);
		   }else{
			   if(valor.type == "radio"){
				   var r= getRadioObjectSelected(valor);
				   //console.log("r",r)
				   return (r == null);
			   }else if(valor.type == "select" || valor.type == "select-one"){
				   //console.log("selec",valor.selectedIndex)
				   switch(valor.selectedIndex){
					   case -1:return true;
					   case 0:
						   var v=valor.options[0].value;
						   if(!v)
							   return true;
						   v=String(v).trim();
						   return (v == "" || v == "-1");
					   default: return false;
				   }
			   }else if(valor.type == "checkbox"){
				   return !valor.checked;
			   }else if(valor.type == "text"){
				   valor= valor.value;
			   }
		   }
	   }
	   if(typeof valor == 'string' && typeof valor.trim == 'function')
		   valor= valor.trim();
	   if(!isNaN(valor))
		   return (valor == "") || /^\s*(0+)\s*$/.test(String(valor).replace(/\.|,/g,""));
	   return (valor == "");
   }
   /**
    * Seleciona o bot�o de radio cujo valor � igual ao passado como par�metro.
    * Retorna o �ndice da item selecionado do bot�o de r�dio.
    * @param radioObj
    * @param valor
    * @param indiceInicial (opcional) N�mero da op��o do radio para iniciar a busca 
    * 	(S� usado quando h� mais de um radio com o mesmo valor); 
    */
   function checkRadioByValue(radioObj,valor,indiceInicial) {
   	if(!radioObj)
   		return -1;
   	indiceInicial= typeof indiceInicial != 'number'?0:indiceInicial;
   	var radioLength = radioObj.length;
   	if(radioLength == undefined){
   		if( radioObj.value == valor){
   			radioObj.checked=true;
   		}
   		return 0;
   	}
   	for(var i = indiceInicial; i < radioLength; i++) {		
   		if(radioObj[i].value == valor) {
   			radioObj[i].checked=true;
   			return i;
   		}
   	}
   }

   function clearCombo(combo) {
	   	if(!combo || !combo.options || !combo.options.length)return;
	   	for(var i=combo.options.length-1; i>=0; i--){
	   		combo.options.remove(i);
	   	}
   }
   
   function saveComboValue(input, value) {
	   if(value) {
		   selectComboByValue(input, value);
		   input.fixedValue = value;
	   }
	   input.oldValue = input.value;
   }
   
   function loadComboValue(input) {
	   var value = input.fixedValue;
	   if(!value) {
		   value = input.oldValue;
	   }
	   selectComboByValue(input, value);
	   input.fixedValue = '';
   }
   
   /**
    * Seleciona o item da combo cujo valor � igual ao passado como par�metro.
    * @param combo
    * @param value
    */
   function selectComboByValue(combo,values){
   	 if(!combo || !combo.options || !combo.options.length)return;
	 if(!Array.isArray(values))
		values=[values];
	 for(v of values){
	   	for(var i=0; i<combo.options.length; i++){
	   		if(String(combo.options[i].value).trim() == String(v).trim()){
	   			combo.options[i].selected= true;
				break;
	   		}
	   	}
	 }
   }

   /**
    * Seleciona o item da combo cujo texto eh igual ao passado como parametro.
    * @param combo
    * @param value
    */
   function selectComboByText(combo,texto){
	   	if(!combo || !combo.options || !combo.options.length)return;
	   	for(var i=0; i<combo.options.length; i++){
	   		if(String(combo.options[i].text).trim().toUpperCase() == String(texto).trim().toUpperCase()){					   			
	   			combo.selectedIndex= i;
	   			return;
	   		}
	   	}
   }

   /**
    * Fun��o para submeter uma p�gina mudando a action do form passado. 
    * @param acao url com a action do formul�rio 
    * @param formulario objeto de formul�rio para submeter 
    * 
    * Exemplo: submitPage(getContextPath() + '/exemplo.do?actionType=teste',this.form)
    */
   function submitPage(acao,formulario){
	   disableScreen();
	   formulario.action = acao;  
	   formulario.submit();
   }
   
   /**
    * Fun��o para submeter uma p�gina mudando a action do form passado sem disablescreen. 
    * @param acao url com a action do formul�rio 
    * @param formulario objeto de formul�rio para submeter 
    * 
    * Exemplo: submitPage(getContextPath() + '/exemplo.do?actionType=teste',this.form)
    */
   function submitPageNoDS(acao,formulario){
	   formulario.action = acao;  
	   formulario.submit();
   }

   //Controlador de Sessao que permite o recurso de sess�es de tempo vari�vel
   /**
    * IMPORTANTE: Ap�s a retomada do timeout da aplica��o para 60 minutos este objeto
    * N�O � mais utilizado
    * Altera��o realizada em 21/03/2012;
    */
   function ControladorSessao(tipoTimeout){
	   /*
	    this.DEBUG= false;
   		this.tipoTimeout=(typeof tipoTimeout == 'undefined'?'geral':tipoTimeout);
    	this.setTipoTimeout=function(t){this.tipoTimeout=t;};
    	this.getTimeoutTotal=function(){return this.timeoutTotal;};
		this.timeoutTotal=0;
		this.lastStart=null;
    	this.init= function(){
    		this._TIMEOUT_PADRAO= 60;
    		this.qtdeRechamadas=1; //N�mero padr�o de rechamadas
    		this.timeout=this._TIMEOUT_PADRAO; 	   //Timeout de sessao em minutos
    		this.tempoFolgaChamada=2; //Tempo em segundos antes de acontecer o timeout real do servidor
    		this.lastStart=(new Date().getTime());
    	};    	
    	this.log=function(msg){
    		if(this.DEBUG && typeof console != "undefined" && typeof console.log == "function"){
    			console.log(msg);
    		}
    	};
    	this.habilitarTimeout=function(){
    		//Para esta versao, apenas habilitar� timeout se a p�gina tem edi��o de textos.
    		return this.tipoTimeout == 'geral' || (typeof window.CKEDITOR != 'undefined');
    	};
    	this.getTempoTimeout= function()
    	{
    		var numMilli=(this.timeout * 60 * 1000) - (this.tempoFolgaChamada * 1000);
    		return numMilli;
    	};
    	//monta o setTimeout para realimentar a sessao
    	this.callTimeout=function(tempo,fxTimeout){
    		if(typeof tempo == 'undefined')
    			tempo=this.getTempoTimeout();
    		if(typeof fxTimeout == 'undefined')
    			fxTimeout="window._sControler.realimentarSessao()";
    		window.setTimeout(fxTimeout, tempo);
    	};
    	//executa action de "refresh" de sess�o.
    	this.refreshSession=function(){
    		var url=getContextPath() + '/usuario/logon.do?actionType=realimentarSessao';
    		var img=document.getElementById('_imgSessao');
    		if(img == null)
    			return;
    		img.src=url+"&q="+this.qtdeRechamadas+"&d="+new Date().formatDate("yyyyMMddhhmmss")+"&r="+Math.random();
    		this.log(">> Realimentando sessao: url="+img.src + " - rechamadas antigo:"+this.qtdeRechamadas);
    	}
    	
    	//realimenta propriamente a sessao chamando o m�todo no LogonAction
    	this.realimentarSessao=function(){
    		this.refreshSession();
    		if(this.qtdeRechamadas > 1){
    			this.callTimeout();
    			this.log(">> Rechamando total rechamadas:"+this.qtdeRechamadas);
    		}else{
    			this.log(">> Final de chamadas;")
    		}
			this.qtdeRechamadas--;
    	};
    	
    	//Atualiza rel�gio de timeout
    	this.atualizaRelogio=function(){
    		this.timeoutTotal=(this.qtdeRechamadas * this._TIMEOUT_PADRAO);
    		window.sessionTimeout=this.timeoutTotal;
    		if(typeof displaySessionTime!='undefined'){
    			displaySessionTime(window.sessionTimeout);
    		}
    	};
    	this.renovaTimeout=function(podeRenovar){
    		if(typeof podeRenovar != "undefined" && podeRenovar == false){
   	    		this.log(">> Nao vai renovar timeout...")
   				return;
    		}
    		this.log(">> Renovando timeout...")
    		this.setTipoTimeout("geral");
    		this.start();
    	};
    	
    	this.start=function()
    	{    		
    		if(!this.habilitarTimeout())
    			return;
    		
    		// Estrat�gia de realimenta��o de timeout 
    		// 
    		// +==============+
    		// | 15 | 30 | 60 | <-- tempo para rechamadas de timeout em minutos
    		// +--------------+
    		// |  2 |  1 |  x | <-- contador decrescente de chamadas de realimenta��o   
    		// +--------------+
    		// 
    		//     		
			if(typeof this.qtdeRechamadas != 'undefined'){ //� um "restart" ?
				//calcula tempo decorrido entre o �ltimo restart e agora.
				var tempoDecorrido= (new Date().getTime()) - this.lastStart;
				var folgaRestart=(1 * 60 * 1000); //1 minuto
				this.log("� um restart, tempo decorrido:"+tempoDecorrido);

				//menos de 1 minuto entre restarts, ignora..
				if(tempoDecorrido <= folgaRestart){
					this.log("Restart n�o necess�rio, apenas "+tempoDecorrido+" milisegundos.");
					return;
				}

				//calcula o tempo entre o timeout padr�o e quanto j� teve de tempo
				//decorrido desde o �ltimo restart.
				var tempoTimeoutPadrao= (this._TIMEOUT_PADRAO * 60 * 1000);
				var tempoTimeout= 0;
				
				//Se ainda h� timeout pra ocorrer, apenas chama timeout para 
				//"acertar" o tempo para a sess�o fechar em 60 minutos
				//Ex 1): Se ainda h� timeout pra ocorrer � s� chamar um timout em 30 minutos
				//       que � garantido que teremos 60 minutos de sess�o.
				//Ex 2) Se n�o h� timeouts pra ocorrer, chama um timeout imediato pq sess�o
				//pode estar acabando e depois d� start em um novo controle de sess�o.
				if(this.qtdeRechamadas > 0){
					tempoTimeout= tempoTimeoutPadrao;
					this.log("H� "+ this.qtdeRechamadas+ "rechamadas, tempoTimeout="+tempoTimeout);
				}else{
					//se estava no �ltimo timeout chama imediatamente timeout pq tempo
					//de sess�o pode estar acabando. Depois reinicializa tudo e chama 
					//timeout como 	
					var tFolgaChamada= 2 * 1000; //2 segundos de folga;
					tempoTimeout= tFolgaChamada;	
					this.log("N�o H� rechamadas, tempoTimeout="+tempoTimeout);
				}

				this.callTimeout(tempoTimeout,"window._sControler.refreshSession()");
				this.atualizaRelogio();
				this.lastStart=(new Date().getTime());
				if(this.qtdeRechamadas > 0){ 
					//se ainda h� rechamadas vai embora pq timeout foi s� para "acerto"
					this.log("Abandonando execu��o pois h� mais rechamadas.");
					return;
				}else{
					//se n�o h� mais rechamadas efetua um restart...
					this.log("Restartando porque n�o h� mais rechamadas.");
				}
			}
			
			this.init();
			
			//escreve imagem que ser� chamar� o "refresh"de sess�o;
			if(document.getElementById('_imgSessao') == null){
				var div=document.getElementById('userinfo');    				
				if(div !=null){
					var img = document.createElement("IMG");
					img.id="_imgSessao";
					img.style.width="1px";
					img.style.height="1px";
					div.appendChild(img);
				}else{
					document.writeln('<img id="_imgSessao" width="1" height="1" />');
				}
			}
			if(typeof this.qtdeRechamadas == 'undefined' || this.qtdeRechamadas < 1)
				return;			
			//----
			//Por estrategia para minimizar casos de "cache" de chamadas que nao
			//atualizam a sessao, vamos dobrar o numero de chamadas de timeout
			//----
			if(this.qtdeRechamadas == 1){
				this.qtdeRechamadas++;
				this.atualizaRelogio();
				this.timeout= this.timeout / 2;
			}else{
				this.atualizaRelogio();
			}
			this.log("start com rechamadas="+this.qtdeRechamadas);
			//----
			this.callTimeout(); //chama timeout com tempo padrao.
    	};
    	this.start();
    	
    	*/
    } //Fim ControladorSessao
   
 	function openDialogSelecaoDelegaciaCelepar(titulo, contextPath, parentForm, parentIdField, parentDescricaoField) {
  		// abre a popup (sem encriptar a url)
  		var url = contextPath + '/processo/criminal/delegaciaCelepar.do?actionType=pesquisar' +
  			'&parentForm=' + parentForm + '&parentIdField=' + parentIdField + '&parentDescricaoField=' + parentDescricaoField;
  		openDialog(url,titulo,0,0);
  	}   

 	
/******************************************************************************
 *             FUN��ES UTILIZADAS PARA A TAGLIB pjd:selectVarios              *
 ******************************************************************************/
function selectVarios(origem, destino, final, btnAdd, btnDel, btnAddAll, btnDelAll, btnMoveUp, btnMoveDown) {
	Event.observe(window, 'load', function() {selectVariosOnLoad(origem, destino, final, btnAdd, btnDel, btnAddAll, btnDelAll, btnMoveUp, btnMoveDown);});
}

function selectVariosOnLoad(origem, destino, final, btnAdd, btnDel, btnAddAll, btnDelAll, btnMoveUp, btnMoveDown) {
    /* adiciona o evento de click para os botoes que indicam os cadernos de pesquisa */
    if($(btnAdd)) Event.observe($(btnAdd), 'click', function(event){selecionarOpcao(event, origem, destino, final);});
    if($(btnDel)) Event.observe($(btnDel), 'click', function(event){removerSelecaoOpcao(event, origem, destino, final);});
    if($(btnAddAll)) Event.observe($(btnAddAll), 'click', function(event){selecionarOpcao(event, origem, destino, final, true);});
    if($(btnDelAll)) Event.observe($(btnDelAll), 'click', function(event){removerSelecaoOpcao(event, origem, destino, final, true);});
    if($(btnMoveUp)) Event.observe($(btnMoveUp), 'click', function(event){moverOpcaoCima(event, destino, final);});
    if($(btnMoveDown)) Event.observe($(btnMoveDown), 'click', function(event){moverOpcaoBaixo(event, destino, final);});
}

function selectVariosOnSubmit(destino) {
    $A($(destino).options).each(function (elemento) { elemento.selected = true;});
}				

function selecionarOpcao(event, origem, destino, final, todos) {
	/* para a propagacao do evento de clique */
	Event.stop(event);

    var opcoesDisponiveis = $(origem);
    var opcoesSelecionadas = $(destino);
    var opcoesFinal = $(final);

	var opcao;
    for (var i = 0; i < opcoesDisponiveis.options.length; i++)
    {
		opcao = $(opcoesDisponiveis.options[i]);
        if ((!todos && !opcao.selected) || opcao.disabled)
            continue;
        
        var novaOpcao = new Option(opcao.text, opcao.value);
        novaOpcao.title = novaOpcao.text;
        opcoesSelecionadas.options[opcoesSelecionadas.options.length] = novaOpcao;
        
        novaOpcao = new Option(opcao.text, opcao.value);
        novaOpcao.title = novaOpcao.text;
        opcoesFinal.options[opcoesFinal.options.length] = novaOpcao;
        novaOpcao.selected = true;
        
        opcao.disabled = true;
		opcao.addClassName("desativado");
        opcao.selected = false;
    }
}

function removerSelecaoOpcao(event, origem, destino, final, todos) {
	/* para a propagacao do evento de clique */
	Event.stop(event);
	
    var opcoesDisponiveis = $(origem);
    var opcoesSelecionadas = $(destino);
    var opcoesFinal = $(final);

	if(todos) {
	    $A(opcoesSelecionadas.options).each(function (elemento) { elemento.selected = true;});
	}				    
    
    var opcoesSelecionadasExclucao = $F(opcoesSelecionadas);
	if (opcoesSelecionadasExclucao == null)
		return;

	var opcao;
    for (var i = 0; i < opcoesDisponiveis.options.length; i++)
        if (opcoesSelecionadasExclucao.indexOf(opcoesDisponiveis.options[i].value) != -1)
		{
			opcao = $(opcoesDisponiveis.options[i]);
			opcao.removeClassName("desativado");
			opcao.disabled = false;
		}

    for (var i = (opcoesSelecionadas.options.length - 1); i >= 0 ; i--)
        if (opcoesSelecionadasExclucao.indexOf(opcoesSelecionadas.options[i].value) != -1) {
            opcoesSelecionadas.options[i] = null;
            opcoesFinal.options[i] = null;
        }
}

function moverOpcaoCima(event, destino, final) {
	/* para a propagacao do evento de clique */
	Event.stop(event);
	
    var opcoesSelecionadas = $(destino);
    var opcoesFinal = $(final);

    for (var i=1 ; i<opcoesSelecionadas.options.length; i++) {
    	if(opcoesSelecionadas.options[i].selected && !opcoesSelecionadas.options[i-1].selected) {
    		var opcaoa = $(opcoesSelecionadas.options[i-1]);
    		var opcaob = $(opcoesSelecionadas.options[i]);
    		opcoesSelecionadas.options[i-1] = new Option('', '');
    		opcoesSelecionadas.options[i] = opcaoa;
    		opcoesSelecionadas.options[i-1] = opcaob;
    		
    		opcaoa = $(opcoesFinal.options[i-1]);
    		opcaob = $(opcoesFinal.options[i]);
    		opcoesFinal.options[i-1] = new Option('', '');
    		opcoesFinal.options[i] = opcaoa;
    		opcoesFinal.options[i-1] = opcaob;
    	}
    }
}

function moverOpcaoBaixo(event, destino, final) {
	/* para a propagacao do evento de clique */
	Event.stop(event);
	
    var opcoesSelecionadas = $(destino);
    var opcoesFinal = $(final);

    for (var i=opcoesSelecionadas.options.length-2 ; i>=0; i--) {
    	if(opcoesSelecionadas.options[i].selected && !opcoesSelecionadas.options[i+1].selected) {
    		var opcaoa = $(opcoesSelecionadas.options[i+1]);
    		var opcaob = $(opcoesSelecionadas.options[i]);
    		opcoesSelecionadas.options[i+1] = new Option('', '');
    		opcoesSelecionadas.options[i] = opcaoa;
    		opcoesSelecionadas.options[i+1] = opcaob;

    		opcaoa = $(opcoesFinal.options[i+1]);
    		opcaob = $(opcoesFinal.options[i]);
    		opcoesFinal.options[i+1] = new Option('', '');
    		opcoesFinal.options[i] = opcaoa;
    		opcoesFinal.options[i+1] = opcaob;
    	}
    }
}

function validaTamanhoTexto(areaTexto, tamanhoMaximoTexto){
	if (areaTexto.value.length >= tamanhoMaximoTexto) {
		areaTexto.value = areaTexto.value.substring(0, tamanhoMaximoTexto);
	}
}

function validaTamanhoTexto(areaTexto, tamanhoMaximoTexto, contadorSpanId){
	if (areaTexto.value.length >= tamanhoMaximoTexto) {
		areaTexto.value = areaTexto.value.substring(0, tamanhoMaximoTexto);
	}		
	document.getElementById(contadorSpanId).innerHTML = "Caracteres restantes: " + (tamanhoMaximoTexto - areaTexto.value.length);
}

/**
 * Funcao que ao passar um atributo do tipo radio, retorna o valor que esta selecionado.
 * Retorna null caso de nao encontre o radio.
 * @param radio
 * @returns
 */
function getCheckedRadioValue(radio){
	  if(typeof radio == "undefined"){
	  		return null;
	  }
	  var valor = null;
	  if(radio.length > 1){
		for (var index = 0; index < radio.length; index++) {
		   if(radio[index].checked)
		    	valor = radio[index].value;
		}
	 }else{
		valor = radio;
	 }
	 return valor;
}  

/******************************************************************************
 *             FUN��ES UTILIZADAS PARA A TAGLIB pjd:DropDownCheckboxList      *
 ******************************************************************************/
 /**
  * Habilita (se isDisabled == false) ou desabilita (se isDisabled == true) todos os checkboxes
  * do componente DropDownCheckboxList cujo nome foi passado como par�metro.
  * 
  * @param nomeComponente      nome do componente do tipo DropDownCheckboxList.
  *                            Este nome � aquele passado no cria��o do componente por meio do par�metro "name".
  *
  * @param isDisabled          "true" para desabilitar todos os checkboxes deste componente.
  *                            "false" para habilitar todos os checkboxes deste componente.
  */
function disableEnableDropDownCheckboxList(nomeComponente, isDisabled) {
	var div = document.getElementById(nomeComponente);
	var elems = div.getElementsByTagName("input");
    for(var i = 0; i < elems.length; i++) {
    	if (elems[i] !== undefined) {
        	elems[i].disabled = isDisabled;
    	}
    }  
} 
  
  /**
   * Limpa todos os checkboxes do componente cujo nome foi passado como par�metro.
   *
   * @param nomeComponente      nome do componente do tipo DropDownCheckboxList.
   *                            Este nome � aquele passado no cria��o do componente por meio do par�metro "name".
   */
  function cleanDropDownCheckboxList(nomeComponente) {
		var div = document.getElementById(nomeComponente);
		var elems = div.getElementsByTagName("input");
	    for(var i = 0; i < elems.length; i++) {
	    	if (elems[i] !== undefined) {
	        	elems[i].checked = false;
	    	}
	    }  
	} 

 /**
  * Verifica se no componente DropDownCheckboxList h� um checkbox, cujo valor � passado como par�metro "valueToCompare",
  * est� checado. Se sim, retorna TRUE. Caso contr�rio, retorna FALSE.
  * 
  * @param nomeComponente      nome do componente do tipo DropDownCheckboxList.
  *                            Este nome � aquele passado no cria��o do componente por meio do par�metro "name".
  *                             
  * @param separador           separador usado para separar o �ndice do checkbox e o valor do checkbox.
  *                            Veja o atributo da classe DropDownCheckboxList.java para melhor entendimento.
  *
  * @param valueToCompare      Valor do checkbox que ser� verificado se est� checado ou n�o.
  *
  * @return                    "true" se h� um checkbox no componente marcado cujo valor � igual a valueToCompare (passado como par�metro).
  *                            "false" caso contr�rio.
  * 
  */
function isCheckedDropDownCheckboxList(nomeComponente, separador, valueToCompare) {
	var div = document.getElementById(nomeComponente);
	var elems = div.getElementsByTagName("input");
	
    for(var i = 0; i < elems.length; i++) {
    	if (elems[i] !== undefined) {
    		var valorNoLoop;
    		if (typeof separador == 'string' && separador != "") {
    			valorNoLoop = elems[i].value.substring(elems[i].value.indexOf(separador) + 1, elems[i].value.length);
    		}
    		else {
    			valorNoLoop = elems[i].value;
    		}
    		
    		if (valorNoLoop == valueToCompare) {
    			return elems[i].checked;
    		}
    	}
    }

    return false;
}

/**
 * Verifica se no componente DropDownCheckboxList h� algum checkbox marcado.
 * Se sim, retorna TRUE. Caso contr�rio, retorna FALSE.
 * 
 * @param nomeComponente      nome do componente do tipo DropDownCheckboxList.
 *                            Este nome � aquele passado no cria��o do componente por meio do par�metro "name".
 *                             
 * @param separador           separador usado para separar o �ndice do checkbox e o valor do checkbox.
 *                            Veja o atributo da classe DropDownCheckboxList.java para melhor entendimento.
 *
 * @param valueToCompare      Valor do checkbox que ser� verificado se est� checado ou n�o.
 *
 * @return                    "true" se h� algum checkbox no componente marcado.
 *                            "false" caso contr�rio.
 * 
 */
function hasCheckedDropDownCheckboxList(nomeComponente) {
	var div = document.getElementById(nomeComponente);
	var elems = div.getElementsByTagName("input");
	
   for(var i = 0; i < elems.length; i++) {
	   if (elems[i] !== undefined) {
		   if (elems[i].checked == true) {
			   return true;
		   }
	   }
   }

   return false;
}

/**
 * Mostra elementos da tela cujo "class" � igual ao nome do class passado como par�metro
 * @param className
 * @param show
 */
function mostrarElementosPelaClasse(className,show) {
    var elems = document.getElementsByTagName('tr'), i;
    for (i in elems) {
        if((' ' + elems[i].className + ' ').indexOf(' ' + className + ' ')
                > -1) {
            elems[i].style.display = (show) ? "" : "none" ;
        }
    }
}	

/**
 * Abre uma pop up conforme parametros 
 * @param URL
 * @param width
 * @param height
 * @param left
 * @param top
 */
function openPopUp(URL,width,height,left,top){
	 window.open(URL,'janela', 'width='+width+', height='+height+', top='+top+', left='+left+', scrollbars=yes, status=no, toolbar=no, location=no, directories=no, menubar=no, resizable=no, fullscreen=no');
}



/** abre as opções de impressão para relatórios genéricos **/
function loadOpcoesImpressaoRelatorio(contextPath, parentForm, titulo, formato, urlPesquisa, tamanhoFonte,tipoExportacao,subtitulo){	
	var ID_RELATORIO_GENERICO = 284;	
	contextPath= new String(contextPath).replace(/\/$/,"");	
	if(typeof tamanhoFonte == 'undefined' || tamanhoFonte==null || isNaN(tamanhoFonte))
		tamanhoFonte= 10;  //tamanho normal
	
	var url= contextPath+"/administracao/relatorio.do?actionType=visualizar&idRelatorio="+ID_RELATORIO_GENERICO
		+"&parentForm="+parentForm+"&parentURL="+escape(urlPesquisa)
		+"&urlRelatorioHQL="+escape(urlPesquisa)+"&descricao="+titulo+"&formato="+formato+"&tamanhoFonte="+tamanhoFonte 
		+(tipoExportacao?"&tipoExportacaoSelec="+tipoExportacao:'')+(subtitulo?'&subTituloDinamico='+subtitulo:'');
	_openOpcoesRelatorio(url,titulo,0,0,parentForm,urlPesquisa);	
}

function _openOpcoesRelatorio(_url, _title, _width, _height, _parentFormName, _closeUrl) {
	// calcula o tamanho da janela
	_width  = calculateDlgWidth(_width);
	_height = calculateDlgHeight(_height);
	// cria e exibe a janela
	var win = new Window({className:"tjpr", title:_title,
                          top:20, left:20, width:_width, height:_height,
                          url:_url, minimizable:false, destroyOnClose:true,
						  closable:true	                          
                          });
    win.showCenter(true);
    win.setCloseCallback(
    		function(){
    			var f=document.forms[_parentFormName];
    			f.target='_self';
    			f.action=_closeUrl;
    			if(win && win.hide)
    				win.hide();
    		}
    );
}


/**
 * Funcao que retorna todos os objetos radios selecionados
 * @param radio ou um array de radio para verifica��o
 * @return array de objetos radios selecionados
 */
function getAllRadioObjectSelected(radioObj) {
	var arr= [];
	if(!radioObj)
		return null;
	var radioLength = radioObj.length;
	if(typeof radioLength == 'undefined')
		if(radioObj.checked)
			return [radioObj];
		else
			return null;
	for(var i = 0; i < radioLength; i++) {
		if(radioObj[i].checked) {
			arr[arr.length]= radioObj[i]; 
		}
	}
	return (arr == []?null:arr);
}


function setVisible(id, visible) {
	var obj = $(id);
	if(obj != null && obj.style != null) {
		obj.style.display = (visible) ? '' : 'none';
	}
}

function toggleVisible(id){
	var obj = $(id);
	if(obj != null && obj.style != null) {
		var estadoAtual= (obj.style.display == '');
		setVisible(id,!estadoAtual);
	}		
}
/**
 * Função que automaticamente mostra ou oculta um menu scroll do tipo "mais e menos"
 * @param containerID
 * @param img
 * @returns
 */

function toggleScrollMenu(containerID, img){
	container = document.getElementById(containerID);
	if (container == null)
		return;
	if (container.style.display){//está oculto, exibe (quando exibe, não há style.display definido)
		img.src = img.src.replace('Plus','Minus');
		new Effect.SlideDown(containerID,{ duration: 0.5 });
	}else { //oculta
		img.src = img.src.replace('Minus','Plus');
		new Effect.SlideUp(containerID,{ duration: 0.5 });
	}
}


/**
 * Função que retorna o valor selecionado de um radio
 * @returns
 */
function getSelectedRadioValue(radio)  
{  
    var i;
    for (i=0;i<radio.length;i++){
       if (radio[i].checked)
          return radio[i].value;
    }
    return null;
} 

function controlaBox(imgElement){
	var c= imgElement.parentNode.parentNode;
	do{
		c= c.nextSibling;
		//alert("c="+c.type + " - "+c.className);
		if(c.className && c.className == 'form'){
			el= c;
			break;
		}else if(c.type == 'fieldset'){
			el= c;
			break;
		}
	}while(c != null);		
	var s='';
	if(imgElement.src.indexOf('iRollDown') != -1){		
		s= imgElement.src.replace('iRollDown','iRollUp');
		imgElement.src= s;
		if(el)
			new Effect.SlideDown(el,{ duration: 0.2 });
	}else{
		s= imgElement.src.replace('iRollUp','iRollDown');
		imgElement.src= s;
		if(el)
			new Effect.SlideUp(el,{ duration: 0.2 });
	}
}

/** Controle visualização ou não de elementos de acordo com seu className */
function showElementsByClassName(nomeClasse,show,tipoDisplayAberto){
	if(typeof tipoDisplayAberto == 'undefined' || !tipoDisplayAberto) 
		tipoDisplayAberto='';
	
	var arr=document.getElementsByClassName(nomeClasse);
	if(!arr || arr.length == 0)
		return;
	for(var i=0; i<arr.length; i++){
		arr[i].style.display= (show?tipoDisplayAberto:'none');
	}
}

/** verifica se um objeto está indefinido ou nulo **/
function isIndefinido(obj){
	if(typeof obj == 'undefined')
		return true;
	return (obj == null);
}

function validarCPF(strCPF) {
	strCPF = strCPF.replace(/[^\d]+/g,'');
	strCPF = strCPF.replace('.','');
	strCPF = strCPF.replace('.','');
	strCPF = strCPF.replace('.','');
	strCPF = strCPF.replace('-','');
    if(strCPF == '') return false;
    
    if (strCPF.length != 11)
        return false;
    
    var Soma;
    var Resto;
    Soma = 0;
    
    if (strCPF == "00000000000" || 
    		strCPF == "11111111111" || 
    		strCPF == "22222222222" || 
    		strCPF == "33333333333" || 
    		strCPF == "44444444444" || 
    		strCPF == "55555555555" || 
    		strCPF == "66666666666" || 
    		strCPF == "77777777777" || 
    		strCPF == "88888888888" || 
    		strCPF == "99999999999")
            return false;

   
  for (i=1; i<=9; i++) Soma = Soma + parseInt(strCPF.substring(i-1, i)) * (11 - i);
  Resto = (Soma * 10) % 11;
   
    if ((Resto == 10) || (Resto == 11))  Resto = 0;
    if (Resto != parseInt(strCPF.substring(9, 10)) ) return false;
   
  Soma = 0;
    for (i = 1; i <= 10; i++) Soma = Soma + parseInt(strCPF.substring(i-1, i)) * (12 - i);
    Resto = (Soma * 10) % 11;
   
    if ((Resto == 10) || (Resto == 11))  Resto = 0;
    if (Resto != parseInt(strCPF.substring(10, 11) ) ) return false;
    return true;
}

function validarCNPJ(cnpj) {
	 
    cnpj = cnpj.replace(/[^\d]+/g,'');
 
    if(cnpj == '') return false;
     
    if (cnpj.length != 14)
        return false;
 
    // Elimina CNPJs invalidos conhecidos
    if (cnpj == "00000000000000" || 
        cnpj == "11111111111111" || 
        cnpj == "22222222222222" || 
        cnpj == "33333333333333" || 
        cnpj == "44444444444444" || 
        cnpj == "55555555555555" || 
        cnpj == "66666666666666" || 
        cnpj == "77777777777777" || 
        cnpj == "88888888888888" || 
        cnpj == "99999999999999")
        return false;
         
    // Valida DVs
    tamanho = cnpj.length - 2
    numeros = cnpj.substring(0,tamanho);
    digitos = cnpj.substring(tamanho);
    soma = 0;
    pos = tamanho - 7;
    for (i = tamanho; i >= 1; i--) {
      soma += numeros.charAt(tamanho - i) * pos--;
      if (pos < 2)
            pos = 9;
    }
    resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
    if (resultado != digitos.charAt(0))
        return false;
         
    tamanho = tamanho + 1;
    numeros = cnpj.substring(0,tamanho);
    soma = 0;
    pos = tamanho - 7;
    for (i = tamanho; i >= 1; i--) {
      soma += numeros.charAt(tamanho - i) * pos--;
      if (pos < 2)
            pos = 9;
    }
    resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
    if (resultado != digitos.charAt(1))
          return false;
           
    return true;
}

function sleep(ms) {
	//console.log('Sleep:' + ms + 'ms');
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Funcao que realiza a chamada ajax para a URL informada utilizando uma fila de chamada, além disso atualiza no campo
 * target o valor retornado da url.
 * @param target
 * @param url
 * @param retryContainerDeep - Tipo inteiro. Quando informado, vai adicionar um icone para nova tentativa em caso de falha.
 *									IMPORTANTE! O novo elemento sera adicionado no n�vel informado em relacao ao parent-container do target.
 Ex. Nivel 1, ser� o target. Nivel 2 sera o target.parentElement.
 * @param callbackFunction - Função que manipulará os dados retornados
 * @returns
 */
function ajaxEnfileirar(target, url, retryContainerDeep, callbackFunction){
	if (target == null || target == 'undefined' || url == null || url == 'undefined'){
		console.warn("ajaxEnfileirar: parametros invalidos");
		return null;
	}
	ajaxEnfileirarTaskManager.addAjaxCall(target, url, retryContainerDeep, callbackFunction);
}

/**
 * Funcao que realiza a chamada ajax para a URL informada, e atualiza no campo target o valor retornado da url.
 * @param target
 * @param url
 * @param useRedColorFont - Caso o useRedColorFont seja true, a fonte da cor sera vermelha se o retorno for maior que zero
 * @param leadZeros -  Caso o leadZeros seja true, o resultado sera formatado com ate 3 zeros a esquerda.
 * @param retryContainerDeep - Tipo inteiro. Quando informado, vai adicionar um icone para nova tentativa em caso de falha. 
 *									IMPORTANTE! O novo elemento sera adicionado no n�vel informado em relacao ao parent-container do target.
									Ex. Nivel 1, ser� o target. Nivel 2 sera o target.parentElement.
 * @returns
 */
function ajaxTotalizar(target, url,useRedColorFont, leadZeros, retryContainerDeep){
	if (target == null || target == 'undefined' || url == null || url == 'undefined'){
		console.warn("ajaxTotalizar: parametros invalidos");
		return null;	
	}
	ajaxEnfileirar(target, url, retryContainerDeep, function(result) {
		if(leadZeros !== 'undefined' && (leadZeros == true || leadZeros == 'true')){
			result = result.padStart(3, '0');
		}
		if(useRedColorFont !== 'undefined' && (useRedColorFont == true || useRedColorFont == 'true')){
			result = "<span style='color: red;'>"+result+"</span>";
		}
		target.innerHTML =  result;
	});
}

/**
* Gerenciador para controlar o numero de chamadas ajax simultaneas
 */
var ajaxEnfileirarTaskManager = (function(){
	const MAX_ACTIVE_CALL = 5;
	var queue = [];
	var activeCall = 0;
	
	function queueAjaxCall(target, url, retryContainerDeep, callbackFunction){
		queue.push([target, url, retryContainerDeep, callbackFunction]);
    	checkQueue();
	}
	
	function onPromiseCompleteOrFailure() {
	    activeCall--;
		if(activeCall < 0){
			activeCall = 0;
		}
		//console.log('Queue Size:' + queue.length + ', Active Calls:' + activeCall);
	    checkQueue();
	}
			
	function makeAjaxCall(target, url, retryContainerDeep, callbackFunction){
		var xmlhttp = new XMLHttpRequest();
			xmlhttp.onreadystatechange = function() {				
				if (this.readyState != 4 && this.status != 200) {
					target.innerHTML = '';//limpa o conteúdo
					//ícone de status
					i = document.createElement("img");
					i.src = getContextPath() + '/img/indicator.gif';
					i.className = 'indicatorOn';
					i.alt = 'Aguarde...'
					target.appendChild(i);
				} else if (this.readyState == 4) {
					if(this.status == 200){
						let result = this.responseText;
						callbackFunction(result);
						onPromiseCompleteOrFailure();
					}else {
						target.innerHTML = '';
						//Icone de status
						i = document.createElement("img");
						i.src = getContextPath() + '/img/iWarning.png';						
						i.alt = "Falha ao obter total";								 										
						new Opentip(i, i.alt,{target: i, targetJoint: "bottom-right", fixed: true});			
						target.appendChild(i);
						console.log('retryContainerDeepParam:'+retryContainerDeep);						
						if(retryContainerDeep && retryContainerDeep > 0){	
							console.log("aqui 1");																								
							oi = document.createElement("img");
							oi.title = "Clique para tentar novamente";
							oi.src = getContextPath() + '/img/retry.png';
							oi.style = "cursor:pointer";							
							oi.onclick = function(e) {
								e.preventDefault();
								ajaxEnfileirar(target, url+'&retry=true', retryContainerDeep, callbackFunction);
								this.parentElement.removeChild(this);
							};
							container = target;
							for(j = 1;j<retryContainerDeep; j++){
								container = container.parentElement;								
							}
							console.log('container:'+container);
							container.append(oi);
						}
						onPromiseCompleteOrFailure();
					}
				}				
			}
			url += '&rid=' + Math.random();
			xmlhttp.open('GET', url, true);
			xmlhttp.setRequestHeader('Cache-Control', 'no-cache');
			xmlhttp.send();	
	}
	
	function checkQueue() {
	    if (queue.length && activeCall <= MAX_ACTIVE_CALL) {
			let params = queue.shift();			
			if (!params) {
				return;
	      	}			
			activeCall++;
			let target = params[0];
			let url = params[1];
			let retryContainerDeep = params[2];
			let callbackFunction = params[3];
			makeAjaxCall(target, url, retryContainerDeep, callbackFunction);
		}				
	}	
	
	return {
		addAjaxCall: queueAjaxCall
	}
})();

/*
 * Serializa todos os atributos de um form numa string para ser passada em uma URL
 */
function serializeForm(form) {
	// Setup our serialized data
	var serialized = [];
	// Loop through each field in the form
	for (var i = 0; i < form.elements.length; i++) {
		var field = form.elements[i];
		// Don't serialize fields without a name, submits, buttons, file and reset inputs, and disabled fields
		if (!field.name || field.disabled || field.type === 'file' || field.type === 'reset' || field.type === 'submit' || field.type === 'button') continue;
		// If a multi-select, get all selections
		if (field.type === 'select-multiple') {
			for (var n = 0; n < field.options.length; n++) {
				if (!field.options[n].selected) continue;
				serialized.push(encodeURIComponent(field.name) + "=" + encodeURIComponent(field.options[n].value));
			}
		}
		// Convert field data to a query string
		else if ((field.type !== 'checkbox' && field.type !== 'radio') || field.checked) {
			serialized.push(encodeURIComponent(field.name) + "=" + encodeURIComponent(field.value));
		}
	}
	return serialized.join('&');
}

/** função utilitária para facilitar a execução de ajax via o recurso "fetch" do ECMA 6 **/
function executeFetch(url, type, fxCallback){
	if(typeof fetch != 'function')
		return;
	fetch(url)
		.then(
			function(response){
				if (response.status !== 200) {
			        console.log('Não foi possível obter resposta. Status Code: ' +  response.status);
			        return;
			    }
				if(type == 'text')
					response.text().then(function(dados){ fxCallback(dados); });
				else
					console.log('Type não reconhecido: '+type);
			}
		)
		.catch(function(err){
			console.log('Fetch Error :-S', err);
		})
	;
}

/**
 * Função que remove as pontuações de um valor
 */
function removerPontuacao(vr){
	    var str= vr.replace( /\.|\,/g,"");
	    if(str == null || str == '')
		    return '0';
	    return str;
}

/** função que copia um texto para a area de transferência do usuário
 */
function copiarTexto(textoParaCopiar){
	var inputc = document.body.appendChild(document.createElement("input"));
		inputc.value = textoParaCopiar;
		
		inputc.select();
		document.execCommand('copy');
		inputc.parentNode.removeChild(inputc);
}

/**
 * Abrir nova janela
 * @returns
 */
function abrirNovaJanela(url){
	 var width = 1000;
	 var height = 700;
	 var left = 99;
	 var top = 99;
	 window.open(url,'janela', 'width='+width+', height='+height+', top='+top+', left='+left+', scrollbars=yes, status=no, toolbar=no, location=no, directories=no, menubar=no, resizable=no, fullscreen=no');
}

/** Habilita ou Desabilita campos do form, bem como limpa seus valores antes de desabilitar 
para evitar problemas na submissão do form */
function enableDisableFieldsForm(flagEnable,fields){
	var f=null;
	for(var i=0; i< fields.length; i++){
		f=$(fields[i]);
		if(typeof f == 'undefined' || f == null)
			continue;
		if(/^select|radio|checkbox/.test(f.type)){  //desabilita combos e radios..
			f.disabled= !flagEnable;
		}else if(typeof f._createUI == 'function') { //multiSelect ?
			f= f.update(flagEnable);
		}else{
			if(!flagEnable && f.value)
				f.value='';
			f.readOnly= !flagEnable;
		}
	}
}

/** Abre ou fecha um elemento através de seu ID */
function mostrarElemento(idElemento,show){
	if(!$(idElemento))
		return;
	$(idElemento).style.display=(show?'':'none');
}

/**
 * Formata um número único da mesma forma que na taglib NumeroFormatadoTag
 * @param numeroUnico
 * @returns {string}
 */
function formataNumeroUnico(numeroUnico){
	if(!numeroUnico)
		return "";
	numeroUnico = numeroUnico.replaceAll(/(\.|\(|\)|\/|\-| )+/g,'');
	while (numeroUnico.length < 20)
		numeroUnico = "0" + numeroUnico;

	let sequencial = (numeroUnico.substring(0, 7));
	let dv = (numeroUnico.substring(7, 9));
	let ano = (numeroUnico.substring(9, 13));
	let sOrgao = numeroUnico.substring(13, 14);
	let sOrgaoJustica = numeroUnico.substring(14, 16);
	let origem = (numeroUnico.substring(16, 20));

	let novoNumeroUnico = sequencial+"-"+dv+"."+ano+"."+sOrgao+"."+sOrgaoJustica+"."+origem;
	return novoNumeroUnico;
}

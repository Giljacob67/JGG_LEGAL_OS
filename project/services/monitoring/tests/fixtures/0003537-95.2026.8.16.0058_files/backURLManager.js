/**************************************************************************************
 * Gerencia a url de retorno na session storage do browser, simulando uma pilha de urls
 *
 * @author htb 
 * (baseado em "userPreferences.js")
 *************************************************************************************/

var BackURLManager = function() {
	var userManager = new UserManager();
	this.key        = 'ProjudikURL' + '.' + userManager.getLogin(); 
	this.separator  = ' URL:';
}

BackURLManager.prototype.supports = function () {	
	return (typeof(Storage) !== 'undefined') ? true : false;
}

BackURLManager.prototype.isEmpty = function() {
	var urlStack = sessionStorage.getItem(this.key);
	return ((urlStack == null) || (urlStack.length == 0));
}

BackURLManager.prototype.add = function(_url) {
	// valida antes de empilhar
	if( !this.supports() )
		return;	
	if( (_url == null) || (_url.length == 0) )
		return;	

	// obtém a "pilha de urls"
	var urlStack = this.isEmpty() ? '' : sessionStorage.getItem(this.key);
	
	// adiciona a url na "pilha de urls"
	urlStack = urlStack + this.separator + _url;
	sessionStorage.setItem(this.key, urlStack);
}

BackURLManager.prototype.get = function() {
	// valida antes de desempilhar
	if( !this.supports() )
		return null;	
	
	// obtém a "pilha de urls"
	if( this.isEmpty() )
		return null;
	var urlStack = sessionStorage.getItem(this.key); 
	
	// obtém a última url da "pilha" 
	var idx  = urlStack.lastIndexOf(this.separator);
	var url  = urlStack.substring(idx).replace(this.separator, '');
	
	// remove a última url da "pilha"
	urlStack = urlStack.substring(0, idx);
	this.replace(urlStack);
	
	// retorna a url
	return url;
}

BackURLManager.prototype.removeLast = function() {
	// apenas consome a última url da "pilha"
	this.get();
}

BackURLManager.prototype.replace = function(_urlStack) {
	// valida antes de empilhar
	if( !this.supports() )
		return;	
	if( (_urlStack == 'undefined') || (_urlStack == null) )
		return;	

	// troca a pilha de urls
	sessionStorage.setItem(this.key, _urlStack);
}

BackURLManager.prototype.clear = function() {
	if( !this.supports() )
		return;	
	sessionStorage.removeItem(this.key);
}

BackURLManager.prototype.disableBackButton = function() {
	// se a pilha de urls estiver vazia, não faz nada
	if( this.isEmpty() )
		return;
		
	// fonte: https://stackoverflow.com/questions/12381563/how-to-stop-browser-back-button-using-javascript
/*	
	window.location.hash="no-back-button";
	//window.location.hash="Again-No-back-button";//again because google chrome don't insert first hash into history
	window.onhashchange = function() {
		window.location.hash="no-back-button";
	}
*/
	
	// fonte: https://stackoverflow.com/questions/12381563/how-to-stop-browser-back-button-using-javascript
	history.pushState(null, document.title, location.href);
	window.addEventListener('popstate', 
		function (event) {
			history.pushState(null, document.title, location.href);
		}
	);
}

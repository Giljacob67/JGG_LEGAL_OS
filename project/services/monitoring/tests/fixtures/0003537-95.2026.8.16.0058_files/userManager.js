/**********************************************************************************************************************
 * Gerencia informações do usuário logado.
 *
 * Por enquanto está tratando apenas do login do usuário, porém pode ser estendido para outros campos ou informações.
 *
 * @author htb 
 * (baseado em "userPreferences.js")
 *********************************************************************************************************************/

var UserManager = function() {
	this.loginKey = 'ProjudiUserLogin';
	this.browserStorage = localStorage;
}

UserManager.prototype.supports = function () {	
	return (typeof(Storage) !== 'undefined') ? true : false;
}


/**********************************************************************************************************************
 * Gerenciamento do login do usuário 
 *********************************************************************************************************************/
UserManager.prototype.setLogin = function(_userLogin) {
	if( !this.supports() )
		return;	
	if( _userLogin == 'undefined' )
		return;
	this.browserStorage.setItem(this.loginKey, _userLogin);
}
UserManager.prototype.getLogin = function() {
	if( !this.supports() )
		return null;	
	return this.browserStorage.getItem(this.loginKey);
}
UserManager.prototype.clearLogin = function() {
	if( !this.supports() )
		return;	
	this.browserStorage.removeItem(this.loginKey);
}

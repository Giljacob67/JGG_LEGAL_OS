/*

@author mgob
*/

var PerfilController = function(action, formName, loginParamName, cpfCNPJ){
    this.action = action;
    this.formName = formName;
    this.loginParamName = loginParamName;
    this.cpfCNPJ = cpfCNPJ;
    this.arr = [];
}

PerfilController.prototype.select = function(login, grupoID){
    document[this.formName].action = this.action + '&_cpfCNPJ=' + this.cpfCNPJ + '&grupoID=' + grupoID +  '&' + this.loginParamName + '=' + login;
    document[this.formName].submit();
}

PerfilController.prototype.addLogon = function(descricao, login){
    this.arr.push({"descricao": descricao, "login": login});
}

PerfilController.prototype.autocomplete = function(input, inputID){
	/*Autocomplete com extensão para os métodos search e select */
    AutocompleteJS.prototype.search = function(val){
		for (i = 0; i < this.array.length; i++) {
			/* o item eh um JSON para perfil. deve verificar descricao (grupo) e login */
			var item = this.array[i];
			var descricao = '';
			var startIdx = -1;
			
            var desc = item.descricao + ' (' + item.login + ')';
            if (desc.toUpperCase().indexOf(val.toUpperCase()) != -1){
                var obj = item.login;
                addOption(val, desc, desc.toUpperCase().indexOf(val.toUpperCase()), obj);
            }
		}
	}

    AutocompleteJS.prototype.select = function(){
		const parent = this.inpID.parentElement;
		var login = this.inpID.value;
		this.controller.select(login);
	}
	
	return new AutocompleteJS(input, inputID, this.arr, this);
}
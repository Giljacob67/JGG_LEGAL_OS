/**
 * Funções para manter preferências de usuário no armazenamento local do navegador, utilizando a API Web Storage do HTML5.
 * 
 * Nesta API há dois modos de manter os dados: por sessão do usuário, até fechar a aba (sessionStorage) ou permanentemente (localStorage).
 * Diferentemente dos cookies, os dados nunca trafegam para o servidor, e devem ser persistidos e acessados somente no client side.
 * Este tipo de armazenamento é mais seguro, não afeta a performance da aplicação e suporta maior quantidade de dados armazenados.
 * Entretanto, o armazenamento é por origem (domínio e protocolo), não por usuário logado. Portanto é preciso determinar um modo
 * de acesso tal que um usuário não acesse dados de outro usuário quando ambos utilizarem o sistema.
 * Os dados são persistidos no modo par nome/valor, sempre como strings.
 * 
 * Para mais detalhes:
 * https://www.w3schools.com/html/html5_webstorage.asp
 * 
 * 
 * As principais funções deste script são userPrefs.save(login, name, value) e userPrefs.get(login, name), usados respectivamente para armazenar e ler os dados no modo
 * localStorage. O parâmetro 'login' sempre é obrigatório, pois será usado como chave nas operações com suas preferências. Mais detalhes na documentação de cada função.
 * 
 * É possível armazenar usando sessionStorage, por meio do objeto userPrefs.session, para operações específicas do desenvolvedor.
 * 
 * Caso o navegador não tenha compatibilidade com Web Storage, as funções não retornaram erro; entretanto, pode ser usada a função
 * userPrefs.supports() para testar a compatibilidade antes de invocar as demais funções.
 *
 * @mgob
 * @since 5.2
 */

//Prefixo para criar a chave do item de armazenamento das preferências do usuário. Será composto com o login, p.ex.:  'ProjudiUserPrefs.mgob.anl'
var userPreferencesKeyPrefix = 'ProjudiUserPrefs';

//Atributos e valores default para o item de armazenamento das preferências. Usado na primeira vez em que o usuário fizer o logon.
var _default = {
	ultimoAcesso: new Date(),
	assessoradosVisitados: [], //será um array de objetos com os atributos 'codigo', 'tipoAssessor' e 'nome'
	areasAtuacaoVisitadas: [], //será um array de objetos com os atributos 'codigo', 'tipoAreaAtuacao' e 'nome'
	historicoProcessos: [] //TODO será um array de objetos com os atributos 'numeroUnico', 'instancia', 'classeProcessual' e 'assuntoPrincipal'
};

/**
 * O objeto UserPreferencesManager manipula sempre um JSON identificado pelo nome 'ProjudiUserPrefs.login'.
 * Neste JSON serão incluídos novos atributos para cada nome indicado na função 'save()'.
 * A função get() sempre irá buscar neste objeto JSON o atributo com o nome informado, se existir.
 * 
 * 
 */
var UserPreferencesManager = function(login){
	//login é obrigatório:
	if (login === 'undefined')
		return null;
	
	this.login = login;
	this.key = userPreferencesKeyPrefix+'.'+login;
	
	if (typeof(Storage) !== 'undefined'){
		_up = localStorage.getItem(this.key);//string

		if (_up){
			this.userPreferences = JSON.parse(this.local.getItem(this.key));//object
		}else {
			this.userPreferences = _default;
			this.userPreferences.login = login;
			this.local.setItem(this.key, JSON.stringify(this.userPreferences));//save empty
		}
	}
}

//TODO mgob necessário?
UserPreferencesManager.prototype.supports = function (){
	if (typeof(Storage) !== 'undefined')
		return true;
	else
		return false;
}

UserPreferencesManager.prototype.local = localStorage;
UserPreferencesManager.prototype.session = sessionStorage;

/**
 * 
 */
UserPreferencesManager.prototype.save = function(name, value){
	if (!this.supports())
		return;
	
	this.userPreferences[name] = value;
	this.userPreferences.ultimoAcesso = new Date();
	this.local.setItem(this.key, JSON.stringify(this.userPreferences));
	this.userPreferences = JSON.parse(this.local.getItem(this.key));
}

/**
 * 
 */
UserPreferencesManager.prototype.get = function(name){
	if (!this.supports())
		return;
	
	if (this.userPreferences[name]){
		value = this.userPreferences[name];
		if (typeof(value) == 'string'){
			try {
				value = JSON.parse(this.userPreferences[name]);
			}catch(e){
				
			}
			return value;
		}else
			return value;
	}else
		return null;
}

UserPreferencesManager.prototype.clear = function(name){
	if (!this.supports())
		return;
	
	if (this.userPreferences[name]){
		delete this.userPreferences[name];
		this.local.setItem(this.key, JSON.stringify(this.userPreferences));
	}
}

UserPreferencesManager.prototype.clearAll = function(){
	if (!this.supports())
		return;
	//TODO mgob Caso o usuário tenha a opção ele próprio de limpar suas preferências, incluir aqui um confirm.
	this.userPreferences = _default;
	this.userPreferences.login = this.login;
	this.local.setItem(this.key, JSON.stringify(this.userPreferences));
}

/** 
 * FilterMannager: Objeto responsável por gerenciar campos de busca em formulário (filtros) 
 */

var FilterMannager= function(userLogin){
	this.key= "formFilters";
	this.userLogin= userLogin;
	this.upm = (typeof UserPreferencesManager != 'undefined'?new UserPreferencesManager(this.userLogin): null);
	this.filters= this.upm.get(this.key);//array
	if(!this.filters)
		this.filters=[];
};

FilterMannager.prototype._save=function(){
	this.upm.save(this.key,this.filters);
}

FilterMannager.prototype.addFilter=function(f){
	var idx= -1;
	if(f && f.id)
		idx= this.getFilterIndexById(f.id);
	
	if(idx == -1)
		idx= this.filters.length;
	this.filters[idx]= f;
	this._save();
}

FilterMannager.prototype.getFilterById= function(idFilter){
	var filter= null;
	for(var i=0; i<this.filters.length; i++){
		if(this.filters[i].id == idFilter){
			filter= this.filters[i];
			break;
		}
	}
	return filter;
}

FilterMannager.prototype.getFilterIndexById= function(idFilter){
	for(var i=0; i<this.filters.length; i++){
		if(this.filters[i].id == idFilter)
			return i;
	}
	return -1;
}

FilterMannager.prototype.getParms= function(idFilter){
	var filter= this.getFilterById(idFilter);
	if(!filter)
		return '';
	var attrs= filter.attributes;
	if(!attrs)
		return '';
	var s=''
	var vr= '';
	var vrAttr= '';
	for(var i=0; i< attrs.length; i++){
		if(s != '')
			s+='&';			
		vr= attrs[i].value;
		if( (typeof vr == 'array' || typeof vr == 'object')){
			for(var j=0; j< vr.length; j++){
				if(j > 0)
					s+='&';
				s+= attrs[i].name + '=' + escape(vr[j]);
			}
		}else{
			s+= attrs[i].name + '=' + escape(vr);	
		}
	}
	return s;
}

FilterMannager.prototype.getFilterValue= function(idFilter,nameAttribute){
	var filter= this.getFilterById(idFilter);
	if(!filter)
		return '';
	var attrs= filter.attributes;
	if(!attrs)
		return '';
	for(var i=0;i<attrs.length;i++){
		if(attrs[i].name == nameAttribute)
			return attrs[i].value;
	}
	return '';
}


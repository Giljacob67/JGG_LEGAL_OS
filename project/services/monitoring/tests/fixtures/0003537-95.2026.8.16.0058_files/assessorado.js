/*

@author mgob
*/

var AssessoradoController = function(userLogin, action, targetFrame){
	this.userLogin = userLogin;
	this.action = action;
	this.targetFrame = targetFrame;
	this.upm = new UserPreferencesManager(userLogin);//userPreferences
	return this;
}

/* Salva o assessorado (e área de atuação, se houver) selecionado pelo assessor nas preferências, para a lista de últimos visitados.*/
AssessoradoController.prototype.salvar = function(_login, _tipoAssessorado, _nome, _tipoAreaAtuacao, _codigoAreaAtuacao){
	if (_login == 'undefined' || _tipoAssessorado == 'undefined' || _nome == 'undefined')
		return;
	
	if (this.upm){
		var novoAssessorado = {
			login: _login,
			tipoAssessorado: _tipoAssessorado,
			nome: _nome,
			tipoAreaAtuacao: _tipoAreaAtuacao,
			codigoAreaAtuacao: _codigoAreaAtuacao
		};
		var assessorados = this.upm.get('assessoradosVisitados');//array
		if (assessorados && assessorados.length > 0){
			for (i=0; i<assessorados.length; i++){
				const assessorado = assessorados[i];
				if (assessorado.tipoAssessorado == novoAssessorado.tipoAssessorado && assessorado.login == novoAssessorado.login){
					if (assessorado.tipoAreaAtuacao != null){
						if (assessorado.tipoAreaAtuacao == novoAssessorado.tipoAreaAtuacao && assessorado.codigoAreaAtuacao == novoAssessorado.codigoAreaAtuacao){
							assessorados.splice(i, 1);//remove da lista para inserir novamente como primeiro elemento.
							break;
						}	
					}else {
						assessorados.splice(i, 1);//remove da lista para inserir novamente como primeiro elemento.
						break;
					}
				}
			}

			//Adiciona no começo
			//Mantém o array com no máximo os 5 últimos visitados, removendo o último elemento.
			if (assessorados.unshift(novoAssessorado) > 5)
				assessorados.pop();
			
		}else {
			assessorados = [novoAssessorado];
		}
		this.upm.save('assessoradosVisitados', assessorados);
	}
}

AssessoradoController.prototype.listarUltimosVisitados = function(listDiv){
	if (this.upm){// browser permite Web Storage (ver userPreferences.js)
		const assessorados = this.upm.get('assessoradosVisitados');//array
		if (assessorados && assessorados.length > 0){
			var containerDiv = listDiv.parentElement;
			containerDiv.style.display = '';
			var effectDiv = document.createElement('div');
			var ul = document.createElement('ul');
			for (i=0; i<assessorados.length; i++){
				const _assessorado = assessorados[i];
				var parameters = '&login='+_assessorado.login+'&tipoAssessorado='+_assessorado.tipoAssessorado;
				if (_assessorado.tipoAreaAtuacao != null)
					parameters += '&tipoAreaAtuacao='+_assessorado.tipoAreaAtuacao+'&codigoAreaAtuacao='+_assessorado.codigoAreaAtuacao;
				var li = document.createElement('li');
				li.className = (i%2 == 0 ? 'even' : 'odd');
				var link = document.createElement('a');
				link.setAttribute('href', this.action+parameters);
				link.setAttribute('target', this.targetFrame);
				link.setAttribute('title', _assessorado.nome);
				/*
				link.setAttribute('onclick', function(){
					this.salvar(_assessorado.login + ',' + _assessorado.tipoAssessorado + ',' + _assessorado.nome + ',' + _assessorado.tipoAreaAtuacao + ',' + _assessorado.codigoAreaAtuacao);
				});
				*/
				link.innerHTML = _assessorado.nome;
				li.appendChild(link);
				ul.appendChild(li);
			}
			effectDiv.appendChild(ul);
			listDiv.appendChild(effectDiv);
		}
	}
}

AssessoradoController.prototype.limparUltimosVisitados = function(divID){
	this.upm.clear('assessoradosVisitados');
	var div = document.getElementById(divID);
	div.parentNode.removeChild(div);
}

AssessoradoController.prototype.autocomplete = function(input, inputID, arr){
	/*Autocomplete com extensão para os métodos search e select */
	AutocompleteJS.prototype.search = function(val){
		for (i = 0; i < this.array.length; i++) {
			/* o item eh um JSON para assessorado com ou sem area de atuacao. deve verificar o nome do assessorado e o nome da area de atuacao */
			var item = this.array[i];
			var descricao = '';
			var startIdx = -1;

			if (item.areasAtuacao != null && item.areasAtuacao.length > 0){
				for (aidx = 0; aidx < item.areasAtuacao.length; aidx++){
					var areaAtuacao = item.areasAtuacao[aidx];
					descricao = item.nome + ' - ' + areaAtuacao.nome;
					if (descricao.toUpperCase().indexOf(val.toUpperCase()) != -1){
						startIdx = descricao.toUpperCase().indexOf(val.toUpperCase());
						var obj = item.login + "," + item.tipoAssessorado + "," + descricao + "," + areaAtuacao.tipoAreaAtuacao + "," + areaAtuacao.codigo + "," + areaAtuacao.nome;
						addOption(val, descricao, startIdx, obj);
					}
				}
			}else {
				if (item.nome.toUpperCase().indexOf(val.toUpperCase()) != -1){
					var obj = item.login + "," + item.tipoAssessorado + "," + item.nome;
					addOption(val, item.nome, item.nome.toUpperCase().indexOf(val.toUpperCase()), obj);
				}
			}
		}
	}

	AutocompleteJS.prototype.select = function(){
		const parent = this.inpID.parentElement;
		const a = this.inpID.value.split(",");
		var login = a[0];
		var tipo = a[1];
		var nome = a[2];
		var tipoArea = null;
		var codigoArea = null;
		var parameters = '&login='+login+'&tipoAssessorado='+tipo;
		
		if (a.length > 3){//tem área de atuação:
			tipoArea = a[3];
			codigoArea = a[4];
			parameters += '&tipoAreaAtuacao='+tipoArea+'&codigoAreaAtuacao='+codigoArea;
		}
		
		var link = document.createElement('a');
		link.setAttribute('target', this.controller.targetFrame);
		link.setAttribute('href', this.controller.action+parameters);
		parent.appendChild(link);
		link.click();
		parent.removeChild(link);
	}
	
	return new AutocompleteJS(input, inputID, arr, this);
}

var AssessoradoPromise = function(userLogin, action){
	var upm = new UserPreferencesManager(userLogin);//userPreferences
	var promise = new Promise(
		function (resolve, reject){
			var request = new XMLHttpRequest();
			request.open('GET', action);
			request.responseType = 'json';
			request.onload = function(){
				if(request.status == 200){
					resolve(request.response);
				}else {
					reject(Error('Assessorado logado nao foi obtida; error code: ' + request.statusText));
				}
			};
			request.onerror = function(){
				reject(Error('Erro de rede.'));
			};
			request.send();
		}
	);

	promise.then(
		function(response) {
			//_login, _tipoAssessorado, _nome, _tipoAreaAtuacao, _codigoAreaAtuacao
			var nome = response.nome, tipoAreaAtuacao, codigoAreaAtuacao;
			if (response.areasAtuacao != null && response.areasAtuacao.length > 0){
				nome += ' - ' + response.areasAtuacao[0].nome;
				tipoAreaAtuacao = response.areasAtuacao[0].tipoAreaAtuacao;
				codigoAreaAtuacao = response.areasAtuacao[0].codigo;
			}
			new AssessoradoController(userLogin, action, '').salvar(response.login, response.tipoAssessorado, nome, tipoAreaAtuacao, codigoAreaAtuacao);
		}, 
		function(Error) {
			console.log(Error);
		}
	);
}
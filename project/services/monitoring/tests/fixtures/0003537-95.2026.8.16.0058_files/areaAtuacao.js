/*

@author mgob
*/

var AreaAtuacaoController = function(userLogin, action, targetFrame){
	this.userLogin = userLogin;
	this.action = action;
	this.targetFrame = targetFrame;
	this.upm = new UserPreferencesManager(userLogin);//userPreferences
	return this;
}

/* */
AreaAtuacaoController.prototype.salvar = function(_codigo, _tipoAreaAtuacao, _nome){
	if (_codigo == 'undefined' || _tipoAreaAtuacao == 'undefined' || _nome == 'undefined')
		return;
	
	if (this.upm){
		var novaArea = {
			codigo: _codigo,
			tipoAreaAtuacao: _tipoAreaAtuacao,
			nome: _nome
		};
		var areasAtuacao = this.upm.get('areasAtuacaoVisitadas');//array
		if (areasAtuacao && areasAtuacao.length > 0){
			for (i=0; i<areasAtuacao.length; i++){
				const area = areasAtuacao[i];
				if (area.tipoAreaAtuacao == novaArea.tipoAreaAtuacao && area.codigo == novaArea.codigo){
					areasAtuacao.splice(i, 1);//remove da lista para inserir novamente como primeiro elemento.
					break;
				}
			}
			//Adiciona no começo
			//Mantém o array com no máximo as 5 últimas visitadas, removendo o último elemento.
			if (areasAtuacao.unshift(novaArea) > 5)
				areasAtuacao.pop();
			
		}else {
			areasAtuacao = [novaArea];
		}
		this.upm.save('areasAtuacaoVisitadas', areasAtuacao);
	}
}

AreaAtuacaoController.prototype.remover = function(area){
	if (area == 'undefined' || area == null)
		return;

	if (this.upm){
		var areasAtuacao = this.upm.get('areasAtuacaoVisitadas');//array
		if (areasAtuacao && areasAtuacao.length > 0){
			for (i=0; i<areasAtuacao.length; i++){
				const a = areasAtuacao[i];
				if (a.tipoAreaAtuacao == area.tipoAreaAtuacao && a.codigo == area.codigo){
					delete areasAtuacao[i];//remove da lista
					break;
				}
			}
		}
	}
}

AreaAtuacaoController.prototype.listarUltimosVisitados = function(listDiv){
	if (this.upm){// browser permite Web Storage (ver userPreferences.js)
		const areasAtuacao = this.upm.get('areasAtuacaoVisitadas');//array
		if (areasAtuacao && areasAtuacao.length > 0){
			var containerDiv = listDiv.parentElement;
			containerDiv.style.display = '';
			var effectDiv = document.createElement('div');
			var ul = document.createElement('ul');
			for (i=0; i<areasAtuacao.length; i++){
				const area = areasAtuacao[i];
				var parameters = '&codigo='+area.codigo+'&tipoAreaAtuacao='+area.tipoAreaAtuacao;
				var li = document.createElement('li');
				li.className = (i%2 == 0 ? 'even' : 'odd');
				var link = document.createElement('a');
				link.setAttribute('href', this.action+parameters);
				link.setAttribute('target', this.targetFrame);
				link.setAttribute('title', area.nome);
				/*
				link.setAttribute('onclick', function(){
					this.salvar(area.codigo + ',' + area.tipoAreaAtuacao + ',' + area.nome);
				});
				*/
				link.innerHTML = area.nome;
				li.appendChild(link);
				ul.appendChild(li);
			}
			effectDiv.appendChild(ul);
			listDiv.appendChild(effectDiv);
		}
	}
}

AreaAtuacaoController.prototype.limparUltimosVisitados = function(divID){
	this.upm.clear('areasAtuacaoVisitadas');
	var div = document.getElementById(divID);
	div.parentNode.removeChild(div);
}

AreaAtuacaoController.prototype.autocomplete = function(input, inputID, arr){
	/*Autocomplete com extensÃ£o para os mÃ©todos search e select */
    AutocompleteJS.prototype.search = function(val){
		for (i = 0; i < this.array.length; i++) {
			/* o item eh um JSON para area atuacao com ou sem area de atuacao. deve verificar o nome do area atuacao e o nome da area de atuacao */
			var item = this.array[i];
			var descricao = '';
			var startIdx = -1;

			if (item.subAreas != null && item.subAreas.length > 0){
				for (aidx = 0; aidx < item.subAreas.length; aidx++){
					var subArea = item.subAreas[aidx];
					descricao = item.nome + ' - ' + subArea.nome;
					if (descricao.toUpperCase().indexOf(val.toUpperCase()) != -1){
						startIdx = descricao.toUpperCase().indexOf(val.toUpperCase());
						var obj = subArea.codigo + "," + subArea.tipoAreaAtuacao + "," + descricao;
						addOption(val, descricao, startIdx, obj);
					}
				}
			}else {
				if (item.nome.toUpperCase().indexOf(val.toUpperCase()) != -1){
					var obj = item.codigo + "," + item.tipoAreaAtuacao + "," + item.nome;
					addOption(val, item.nome, item.nome.toUpperCase().indexOf(val.toUpperCase()), obj);
				}
			}
		}
	}

    AutocompleteJS.prototype.select = function(){
		const parent = this.inpID.parentElement;
		const a = this.inpID.value.split(",");
		var codigo = a[0];
		var tipo = a[1];
		var nome = a[2];
		var parameters = '&codigo='+codigo+'&tipoAreaAtuacao='+tipo;
		
		var link = document.createElement('a');
		link.setAttribute('target', this.controller.targetFrame);
		link.setAttribute('href', this.controller.action+parameters);
		parent.appendChild(link);
		link.click();
		parent.removeChild(link);
	}
	
	return new AutocompleteJS(input, inputID, arr, this);
}

var AreaAtuacaoPromise = function(userLogin, action){
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
					reject(Error('AreaAtuacao logada nao foi obtida; error code: ' + request.statusText));
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
			new AreaAtuacaoController(userLogin, action, '').salvar(response.codigo, response.tipoAreaAtuacao, response.nome);
		}, 
		function(Error) {
			console.log(Error);
		}
	);
}
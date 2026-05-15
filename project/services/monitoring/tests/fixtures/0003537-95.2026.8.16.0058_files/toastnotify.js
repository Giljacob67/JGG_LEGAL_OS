/*!
 * Toastnotify.js  http://pixmawebdesign.com/library/toastnotify/
 * Version - 1.2.1
 * Licensed under the MIT license - http://opensource.org/licenses/MIT
 * Copyright (c) 2019 Leonardo Manuel Alvarez
 */
(function (root, factory) {
    try {
        if (typeof module === "object" && module.exports) {
            module.exports = factory();
        } else {
            root.Toastnotify = factory();
        }
    } catch (error) {
        console.log(
            "Browser compatibility issues."
        );
    }
})(this, function (global) {
    if (document.readyState === "complete") {
        init();
    } else {
        window.addEventListener("DOMContentLoaded", init);
    }

    Toastnotify = {
        create:()=> {
            console.error(
                [
                    "Loading not finished.",
                    "\tCall creation methon when DOM readyState is finished."
                ].join("\n")
            );
        }
    };

    let autoincrement = 0;

    function init() {
        const container = document.createElement("div");
        container.id = "toastnotify-container";
        document.body.appendChild(container);

        Toastnotify.create = (options)=> {
            const toast = document.createElement("div");
            toast.id = ++autoincrement;
            toast.id = "toast-" + toast.id;
            if (options.animationIn) {
                toast.className = "toastnotify animated " + options.animationIn;
            } else {
                toast.className = "toastnotify animated fadeInLeft";
            }

            const containertoast = document.createElement("div");
            containertoast.className = "vh";
            toast.appendChild(containertoast);

            //image
            if (options.image) {
                const containerimage = document.createElement("span");
                containerimage.className = "b4cimg";
                containertoast.appendChild(containerimage);
                const img = document.createElement("img");
                img.src = options.image;
                img.className = "bAimg";
                containerimage.appendChild(img);
                if (options.important) {
                    const important = document.createElement("i");
                    important.className = "important";
                    containerimage.appendChild(important);
                }
            }

            //add icon
            if (options.icon) {
                const containericono = document.createElement("span");
                containericono.className = "b4cicon";
                containertoast.appendChild(containericono);
                const icono = document.createElement("i");
                icono.className = options.icon;
                containericono.appendChild(icono);
                if (options.important) {
                    const importanticon = document.createElement("i");
                    importanticon.className = "important";
                    containericono.appendChild(importanticon);
                }
            }

            // text description
            const p = document.createElement("span");
            p.className = "bAq";
            if (options.text) {
                p.innerHTML = options.text;
            } else {
                p.innerHTML = "Oi!";
            }
            containertoast.appendChild(p);

            const buttoncontainer = document.createElement("span");
            buttoncontainer.className = "bAo";
            containertoast.appendChild(buttoncontainer);

            //button ok

            if (typeof options.callbackOk === "function") {
                const buttonOK = document.createElement("span");
                if (options.buttonOk) {
                    buttonOK.innerHTML = options.buttonOk;
                } else {
                	buttonOK.innerHTML = options.okbutton;
                }
                buttonOK.className = "a8k";
                buttoncontainer.appendChild(buttonOK);

                buttonOK.addEventListener("click", (event)=> {
                    event.stopPropagation();
                    options.callbackOk.call(removeToastnotify());
                });
            }

            //button cancel

            if (typeof options.callbackCancel === "function") {
                const buttonCancel = document.createElement("span");
                if (options.buttonCancel) {
                    buttonCancel.innerHTML = options.buttonCancel;
                } else {
                    buttonCancel.innerHTML = options.cancelbutton;
                }
                buttonCancel.className = "a8k";
                buttoncontainer.appendChild(buttonCancel);

                buttonCancel.addEventListener("click", (event)=> {
                    event.stopPropagation();
                    options.callbackCancel.call(removeToastnotify());
                });
            }


			/*
            //button closse notification
            if (options.buttoncloseOpt) {
	            const contenedorClose = document.createElement("div");
	            contenedorClose.className = "bBe";
	            containertoast.appendChild(contenedorClose);
	
	            const buttonClose = document.createElement("div");
	            buttonClose.className = "bBf";
	            contenedorClose.appendChild(buttonClose);
	
	            contenedorClose.addEventListener("click", (event)=> {
	                event.stopPropagation();
	                removeToastnotify();
	            });
            }
			*/

            toast.hide = ()=> {
                if (options.animationIn) {
                    toast.classList.remove(options.animationIn);
                } else {
                    toast.classList.remove("fadeInLeft");
                }

                if (options.animationOut) {
                    toast.classList.add(options.animationOut);
                } else {
                    toast.classList.add("fadeOutLeft");
                }
                window.setTimeout( ()=> {
                    toast.remove();
                }, 2000);
            };

            // auto close
            if (options.duration) {
                window.setTimeout(toast.hide, options.duration);
            }

            if (options.rounded) {
                toast.className += " rounded";
            }

            if (options.type) {
                toast.className += " toastnotify-" + options.type;
            } else {
                toast.className += " toastnotify-default";
            }

            if (options.classes) {
                toast.className += " " + options.classes;
            }

            const removeToastnotify = ()=> {
                if (options.animationIn) {
                    toast.classList.remove(options.animationIn);
                } else {
                    toast.classList.remove("fadeInLeft");
                }

                if (options.animationOut) {
                    toast.classList.add(options.animationOut);
                } else {
                    toast.classList.add("fadeOutLeft");
                }
                window.setTimeout(
                    function () {
                        toast.remove();
                    }.bind(this),
                    1000
                );
            }

            document.getElementById("toastnotify-container").appendChild(toast);
            return toast;
        };
    }

    return Toastnotify;
});

function getContextPath() { if(myContextPath == '') { var b = document.URL; b = b.substr(b.indexOf('/', b.indexOf('//') + 2), b.indexOf('/', b.indexOf('/', b.indexOf('//') + 2) + 1)); myContextPath = b.substr(0, b.indexOf('/', 1)); } return myContextPath; }

function chamaAjaxTarefa(fileName, idObjeto, idTopico, idTarefa, url, funcRetorno) {
	http_request = false;
	if (window.XMLHttpRequest) { // Mozilla, Safari,...
		http_request = new XMLHttpRequest();
		if (http_request.overrideMimeType) {
			http_request.overrideMimeType('text/html');
		}
	} else if (window.ActiveXObject) { // IE
		try {
			http_request = new ActiveXObject("Msxml2.XMLHTTP");
		} catch (e) {
			try {
				http_request = new ActiveXObject("Microsoft.XMLHTTP");
			} catch (e) {}
		}
	}

	http_request.onreadystatechange = funcRetorno;
	http_request.open('POST', getContextPath() + url, true);
	http_request.setRequestHeader("Content-type", "application/x-www-form-urlencoded; charset=iso-8859-1");
	http_request.setRequestHeader("encoding", "ISO-8859-1");
	
	if (idObjeto == null) {
		idObjeto = -1;
	}
	
	if (idTopico == null) {
		idTopico = -1;
	}
	
	if (idTarefa == null) {
		idTarefa = -1;
	}
	
	if (fileName == null) {
		fileName = -1;
	}
	
	http_request.send('idObjeto='+ idObjeto +'&idTopico='+ idTopico+'&idTarefa='+ idTarefa+'&fileName='+ fileName);
}

function exibe_tarefas(idObjeto, idTopico) {
	chamaAjaxTarefa(null, idObjeto, idTopico, null, '/ajaxUtils.do?actionType=ajaxGetTarefasAssincronas', retorno_busca_tarefas);
}

function retorno_busca_tarefas() {
	if (http_request.readyState == 4) {
		if (http_request.status == 200) {
			if (http_request.responseText.length > 0) {
				new MensagemEvento(http_request.responseText);
			}
		}
		else {
			new MensagemErro('Erro de conex&atilde;o ('+http_request.status+')');
		}
	}
}

var MensagemEvento = function (objStr) {
	var obj = JSON.parse(objStr);
	for (var i = 0; i < obj.tarefas.length; i++) {
		if (obj.tarefas[i].status == "0") { // aguardando
			// a tarefa produziu um arquivo
			new MensagemDescartarTarefaAssincrona(obj.tarefas[i].mensagem, obj.tarefas[i].urlRemove);
		}
		else if (obj.tarefas[i].status == "1" || obj.tarefas[i].status == "5") { // concluido ou parcialmente concluido
			if (typeof obj.tarefas[i].url !== 'undefined') {
				// a tarefa produziu um arquivo
				new MensagemDownloadArquivoTarefaAssincrona(obj.tarefas[i].mensagem, obj.tarefas[i].url, obj.tarefas[i].urlRemove, obj.tarefas[i].fileName);
			}
			else {
				// nao houve arquivo
				new MensagemAlertaParaDispensa(obj.tarefas[i].mensagem, obj.tarefas[i].urlRemove);
			}
		}
		else {
			new MensagemAlertaApagaRegistro(obj.tarefas[i].mensagem, obj.tarefas[i].urlRemove);
		}
	}
}

function apaga_tarefa_MS(urlRemove) {
	// antes o proprio projudi apagava o arquivo.. agora, essa tarefa foi passada para o microsservico
	var http_request = new XMLHttpRequest();
	http_request.open('GET', urlRemove, true);
	//http_request.setRequestHeader('Accept', '*/*');
	//http_request.withCredentials = true;
    //http_request.setRequestHeader('Authorization', 'Bearer ' + token);

	http_request.onreadystatechange = function () {
		if (http_request.readyState == 4) {
			if (http_request.status == 200) {
				new MensagemAlerta("A solicita&ccedil;&atilde;o foi cancelada.");
			}
			else {
				new MensagemAlerta("Falhou para cancelar a solicita&ccedil;&atilde;o. Tente novamente mais tarde.");
			}
		}
	
	};
	http_request.send();
}

function retorno_apaga_tarefa() {
	if (http_request.readyState == 4) {
		if (http_request.status == 200) {
			if (http_request.responseText.length > 0) {
				var obj = JSON.parse(http_request.responseText); 
				if (obj.sucesso == "true") {
					new MensagemAlerta("A solicita&ccedil;&atilde;o foi cancelada.");
				}
				else {
					new MensagemAlerta("Falhou para cancelar a solicita&ccedil;&atilde;o. Contate o administrador do sistema." + obj.mensagem);
				}
			}
		}
		else {
			new MensagemErro('Erro de conex&atilde;o ('+http_request.status+')');
		}
	}
}

var MensagemTemporizada = function (mensagem, tempoMili) {
    Toastnotify.create({
        text: mensagem,
        type:'info',
        duration: tempoMili
    });
}

var MensagemErro = function (mensagem) {
	Toastnotify.create({
	    text: mensagem,
	    type:'danger',
	    buttoncloseOpt: true,
	    duration: 5000,
	    okbutton: 'Ok',
	    callbackOk: function() {
	    }
	});
}

function temToastIgual(mensagem) {
	var toast_container = document.getElementById('toastnotify-container');
	if(toast_container) {
		var toasts = toast_container.getElementsByClassName('bAq')
		if(toasts && toasts.length > 0) {
			var div = document.createElement("div");
			div.innerHTML = mensagem;

			var txtMensagem = div.innerText.replaceAll('\t', '').replaceAll('\n', '').replaceAll(' ', '');
			for(var toast of toasts) {
				if(toast.innerText.replaceAll('\t', '').replaceAll('\n', '').replaceAll(' ', '') == txtMensagem) {
					return true;
				}
			}
		}
	}
	return false;
}

var MensagemDownloadArquivoTarefaAssincrona = function (mensagem, url, urlRemove, fileName) {

	//Vamos verificar antes se ja existe alguma mensagem igual na tela para nao mostrar novamente
	if(temToastIgual(mensagem)) {
		return;
	}
	
    Toastnotify.create({
        text: mensagem,
        type:'success',
        okbutton: 'Download',
        cancelbutton: 'Descartar',
        buttoncloseOpt: true,
        callbackOk: function() {
        
			download_file(url, '0', fileName);
			
			/*
			AGUARDANDO definição da DIS
			
			const keycloak = Keycloak({
			    url: document.getElementById("keycloakAuthServerUrl").value,
			    realm: document.getElementById("keycloakTjprRealm").value,
				clientId: document.getElementById("keycloakClientId").value
			});
 
			var silentSSOUri = window.location.origin + getContextPath() + '/html/silent-check-sso.html';
			keycloak.init({onLoad: 'check-sso', silentCheckSsoRedirectUri: silentSSOUri}).then(function(authenticated) {
				if (authenticated) {
					download_file(url, keycloak.token, fileName);
				}
				else {
					new MensagemErro('Ocorreu algum erro com a autoriza&ccedil;&atilde;o do download do arquivo.');
					//getTokenAndDownload(url, fileName);
				}
            }).catch(function() {
				console.log("2. Ocorreu algum erro para iniciar keycloak.");
				new MensagemErro('Ocorreu algum erro com a autoriza&ccedil;&atilde;o do download do arquivo.');
			});
			*/
        },
        callbackCancel: function() {
        	/*
			AGUARDANDO definição da DIS
			keycloak
			*/
			
			apaga_tarefa_MS(urlRemove);
        }
    });
}

function getTokenAndDownload(url, fileName) {
	http_request = false;
	if (window.XMLHttpRequest) { // Mozilla, Safari,...
		http_request = new XMLHttpRequest();
		if (http_request.overrideMimeType) {
			http_request.overrideMimeType('text/html');
		}
	}
	else if (window.ActiveXObject) { // IE
		try {
			http_request = new ActiveXObject("Msxml2.XMLHTTP");
		}
		catch (e) {
			try {
				http_request = new ActiveXObject("Microsoft.XMLHTTP");
			}
			catch (e) {
				new MensagemErro('Ocorreu algum erro com a autoriza&ccedil;&atilde;o da a&ccedil;&atilde;o.');
			}
		}
	}

	http_request.onload = function() {
		if (http_request.responseText != null && http_request.responseText != '') {
			download_file(url, http_request.responseText, fileName); // passando o token
		}
		else {
			new MensagemErro('Ocorreu algum problema com a autoriza&ccedil;&atilde;o para donwload.');
		}
	};
	
	http_request.open('POST', getContextPath() + '/ajaxUtils.do?actionType=getToken', true);
	http_request.setRequestHeader("Content-type", "application/x-www-form-urlencoded; charset=iso-8859-1");
	http_request.setRequestHeader("encoding", "ISO-8859-1");
	http_request.send();
}

function download_file(url, token, fileName) {
	var http_request = new XMLHttpRequest();
	http_request.open('GET', url, true);
	//http_request.setRequestHeader('Accept', '*/*');
	//http_request.withCredentials = true;
    //http_request.setRequestHeader('Authorization', 'Bearer ' + token);
	http_request.responseType = 'blob';
	http_request.onreadystatechange = function () {
		if (http_request.readyState == 4) {
			if (http_request.status == 200) {
				saveBlob(http_request.response, fileName);
			}
			else {
				new MensagemErro('Erro de conex&atilde;o ('+http_request.status+')');
			}
		}
	
	};
	http_request.send();
}

function saveBlob(blob, fileName) {
	var file = new Blob([blob], { type : 'application/octet-stream' });
	if (window.navigator && window.navigator.msSaveOrOpenBlob) { // IE
        window.navigator.msSaveOrOpenBlob(file);
    }
	else {
		var a = document.createElement('a');
        a.href = window.URL.createObjectURL(file);
		a.download = fileName;
		a.dispatchEvent(new MouseEvent('click'));
    }
}

var MensagemDescartarTarefaAssincrona = function (mensagem, url) {
	Toastnotify.create({
        text: mensagem,
        type:'warning',
        duration: 6000,
        cancelbutton: 'Interromper',
        buttoncloseOpt: true,
        callbackCancel: function() {
        	apaga_tarefa_MS(url);
        }
    });
}

var MensagemAlerta = function (mensagem) {
    Toastnotify.create({
        text: mensagem,
        type:'warning',
        duration: 8000,
        okbutton: 'Ok',
        callbackOk: function() {
        	// apenas fecha o toast
        }
    });
}

var MensagemAlertaParaDispensa = function (mensagem, url) {
    Toastnotify.create({
        text: mensagem,
        type:'success',
        duration: 10000,
        okbutton: 'Ok',
		cancelbutton: 'Interromper',
        callbackOk: function() {
        	// apenas fecha o toast
        },
		callbackCancel: function() {
        	apaga_tarefa_MS(url);
        }
    });
}

var MensagemAlertaApagaRegistro = function (mensagem, url) {
    Toastnotify.create({
        text: mensagem,
        type:'warning',
        duration: 8000,
        okbutton: 'Ok',
        callbackOk: function() {
        	apaga_tarefa_MS(url);
        }
    });
}

// exibe um botao para visualizar e a acao deste botao e direcionar para uma URL
var MensagemBotaoVisualizar = function (mensagem, framename, url) {
    Toastnotify.create({
        text: mensagem,
        type:'info',
        duration: 20000,
        buttoncloseOpt: true,
        okbutton: 'Visualizar',
        callbackOk: function() {
        	document.getElementsByName(framename)[0].src = url;
        }
    });
}


function getSelected(selectId){
    let select = document.getElementById(selectId);
    if (select.children.length == 1){
        return select.children[0].value;
    }else {
        for (i=0;i<select.children.length;i++){
            if (select.children[i].selected){
                return select.children[i].value;
            }
        }
    }
}

function updateCompetencias(codComarca, view){
    let target = document.getElementById('codTipoCompetencia');
    let codTipoCompetencia;
    let url = './metasCNJv2.do?actionType=ajaxListaCompetenciaByComarca';
    let xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            let data = this.response;
            target.innerHTML = '';
            for (i=0;i<data.length;i++){
                let option = data[i];
                let o = document.createElement('option');
                o.value = option.valor;
                o.innerHTML = option.descricao;
                target.append(o);
                if (i == 0) codTipoCompetencia = option.valor;
            }

            updateVaras(codTipoCompetencia, view);
        }
    };
    xhr.open('GET', url+'&codComarca='+codComarca);
    xhr.responseType = 'json';
    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xhr.send('&rid=' + Math.random());
}

function updateVaras(codTipoCompetencia, view){
    let target = document.getElementById('codVara');
    let url = './metasCNJv2.do?actionType=ajaxListaVaraByComarcaCompetencia';
    const codComarca = getSelected('codComarca');
    let codVara;
    let xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            let data = this.response;
            target.innerHTML = '';
            for (i=0;i<data.length;i++){
                let option = data[i];
                let o = document.createElement('option');
                o.value = option.valor;
                o.innerHTML = option.descricao;
                target.append(o);
                if (i==0) codVara = option.valor;
            }
            if (view == 'ANALITICO')
                updateMetasAnalitico();
            else
                updateMetas();
        }
    };
    xhr.open('GET', url+'&codComarca='+codComarca+'&codTipoCompetencia='+codTipoCompetencia);
    xhr.responseType = 'json';
    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xhr.send('&rid=' + Math.random());
}

function updateMetas() {
    let ano = getSelected('ano');
    let codVara = getSelected('codVara');
    console.log('updateMetas(), codVara = '+ codVara);
    let url = './metasCNJv2.do?actionType=visualizar';
    let target = document.getElementById('metas');

    /*
    fetch(url+'&codVara='+codVara+'&ano='+ano)
        .then(function (response){
            target.innerHTML = response.text();
        })
        .catch(function (error) {
            log('Erro ao atualizar Metas', error);
        });

     */

    let xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
        if (this.readyState != 4 && this.status != 200) {
            showLoader();
        } else if (this.readyState == 4 && this.status == 200) {
            target.innerHTML = this.responseText;
            medirDesempenhoVara(codVara, ano);
        }
    };
    xhr.open('GET', url+'&ano='+ano+'&codVara='+codVara);
    xhr.responseType = 'text';
    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xhr.send('&rid=' + Math.random());
}

function updateMetasAnalitico(){
    let ano = getSelected('ano');
    let codVara = getSelected('codVara');
    let meta = getSelected('meta');
    console.log('updateMetasAnalitico(), codVara = '+ codVara);
    let url = './metasCNJv2.do?actionType=ajaxMetasAplicaveis';
    let target = document.getElementById('meta');

    let xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            let data = this.response;
            target.innerHTML = '';
            let manterSelecionada = false;
            for (i=0;i<data.length;i++){
                let option = data[i];
                let o = document.createElement('option');
                o.value = option.valor;
                o.innerHTML = option.descricao;
                target.append(o);
                if (o.value == meta)
                    manterSelecionada = true;
            }
            if (manterSelecionada)
                target.value = meta;//mantem a meta selecionada previamente, se existir.

            obsolete();
        }
    };
    xhr.open('GET', url+'&ano='+ano+'&codVara='+codVara);
    xhr.responseType = 'json';
    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xhr.send('&rid=' + Math.random());
}

function updateIndicadoresAnalitico() {
    let ano = getSelected('ano');
    let meta = getSelected('meta');
    let indicador = getSelected('indicador');
    console.log('updateIndicadoresAnalitico(), meta = ' + meta + '/' + ano);
    let url = './metasCNJv2.do?actionType=ajaxIndicadoresAplicaveis';
    let target = document.getElementById('indicador');

    let xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            let data = this.response;
            target.innerHTML = '';
            let manterSelecionada = false;
            for (i=0;i<data.length;i++){
                let option = data[i];
                let o = document.createElement('option');
                o.value = option.valor;
                o.innerHTML = option.descricao;
                target.append(o);
                if (o.value == indicador)
                    manterSelecionada = true;
            }
            if (manterSelecionada)
                target.value = indicador;//mantem a meta selecionada previamente, se existir.

            obsolete();
        }
    };
    xhr.open('GET', url+'&ano='+ano+'&meta='+meta);
    xhr.responseType = 'json';
    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xhr.send('&rid=' + Math.random());
}

function togglePanelMedirDesempenho(containerID, img, loaderID, panelID, meta, ano){
    let container = document.getElementById(containerID);
    if (container.style.display){
        showPanel(containerID, img);
        medirDesempenho(loaderID, panelID, meta, ano);
    }else {
        hidePanel(containerID, img);
    }
}

function medirDesempenho(loaderID, panelID, meta, ano){
    let codVara = getSelected('codVara');

    let loader = document.getElementById(loaderID);
    let panel = document.getElementById(panelID);

    let request = new XMLHttpRequest();
    let url = './metasCNJv2.do?actionType=ajaxMedirDesempenho';
    request.onreadystatechange = function () {
        if (this.readyState != 4 && this.status != 200){
            loader.style.display = '';
            panel.style.display = 'none';
        }else if (this.readyState == 4 && this.status == 200){
            loader.style.display = 'none';
            panel.style.display = '';
            updateDesempenhoMeta(this.response);
        }
    }
    request.onerror = function () {
        //TODO mgob tratar erro com mensagem na tela e retry
        console.log('Erro de rede:' + this.statusText);
    }
    request.open('GET', url+'&meta='+meta+'&ano='+ano+'&codVara='+codVara);
    request.responseType = 'json';
    request.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    request.send('&rid=' + Math.random());
}

function medirDesempenhoVara(codVara, ano){
    let xhr = new XMLHttpRequest();
    let url = './metasCNJv2.do?actionType=ajaxMedirDesempenhoVara';
    xhr.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200){
            let desempenhoList = this.response;
            for (let i=0;i<desempenhoList.length;i++) {
                let desempenho = desempenhoList[i];
                updateDesempenhoMeta(desempenho);
            }
        }
    }
    xhr.onerror = function () {
        //TODO mgob tratar erro com mensagem na tela e retry
        console.log('Erro de rede:' + this.statusText);
    }
    xhr.open('GET', url+'&ano='+ano+'&codVara='+codVara);
    xhr.responseType = 'json';
    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xhr.send('&rid=' + Math.random());
}

function updateDesempenhoMeta(desempenho){
    let meta = desempenho.meta;
    if (!document.getElementById('desempenhoMeta'+meta))
        return;

    //Se não tiver pendente e o percentual de cumprimento for 0%, colocar não se aplica

    document.getElementById('loadingMeta'+meta).style.display = 'none';

    if (!desempenho.aplicada){
        document.getElementById('enunciado'+meta).style.display = 'none';
        document.getElementById('naoSeAplica'+meta).style.display = '';
        document.getElementById('toggleIcon'+meta).style.display = 'none';
        document.getElementById('title'+meta).style.backgroundColor = 'gray';
        return;
    }

    document.getElementById('desempenhoMeta'+meta).style.display = '';
    document.getElementById('informacoesGerais'+meta).style.display = '';

    //Percentual e indicativo de cumprimento
    let percentual = document.getElementById('percentual'+meta);
    if (desempenho.cumprida == true)
        percentual.className += ' status-meta-cnj-cumprida';
    else
        percentual.className += ' status-meta-cnj-nao-cumprida';
    percentual.lastElementChild.innerHTML = desempenho.percentualCumprimentoFormatado+'%';

    let resultados = desempenho.resultados;
    for (let i=0; i < resultados.length; i++) {
        let r = resultados[i];
        let span = document.getElementById(r.nome + meta);
        if (span == null) continue;
        span.lastElementChild.innerHTML = r.valor;
        if (r.nome == 'pendentes' && r.valor > 0)
            span.className += ' status-meta-cnj-atencao';
        if (r.nome == 'saldoPendentes' && r.valor > 0 && !desempenho.cumprida)
            span.className += ' status-meta-cnj-atencao';
    }
}

function listarProcessos(meta, indicador){
    let vara = getSelected('codVara');
    let ano = getSelected('ano');
    let url = './metasCNJv2.do?actionType=listar';
    document.metasCNJForm.action = url + '&ano='+ano + '&meta='+meta + '&codVara='+vara + '&indicador='+indicador;
    document.metasCNJForm.submit();
}

function exportarAnalitico(url){
    let vara = getSelected('codVara');
    let meta = getSelected('meta');
    let ano = getSelected('ano');
    let indicador = getSelected('indicador');
    let metasCNJSortColumn = document.metasCNJForm['metasCNJSortColumn'].value;
    let metasCNJSortOrder = document.metasCNJForm['metasCNJSortOrder'].value;
    let metasCNJSortComparator = document.metasCNJForm['metasCNJSortComparator'].value;
    window.location = url+'&codVara='+vara+'&meta='+meta+'&ano='+ano+'&indicador='+indicador+'&metasCNJSortColumn='+metasCNJSortColumn+'&metasCNJSortOrder='+metasCNJSortOrder+'&metasCNJSortComparator='+metasCNJSortComparator;
    //document.metasCNJForm.action = url+'&codVara='+vara+'&meta='+meta+'&ano='+ano+'&indicador='+indicador;
    //document.metasCNJForm.submit();
}

function exportarQuestionario(url) {
    let vara = getSelected('codVara');
    let ano = getSelected('ano');
    window.location = url+'&codVara='+vara+'&ano='+ano;
}

function visualizarEnquadramento(meta, url, title){
    let vara = getSelected('codVara');
    let ano = getSelected('ano');
    openSubmitDialog(url+'&codVara='+vara+'&meta='+meta+'&ano='+ano+'&rd='+Math.random(), title, 0, 0);
}

function showLoader(){
    let metas = document.getElementById('metas');
    metas.innerHTML = '';
    metas.innerHTML = '<div style=\"width: 100%; text-align: center;\"><img src="' + getContextPath() + '/img/themes/olive/loader.gif" alt="Aguarde..." style=\"width: 50px;\" \></div>';
}

function showError(msg){
    let metas = document.getElementById('metas');
    metas.innerHTML = '';
    metas.innerHTML = '<div style=\"width: 100%; text-align: center;\">'+msg+'</div>';
}

function showPanel(containerID,img){
    img.src = img.src.replace('Plus','Minus');
    new Effect.SlideDown(containerID,{ duration: 0.5 });
}

function hidePanel(containerID, img){
    img.src = img.src.replace('Minus','Plus');
    new Effect.SlideUp(containerID,{ duration: 0.5 });
}

function togglePanel(containerID, img){
    let container = document.getElementById(containerID);
    if (container == null)
        return;

    if (container.style.display)
        showPanel(containerID, img);
    else
        hidePanel(containerID, img);
}

function obsolete() {
    document.getElementById("result").className += " meta-cnj-obsolete";
}
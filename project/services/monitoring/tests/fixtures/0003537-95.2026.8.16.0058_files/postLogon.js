/*

@author mgob
*/

/* Expande ou recolhe um item da lista, alternando a imagem entre '+' e '-'. */
function toggleDetail(containerID, img){
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

/* Expande todos os itens da lista. */
function expandAll(){
	var ul_array = document.querySelectorAll('li');
	for (i = 0; i < ul_array.length; i++) {
		const element = ul_array[i];
		if (element.children[0] instanceof HTMLImageElement){
			element.children[0].click();
		}
	}
}
/* 

@author mgob
*/

const minchars = 1;

var AutocompleteJS = function(inp, inpID, arr, controller){
    this.inp = inp;
    this.inpID = inpID;
    this.array = arr;
    this.controller = controller;
    const _auto = this;
    var currentFocus;
    var a;

    inp.addEventListener("input", function(e) {
        var b, i, selected, val = this.value;
        closeAllLists();
        if (!val || val.length < minchars) { return false;}//min 3 caracters
        currentFocus = -1;
        a = document.createElement("DIV");
        a.setAttribute("id", this.id + "autocomplete-list");
        a.setAttribute("class", "autocomplete-items");
        this.parentNode.appendChild(a);
        
        _auto.search(val);
    });

    inp.addEventListener("keydown", function(e) {
        var x = document.getElementById(this.id + "autocomplete-list");
        if (x) x = x.getElementsByTagName("div");
        if (e.keyCode == 40) {
          currentFocus++;
          addActive(x);
        } else if (e.keyCode == 38) { //up
          currentFocus--;
          addActive(x);
        } else if (e.keyCode == 13) {
          e.preventDefault();
          if (currentFocus > -1) {
            if (x) x[currentFocus].click();
          }
        }
    });

    inp.addEventListener("click", function(e) {
      inp.select();
    });

    addOption = function(val, descricao, startIdx, obj){
        b = document.createElement("DIV");
        b.innerHTML = descricao.substr(0,startIdx) + "<strong>" + descricao.substr(startIdx, val.length) + "</strong>";
        b.innerHTML += descricao.substr(startIdx+val.length);
        
        b.innerHTML += "<input type='hidden' value='" + descricao + "'>";//TODO id??
        
        b.addEventListener("click", function(e) {
            inp.value = this.getElementsByTagName("input")[0].value;
            inpID.value = obj;
            closeAllLists();
            return _auto.select();
        });
        a.appendChild(b);
    }

    addActive = function(x) {
        if (!x) return false;
        removeActive(x);
        if (currentFocus >= x.length) currentFocus = 0;
        if (currentFocus < 0) currentFocus = (x.length - 1);
        x[currentFocus].classList.add("autocomplete-active");
    }

    removeActive = function(x) {
        for (var i = 0; i < x.length; i++) {
            x[i].classList.remove("autocomplete-active");
        }
    }

    closeAllLists = function(elmnt) {
        var x = document.getElementsByClassName("autocomplete-items");
        for (var i = 0; i < x.length; i++) {
            if (elmnt != x[i] && elmnt != inp) {
                x[i].parentNode.removeChild(x[i]);
            }
        }
    }

    document.addEventListener("click", function (e) {
        closeAllLists(e.target);
    });
}
AutocompleteJS.prototype.search = function(val){
    //should be implemented on the controller
}

AutocompleteJS.prototype.select = function(){
    //should be implemented on the controller
}
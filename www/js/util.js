define(function(require) {
    var clickEvent = 'ontouchstart' in window ? 'touchstart' : 'click';

    function ajax(method, url, params, success) {
        if(typeof params == 'function') {
            success = params;
            params = null;
        }

        var ajax = new XMLHttpRequest();

        ajax.onreadystatechange = function() {
            if(ajax.readyState == 4 && ajax.status == 200) {
                success(ajax.responseText);
            }
        };

        if(params) {
            var arr = [];
            for(var k in params) {
                arr.push(k + '=' + encodeURIComponent(params[k]));
            }
            params = arr.join('&');
        }

        ajax.open(method, url, true);

        if(method == 'POST') {
            ajax.setRequestHeader('Content-type',
                                  'application/x-www-form-urlencoded');
        }

        ajax.send(params);
    }

    function getElement(id) {
        return document.getElementById(id);
    }

    function getElements(q) {
        return Array.prototype.slice.call(
            document.querySelectorAll(q)
        );
    }

    function isArray(obj) {
        return Object.prototype.toString.call(obj) == '[object Array]';
    }

    function addClass(el, cls) {
        if(el.className.indexOf(cls) === -1) {
            el.className += ' ' + cls;
        }
    }

    function removeClass(el, cls) {
        el.className = el.className.replace(cls, '');
    }

    return {
        clickEvent: clickEvent,
        ajax: ajax,
        getElement: getElement,
        getElements: getElements,
        isArray: isArray,
        addClass: addClass,
        removeClass: removeClass
    };
});

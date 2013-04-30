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

    return {
        clickEvent: clickEvent,
        ajax: ajax
    };
});

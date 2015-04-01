// ==UserScript==
// @name         Star Thumbnail Expando
// @resource     STYLE  https://rawgit.com/MadaraUchiha/star-thumn/master/style.css
// @version      0.1
// @match        *://chat.stackexchange.com
// @match        *://chat.stackoverflow.com
// @match        *://chat.meta.stackexchange.com
// @grant        GM_addStyle
// @grant        GM_getResourceText
// ==/UserScript==

(function(){window.addEventListener('load', function() {
    'use strict';

    var cssTxt  = GM_getResourceText ("STYLE");
    GM_addStyle (cssTxt);


    var stars = document.getElementById('starred-posts');
    var thumbs = document.createElement('div');
    thumbs.id = 'thumbs';
    stars.appendChild(thumbs);

    function xhr(url, method, data) {
        data = data || {};
        method = method || "GET";

        var serialize = function(obj) {
            return Object.keys(obj).map(function(key) {
                return key + '=' + obj[key];
            }).join('&');
        };
        return new Promise(function(resolve, reject) {
            var req = new XMLHttpRequest();
            req.onload = function() { resolve(req.responseText); };
            req.onerror = reject;

            req.open(method, url);

            if (method !== 'GET') {
                req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
            }
            req.setRequestHeader('X-Requested-With', 'XMLHttpRequest');

            req.send(serialize(data));
        });
    }

    function isOnebox(msgId) {
        return xhr('/message/' + msgId, 'POST', {plain: true})
            .then(function(response) {
                //          vvvvvvvvvvvvvv just URL vvvvvvvvvvvvvvv vvvvvvvvvvvvvvvvv just linked image vvvvvvvvvvvvvvvvv
                return /^(?:!?https?:\/\/[^ ]+\.(?:jpg|png|gif|svn)|\[[^]]+\]\(!?https?:\/\/[^ ]+\.(?:jpg|png|gif|svn)\))$/.test(response);
            });
    }

    function isLiOnebox(li) {
        return isOnebox(li.id.replace('summary_', ''));
    }


    function toThumbnail(li) {
        // Purely so that the current scripts won't break!
        var newLi = document.createElement('li');
        newLi.id = li.id;

        var figure = document.createElement('figure');

        var imgA = li.querySelector('a').cloneNode(true);
        var starSpan = li.querySelector('span').cloneNode(true);

        var img = new Image();
        img.src = imgA.href;

        if (!imgA.href.includes(imgA.textContent)) { imgA.title = imgA.textContent; }
        imgA.textContent = '';

        imgA.appendChild(img);
        figure.appendChild(imgA);
        figure.appendChild(starSpan);

        newLi.appendChild(figure);

        return newLi;
    }

    function emptyElement(node) {
        while (node.firstChild) {
            node.removeChild(node.firstChild);
        }
    }

    function renderAllThumbnails() {
        console.info('RENDERING EVERYTHING');
        emptyElement(thumbs);

        var thumbnailWorthy = [].filter.call(stars.querySelectorAll('a'), function justThoseWithImageLinks(link) {
            return /(?:jpg|png|gif|svn)$/.test(link.href);
        })
        .map(function getParent(link) {
            return link.parentNode;
        });
        Promise.all(thumbnailWorthy)
            .then(function(thumbnailWorthyArray) {
                return thumbnailWorthyArray.filter(isLiOnebox);
            })
            .then(function prepareGround(confirmedThumbnails) {
                confirmedThumbnails.forEach(function(li) {
                    li.classList.add('hidden');
                });
                return confirmedThumbnails;
            })
            .then(function(confirmedThumbnails) {
                return confirmedThumbnails.map(toThumbnail);
            })
            .then(function(images) {
                images.forEach(thumbs.appendChild.bind(thumbs));
            })
            .then(console.info.bind(console));
    }

    (new MutationObserver(renderAllThumbnails))
        .observe(stars.parentNode, {childList: true, subTree: true, characterData: true, attributes: true});

    setTimeout(renderAllThumbnails, 0);

});})();
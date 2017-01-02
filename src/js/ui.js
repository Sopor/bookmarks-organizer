'use strict';

const elBody = document.querySelector('body');
const elButton = document.querySelector('button');
const elResults = document.getElementById('results');
const elTotalBookmarks = document.getElementById('totalBookmarks');
const elCheckedBookmarks = document.getElementById('checkedBookmarks');
const elBookmarksErrors = document.getElementById('bookmarksErrors');
const elBookmarksWarnings = document.getElementById('bookmarksWarnings');
const elUnknownBookmarks = document.getElementById('unknownBookmarks');
const elProgress = document.getElementById('progress');

const ui = {
  bookmarks : [],

  execute : function () {
    browser.runtime.sendMessage({ 'message' : 'execute' });
  },

  handleResponse : function (response) {
    if (response.message === 'add-result') {
      let bookmark = response.bookmark;

      browser.bookmarks.get(bookmark.parentId).then((parentBookmark) => {
        bookmark.parentTitle = parentBookmark[0].title;
        ui.bookmarks.push(bookmark);
      });
    } else if (response.message === 'total-bookmarks') {
      elTotalBookmarks.innerText = response.total_bookmarks;
    } else if (response.message === 'update-counters') {
      elCheckedBookmarks.innerText = response.checked_bookmarks;
      elBookmarksErrors.innerText = response.bookmarks_errors;
      elBookmarksWarnings.innerText = response.bookmarks_warnings;
      elUnknownBookmarks.innerText = response.unknown_bookmarks;
      elProgress.setAttribute('value', response.progress);
    } else if (response.message === 'finished') {
      ui.bookmarks.sort(ui.sort(['parentTitle', 'title']));
      ui.showBookmarks();
    }
  },

  sort : function (fields) {
    return (a, b) => fields.map(obj => {
        let returnValue = 1;

        if (obj[0] === '-') {
          returnValue = -1;
          obj = obj.substring(1);
        }

        return a[obj] > b[obj] ? returnValue : a[obj] < b[obj] ? -(returnValue) : 0;
    }).reduce((a, b) => a ? a : b, 0);
  },

  showBookmarks : function () {
    for (let bookmark of ui.bookmarks) {
      const template = document.getElementById('result-template').content.cloneNode(true);

      const elWrapper = template.querySelector('.wrapper');
      elWrapper.parentNode.id = bookmark.id;

      const elNameText = document.createTextNode(bookmark.title);
      const elName = template.querySelector('.name');
      elName.appendChild(elNameText);

      const elUrlText = document.createTextNode(bookmark.url);
      const elUrl = template.querySelector('.url');
      elUrl.appendChild(elUrlText);
      elUrl.setAttribute('href', bookmark.url);
      elUrl.setAttribute('target', '_blank');
      elUrl.setAttribute('rel', 'noopener');

      const elLocationText = document.createTextNode('Lesezeichen-Ort: ' + bookmark.parentTitle);
      const elLocation = template.querySelector('.location');
      elLocation.appendChild(elLocationText);

      const elStatus = template.querySelector('.status');

      if (bookmark.status == 901) {
        const elStatusText = document.createTextNode('Status: Weiterleitung');
        elStatus.appendChild(elStatusText);
        elWrapper.className += ' warning';
      } else if (bookmark.status === 999) {
        const elStatusText = document.createTextNode('Status: unbekannt');
        elStatus.appendChild(elStatusText);
      } else {
        const elStatusText = document.createTextNode('Status: ' + bookmark.status);
        elStatus.appendChild(elStatusText);
        elWrapper.className += ' error';
      }

      if (bookmark.newUrl) {
        const elNewUrlText = document.createTextNode('Neue URL: ' + bookmark.newUrl);
        const elNewUrl = template.querySelector('.newUrl');
        elNewUrl.appendChild(elNewUrlText);
        elNewUrl.setAttribute('href', bookmark.newUrl);
        elNewUrl.setAttribute('target', '_blank');
        elNewUrl.setAttribute('rel', 'noopener');
      }

      const elRemoveButton = template.querySelector('.remove');
      elRemoveButton.setAttribute('data-id', bookmark.id);

      elResults.appendChild(template);
    }
  },

  removeBookmark : function (e) {
    if (e.target.tagName.toLowerCase() === 'a' && e.target.className === 'remove') {
      e.preventDefault();

      let bookmarkId = e.target.getAttribute('data-id');
      document.getElementById(bookmarkId).style.display = 'none';
      browser.bookmarks.remove(bookmarkId);
    }
  }
};

elButton.addEventListener('click', ui.execute);
elBody.addEventListener('click', ui.removeBookmark);

browser.runtime.onMessage.addListener(ui.handleResponse);

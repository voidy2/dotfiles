let self = liberator.plugins.greader = (function() {
  // COMMAND /////////////////////////////////////////////////////// {{{
  commands.addUserCommand(
    ["gr[eaderstarreditemopen]"],
    "Open Google Reader starred item",
    function(args) {
      let gapi = new GoogleApiController()
      let stars = new Stars(gapi);
      let items = stars.items();

      if (!items || items.length == 0) {
        liberator.echo("starred item doesn't exists.");
        return;
      }
      if (args.string == "") {
        let star;
        let max = (args.count >= 1) ? args.count : openItemsCount();
        for(let i = 0; i < max; i++) {
          if (!(star = stars.shift()))
            break;
          setTimeout(function(link) liberator.open(link, openBehavior()), 100 * i, star.link);
        }
      }
      else {
        liberator.open(args.string, openBehavior());
        stars.remove(args.string);
      }
    },
    {
      literal: 0,
      count: true,
      completer: function(context) {
        context.format = {
            anchored: true,
            title: ["TITLE & URL","SOURCE"],
            keys: {
                text: "url",
                title:"title",
                sourceTitle: "sourceTitle",
            },
            process: [templateTitleAndUrl,templateSourceTitle]
        };
        context.completions = generateCandidates();
    },
    options: [
      ]
    },
    true
  );
  // }}}
  // GLOBAL VARIABLES ////////////////////////////////////////////// {{{
  var gv = liberator.globalVariables;

  function openBehavior()
    window.eval(gv.pinoOpenBehavior) || liberator.NEW_BACKGROUND_TAB;

  function openItemsCount()
    gv.greaderOpenItemsCount || 5;

  function viewItemsCount()
    gv.greaderViewItemsCount || 10;

  function getGreaderUserId()
    gv.greaderUserId || new GoogleApiController().user_id();

  // }}}
  // CLASS ///////////////////////////////////////////////////////// {{{
  function GoogleApiController() {
    this.cache_token = null;
    this.cache_userid = null;
  }
  GoogleApiController.prototype = {
    token : function(){
      if( !this.cache_token )
        this.cache_token = this._getToken();
      return this.cache_token;
    },
    user_id : function() {
      if( !this.cache_userid ){
        this.cache_userid = this._getUserId();
      }
      return this.cache_userid;
    },
    _getUserId : function() {
      var result = null;
      var request = new libly.Request(
          "http://www.google.co.jp/reader/view/",
          null,
          {
            asynchronous: false,
          }
      );

      request.addEventListener("onSuccess", function(data) {
        var src = data.responseText;
        var reg = src.match(/_USER_ID = "([0-9]+)",$/m);
        if(reg != null){
          result = reg[1];
        }
      });
      request.addEventListener("onFailure", function(data) {
        liberator.echoerr("Failure: Can't get user_id");
      });
      request.get();

      return result;
    },
    _getToken : function() {
      var result = null;
      var request = new libly.Request(
          "http://www.google.com/reader/api/0/token",
          null,
          {
            asynchronous: false,
          }
      );

      request.addEventListener("onSuccess", function(data) {
        result = data.responseText;
        //liberator.log(result,-1);
      });
      request.addEventListener("onFailure", function(data) {
        liberator.echoerr("Failure: Can't get token");
      });
      request.get();
      return result;
    },
  }
  function Stars(gapi) {
    this.cache_items = null;
    this.gapi = gapi;
  }
  Stars.prototype = {
    items : function() {
      let result = this.cache_items
              ? this.cache_items
              : this.cache_items = this._getStarredItems();
      return result;
    },
    _getStarredItems : function() {
       var result = null;
       var request = new libly.Request(
           "http://www.google.com/reader/atom/user/-/state/com.google/starred?n=" + viewItemsCount(),
           null,
           {
             asynchronous: false,
           }
       );

       request.addEventListener("onSuccess", function(data) {
         var response = data.responseText;
         //firefox bug 336551
         response = response.replace(/^<\?xml\s+version\s*=\s*(["'])[^\1]+\1[^?]*\?>/,"");
         //名前空間を取り除く
         response = response.replace(/(xmlns=".*")/,"");
         var e4x = new XML(response);
         //liberator.log(e4x.entry[0].id,-1);
         var entrys = e4x.entry;
         if ( entrys.length != 0 ) {
            result = [];
         } else {
            return [];
         }
         for each (var e in entrys ) {
            var entry = {
              author : e.author.name.toString(),
              published : e.published.toString(),
              link : e.link.@href.toString(),
              title : e.title.toString(),
              id : e.id.toString(),
              source_title : e.source.title.toString(),
              source_link : e.source.link.@href.toString(),
            }
            result.push(entry);
         }
       });
       request.addEventListener("onFailure", function(data) {
         liberator.echoerr("Can't get pinned list!!!");
       });
       request.get();
       return result;
    },
    shift : function() {
      if (this.items().length == 0)
        return null;
      var star = this.items().shift();
      this._remove(star.id);
      return star;
    },
    remove : function(url) {
      entry_id = this.getEntryId(url);
      liberator.log(entry_id,-1);
      this._remove(entry_id);
    },
    _remove : function(entry_id) {
      var request = new libly.Request(
        "http://www.google.com/reader/api/0/" + "edit-tag" + "?client=contact:myname-at-gmail",
        null,
        {
          postBody: toQuery({
            i : entry_id,
            r : "user/" + this.gapi.user_id() + "/state/com.google/starred",
            T : this.gapi.token(),
            async : "false",
          })
        }
      );
      request.addEventListener("onSuccess", function(data) {
        liberator.log("Removed star from '" + entry_id + "' was succeeded.");
      });
      request.addEventListener("onFailure", function(data) {
        liberator.echoerr("Cannot remove star");
      });
      request.post();
    },
    getEntryId : function(url) {
      var items = this.items();
      for each( var e in  items) {
        if(e.link == url)
          return e.id;
      }
      return null;
    }
  }
  //}}}
  function parseAtom(sXML) {
    var resultText = atomTitle = atomLink = atomText = "";
    var itemList = sXML.getElementsByTagName("entry");
    for (var i=0; i<itemList.length; i++) {
      atomTitle = itemList[i].getElementsByTagName("title")[0].childNodes[0].nodeValue;
      atomLink = itemList[i].getElementsByTagName("link")[0].getAttribute("href");
      try {
        atomText = itemList[i].getElementsByTagName("summary")[0].childNodes[0].nodeValue;
      }catch(e){
        atomText = ""
      }
      resultText += '<a href="'+atomLink+'">'+atomTitle+'</a><div class="desc">'+atomText+'</div>';
    }
    return resultText;
  }
  
  function templateTitleAndUrl(obj) {
        return <>
            <img src={getFaviconURI(obj.item.url + '/')} />
            <span class="td-strut"/>{obj.item.title}
            <a href={obj.item.url} highlight="simpleURL">
              <span class="extra-info">{obj.item.url.replace(/^https?:\/\//, '')}</span>
            </a>
        </>;
  }
  function templateSourceTitle(obj) {
      return obj.item.sourceTitle;
  }
  /**
  * Get candidates list
  * @return [{"url": "(url)", "title": "hogehoge", "sourceTitle": "hogefuga"}, ... ]
  */
  function generateCandidates() {
    let allEntries = [];
    let stars = new Stars();
    let items = stars.items();
    for each (var e in items){
        var entries = {
            "url" : e.link,
            "title" : e.title,
            "sourceTitle" : e.source_title,
        }
        allEntries = allEntries.concat(entries);
    }
    return allEntries;
  }
  let showCompletions = function() {
       if (!options.get('wildoptions').has('auto')) {
           evalWithContext(function() {
               completions.complete(true, false);
               completions.itemList.show();
           }, commandline.input);
       }
   };
  // UTILITY //
  let getFaviconURI = (function() {
        let faviconCache = {};

        return function (pageURI) {
            if (faviconCache[pageURI])
                return faviconCache[pageURI];

            let uri = Cc["@mozilla.org/network/io-service;1"]
                    .getService(Ci.nsIIOService)
                    .newURI(pageURI, null, null);
            let faviconURI = Cc["@mozilla.org/browser/favicon-service;1"]
                    .getService(Ci.nsIFaviconService)
                    .getFaviconImageForPage(uri);
            return faviconCache[pageURI] = faviconURI.spec;
        }
    })();
  function toQuery(source)
      [encodeURIComponent(i) + "=" + encodeURIComponent(source[i])
          for (i in source)
      ].join('&');
  
})();

// vim: ts=2 sw=2 et fdm=marker

// PLUGIN_INFO//{{{
var PLUGIN_INFO =
<VimperatorPlugin>
  <name>{NAME}</name>
  <description>Open Google Reader starred items</description>
  <description lang="ja">Google Reader でスターを付けたページを開く</description>
  <author mail="y2.void@gmail.com" homepage="http://d.hatena.ne.jp/voidy21/">voidy21</author>
  <version>0.1.1</version>
  <minVersion>2.2pre</minVersion>
  <maxVersion>2.2pre</maxVersion>
  <updateURL>http://github.com/voidy21/dotfiles/raw/master/.vimperator/plugin/greader.js</updateURL>
  <require type="plugin">_libly.js</require>
  <detail><![CDATA[
   == Subject ==
    Open Google Reader starred items.

   == Needs Library ==
    - _libly.js(ver.0.1.23)
    @see http://coderepos.org/share/browser/lang/javascript/vimperator-plugins/trunk/_libly.js

   == Commands ==
    :[count]gr[eader]

   == Global variables ==
    g:greaderOpenItemsCount:
      default: 5

    g:greaderViewItemsCount:
      default: 20

    g:greaderOpenBehavior:
      default: liberator.NEW_BACKGROUND_TAB

    g:greaderStarRemoveEnable:
      default: "true"

   == API ==
    plugins.greader.items():
      Return starred items list array.
      Each item is following structure.
      >||
      {
        author : (page author),
        created_on : (create date),
        link : (url),
        title : (page title),
        id : (page item_id in Google Reader. e.g. tag:google.com,2005:reader/item/~~),
        source_title : (source rss feed title),
        source_link : (source rss feed link),
        category : (page category)
      }
      ||<

    plugins.greader.shift():
      Return first item and remove star.

    plugins.greader.remove(link):
      Remove star from item that matched by 'link'.

  ]]></detail>
  <detail lang="ja"><![CDATA[
    == 概要 ==
      Google Reader でスターを付けた記事をVimperatorのコマンドラインから開く
      ことができます。

    == コマンド ==
    :[count]gr[eader]:
      そのまま<Enter>で先頭のn件（デフォルト5件、グローバル変数で調整可能）
      をバックグラウンドのタブで開きます。
      <TAB>で補完候補の一覧にスターを付けた記事の一覧から選択することもできます。
      count を指定すると、その件数だけ開きます。

    == グローバル変数 ==
    g:greaderOpenItemsCount:
      一度に開くスター付き記事の数
      default: 5

    g:greaderViewItemsCount:
      補完候補の一覧に表示されるスター付き記事の数
      default: 20

    g:greaderOpenBehavior:
      スター付き記事を開くときの挙動、liberator.open()の第2引数として使用する値
      参考）http://wiki.livedoor.jp/shin_yan/d/liberator%282%2e0%29#content_34
      default: liberator.NEW_BACKGROUND_TAB

    g:greaderStarRemoveEnable:
      スター付き記事を開くときにスターを外すかどうか
      plugins.greader.remove(link)は動く
      default: "true"

    == API ==
    plugins.greader.items():
      スターの付いた記事の一覧を配列で取得する。
      データ構造は以下のとおりです。
      >||
      {
        author : (記事の著者),
        created_on : (日時),
        link : (記事のURL),
        title : (記事のタイトル),
        id : (Google Reader内部で使用されているitem_id。 例 tag:google.com,2005:reader/item/~~),
        source_title : (記事のネタ元のRSSfeedのタイトル),
        source_link : (記事のネタ元のRSSfeedのURL),
        category : (記事の種類)
      }
      ||<

    plugins.greader.shift():
      先頭のスター付き記事を取得して、そのスターを一覧から削除する。

    plugins.greader.remove(link):
      linkに該当するスターを一覧から削除する。
      ただし、最新のスターからg:greaderViewItemsCountで指定した数(デフォルトでは20)までしか辿らないので注意。

    == TODO ==
      - タグ指定で読めるようにする
      - 未読か既読か決められるようにする
  ]]></detail>
</VimperatorPlugin>;
//}}}
let self = liberator.plugins.greader = (function() {
  // COMMAND /////////////////////////////////////////////////////// {{{
  commands.addUserCommand(
    ["gr[eader]"],
    "Open Google Reader starred items",
    function(args) {
      var stars = new Stars();
      var items = stars.items();

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
          liberator.open(star.link, openBehavior());
        }
        return;
      }
      else {
        liberator.open(args.string, openBehavior());
        setTimeout(function(e_id) { stars.removeId(e_id)}, 10 , stars.getEntryId(args.string));
        return;
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
        context.completions = generateCandidates(false);
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
    window.eval(gv.greaderOpenBehavior) || liberator.NEW_BACKGROUND_TAB;

  function openItemsCount()
    gv.greaderOpenItemsCount || 5;

  function viewItemsCount()
    gv.greaderViewItemsCount || 20;

  // }}}
  // CLASS ///////////////////////////////////////////////////////// {{{
  function GoogleApiController() {
    this.cache_token = null;
    this.URI_PREFIXE_READER = 'http://www.google.com/reader/';
    this.URI_PREFIXE_ATOM = this.URI_PREFIXE_READER + 'atom/';
    this.URI_PREFIXE_API = this.URI_PREFIXE_READER + 'api/0/';
    this.URI_PREFIXE_VIEW = this.URI_PREFIXE_READER + 'view/';
    this.ATOM_PREFIXE_USER = 'user/-/';
    this.ATOM_PREFIXE_LABEL = this.ATOM_PREFIXE_USER + 'label/';
    this.ATOM_PREFIXE_STATE_GOOGLE = this.ATOM_PREFIXE_USER + 'state/com.google/';
    this.ATOM_STATE_READ = this.ATOM_PREFIXE_STATE_GOOGLE + 'read';
    this.ATOM_STATE_READING_LIST = this.ATOM_PREFIXE_STATE_GOOGLE + 'reading-list';
    this.ATOM_STATE_STARRED = this.ATOM_PREFIXE_STATE_GOOGLE + 'starred';
  }
  GoogleApiController.prototype = {
    token : function(){
      if( !this.cache_token )
        this.cache_token = this._getToken();
      return this.cache_token;
    },

    userId : function() {
      return this._getUserId();
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
        this.URI_PREFIXE_API + "token",
        null,
        {
          asynchronous: false,
        }
      );
      request.addEventListener("onSuccess", function(data) {
        result = data.responseText;
      });
      request.addEventListener("onFailure", function(data) {
        liberator.echoerr("Failure: Can't get token");
      });
      request.get();
      return result;
    },
    getFeed : function(label) {
       var result = null;
       var feedUri = this.URI_PREFIXE_ATOM;
       if( label == "_get_starred_item" )
         feedUri += this.ATOM_STATE_STARRED;
       else if( label != undefined )
         feedUri += this.ATOM_PREFIXE_LABEL + escape(label);
       else
         feedUri += this.ATOM_STATE_READING_LIST;

       var request = new libly.Request(
         feedUri + "?n=" + viewItemsCount(),
         null,
         {
           asynchronous: false,
         }
       );

       request.addEventListener("onSuccess", function(data) {
         var response = data.responseText;
         if ( response.substr(0,6) == "<html>" ){
             liberator.echoerr("google Web login required",-1);
             return;
         }
         //firefox bug 336551
         response = response.replace(/^<\?xml\s+version\s*=\s*(["'])[^\1]+\1[^?]*\?>/,"");
         //名前空間を取り除く
         response = response.replace(/(xmlns=".*")/,"");
         var e4x = new XML(response);
         var entrys = e4x.entry;
         if ( entrys.length != 0 ) {
            result = [];
         } else {
            return [];
         }
         for each (var e in entrys ) {
            var entry = {
              author : e.author.name.toString(),
              created_on : e.created_on.toString(),
              link : e.link.@href.toString(),
              title : e.title.toString(),
              id : e.id.toString(),
              source_title : e.source.title.toString(),
              source_link : e.source.link.@href.toString(),
              category : e.category.@term.toSource(),
            }
            result.push(entry);
         }
       });
       request.addEventListener("onFailure", function(data) {
         liberator.echoerr("Can't get starred list!!!");
       });
       request.get();
       return result;
    },
}

  function Stars() {
    this.cache_items = null;
    this.gapi = new GoogleApiController();
    this.isRemoveEnable =
      liberator.globalVariables.greaderStarRemoveEnable != undefined ?
      window.eval(liberator.globalVariables.greaderStarRemoveEnable) : true;
  }

  Stars.prototype = {
    items : function() {
      let result = this.cache_items
                 ? this.cache_items
                 : this.cache_items = this._getStarredItems();
      return result;
    },
    _getStarredItems : function() {
      return this.gapi.getFeed("_get_starred_item");
    },

    getTagItems : function(label) {
      return this.gapi.getFeed(label);
    },

    shift : function() {
      if (this.items().length == 0)
        return null;
      var star = this.items().shift();
      this.removeId(star.id);
      return star;
    },

    remove : function(url) {
      entry_id = this.getEntryId(url);
      this.removeId(entry_id,true);
    },

    removeId : function(entry_id, isRemove) {
      if( !this.isRemoveEnable && isRemove == undefined )
        return;
      var request = new libly.Request(
        "http://www.google.com/reader/api/0/" + "edit-tag" + "?client=contact:myname-at-gmail",
        null,
        {
          postBody: toQuery({
            i : entry_id,
            r : "user/" + getGreaderUserId() + "/state/com.google/starred",
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
  // FUNCTIONS ///////////////////////////////////////////////////// {{{
  function getGreaderUserId(){
    if(!liberator.plugins.greader_id)
      liberator.plugins.greader_id = (new GoogleApiController()).userId();
    return liberator.plugins.greader_id;
  }

  function templateTitleAndUrl(obj) {
    return <>
      <img src={'http://favicon.hatena.ne.jp/?url=' + obj.item.url} />
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
  function generateCandidates(isUnreadFilter) {
    let allEntries = [];
    let stars = new Stars();
    let items = stars.items();
    if( isUnreadFilter )
        items = filterUnReadEntry(items);
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

  function filterUnReadEntry(items){
    var result = [];
    for each(item in items){
      if( item.category.indexOf("read\"",0) > 0)
        result.push(item);
    }
    return result;
  }

  function toQuery(source)
    [encodeURIComponent(i) + "=" + encodeURIComponent(source[i])
      for (i in source)
    ].join('&');

  //}}}
  // API /////////////////////////////////////////////////////////// {{{
  return {
    items : function()
      (new Stars()).items(),

    shift : function()
      (new Stars()).shift(),

    remove : function(link)
      (new Stars()).remove(link),
  };
  // }}}

})();
// vim: ts=2 sw=2 et fdm=marker

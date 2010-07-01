// PLUGIN_INFO//{{{
var PLUGIN_INFO =
<VimperatorPlugin>
  <name>{NAME}</name>
  <description>Open Google Reader starred items</description>
  <description lang="ja">Google Reader でスターを付けたページを開く</description>
  <author mail="y2.void@gmail.com" homepage="http://d.hatena.ne.jp/voidy21/">voidy21</author>
  <version>0.3.0</version>
  <minVersion>2.2pre</minVersion>
  <maxVersion>2.4pre</maxVersion>
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
    :gr[label]

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

    :grl[abel] :
      このコマンドはラベル指定によって未読の記事をバッググラウンドのタブで開きます。
      まずGoogleReaderのラベルを補完候補から<TAB>で選び、スペースキーで空白を入力します。
      するとさらにラベルが付いた記事の一覧のURLの補完候補が出てくるので、<TAB>で選び
      <Enter>で決定します。
      また、-allitemオプションによって既読の記事も表示させることができます。
      さらに、XUL/Migemo拡張を使用している場合、ラベルについてはMigemo補完が可能です。

    == グローバル変数 ==
    g:greaderOpenItemsCount:
      一度に開くスター付き記事の数
      default: 5

    g:greaderViewItemsCount:
      補完候補の一覧に表示される記事の数
      default: 20

    g:greaderOpenBehavior:
      記事を開くときの挙動、liberator.open()の第2引数として使用する値
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

    == ChangeLog ==
      - 0.3.0
      -- まとめて開く際はBarTabで蓋をするようにした
      - 0.2.0
      -- ラベル指定で記事を読めるようにした

    == TODO ==
      - 指定したURLのGoogleReaderのフィード登録を出来るようにする
  ]]></detail>
</VimperatorPlugin>;
//}}}
let self = liberator.plugins.greader = (function() {
  // FOR MIGEMO EXTENTION ////////////////////////////////////////////// {{{

  try{
    var XMigemoCore = Components
      .classes['@piro.sakura.ne.jp/xmigemo/factory;1']
      .getService(Components.interfaces.pIXMigemoFactory)
      .getService("ja");
  }catch(ex){
    var XMigemoCore = undefined;
  }

  // }}}
  // COMMAND /////////////////////////////////////////////////////// {{{
  commands.addUserCommand(
    ["gr[eader]"],
    "Open Google Reader starred items",
    function(args) {
      let stars = new Stars();
      let items = stars.items();
      if (!items || items.length == 0) {
        liberator.echo("starred item doesn't exists.");
        return;
      }
      if (args.string == "") {
        let star;
        let max = (args.count >= 1) ? args.count : openItemsCount();
        let index = tabs.index(tabs.getTab());
        for(let i = 0; i < max; ++i) {
          if (!(star = stars.shift()))
            break;
          liberator.open(star.link, openBehavior());
          gBrowser.BarTabHandler.unloadTab(tabs.getTab(index+i+1));
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
          anchored: false,
          title: ["TITLE & URL","SOURCE"],
          keys: {
            text: "url",
            title:"title",
            sourceTitle: "sourceTitle",
          },
          process: [templateTitleAndUrl,templateSourceTitle]
        };
        context.completions = generateCandidates(false,(new Stars()).items());
      },
      options: [
      ]
    },
    true
  );
  commands.addUserCommand(
    ["grl[abel]"],
    "view Google Reader select label feed",
    function(args) {
      let gapi = new GoogleApiController();
      if (args.string == "") {
        return;
      } else {
        if( args[0].indexOf("http://",0) != 0 )
          return;
        liberator.open(args[0], openBehavior());
        setTimeout(function() { gapi.setReadUrl(args[0],comp_tag) }, 10 );
        return;
      }
    },
    {
      literal: 0,
      count: false,
      completer: function(context, args) {
        let filter = context.filter;
        let gapi = new GoogleApiController();
        let labels = gapi.getLabels();
        if ( filter.match("] ") == null ){
          let match_result = filter.match(/((?:\[[^\]]*\])+)?\[?(.*)/); //[all, commited, now inputting]
          let m = new RegExp(XMigemoCore ? "^(" + XMigemoCore.getRegExp(match_result[2]) + ")"
                                         : "^" + match_result[2],'i');
          let completionList = [];
          labels.forEach(function(label){
            if(m.test(label)){
              completionList.push(["[" + label + "]","Google Reader Label"]);
            }
          });
          context.title = ['Label','Description'];
          context.completions = completionList;
        } else {
          comp_tag = context.filter.match(/\[(.*)\]/)[1];
          context.filter = filter.replace("[" + comp_tag + "]","");
          context.format = {
            anchored: true,
            title: ["TITLE & URL (Label : " + comp_tag + ")","SOURCE"],
            keys: {
              text: "url",
              title:"title",
              sourceTitle: "sourceTitle",
            },
            process: [templateTitleAndUrl,templateSourceTitle]
          };
          let isViewUnreadItem = args["-allitem"] ? false : true;
          context.completions = generateCandidates(isViewUnreadItem,gapi.getFeed(comp_tag));
        }
      },
      options: [
        //[['-unread', '-u'], commands.OPTION_NOARG],
        [['-allitem', '-a'], commands.OPTION_NOARG],
      ]
    },
    true
  );
  // }}}
  // GLOBAL VARIABLES ////////////////////////////////////////////// {{{
  let gv = liberator.globalVariables;

  function openBehavior()
    window.eval(gv.greaderOpenBehavior) || liberator.NEW_BACKGROUND_TAB;

  function openItemsCount()
    gv.greaderOpenItemsCount || 5;

  function viewItemsCount()
    gv.greaderViewItemsCount || 20;

  let comp_tag = null;

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
    this.API_LIST_TAG = 'tag/list';
    this.API_EDIT_TAG = 'edit-tag';
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
      let result = null;
      let request = new libly.Request(
        "http://www.google.co.jp/reader/view/",
        null,
        {
          asynchronous: false,
        }
      );
      request.addEventListener("onSuccess", function(data) {
        let src = data.responseText;
        let reg = src.match(/_USER_ID = "([0-9]+)",$/m);
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
      let result = null;
      let request = new libly.Request(
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

    getLabels : function() {
      let result = [];
      let request = new libly.Request(
        this.URI_PREFIXE_API + this.API_LIST_TAG,
        null,
        {
          asynchronous: false,
        }
      );
      request.addEventListener("onSuccess", function(data) {
        let response = data.responseText;
        let e4x = new XML(response);
        let lists = e4x.list.object.string.(@name=="id");
        for each (let e in lists ) {
          let str = e.toString();
          if ( str.indexOf("state/com.",0) < 0 )
            result.push(str.slice(32,str.length));
         }
      });
      request.addEventListener("onFailure", function(data) {
        liberator.echoerr("Failure: Can't get token");
      });
      request.get();
      return result;
    },

    edit_api : function(postArgs) {
      let request = new libly.Request(
        this.URI_PREFIXE_API + this.API_EDIT_TAG,
        null,
        {
          postBody: toQuery(postArgs)
        }
      );
      request.addEventListener("onFailure", function(data) {
        liberator.echoerr("Cannot request post!");
      });
      request.post();
    },

    getFeed : function(label) {
       let result = null;
       let feedUri = this.URI_PREFIXE_ATOM;
       if( label == "_get_starred_item" )
         feedUri += this.ATOM_STATE_STARRED;
       else if( label != undefined )
         feedUri += this.ATOM_PREFIXE_LABEL + escape(label);
       else
         feedUri += this.ATOM_STATE_READING_LIST;

       let request = new libly.Request(
         feedUri + "?n=" + (viewItemsCount() + 40),
         null,
         {
           asynchronous: false,
         }
       );

       request.addEventListener("onSuccess", function(data) {
         let response = data.responseText;
         if ( response.substr(0,6) == "<html>" ){
             liberator.echoerr("google Web login required",-1);
             return;
         }
         //firefox bug 336551
         response = response.replace(/^<\?xml\s+version\s*=\s*(["'])[^\1]+\1[^?]*\?>/,"");
         //名前空間を取り除く
         response = response.replace(/(xmlns=".*")/,"");
         let e4x = new XML(response);
         let entrys = e4x.entry;
         if ( entrys.length != 0 ) {
            result = [];
         } else {
            return [];
         }
         for (let n = 0,len = viewItemsCount(); n < len; ++n ) {
            e = entrys[n];
            let entry = {
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

    setReadId : function(entry_id) {
      this.edit_api({
        i : entry_id,
        a : "user/" + getGreaderUserId() + "/state/com.google/read",
        T : this.token(),
        async : "false",
      });
    },

    setReadUrl : function(url,label) {
      let items = this.getFeed(label);
      for each( let e in  items) {
        if(e.link == url)
          this.setReadId(e.id);
      }
    }
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
      let star = this.items().shift();
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
      this.gapi.edit_api({
        i : entry_id,
        r : "user/" + getGreaderUserId() + "/state/com.google/starred",
        T : this.gapi.token(),
        async : "false",
      });
    },

    getEntryId : function(url) {
      let items = this.items();
      for each( let e in  items) {
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
  function generateCandidates(isUnreadFilter,items) {
    let allEntries = [];
    let _items = items;
    if( isUnreadFilter )
      _items = filterUnReadEntry(items);
    for each ( let e in _items ){
      let entries = {
        "url" : e.link,
        "title" : e.title,
        "sourceTitle" : e.source_title,
      }
      allEntries = allEntries.concat(entries);
    }
    return allEntries;
  }

  function filterUnReadEntry(items){
    let result = [];
    for each(item in items){
      if( item.category.indexOf('read\"',0) < 0){
        result.push(item);
      }
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

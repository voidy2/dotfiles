(function(){
  let libly = liberator.plugins.libly;
  let $U = libly.$U;
  let gv = liberator.globalVariables;
  function openBehavior()
    liberator.eval(gv.feedSelectorOpenBehavior) || liberator.NEW_BACKGROUND_TAB;

  function getFeedUrl() {
    let feeds = [];
    let doc = window.content.document;
    for (let link in util.evaluateXPath(["link[@href and (@rel='feed' or (@rel='alternate' and @type))]"], doc)) {
      let rel = link.rel.toLowerCase();
      let feed = { title: link.title, href: link.href, type: link.type || "" };
      if(feedTypes[feed.type] == ("RSS"||"Atom")){
        feeds.push(feed.href);
      }
    }
    return feeds;
  }

  function loadFeed(url){
    let result = [];
    let request = new libly.Request(
      url,
      null,
      {
        asynchronous: false,
      }
    );
    request.addEventListener("onSuccess", function(data) {
      let response = data.responseText;
      //firefox bug 336551
      response = response.replace(/^<\?xml\s+version\s*=\s*(["'])[^\1]+\1[^?]*\?>/,"");
      //名前空間を取り除く
      response = response.replace(/(xmlns=".*")/,"");
      //ここで上手くいかなくて処理が止まることがある #bug
      let e4x = new XML(response);
      let item_list = e4x.item;
      for each ( let e in item_list ) {
        let title = e.title.toString();
        let link = e.link;
        result.push([link,title]);
      }
    });
    request.addEventListener("onFailure", function(data) {
      liberator.echoerr("Failure: cannot load..");
    });
    request.get();
    return result;
  }

  function templateTitleAndUrl(title,url) {
    return <>
      <img src={'http://favicon.hatena.ne.jp/?url=' + url} />
      <span class="td-strut"/>{title}
      <a href={url} highlight="simpleURL">
        <span class="extra-info">{url.replace(/^https?:\/\//, '')}</span>
      </a>
    </>;
  }

  const feedTypes = {
    "application/rss+xml": "RSS",
    "application/atom+xml": "Atom",
    "text/xml": "XML",
    "application/xml": "XML",
    "application/rdf+xml": "XML"
  };

  commands.addUserCommand(
    ["feeds[elect]"],
    "feed selector",
    function(args) {
      liberator.open(args.string, openBehavior());
    },
    {
      literal: 0,
      count: false,
      completer: function(context, args) {
        let filter = context.filter;
        if( filter.match("\S? ") == null ){
          let feeds = getFeedUrl();
          let completionList = [];
          feeds.forEach(function(feed){
              completionList.push([feed,"RSS Feed"]);
          });
          context.title = ['RSS Feed URL'];
          context.completions = completionList;
        } else {
          context.filter = "";
          let url = filter.replace(" ","");
          context.title = ['Link and Title in RSS Feed'];
          context.completions = loadFeed(url);
        }
      },
      options: []
    },
    true
  );
})();
// vim:sw=2 ts=2 et si fdm=marker:

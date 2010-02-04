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

  function templateTitleAndUrl(obj) {
    return <>
      <img src={'http://favicon.hatena.ne.jp/?url=' + obj.item.url} />
      <span class="td-strut"/>{obj.item.title}
      <a href={obj.item.url} highlight="simpleURL">
        <span class="extra-info">{obj.item.url.replace(/^https?:\/\//, '')}</span>
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
        let feeds = getFeedUrl();
        let completionList = [];
        feeds.forEach(function(feed){
            completionList.push([feed,"RSS Feed"]);
        });
        context.title = ['RSS Feed URL'];
        context.completions = completionList;
      },
      options: []
    },
    true
  );
})();
// vim:sw=2 ts=2 et si fdm=marker:

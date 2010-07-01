/*
 * BarTab integration - Vimperator Plugin
 *
 * Commands:
 *  :tap          tap the current tab
 *  :tap #        tap the previous seleced tab
 *  :tap {num}:?  tap the {num}-th tab
 *  :tap!         tap all tabs without the current tab
 *
 *    Tab Completion is available !!
 *
 * Completion:
 *  overwrite completion.buffer and urlCompleter
 *  these can search title or url even if the tab is tapped
 *
 *  So, buffer command and urlCompleter ("t" in 'complete' option)
 *  are completable.
 *
 * Other:
 *  overwrite tabs.get method.
 */

let originalBufferCompletion = completion.buffer;
let originalBufferURLComplter = completion.urlCompleters.t;
let originalTabsGet = tabs.get;

completion.buffer = barTap_bufferCompletion;
completion.addUrlCompleter("t", "Open tabs (+BarTabGlue)", completion.buffer);
tabs.get = tabsGet;

function barTap_bufferCompletion (context) {
  context.anchored = false;
  context.title = ["Buffer", "URL"];
  context.keys = { text: "text", description: "url", icon: "icon" };
  context.compare = CompletionContext.Sort.number;
  let process = context.process[0];
  context.process = [function (item, text) <>
    <span highlight="Indicator" style="display: inline-block; width: 2em; text-align: center">{item.item.indicator}</span>
    { process.call(this, item, text) }
  </>];
  context.completions = util.map(util.Array.iteritems(gBrowser.mTabs), function ([i, browser]) {
    let indicator = " ";
    let ontap = browser.hasAttribute("ontap");
    if (i == tabs.index())
     indicator = "%"
    else if (i == tabs.index(tabs.alternate))
     indicator = "#";

    indicator = (ontap ? "*" : " ") + indicator;

    let tab = tabs.getTab(i);
    let url = ontap ? browser.linkedBrowser.userTypedValue : browser.linkedBrowser.contentDocument.location.href;
    i = i + 1;

    return {
      text: [i + ": " + (tab.label || "(Untitled)"), i + ": " + url],
      url:  template.highlightURL(url),
      indicator: indicator,
      icon: tab.image || DEFAULT_FAVICON,
      ontap: ontap
    };
  });
}

function tabsGet () {
  let buffers = [];
  let tabbrowser = getBrowser();
  for (let i=0, len=tabbrowser.mTabs.length; i<len; i++){
    let tab = tabbrowser.mTabs[i];
    let browser = tab.linkedBrowser;
    let title = tab.label || "(Untitled)";
    let uri = browser.hasAttribute("ontap") ? browser.userTypedValue : browser.currentURI.spec;
    let number = i + 1;
    buffers.push([number, title, uri]);
  }
  return buffers;
}

function tap (arg, isAll) {
  let tab;
  let tabbrowser = getBrowser();
  if (isAll) {
    for (let i=0, len= tabbrowser.mTabs.length; i<len; i++) {
      let tab = tabbrowser.mTabs[i];
      if (tab != tabbrowser.mCurrentTab && !tab.hasAttribute("ontap"))
        gBrowser.BarTabHandler.unloadTab(tab);
    }
  } else if (!arg) {
    gBrowser.BarTabHandler.unloadTab(tabs.getTab());
  } else if (arg == "#") {
    gBrowser.BarTabHandler.unloadTab(tabs.alternate);
  } else {
    let matches = arg.match(/^(\d+):?/);
    if (matches) {
      gBrowser.BarTabHandler.unloadTab(tabs.getTab(parseInt(matches[1], 10) - 1));
    }
  }
}

commands.addUserCommand(["tap"], "BarTab: tap",
  function (args) {
    tap(args.literalArg, args.bang);
  }, {
    argCount: "?",
    bang: true,
    literal: 0,
    completer: function (context) {
      context.filters.push(function(item) !item.item.ontap);
      completion.buffer(context);
    }
  }, true);

function onUnload () {
  completion.buffer = originalBufferCompletion;
  completion.addUrlCompleter("t", "Open tabs", completion.buffer);
  tabs.get = originalTabsGet;
}

// vim: sw=2 ts=2 et:

(function () {
    function opener(where) {
        return function (args) {
            let index = 0;
            let url = util.stringToURLArray(args[0]).toString();
            for each ( [,tab] in tabs.browsers ) {
                if(url == tab.currentURI.spec){
                    tabs.select(index);
                    return;
                }
                ++index;
            }
            liberator.open(url,where);
        };
    }
 
    let open = commands.get("open");
    //let edit = commands.get("edit");
    let tabopen = commands.get("tabopen");
    open.action = opener(liberator.CURRENT_TAB);
    //edit.action = opener(liberator.CURRENT_TAB);
    tabopen.action = opener(liberator.NEW_TAB);
})();

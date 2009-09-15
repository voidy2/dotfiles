let self = liberator.plugins.greader = (function() {
  // COMMAND /////////////////////////////////////////////////////// {{{
  commands.addUserCommand(
    ["greaderstareditemopen", "gr"],
    "Open Google Reader stared item",
    function(args) {
      let stars = new Stars();
      stars._getStaredItems();
      //let items = stars.items();
    },
    {

    },
    true
  );
  // }}}
  // CLASS ///////////////////////////////////////////////////////// {{{
  function Stars() {
  }
  Stars.prototype = {
    _getStaredItems : function() {
       var result = null;
       var request = new libly.Request(
           "http://www.google.com/reader/atom/user/"+this._getUserID()+"/state/com.google/starred?n=1",
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
         alert(e4x..link);
         var links = e4x..link;
         for each (var e in links ) {
         }

       });
       request.addEventListener("onFailure", function(data) {
         liberator.echoerr("Can't get pinned list!!!");
       });
       request.get();

       return result;
    },
    _getUserID : function() {
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
})();

// vim: ts=2 sw=2 et fdm=marker

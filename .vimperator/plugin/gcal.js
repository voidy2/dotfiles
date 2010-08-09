// PLUGIN_INFO//{{{
var PLUGIN_INFO =
<VimperatorPlugin>
  <name>{NAME}</name>
  <description>Google Calendar Controller</description>
  <description lang="ja">Google Calendarを操作したい</description>
  <author mail="y2.void@gmail.com" homepage="http://d.hatena.ne.jp/voidy21/">voidy21</author>
  <version>0.0.1</version>
  <minVersion>2.3pre</minVersion>
  <maxVersion>2.3pre</maxVersion>
  <updateURL>http://github.com/voidy21/dotfiles/raw/master/.vimperator/plugin/gcal.js</updateURL>
  <require type="plugin">_libly.js</require>
  <detail><![CDATA[
   == Subject ==
    Open Google Reader starred items.

   == Needs Library ==
    - _libly.js(ver.0.1.23)
    @see http://coderepos.org/share/browser/lang/javascript/vimperator-plugins/trunk/_libly.js

   == Commands ==
    :gc[al]

   == Global variables ==
    
   == API ==

  ]]></detail>
  <detail lang="ja"><![CDATA[
    == 概要 ==

    == コマンド ==
      :gcal 文字列
      Google CalendarのQuick Add機能を使用してカレンダーに予定を登録します。
      EX:
        :gcal 8/7 12:00-21:00 ホーミー大会 at 札幌駅
        => 8月7日の12時から21時まで札幌駅でホーミー大会をする予定を登録します

        :gcal 8/20-8/28 夏期休暇
        => 8月20日から8月28日までの夏期休暇の予定を登録します

      注: あらかじめGoogle Calendarの設定から、言語を英語にしておいた方がよいと思います。
      (言語:日本語にしたままでも登録できますが、時間の設定などがあまり高機能ではありません。
      もしかすると高機能な挙動をする日本語文字列が存在するかもしれませんが...)


    == API ==

    == ChangeLog ==
      - 0.0.1
      -- ちょっと作ってみる

    == TODO ==
      - 一通り操作できるところまで作りたい
  ]]></detail>
</VimperatorPlugin>;
//}}}

let self = liberator.plugins.gcal = (function() {
    var accessor = storage.newMap("gcal",{ store: true });
    // COMMAND /////////////////////////////////////////////////////// {{{
    commands.addUserCommand(
        ["gc[al]"],
        "Google Calendar Controller",
        function(args) {
            gcalapi = new GoogleCalendarApiController();
            if( args['-refresh'] || !accessor.get("cal_list") ) {
                let arr = gcalapi.getAllCalendars();
                for each(let a in arr) {
                    gcalapi.getPrivateCalendarUrl(a.url);
                }
            }

            if ( args['-refresh'] || args.string == "") {
                let week_info = [];
                accessor.get("cal_list").forEach(function(element){
                    accessor.get(element.url).forEach(function(e){
                        week_info.push(new CalendarData({
                            url: element.url.toString(),
                            info: e
                        }));
                    });
                });
                week_info.sort(function(a,b){
                    if ( a.getStartTime() < b.getStartTime() ) {
                        return -1;
                    } else {
                        return 1;
                    }
                    return 0;
                });
                showCalendar(week_info);
            } else {
                gcalapi.postCalendarEntry(args.string);
            }
        },

        {
            literal: 0,
            count: false,
            completer: function(context,args) {
                context.completions = [[/* todo */ ]];
            },

            options: [
               [['-refresh', '-r'], commands.OPTION_NOARG],
               [['-date', '-d'], commands.OPTION_NOARG],
            ]
        },
        true
    );

    try {
        var form = ['https://www.google.com', 'https://www.google.com', null];
        var passwordManager = Cc["@mozilla.org/login-manager;1"].getService(Ci.nsILoginManager);
        var logins = passwordManager.findLogins({}, form[0], form[1], form[2]);
        if(logins.length){
            var [gmailUser, gmailPassword] = [logins[0].username, logins[0].password];
        } else {
            var promptSvc = Cc["@mozilla.org/embedcomp/prompt-service;1"]
                .getService(Ci.nsIPromptService);
            var user = { value : null };
            var pass = { value : null };
            var ret = promptSvc.promptUsernameAndPassword(
                window, form[0], "GMail Biff Login", user, pass, null, {});
            if(ret){
                var nsLoginInfo = new Components.Constructor("@mozilla.org/login-manager/loginInfo;1",
                        Ci.nsILoginInfo,
                        "init");
                [gmailUser, gmailPassword] = [user.value, pass.value];
                var formLoginInfo = new nsLoginInfo(
                    form[0], form[1], form[2],
                    gmailUser, gmailPassword, '', '');
                passwordManager.addLogin(formLoginInfo);
            }
            return;
        }
    } catch(e) {
        liberator.log(e);
        liberator.echoerr("gcal.js " + e);
    }
    // }}}
    // GLOBAL VARIABLES ////////////////////////////////////////////// {{{
    // }}}
    // CLASS ///////////////////////////////////////////////////////// {{{
    function CalendarData() {
        this.is_all_day = true;
        this.start_time = null;
        this.start_clocktime = null;
        this.end_time = null;
        this.end_clocktime = null;
        this.category = null;
        this.title = null;
        this.initialize.apply(this,arguments);
    }

    CalendarData.prototype = {
        initialize: function(e) {
            let start = new Date(e.info.start_time);
            let end = new Date(e.info.end_time);
            let info_html = "";
            if ( end - start != 86400000 ) {
                this.is_all_day = false;
            }
            this.start_time = start;
            this.start_clocktime = start.toTimeString().slice(0,8);
            this.end_time = end;
            this.end_clocktime= end.toTimeString().slice(0,8);
            this.category = e.url;
            this.title = e.info.title;
        },

        isAllDay : function() {
            return this.is_all_day;
        },

        getStartTime: function() {
            return new Date(this.start_time).getTime();
        },

        getStartLocaleDateString: function() {
            return new Date(this.start_time).toLocaleDateString();
        },

        getCategoryColor: function() {
            if ( !accessor )
                return "#FFFFFF";
            let color;
            let self = this;
            accessor.get("cal_list").forEach(function(e){
                if ( self.category == e.url ) { 
                    color = e.color; 
                    return;
                }
            });
            return color;
        },

        isToday: function() {
            let start = this.getStartTime();
            return getDayTime(0).getTime() < start && start < getDayTime(1).getTime();
        },

        getDisplayHtml: function() {
            let clock = <tr style='font-size:80%'><td>
                {this.start_clocktime} - {this.end_clocktime}</td></tr>.toSource()
            return new XML("<table class='calendar'><tbody style='background-color:" + this.getCategoryColor() + "'>" +
                  (!this.isAllDay() ? clock : "") + 
                  "<tr style='background-color:rgba(255,255,255,0.15);color:#FFFFFF;'>" +
                  "<td>" + 
                  (this.isAllDay() || !this.isToday() ? this.getStartLocaleDateString() + "<br/>": "") +
                  this.title +
                  "</td></tr></tbody></table>");
        }
    }

    function GoogleCalendarApiController() {
        this.cache_authtoken = null;
        this.API_PREFIX = 'http://www.google.com/calendar/feeds/';
        this.ALL_CALENDARS_URL = 'default/allcalendars/full'
        this.PRIVATE_URL = '/private/full';
    }

    GoogleCalendarApiController.prototype = {
      getAllCalendars: function() {
        let result = null;
        let request = new libly.Request(
          this.API_PREFIX + this.ALL_CALENDARS_URL,
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
           response = response.replace(/(xmlns='.*?')/,"");
           //gCal名前空間接頭辞ィィィ
           let gCal = new Namespace("http://schemas.google.com/gCal/2005");

           let e4x = new XML(response);
           let entries = e4x..entry;
           if ( entries.length != 0 ) {
              result = [];
           } else {
              return [];
           }
           for each(let e in entries) {
              result.push({
                 "url" : e.link.@href[0].toString(),
                 "title" : e.title.toString(),
                 "color" : e.gCal::color.@value.toString(),
              });
           }
           accessor.set("cal_list",result);
        });
        request.addEventListener("onFailure", function(data) {
          liberator.echoerr("Failure: Can't get token");
        });
        request.get();
        return result;
      },

      getPrivateCalendarUrl : function(url) {
        let result = null;
        let start_min = getDayTime(0);
        let start_max = getDayTime(14);
        let request = new libly.Request(
            url + "?start-min="+start_min.toISOString()+"&start-max="+start_max.toISOString()+"&singleevents=true",
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
           //めんどいのでデフォルトの名前空間を取り除く
           response = response.replace(/(xmlns='.*?')/,"");
           let e4x = new XML(response);
           //gd名前空間接頭辞ィィィ
           let gd = new Namespace("http://schemas.google.com/g/2005");
           let entries = e4x..entry;
           if ( entries.length != 0 ) {
              result = [];
           } else {
              return [];
           }
           for each(let e in entries) {
              result.push({
                 "id" : e.id.toString(),
                 "title" : e.title.toString(),
                 "start_time" : e.gd::when[0].@startTime.toString(),
                 "end_time" : e.gd::when[0].@endTime.toString(),
                 "place" : e.gd::where.@valueString.toString(),
              });
           }
           accessor.set(url,result);
        });
        request.addEventListener("onFailure", function(data) {
          liberator.echoerr("Failure: Can't get token");
        });
        request.get();
        return result;
      },

      getAuthToken : function() {
        if( !this.cache_authtoken )
          this.cache_authtoken = this._getAuthToken();
        return this.cache_authtoken;
      },

      _getAuthToken : function() {
          let auth_token = "";
          let auth = new libly.Request(
              "https://www.google.com/accounts/ClientLogin",
              null,
              {
                 asynchronous: false,
                 postBody : "&" + toQuery({
                    "Email": gmailUser,
                    "Passwd": gmailPassword,
                    "accountType":"GOOGLE",
                    "service":"cl",
                    "source":"Google-Contact-Lister"
              })
          });
          auth.addEventListener("onSuccess", function(data) {
            auth_token = data.responseText.split("Auth=")[1].trim();
          });
          auth.addEventListener("onFailure", function(data) {
            liberator.log("Google Authorization Failure...");
          });
          auth.post();
          return auth_token;
      },

      postCalendarEntry : function(text) {
          let xml = <entry xmlns="http://www.w3.org/2005/Atom" xmlns:gCal="http://schemas.google.com/gCal/2005">
                      <content type="html">{text}</content>
                      <gCal:quickadd value="true"/>
                    </entry>;
          let request = new libly.Request(
              "https://www.google.com/calendar/feeds/default/private/full",
              {
                "Content-type":"application/atom+xml; charset=UTF-8;",
                "Authorization":'GoogleLogin auth=' + this.getAuthToken(),
                "Connection":"close"
              },
              {
                  asynchronous: true,
                  postBody:xml.toSource()
              }
          );
          request.addEventListener("onSuccess", function(data) {
              response = data.responseText;
              //firefox bug 336551
              response = response.replace(/^<\?xml\s+version\s*=\s*(["'])[^\1]+\1[^?]*\?>/,"");
              //名前空間を取り除く
              response = response.replace(/(xmlns='.*?')/,"");
              let e4x = new XML(response);
              liberator.echo("Google Calendar Post!! : " + e4x..title.toString());
          });
          request.addEventListener("onFailure", function(data) {
            liberator.log("Google calendar post failure");
          });
          request.post();
      }
    }

    function toQuery(source)
        [encodeURIComponent(i) + "=" + encodeURIComponent(source[i]) for (i in source)].join('&');

    function showCalendar(elements) {
        let html = <style type="text/css"><![CDATA[
            .cal{ vertical-align: top;  }
            .calendar{ margin: 1px 0px; width: 150px;}
        ]]></style>.toSource();
        let table = <table><tr>
            <th></th><th>{new Date().toLocaleDateString()}</th><th></th>
            </tr></table>;
        let tr =  <tr><td width = "100px">
             <datepicker type="grid" xmlns={XUL}/>
             </td></tr>;
        let today_info = <table/>;
        let info = <table/>;
        elements.forEach(function(data) {
            (data.isToday() ? today_info : info).appendChild(<tr>{data.getDisplayHtml()}</tr>);
        });
        tr.appendChild(<td>{today_info}</td>);
        tr.appendChild(<td>{info}</td>);
        table.appendChild(tr);
        html += table.toSource().replace(/(?:\r\n|[\r\n])[ \t]*/g, " ");
        //liberator.log(html);
        liberator.echo(html, true);
    }

    function getColor(url) {
        let color;
        accessor.get("cal_list").forEach(function(e){
            if (e.url == url){ color = e.color; }
        });
        return color;
    }

    function getDayTime(n) {
        let today = new Date();
        today.setHours(0);
        today.setMinutes(0);
        today.setSeconds(0);
        today.setMilliseconds(0);
        return new Date(today.setDate(today.getDate()+n));
    }
})();

// PLUGIN_INFO//{{{
var PLUGIN_INFO =
<VimperatorPlugin>
  <name>{NAME}</name>
  <description>Google Calendar Controller</description>
  <description lang="ja">Google Calendarを操作したい</description>
  <author mail="y2.void@gmail.com" homepage="http://vimperator.g.hatena.ne.jp/voidy21/">voidy21</author>
  <version>0.0.1</version>
  <minVersion>2.3pre</minVersion>
  <maxVersion>2.4pre</maxVersion>
  <updateURL>http://github.com/voidy21/dotfiles/raw/master/.vimperator/plugin/gcal.js</updateURL>
  <require type="plugin">_libly.js</require>
  <detail><![CDATA[
   == Subject ==
    Google Calendar Controller!!!

   == Needs Library ==
    - _libly.js(ver.0.1.32)
    @see http://coderepos.org/share/browser/lang/javascript/vimperator-plugins/trunk/_libly.js

   == Commands ==
    :gc[al]

  ]]></detail>
  <detail lang="ja"><![CDATA[
    == 概要 ==
      Google Calendarに予定を登録したり、確認するためのプラグインです

    == コマンド ==
      :gcal
      本日から2週間後までのGoogle Calendar上のスケジュールを表示します。
      また、:gcal!とすると、キャッシュを使わず、最新の情報を取得します。

      :gcal 文字列
      Google CalendarのQuick Add機能を使用してカレンダーに予定を登録します。
      登録されるカレンダーは、後述するオプション-calendarで設定できます。

      EX:
        :gcal 8/7 12:00-21:00 ホーミー大会 at 札幌駅
        => 8月7日の12時から21時まで札幌駅でホーミー大会をする予定を登録します

        :gcal 8/20-8/28 夏期休暇
        => 8月20日から8月28日までの夏期休暇の予定を登録します

      注: あらかじめGoogle Calendarの設定から、言語を英語にしておいた方がよいと思います。
      (言語:日本語にしたままでも登録できますが、時間の設定などがあまり高機能ではありません。
      もしかすると高機能な挙動をする日本語文字列が存在するかもしれませんが...)

      オプション:
        - [-c]alendar
        登録するカレンダーを数字で指定します。補完機能によって選択することができます。
        何も指定しない場合は、デフォルトで一番上に存在するカレンダーが選択されます。

        - [-d]ate
        指定した日付でのスケジュールを表示します。

    == グローバル変数 ==
      g:gcalCacheDays:
        何日先までの予定をキャッシュとして保持して表示するか
        default:14 

    == API ==
      plugins.gcal.post(arg):
        予定argをGoogle Calendarに登録します。

    == ChangeLog ==
      0.0.1:
      - ちょっと作ってみる

    == TODO ==
      - 一通り操作できるところまで作りたい
  ]]></detail>
</VimperatorPlugin>;
//}}}

let self = liberator.plugins.gcal = (function() {
    var accessor = storage.newMap("gcal",{ store: true });
    // Googleログイン用 ////////////////////////////////////////////// {{{
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
    let gv = liberator.globalVariables;

    function getCacheDays()
        gv.gcalCacheDays || 14;

    // CLASS ///////////////////////////////////////////////////////// {{{
    let GoogleCalendarApiController = (function() {
        let cache_authtoken = null;
        const API_PREFIX = 'http://www.google.com/calendar/feeds/';
        const ALL_CALENDARS_URL = 'default/allcalendars/full'
        const PRIVATE_URL = '/private/full';

        let getAllCalendars = function(isAsync) {
            let result = null;
            let request = new libly.Request(
                API_PREFIX + ALL_CALENDARS_URL,
                null,
                {
                   asynchronous: isAsync,
                }
            );
            request.addEventListener("onSuccess", function(data) {
                let response = data.responseText;
                if ( response.substr(0,6) == "<html>" ){
                    liberator.echoerr("Google login required",-1);
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
                if (entries.length != 0) {
                     result = [];
                } else {
                     return;
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
                liberator.echoerr("Failure: Can't get token... Google login required");
            });
            request.get();
            return result;
        }

        let getPrivateCalendarUrl = function(url,isAsync) {
            let result = null;
            let start_min = getDayTime(0);
            let start_max = getDayTime(getCacheDays());
            let params = toQuery({
                "start-min" : start_min.toISOString(),
                "start-max" : start_max.toISOString(),
                "singleevents" : "true"
            });
            let request = new libly.Request(
                url + "?" + params,
                null,
                {
                   asynchronous: isAsync,
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
                 let entries = e4x..entry;
                 if (entries.length != 0) {
                     GoogleCalendar.setCacheDatasFromXmlEntry(url,entries);
                 }
            });
            request.addEventListener("onFailure", function(data) {
                 liberator.echoerr("Failure: Can't get Private Calendar...");
            });
            request.get();
            return result;
        }

        let getAuthToken = function() {
            if (!cache_authtoken)
                cache_authtoken = _getAuthToken();
            return cache_authtoken;
        }

        let _getAuthToken = function() {
            let auth_token = "";
            let auth = new libly.Request(
                "https://www.google.com/accounts/ClientLogin",
                null,
                {
                     asynchronous: false,
                     postBody : "&" + toQuery({
                         "Email": gmailUser,
                         "Passwd": gmailPassword,
                         "accountType": "GOOGLE",
                         "service": "cl",
                         "source": "Google-Contact-Lister"
                     })
                }
            );
            auth.addEventListener("onSuccess", function(data) {
                auth_token = data.responseText.split("Auth=")[1].trim();
            });
            auth.addEventListener("onFailure", function(data) {
                liberator.log("Google Authorization Failure...");
            });
            auth.post();
            return auth_token;
        }

        let postCalendarEntry = function(urlNumber,text) {
            url = accessor.get("cal_list")[urlNumber].url;
            let xml = <entry xmlns="http://www.w3.org/2005/Atom" xmlns:gCal="http://schemas.google.com/gCal/2005">
                        <content type="html">{text}</content>
                      <gCal:quickadd value="true"/>
                    </entry>;
            let request = new libly.Request(
                url,
                {
                  "Content-type":"application/atom+xml; charset=UTF-8;",
                  "Authorization":'GoogleLogin auth=' + getAuthToken(),
                  "Connection":"close"
                },
                {
                    asynchronous: true,
                    postBody: xml.toSource()
                }
            );
            request.addEventListener("onSuccess", function(data) {
                response = data.responseText;
                //firefox bug 336551
                response = response.replace(/^<\?xml\s+version\s*=\s*(["'])[^\1]+\1[^?]*\?>/,"");
                //名前空間を取り除く
                response = response.replace(/(xmlns='.*?')/,"");
                let entry = new XML(response);
                GoogleCalendar.setCacheDataFromXmlEntry(url,entry,true);
            });
            request.addEventListener("onFailure", function(data) {
                liberator.log("Google calendar post failure");
            });
            request.post();
        }

        return {
            getAuthToken : getAuthToken,
            getPrivateCalendarUrl : getPrivateCalendarUrl,
            postCalendarEntry : postCalendarEntry,
            getAllCalendars : getAllCalendars
        };
    })();

    let GoogleCalendar = (function(){
        //gd名前空間接頭辞ィィィ
        const gd = new Namespace("http://schemas.google.com/g/2005");

        let is_init = false;

        let init = function() {
            if (is_init) return;
            // 起動時にあらかじめ最新の情報を取得しておく
            let cacheCalUrl = getCacheAllCalendarUrl();
            if (cacheCalUrl) for each(let c in cacheCalUrl) {
                GoogleCalendarApiController.getPrivateCalendarUrl(c.url,true);
            }
            is_init = true;
        }

        let refresh = function() {
            let gcalapi = GoogleCalendarApiController;
            let arr = gcalapi.getAllCalendars(false);
            for each(let a in arr) {
                gcalapi.getPrivateCalendarUrl(a.url,false);
            }
            is_init = true;
        }

        let getCacheAllCalendarUrl = function() {
            return accessor.get("cal_list");
        }

        let getAllCalendarData = function(isRefresh) {
            if (isRefresh || !accessor.get("cal_list")) {
                refresh();
            }
            return getCacheData();
        }

        let getCalendarData = function(date,isRefresh) {
            if (isRefresh || !accessor.get("cal_list")) {
                refresh();
            }
            return getCacheData(date);
        }

        let setCacheDataFromXmlEntry = function(url,xmlEntry,isEcho) {
            datas = accessor.get(url);
            let title = xmlEntry.title.toString();
            let start_time = xmlEntry.gd::when[0].@startTime.toString();
            let end_time = xmlEntry.gd::when[0].@endTime.toString();
            let time = " [" + start_time + 
                (start_time.length == 10 ? "" : (" - " + end_time)) + "]";
            datas.push({
               "id" : xmlEntry.id.toString(),
               "title" : title,
               "start_time" : start_time,
               "end_time" : end_time,
               "place" : xmlEntry.gd::where.@valueString.toString()
            });
            accessor.set(url,datas);
            if (isEcho)
                liberator.echo("Google Calendar Post!! : " + title + time);
        }

        let setCacheDatasFromXmlEntry = function(url,xmlEntries) {
            datas = [];
            for each(let e in xmlEntries) {
                datas.push({
                   "id" : e.id.toString(),
                   "title" : e.title.toString(),
                   "start_time" : e.gd::when[0].@startTime.toString(),
                   "end_time" : e.gd::when[0].@endTime.toString(),
                   "place" : e.gd::where.@valueString.toString(),
                });
            }
            accessor.set(url,datas);
        }

        let getCacheData = function(date) {
            init();
            let datas = [];
            accessor.get("cal_list").forEach(function(element){
                accessor.get(element.url).forEach(function(e){
                    let cal_data = CalendarData({
                        url: element.url.toString(),
                        info: e
                    });
                    if (date == undefined || cal_data.getStartDateString() == date)
                        datas.push(cal_data);
                });
            });
            datas.sort(function(a,b){
                return a.getStartTime() < b.getStartTime() ? -1 : 1;
            });
            return datas;
        }

        let getCalendarUrlCompleter = function() {
            let completer = [];
            let datas = getCacheAllCalendarUrl();
            datas.forEach(function(data,i){
                completer.push([i,data.title]);
            });
            return completer;
        }

        let getCalendarDataCompleter = function() {
            let completer = [];
            let datas = getCacheData();
            datas.forEach(function(data){
                let title = data.getTitle();
                let start_date = data.getStartDateString();
                completer.push([start_date,title]);
            });
            return completer;
        }

        return {
            refresh : refresh,
            getAllCalendarData : getAllCalendarData,
            getCalendarData : getCalendarData,
            getCacheData : getCacheData,
            setCacheDataFromXmlEntry : setCacheDataFromXmlEntry,
            setCacheDatasFromXmlEntry : setCacheDatasFromXmlEntry,
            getCalendarUrlCompleter : getCalendarUrlCompleter,
            getCalendarDataCompleter : getCalendarDataCompleter
        };
    })();

    let CalendarData = (function(arg) {
        let is_all_day = false;
        let is_long = false;
        let start_time;
        let start_clocktime;
        let end_time;
        let end_clocktime;
        let category;
        let title;
        let id;

        let initialize = function(e) {
            let id = e.info.id;
            let start = new Date(e.info.start_time);
            let end = new Date(e.info.end_time);
            let info_html = "";
            start_time = start;
            end_time = end;
            let diff = end - start;
            if (!(diff % 86400000)) {
                is_all_day = true;
                if (diff != 86400000)
                    is_long = true;
                start = setTimeZero(start);
                end = setTimeZero(end);
            }
            start_clocktime = start.toTimeString().slice(0,8);
            end_clocktime= end.toTimeString().slice(0,8);
            category = e.url;
            title = e.info.title;
        }

        let isAllDay = function() {
            return is_all_day;
        }

        let isLong = function() {
            return is_long;
        }

        let getTitle = function() {
            return title;
        }

        let getStartTime = function() {
            return new Date(start_time).getTime();
        }

        let getStartLocaleDateString = function() {
            return new Date(start_time).toLocaleDateString();
        }

        let getEndLocaleDateString = function() {
            return new Date(end_time).toLocaleDateString();
        }

        let getStartLocaleDateString = function() {
            return new Date(start_time).toLocaleDateString();
        }
        let getStartDateString = function() {
            let start= new Date(start_time);
            return start.getFullYear() + "/" + 
                (start.getMonth() + 1) + "/" +
                start.getDate();
        }

        let getCategoryColor = function() {
            if ( !accessor )
                return "#FFFFFF";
            let color;
            accessor.get("cal_list").forEach(function(e){
                if ( category == e.url ) { 
                    color = e.color; 
                    return;
                }
            });
            return color;
        }

        let isToday = function() {
            let start = getStartTime();
            return getDayTime(0).getTime() <= start && start < getDayTime(1).getTime();
        }

        let getDisplayHtml = function() {
            let clock = <tr class='clock'><td>
                {start_clocktime} - {end_clocktime}</td></tr>
            let table = <table class='calendar'/>
            let tbody = new XML("<tbody style='background-color:" + getCategoryColor() + "'/>");
            let body = <tr class='body'/>;
            let allday = <>{getStartLocaleDateString() + (isLong() ? " - " + getEndLocaleDateString() : "")}<br/></>;
            let header = <td/>;
            if (isAllDay() || !isToday())
                header.appendChild(allday);
            header.appendChild(<>{title}</>);
            body.appendChild(header);
            if (!isAllDay())
                tbody.appendChild(<>{clock}</>);
            tbody.appendChild(body);
            table.appendChild(tbody);
            return table;
        }

        initialize(arg);
        return {
            isAllDay : isAllDay,
            isLong : isLong,
            getTitle : getTitle,
            getStartTime : getStartTime,
            getStartLocaleDateString : getStartLocaleDateString,
            getEndLocaleDateString : getEndLocaleDateString,
            getStartDateString : getStartDateString,
            getCategoryColor : getCategoryColor,
            isToday : isToday,
            getDisplayHtml : getDisplayHtml
        };
    });

    let Display = (function(){
        const html = <style type="text/css"><![CDATA[
                .cal{ vertical-align: top;  }
                .calendar{ margin: 1px 0px; width: 300px;}
                .calendar .body { background-color:rgba(255,255,255,0.15); color:#FFFFFF;}
                .clock {font-size:80%; color:#FFFFFF; font-weight:bold;}
                .datepicker {width:"100px"}
            ]]></style>.toSource()
                .replace(/(?:\r\n|[\r\n])[ \t]*/g, " ");

        let showCalendar = function(elements) {
            let table = <table><tr>
                <th></th><th>{new Date().toLocaleDateString()}</th><th></th>
                </tr></table>;
            let tr =  <tr><td class="datepicker">
                 <datepicker type="grid" xmlns={XUL}/>
                 </td></tr>;
            let today_info = <table/>;
            let info = <table/>;
            elements.forEach(function(data) {
                if (data.getStartTime() < getDayTime(0)) return;
                (data.isToday() ? today_info : info).appendChild(<tr>{data.getDisplayHtml()}</tr>);
            });
            if (today_info == <table/>)
                today_info.appendChild(<>Today schedule is freedom!!</>);
            tr.appendChild(<td>{today_info}</td>);
            tr.appendChild(<td>{info}</td>);
            table.appendChild(tr);
            let display = html + table.toSource().replace(/(?:\r\n|[\r\n])[ \t]*/g, " ");
            liberator.echo(display, true);
        }

        let createCalendarHtml = function(datas) {
            let info = <table/>;
            datas.forEach(function(data) {
                info.appendChild(<tr>{data.getDisplayHtml()}</tr>);
            });
            return info;
        }

        let showDaySchedule = function(date,datas) {
            let table = <table><tr>
                <th>{new Date(date).toLocaleDateString()}</th>
                </tr></table>;
            let tr = <tr/>;
            let info = createCalendarHtml(datas);
            tr.appendChild(info);
            table.appendChild(tr);
            let display = html + table.toSource().replace(/(?:\r\n|[\r\n])[ \t]*/g, " ");
            liberator.echo(display, true);
        }

        return {
            showCalendar : showCalendar,
            showDaySchedule : showDaySchedule,
            createCalendarHtml : createCalendarHtml
        };
    })();
    //}}}

    function toQuery(source)
        [encodeURIComponent(i) + "=" + encodeURIComponent(source[i]) for (i in source)].join('&');

    function getColor(url) {
        let color;
        accessor.get("cal_list").forEach(function(e){
            if (e.url == url) { color = e.color; }
        });
        return color;
    }

    function setTimeZero(date) {
        date.setHours(0);
        date.setMinutes(0);
        date.setSeconds(0);
        date.setMilliseconds(0);
        return date;
    }

    function getDayTime(n) {
        let today = new Date();
        return new Date(setTimeZero(today).setDate(today.getDate()+n));
    }

    // COMMAND /////////////////////////////////////////////////////// {{{
    commands.addUserCommand(
        ["gc[al]"],
        "Google Calendar Controller",
        function(args) {
            if ( args['-date'] ) {
                let datas = GoogleCalendar.getCalendarData(args['-date'],args.bang);
                Display.showDaySchedule(args['-date'],datas);
            } else if (args.bang || args.string == "") {
                let datas = GoogleCalendar.getAllCalendarData(args.bang);
                Display.showCalendar(datas);
            } else {
                let urlNumber = args['-calendar'] ? args['-calendar'] : 0;
                GoogleCalendarApiController.postCalendarEntry(
                   urlNumber, args.literalArg);
            }
        },

        {
            bang: true,
            literal: 0,
            count: false,
            completer: function(context,args) {
            },

            options: [
               [['-date', '-d'],
                   commands.OPTION_STRING,
                   null,
                   function(context){
                       return GoogleCalendar.getCalendarDataCompleter();
                   }
                ],
               [['-calendar', '-c'],
                   commands.OPTION_INT,
                   null,
                   function(context){
                       return GoogleCalendar.getCalendarUrlCompleter();
                   }
               ]
            ]
        },
        true
    );
    //}}}
    // API /////////////////////////////////////////////////////////// {{{
    return {
        post: function(arg)
            GoogleCalendarApiController.postCalendarEntry(0,arg)
    };
    // }}}
})();

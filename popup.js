$(function() {
    $(".dropdown-menu").click(function() {
        return false;
    });

    initTabs();
    initCurrentTab();

    loadMsg();

    $("#txtinput").keydown(function(e) {
        if (e.keyCode == 13) {
            var val = $("#txtinput").val();

            if (val != "") {
                var type = 1;

                if (httpReg.test(val))
                    type = 2;

                var data = {
                    "msg_content": val,
                    "icon": "",
                    "type": type,
                    "UserToken": getToken()
                }

                AuthPost(getBaseUrl() + "/api/Msg/AddMsg", data, function(result) {
                    if (result.Result == 1) {
                        addListItem(result.ResultMessage, val, type, "", new Date().toLocaleString());
                    } else {
                        //show error
                    }
                });
            }

            $("#txtinput").val("");

            return false;
        }
    });

});

function initCurrentTab() {
    chrome.tabs.query({ 'active': true, 'lastFocusedWindow': true }, function(tabs) {
        var tab = tabs[0];

        if (!tab || !tab.url || tab.url.indexOf('chrome://') == 0) {
            $("#btn-send").attr("disabled", "disabled");
            return;
        }

        $("#btn-send").attr("title", "Click to Send\r\n" + tab.url);

        $("#btn-send").click(function() {
            var data = {
                "msg_content": tab.url,
                "comment": tab.title,
                "icon": "",
                "type": "2",
                "UserToken": getToken()
            }

            AuthPost(getBaseUrl() + "/api/Msg/AddMsg", data, function(result) {
                if (result.Result == 1) {
                    addListItem(result.ResultMessage, tab.url, 2, tab.title, new Date().toLocaleString());
                }
            });

        });
    });
}

function initTabs() {
    var allHtml = "";

    chrome.windows.getAll({ populate: true }, function(windows) {
        windows.forEach(function(curWindow) {

            var wndHtml = "";
            if (allHtml != "")
                wndHtml += '<li role="separator" class="divider"></li>'

            curWindow.tabs.forEach(function(curTab) {
                /*if(curTab.url.indexOf("chrome://") < 0 )*/

                var favicon = (curTab.favIconUrl != '' && curTab.favIconUrl !== undefined) ? curTab.favIconUrl : 'chrome://favicon/' + curTab.url;
                var pagetitle = curTab.title.replace(/\"/g, " ");

                wndHtml += '<li class="lisel' + curTab.windowId + '" title="' + curTab.url + '" fav="' + favicon + '" pagetitle="' + pagetitle + '"> <a href="#"><img src="' + favicon + '">' + pagetitle + '</a></li>';

            });

            wndHtml += '<li class="operate-area"><button class="btn btn-default btn-sm save-tabs" selidx="' + curWindow.id + '">Save</button></li>';

            allHtml += wndHtml;
        });

        $(".dropdown-menu").append(allHtml);

        $(".save-tabs").click(function() {
            var sbtn = $(this);
            sbtn[0].innerHTML = "Saving"
            sbtn.attr("disabled", "disabled");

            var data = {
                "UserToken": getToken(),
                "group_title": new Date().toLocaleString(),
                "List": []
            }

            $(".dropdown-menu li.lisel" + sbtn.attr("selidx")).each(function() {
                var item = {
                    "msg_content": $(this).attr("title"), //url
                    "icon": $(this).attr("fav"),
                    "title": $(this).attr("pagetitle"),
                    "type": "2",
                }
                data.List.push(item);
            });

            AuthPost(getBaseUrl() + "/api/Msg/AddGroup", data, function(result) {
                if (result.Result == 1) {
                    addGroup(result.data.GroupId, result.data.GroupTitle, new Date(result.data.UTCTime).toLocaleString(), result.data.Items);

                    sbtn[0].innerHTML = "Saved"
                } else {
                    //show error
                }
            });

        });

    });
}

function loadMsg() {
    $('.msg-list').html("<div style='text-align:center;margin:0 auto; margin-top:150px;'>Loading...</div>");

    var data = { "UserToken": getToken() }

    AuthPost(getBaseUrl() + "/api/Msg/GetMsgListWithGroup", data, function(result) {
        $('.msg-list').html("");

        if (result.Result == 1) {
            for (i = 0; i < result.ListCount; i++) {
                if (result.List[i].IsGroup == 0) {
                    var item = result.List[i].Items[0];
                    addListItem(item.DataGuid, item.Content, item.ContentType, item.Comment, new Date(item.AddTimeUTC).toLocaleString());
                } else {
                    addGroup(result.List[i].GroupId, result.List[i].GroupTitle, new Date(result.List[i].UTCTime).toLocaleString(), result.List[i].Items);
                }
            }
        }
    });

}

function addListItem(guid, content, type, comment, localtime) {
    var contentStr = content;

    if (type == 1) {
        contentStr = content;
    } else if (type == 2) {
        contentStr = '<a id="op' + guid + '" href="####" title="' + comment + '" >' + content + '</a>';
    }

    var timehtml = '<div class="time">' + localtime + '</div>';

    var c = timehtml + '<div class="rc-row"><p>' + contentStr + '</p> <a id="a' + guid + '" class="del" title="Delete">x</a> </div>';

    $('.msg-list').append(c);


    $("#op" + guid).click(function() {
        var tmp = [];
        tmp.push(content);
        openTabs(tmp);
    });

    bindDel(guid);

    $('.msg-list').scrollTop($('.msg-list')[0].scrollHeight);
}

var groupLinks = [];

function addGroup(group_guid, group_title, localtime, items) {
    var groupTitle = group_title == '' ? localtime : group_title;
    var timehtml = '<div class="grouptitle"> <div id="divtitle' + group_guid + '">' + groupTitle + '</div> </div>';
    var contentStr = "";
    var linksarr = [];

    $.each(items, function(idx, data) {
        //todo bind del item
        contentStr += '<a url="' + data.Content + '" href="####" class="groupitem" title="' + data.Comment + '\r\n' + data.Content + '" > <img src="' + data.Icon + '" /> </a>';
        linksarr.push(data.Content);
    });

    groupLinks[group_guid] = linksarr;

    var c = timehtml + '<div class="rc-row rc-group"><p>' + contentStr + '</p> <div class="righttool"><a id="a' + group_guid + '" class="del" title="Delete all" >x</a> <a id="o' + group_guid + '" title="Open all" class="del opentab" ><span>+</span></a></div> </div>';
    $('.msg-list').append(c);

    //bind every icon click
    $(".groupitem").click(function() {
        var url = $(this).attr("url");
        var tmp = [];
        tmp.push(url);
        openTabs(tmp);
    });


    bindDelGroup(group_guid);

    //open all urls
    $("#o" + group_guid).click(function() {
        var links = groupLinks[group_guid];
        openTabs(links);
    });

    //edit title
    $("#divtitle" + group_guid).click(function() {
        var inputstr = '<input type="text" id="txttitle' + group_guid + '" value="' + $(this).html() + '" />';
        $(this).after(inputstr);

        var _div = $(this);
        var _txt = $("#txttitle" + group_guid);

        _txt.blur(function() {
            renameGroupTitle(_div, _txt);
        });

        _txt.keydown(function(e) {
            if (e.keyCode == 13) {
                renameGroupTitle(_div, _txt);
            } else if (e.keyCode == 27) { //esc
                _txt.remove();
                _div.show();
            }
        });

        $(this).hide();
        _txt.focus();
        _txt.select();
    });

    $('.msg-list').scrollTop($('.msg-list')[0].scrollHeight);
}

function renameGroupTitle(_div, _txt) {
    var oldvalue = _div.html();
    var newvalue = _txt.val();

    if (newvalue != oldvalue) {
        var data = {
            "group_guid": _txt.attr("id").replace("txttitle", ""),
            "new_title": newvalue,
            "UserToken": getToken()
        }

        AuthPost(getBaseUrl() + "/api/Msg/RenameGroupTitle", data, function(result) {
            if (result.Result == 1) {} else {}
        });
    }

    _div.html(newvalue);
    _txt.remove();
    _div.show();
}

function openTabs(urls) {
    for (i = 0; i < urls.length; i++) {
        chrome.tabs.create({
            url: urls[i],
            selected: false
        }, function(tab) {});
    }
}

function bindDel(guid) {
    $("#a" + guid).click(function() {
        var data = {
            "guid": guid,
            "UserToken": getToken()
        }

        AuthPost(getBaseUrl() + "/api/Msg/DelMsg", data, function(result) {
            if (result.Result == 1) {
                var prev = $("#a" + guid).parent().prev();
                var next = $("#a" + guid).parent().next();
                if (prev.hasClass("time") && (next.length == 0 || next.hasClass("time")))
                    $("#a" + guid).parent().prev().remove();

                $("#a" + guid).parent().remove();
            } else {
                //show error
            }
        });
    });
}

function bindDelGroup(group_guid) {
    $("#a" + group_guid).click(function() {
        var data = {
            "guid": group_guid,
            "UserToken": getToken()
        }

        AuthPost(getBaseUrl() + "/api/Msg/DelGroup", data, function(result) {
            if (result.Result == 1) {
                var row = $("#a" + group_guid).parent().parent();
                row.prev().remove();
                row.remove();
            }
        });
    });
}

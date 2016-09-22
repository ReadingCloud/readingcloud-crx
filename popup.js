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
                        addListItem(result.ResultMessage, val, type, new Date().toLocaleString());
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
                "icon": "",
                "type": "2",
                "UserToken": getToken()
            }

            AuthPost(getBaseUrl() + "/api/Msg/AddMsg", data, function(result) {
                if (result.Result == 1) {
                    addListItem(result.ResultMessage, tab.url, 2, new Date().toLocaleString());
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
                "List": []
            }

            $(".dropdown-menu li.lisel" + sbtn.attr("selidx")).each(function() {
                var item = {
                    "msg_content": $(this).attr("title"),
                    "icon": $(this).attr("fav"),
                    "title": $(this).attr("pagetitle"),
                    "type": "2",
                }
                data.List.push(item);
            });

            AuthPost(getBaseUrl() + "/api/Msg/AddGroup", data, function(result) {
                if (result.Result == 1) {
                    for (i = 0; i < data.List.length; i++) {
                        addListItem(result.guids[i], data.List[i].msg_content, data.List[i].type, new Date().toLocaleString(), result.groupid);
                    }

                    sbtn[0].innerHTML = "Saved"

                } else {
                    //show error
                }
            });

        });

    });
}

function loadMsg() {

    var data = { "UserToken": getToken() }

    AuthPost(getBaseUrl() + "/api/Msg/GetMsgList", data, function(result) {
        if (result.Result == 1) {
            for (i = 0; i < result.ListCount; i++) {
                addListItem(result.MsgList[i].DataGuid, result.MsgList[i].Content, result.MsgList[i].ContentType, new Date(result.MsgList[i].AddTimeUTC).toLocaleString(), result.MsgList[i].GroupId);
            }
        }
    });
}

var currentGroupId = '';

function addListItem(guid, content, type, localtime, groupid) {
    var a = content;

    if (type == 1) {
        a = content;
    } else if (type == 2) {
        a = '<a href="' + content + '" target="_blank">' + content + '</a>';
    }

    var timehtml = '';
    if (groupid == '' || currentGroupId != groupid) {
        timehtml = '<div class="time">' + localtime + '</div>';
        currentGroupId = groupid;
    }

    var c = timehtml + '<div class="rc-row"><p>' + a + '</p> <a id="a' + guid + '" class="del" >x</a> </div>';

    $('.msg-list').append(c);

    bindDel(guid);

    $('.msg-list').scrollTop($('.msg-list')[0].scrollHeight);
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


var httpReg = /^(http|https|ftp)\:\/\/([a-zA-Z0-9\.\-]+(\:[a-zA-Z0-9\.&amp;%\$\-]+)*@)?((25[0-5]|2[0-4][0-9]|[0-1]{1}[0-9]{2}|[1-9]{1}[0-9]{1}|[1-9])\.(25[0-5]|2[0-4][0-9]|[0-1]{1}[0-9]{2}|[1-9]{1}[0-9]{1}|[1-9]|0)\.(25[0-5]|2[0-4][0-9]|[0-1]{1}[0-9]{2}|[1-9]{1}[0-9]{1}|[1-9]|0)\.(25[0-5]|2[0-4][0-9]|[0-1]{1}[0-9]{2}|[1-9]{1}[0-9]{1}|[0-9])|([a-zA-Z0-9\-]+\.)*[a-zA-Z0-9\-]+\.[a-zA-Z]{2,4})(\:[0-9]+)?(\/[^\/][a-zA-Z0-9\.\,\?\'\\/\+&amp;%\$#\=~_\-@]*)*$/

function getToken() {
    if (localStorage["readingcloudtoken"] == null || localStorage["readingcloudtoken"] == "") {
        location.href = "login.html";
    }

    return localStorage["readingcloudtoken"];
}

function setToken(token) {
    localStorage["readingcloudtoken"] = token;
}


function getBaseUrl() {
    //return localStorage["readingclouddomain"];
    return "http://guaizi0129-001-site1.itempurl.com";
}

function AuthPost(url, data, callback) {
    $.post(url, data, function(result) {
        if (result.ResultCode == 101) {
            location.href = "login.html?msg=2";
        } else {
            callback(result);
        }
    });
}


function GetQueryString(name) {
    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
    var r = window.location.search.substr(1).match(reg);
    if (r != null) return (r[2]);
    return null;
};
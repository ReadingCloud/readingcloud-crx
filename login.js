$(function() {
    if (GetQueryString("msg") == 2) {
        $("#alertmsg").html("Session expired,please sign in");
    }

    $("body").keydown(function(e) {
        if (e.keyCode == 13) {
            Login();
        }
    });

    $("#btnLogin").click(Login);

    $("#aregister").click(function() {
        window.open(getBaseUrl() + "/user/register");
    });
});

function Login() {
    $("#alertmsg").html("");

    var username = $("#txtUserName").val();
    var pwd = $("#txtPwd").val();

    if (username != "" && pwd != "") {
        var data = {
            "user_name": username,
            "password": pwd
        }

        $("#btnLogin").attr("disabled", "disabled");

        $.post(getBaseUrl() + "/User/CrxLogin", data, function(result) {
            if (result.Result == 1) {
                setToken(result.ResultMessage);

                location.href = "popup.html";
            } else {
                $("#alertmsg").html(result.ResultMessage);
                $("#btnLogin").removeAttr("disabled");
            }
        });
    } else {

    }
}

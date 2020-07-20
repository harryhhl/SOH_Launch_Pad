$(document).ready(Begin);

function Begin() {
    LoadThemeSetting();
    InitAll();
}

function InitAll() {

    var eventMethod = window.addEventListener ? "addEventListener" : "attachEvent";
    var eventer = window[eventMethod];
    var messageEvent = eventMethod === "attachEvent" ? "onmessage" : "message";
    eventer(messageEvent, function (e) {

        if (e.data.startsWith("[UpdateTheme]"))
            LoadThemeSetting();

    });

}

function LoadThemeSetting() {
    let t = localStorage.getItem('SOH_MainTheme');
    if (t == null) return;
    UpdateThemeCSS(t);
}

function UpdateThemeCSS(newTheme) {
    let targetelement = "link";
    let targetattr = "tag";
    let targetattrval = "themecss";
    let allsuspects = document.getElementsByTagName(targetelement);
    for (var i = allsuspects.length; i >= 0; i--) {
        if (allsuspects[i] && allsuspects[i].getAttribute(targetattr) != null && allsuspects[i].getAttribute(targetattr) == targetattrval) {
            let newelement = document.createElement("link");
            newelement.setAttribute("rel", "stylesheet");
            newelement.setAttribute("type", "text/css");
            newelement.setAttribute("href", "../../styles/kgrid_" + newTheme + ".css");
            newelement.setAttribute(targetattr, targetattrval);
            allsuspects[i].parentNode.replaceChild(newelement, allsuspects[i]);
        }
    }
}
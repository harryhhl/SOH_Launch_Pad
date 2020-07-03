'use strict';

Start();

function Start() 
{
    var drawerOpen = false;
    var appLauncherOpen = false;
    var userProfileOpen = false;
    var SOH_systemID = null;
    var favorList = null;
    var frequentList = null;

    var NotificationsFuncList = null;
    var NotificationQueue = null;
    var NotificationCurID = null;

    $(document).ready(Begin);

    function Begin()
    {
        if(isIE){
            return;
        }
        
        LoadThemeSetting();

        AzureAuthen.Init(function () {

            localStorage.setItem('SOH_Token', AzureAccessToken);
            localStorage.setItem('SOH_TokenExp', AzureAccount.idToken.exp);
            localStorage.setItem('SOH_Username', AzureAccount.userName);

            $('.btnLoginMain').hide();

            if(AzureAccount.Photo != null) {
                const url = window.URL || window.webkitURL;
                const blobUrl = url.createObjectURL(AzureAccount.Photo);
                $('#imgUserPhoto').attr("src", blobUrl);
                $('#imgUserPhoto').show();
            }

            var lbUser = $('#userProfileLabel');
            lbUser.empty();
            var lbUserText = "<div>" + AzureAccount.name +"</div>";
            lbUserText += "<div>" + AzureAccount.userName +"</div>";
            lbUser.append(lbUserText);

            $('#lbUserOU').text(GetOULabelfromUser(AzureAccount.name));
            $('#lbUserName').text(AzureAccount.name);
            $('#dvWelcome').empty();
            $('#dvWelcome').append('<h2>&nbsp;&nbsp;Good Day! '+AzureAccount.name.split(' ')[0]+'</h2>');

            $('#lbUserInitial').text(AzureAuthen.GetUserInitial());

            CheckAuth(function(data){
                
                GetFavorList(function(ret) {
                    BuildAppMenu(data);

                    if(SOH_systemID != null)
                    {
                        GetFuncMenu(SOH_systemID, BuildFuncMenu);
                        GetNotificationListSetting(InitNotification);
                        kendo.fx($(".overlay-login")).fade("out").play();
                    }
                    else
                    {
                        alert('You have no access right on SOH');
                        AzureAuthen.SignOut();
                    }
                });
            });
        }, ShowLoginButton);

        $('.btnLoginMain').on( 'click', function(){
            AzureAuthen.SignIn();
        });

        // $('#btnOpenLauncher').on( 'click', function(){
        //     appLauncherOpen = true;
        //     kendo.fx($("#appLauncher")).fade("in").play();
        // });

        // $('#btnCloseLauncher').on( 'click', function(){
        //     appLauncherOpen = false;
        //     kendo.fx($("#appLauncher")).fade("out").play();
        // });

        $('.btnUserProfile').on('click', function() {
            $('#userOrgUnitPop').hide();
            $('#bkSelectionPop').hide();
            $('#userProfilePop').show();
            $('.overlay-container').show();
        });

        // $('.btnOrgUnit').on('click', function() {
        //     $('#userProfilePop').hide();
        //     $('#bkSelectionPop').hide();
        //     $('#userOrgUnitPop').show();
        //     $('.overlay-container').show();
        // });

        $('.btnChangeBK').on('click', function() {
            $('#userOrgUnitPop').hide();
            $('#userProfilePop').hide();
            $('#bkSelectionPop').show();
            $('.overlay-container').show();
        });

        $('.overlay-container').on('click', function(){
            $('.overlay-container').hide();
        });

        $('#hrefSignOut').on('click', function(){
            AzureAuthen.SignOut();
        });

        var eventMethod = window.addEventListener? "addEventListener" : "attachEvent";
        var eventer = window[eventMethod];
        var messageEvent = eventMethod === "attachEvent"? "onmessage" : "message";
        eventer(messageEvent, function (e) {
            
            //if (e.origin !== 'ReportFrame') return;
            
            if (e.data.startsWith("[UpdateFavor]")) 
                UpdateFavorSection(e.data);
            
            if (e.data.startsWith("[RequestToken]"))
            {
                var wn = document.getElementById('theframe').contentWindow;
                wn.postMessage("[SOH_Token]" + AzureAccessToken, "*");
            } 

            if (e.data.startsWith("[RefreshME]"))
            {
                document.getElementById('theframe').contentWindow.location.reload();
            } 
            
            //console.log(e);
        });

        window.addEventListener("resize", function(event) {
            //console.log(document.body.clientWidth + ' wide by ' + document.body.clientHeight+' high');
            ResetDrawerSize();
        });

        $('.btnChangeTheme').on('click', function(){
            var newTheme = $(this).attr('theme');
            localStorage.setItem('SOH_MainTheme', newTheme);
            LoadThemeSetting();

            var wn = document.getElementById('theframe').contentWindow;
            wn.postMessage("[UpdateTheme]Ready", "*");
        });
    }
    

    function LoadThemeSetting()
    {
        var t = localStorage.getItem('SOH_MainTheme');
        if(t == null) return;
        UpdateThemeCSS(t);

        var items = $('#bkSelectionPop').find(".btnChangeTheme");
        items.each(function() {

            $(this).empty();
            var theme = $(this).attr('theme');
            if(theme == t) {
                $(this).html("<span class='k-icon k-i-check'></span>");
            }
        });
    }

    function UpdateThemeCSS(newTheme)
    {
        var targetelement = "link";
        var targetattr = "tag";
        var targetattrval = "themecss";
        var allsuspects = document.getElementsByTagName(targetelement);
        for (var i=allsuspects.length; i>=0; i--) { 
            if (allsuspects[i] && allsuspects[i].getAttribute(targetattr)!=null && allsuspects[i].getAttribute(targetattr)==targetattrval) {
                var newelement = document.createElement("link");
                newelement.setAttribute("rel", "stylesheet");
                newelement.setAttribute("type", "text/css");
                newelement.setAttribute("href", "styles/index_"+newTheme+".css");  
                newelement.setAttribute(targetattr, targetattrval);           
                allsuspects[i].parentNode.replaceChild(newelement, allsuspects[i]);
            }
        }
    }

    function UpdateFavorSection(data)
    {
        GetFavorList(UpdateFavourite);
    }

    function ShowLoginButton()
    {
        $('.btnLoginMain').show();
    }

    function ResetDrawerSize()
    {
        if(document.body.clientWidth < 800)
            openDrawer(false);
        else
            openDrawer(true);

        $('.k-drawer-container').height(window.innerHeight - 50);
    }

    function InitNotification(list) 
    {
        NotificationsFuncList = JSON.parse(list);
        NotificationQueue = [];

        setTimeout(RunNotificationUpdate, 1000);
    }

    function RunNotificationUpdate()
    {
        var allWidgets = $('#drawer-content').find(".widgetCard");
        allWidgets.each(function() {

            var funcID = $(this).attr('data-id');
            
            if(NotificationsFuncList.filter(n=>n.FunctionID == funcID).length > 0 && !NotificationQueue.includes(funcID)) {
                NotificationQueue.push(funcID);
            }
        });

        NotificationsFuncList.filter(n=>n.Type == 0).forEach(function(item){
            NotificationQueue.push(item.FunctionID);
        });

        PopNotificationNext();

        setTimeout(RunNotificationUpdate, 5000);
    }

    function PopNotificationNext()
    {
        if(NotificationQueue.length <= 0 ) return;

        NotificationCurID = NotificationQueue.shift();

        var NotificationObj = NotificationsFuncList.filter(n=>n.FunctionID == NotificationCurID)[0];
        if(NotificationObj.Type == "1") {
            GetPendingApproval(NotificationCurID, NotificationObj.Para);
        }
        else if(NotificationObj.Type == "0") {
            GetPendingNCenterCount();
        }
    }

    function CompleteApprovalPendingCall(data)
    {
        var funcID = NotificationCurID;
        
        var allWidgets = $('#drawer-content').find(".widgetCard");
        allWidgets.each(function() {

            if( funcID == $(this).attr('data-id')) {
                var $widgetBadge = $(this).find(".widgetNotifyNum");
                $widgetBadge.empty();
                if(data > 0) {
                    $widgetBadge.html('<div class="widgetNotifyNumIcon"><span>'+data+'</span></div>');
                }
            }        
        });

        //console.log(funcID + "=" + data);
    }

    function CompleteNCenterPendingCall(data)
    {
        var funcID = NotificationCurID;

        var allWidgets = $('.k-drawer-items').find(".widgetNotifyNum2");
        allWidgets.each(function() {

            if( funcID == $(this).parent().attr('data-id')) {
                var $widgetBadge = $(this);
                $widgetBadge.empty();
                if(data > 0) {
                    $widgetBadge.html('<div class="widgetNotifyNumIcon"><span>'+data+'</span></div>');
                }
            }        
        });
    }

    function AddWidgetToFrequent(funcID, widget)
    {
        if(!frequentList.includes(funcID))
            widget = widget.replace('class="widgetCard"', 'class="widgetCard hidden"');
        
        $($('#Frequents').find('.widgetContainer')).append(widget);
    }

    function AddWidgetToFavor(funcID, widget)
    {
        if(!favorList.includes(funcID))
            widget = widget.replace('class="widgetCard"', 'class="widgetCard hidden"');

        $($('#Favourites').find('.widgetContainer')).append(widget);
    }

    function GenerateFuncWidget(funcID, funcURI, name, icon, parentName, parentIcon, funcPara) 
    {
        //var isFavor = favorList.includes(funcID);
        var addWidgetContent = "";
        addWidgetContent += '<div class="widgetCard" data-id="'+funcID+'" data-uri="'+funcURI+'" data-para="'+funcPara+'">';
        addWidgetContent += '    <div class="widgetCardHeader">';
        addWidgetContent += '        <div class="widgetCardIcon"><span class="'+icon+'"></span></div>';
        addWidgetContent += '        <div class="widgetCardText"><span>'+name+'</span></div>';
        addWidgetContent += '    </div>';
        addWidgetContent += '    <div class="widgetNotifyNum">';
        addWidgetContent += '    </div>';
        addWidgetContent += '</div>';

        return addWidgetContent;
    }

    function BuildAppMenu(systemdata) 
    {
        var jsonobj = JSON.parse(systemdata);
        var listData = jsonobj.ListData;

        var htmlcontent = "";

        for(var i = 0; i<listData.length; i++) {
            if(listData[i].Name == "SOH")
                SOH_systemID = listData[i].Id;
            
            htmlcontent += '<div class="appItem" data-sid="'+listData[i].Id+'">';
            htmlcontent += '  <span class="k-icon '+listData[i].Icon.replace("@kendo.", "")+'"></span>';
            htmlcontent += '  <span>'+listData[i].Name+'</span>';
            htmlcontent += '</div>';
        }

        var $appmenu = $('#appListing');
        $appmenu.html(htmlcontent);
    }

    function BuildFuncMenu(menudata)
    {
        var jsonobj = JSON.parse(menudata);
        var menuData = jsonobj.Functions;

        var templateContent = "";

        templateContent += "<ul>";
        templateContent += "  <li data-role='drawer-item' class='k-state-selected'><span class='k-icon k-i-home'></span><span class='k-item-text'>Home</span></li>";
        //templateContent += "  <li data-role='drawer-separator'></li>";

        var drawerContent = "";

        for(var i = 0; i<menuData.length; i++) {
            var menuItem = menuData[i];
            templateContent += "<li data-role='drawer-item' data-id='"+menuItem.FuncID+"' data-child='"+menuItem.childFunctions.length+"' data-uri='"+menuItem.Uri+"'><span class='k-icon "+menuItem.FuncIcon.replace("@kendo.", "")+"'></span><span class='k-item-text'>"+menuItem.FuncName+"</span>";
            
            if(menuItem.childFunctions.length > 0) { 
                templateContent += "<button class='btnMenuExpand'><span class='k-icon k-i-arrow-chevron-right'></span></button></li>";
                drawerContent += '<div id="'+menuItem.FuncName+'" class="hidden"><div class="widgetArea"><div class="widgetContainer">';
                for(var j = 0; j<menuItem.childFunctions.length; j++){
                    var childfunc = menuItem.childFunctions[j];
                    templateContent += "<li data-role='drawer-item' data-id='"+childfunc.FuncID+"' data-parent='"+childfunc.ParentId+"' data-uri='"+childfunc.Uri+"' style='display: none;'><span class='k-item-text menusubitem' title='"+childfunc.FuncName+"'>"+childfunc.FuncName+"</span></li>";
                    var widget = GenerateFuncWidget(childfunc.FuncID, childfunc.Uri, childfunc.FuncName, 'k-icon '+childfunc.FuncIcon.replace("@kendo.", ""), menuItem.FuncName, 'k-icon '+menuItem.FuncIcon.replace("@kendo.", ""), childfunc.FuncParas);
                    drawerContent += widget;
                    AddWidgetToFavor(childfunc.FuncID, widget);
                    AddWidgetToFrequent(childfunc.FuncID, widget);

                    templateContent += "<li data-role='drawer-separator' data-parent='"+childfunc.ParentId+"' style='display: none;'></li>";
                }
                drawerContent += '</div><br><br></div></div>';
            }
            else {
                templateContent += "<div class='widgetNotifyNum2'></div></li>";
            }
        }

        //templateContent += "  <li data-role='drawer-separator'></li>";
        //templateContent += "  <li data-role='drawer-item'><span class='k-icon k-i-notification'></span><span class='k-item-text'>Notifications</span><div class='widgetNotifyNum2'></div></li>";
        //templateContent += "  <li data-role='drawer-item'><span class='k-icon k-i-star-outline'></span><span class='k-item-text'>Favourites</span></li>";
        templateContent += "</ul>";

        $('#drawer-content').append(drawerContent);

        $("#drawer").kendoDrawer({
            template: templateContent,
            mode: "push",
            mini: true,
            itemClick: function (e) {

                var uri = e.item.attr("data-uri");
                var funcID = e.item.attr("data-id");
                var itemText = e.item.find(".k-item-text").text();

                if(typeof funcID == 'undefined' && (typeof itemText == 'undefined' || itemText.length < 1)) return;

                e.sender.element.find("#drawer-content > div").addClass("hidden");

                if(typeof uri !== 'undefined' && uri.length > 0) {
                    e.sender.element.find("#drawer-content").find("#dvFrame").removeClass("hidden");
                    uri = uri + "&fid=" + funcID + "&fname=" + encodeURIComponent(itemText)  + '&timestamp=' + Date.now();
                    if($('#theframe').attr('funcid')!=funcID) {
                        $('#theframe').attr('src', uri);
                        $('#theframe').attr('funcid', funcID);
                        $('#theframe').attr('name', Date.now());
                    }
                }
                else {
                    var content = e.sender.element.find("#drawer-content").find("#" + itemText);
                    content.removeClass("hidden");
                    UpdateFavouriteStar(content);
                }

                SetFrameDimension();

                setSelectMenuItemTitle(itemText);
            },
            hide: function(e) {
                if(drawerOpen)
                    e.preventDefault();
            },
            position: 'left',
            minHeight: 330,
            width: 280,
            swipeToOpen: true
        });

        $('.k-drawer-container').prepend("<button id='btnMenuSwitch'><span class='k-icon k-i-menu'></span></button>");

        $('.k-drawer-container').height(window.innerHeight - 50);

        $('#btnMenuSwitch').on( 'click', function(){
            toggleDrawer();
        });

        $('#drawer-content').on( 'click', function(){
            if(appLauncherOpen==true) {
                appLauncherOpen = false;
                kendo.fx($("#appLauncher")).fade("out").play();
            }
        });        

        $('.btnMenuExpand').on( 'click', function(){
            var that = $(this);
            if(that.children(":last").hasClass('k-i-arrow-chevron-right')) {
                that.children(":last").removeClass('k-i-arrow-chevron-right');
                that.children(":last").addClass('k-i-arrow-chevron-down');
            } else {
                that.children(":last").removeClass('k-i-arrow-chevron-down');
                that.children(":last").addClass('k-i-arrow-chevron-right');
            }

            var parent = that.parent();
            var parentId = parent.attr("data-id");
            var a = parent.siblings();
            a.each(function(){
                if($(this).attr("data-parent") == parentId) {
                    $(this).toggle();
                }
            });
        });

        ResetDrawerSize();

        $('.widgetCardHeader').click(function(){
            var parentDv = $(this).parent();
            var uri = parentDv.attr("data-uri");
            var funcID = parentDv.attr("data-id");
            var rptdname = $($(this).find(".widgetCardText")).text();
            
            if(typeof uri !== 'undefined' && uri.length > 0) {
                $("#drawer").find("#drawer-content > div").addClass("hidden");
                $("#drawer").find("#drawer-content").find("#dvFrame").removeClass("hidden");
                uri = uri + "&fid=" + funcID + "&fname=" + encodeURIComponent(rptdname);
                if($('#theframe').attr('funcid')!=funcID) {
                    $('#theframe').attr('src', uri);
                    $('#theframe').attr('funcid', funcID);
                    $('#theframe').attr('name', Date.now());
                }
            }

            setSelectMenuItemTitle(rptdname);

        });

        // $('.widgetFavorStarBtn').click(function(){
        //     var parentDv = $($(this).parent()).parent();
        //     var funcID = parentDv.attr("data-id");

        //     if($(this).children(":last").hasClass('k-i-star-outline')){
        //         $(this).children(":last").removeClass('k-i-star-outline');
        //         $(this).children(":last").addClass('k-i-star');

        //         favorList.push(funcID);
        //     }
        //     else {
        //         $(this).children(":last").removeClass('k-i-star');
        //         $(this).children(":last").addClass('k-i-star-outline');

        //         favorList = favorList.filter(f=>f != funcID);
        //     }

        //     if(typeof funcID !== 'undefined') {
        //         ToggleFavorStar(funcID);
        //     }

        //     UpdateFavourite();
        // });

        //UpdateFavourite();
    }

    function UpdateFavourite()
    {
        var allWidgets = $('#Favourites').find(".widgetCard");
        allWidgets.each(function() {

            var funcID = $(this).attr('data-id');
            if(favorList.includes(funcID)) {
                $(this).removeClass('hidden');
                $(this).show();
                // var starbtn = $($(this).find('.widgetFavorStarBtn'));
                // if(starbtn.children(":last").hasClass('k-i-star-outline')) {
                //     starbtn.children(":last").removeClass('k-i-star-outline');
                //     starbtn.children(":last").addClass('k-i-star');
                // }
            }
            else
                $(this).hide();
        });
    }

    function UpdateFavouriteStar(container)
    {
        // var allWidgets = container.find(".widgetCard");

        // allWidgets.each(function() {

        //     var funcID = $(this).attr('data-id');
        //     var starbtn = $($(this).find('.widgetFavorStarBtn'));
        //     if(favorList.includes(funcID)) {

        //         if(starbtn.children(":last").hasClass('k-i-star-outline')) {
        //             starbtn.children(":last").removeClass('k-i-star-outline');
        //             starbtn.children(":last").addClass('k-i-star');
        //         }
        //     }
        //     else {
        //         if(starbtn.children(":last").hasClass('k-i-star')) {
        //             starbtn.children(":last").removeClass('k-i-star');
        //             starbtn.children(":last").addClass('k-i-star-outline');
        //         }
        //     }
                
        // });
    }

    function setSelectMenuItemTitle(title)
    {
        var dvSelectedMenuItem = $('#dvSelectedMenuItem');
        dvSelectedMenuItem.empty();
        dvSelectedMenuItem.append("<span>" + title +"</span>");
    }

    function openDrawer(open)
    {
        if(drawerOpen == open)
            return;

        toggleDrawer();
    }

    function toggleDrawer() 
    {
        if(drawerOpen == true)
            drawerOpen = false;
        else
            drawerOpen = true;

        var drawerInstance = $("#drawer").data().kendoDrawer;
        //var drawerContainer = drawerInstance.drawerContainer;
        
        if(typeof drawerInstance === 'undefined' || drawerInstance == null)
            return;

        if(drawerOpen == true)
            drawerInstance.show();
        else {
            drawerInstance.hide();

            var $allbtnEnpands = $('.btnMenuExpand');
            $allbtnEnpands.each(function(){
                var that = $(this);
                if(that.children(":last").hasClass('k-i-arrow-chevron-down')) {
                    that.children(":last").removeClass('k-i-arrow-chevron-down');
                    that.children(":last").addClass('k-i-arrow-chevron-right');

                    var parent = that.parent();
                    var parentId = parent.attr("data-id");
                    var a = parent.siblings();
                    a.each(function(){
                        if($(this).attr("data-parent") == parentId) {
                            $(this).toggle();
                        }
                    });
                } 
            });

        }

        // if(drawerContainer.hasClass("k-drawer-expanded")) {
        //     drawerInstance.hide();
        // } else {
        //     drawerInstance.show();
        // }

        setTimeout(SetFrameDimension, 500);
    }

    function SetFrameDimension() 
    {
        //$('#theframe').width($('#drawer-content').width());
        //$('#theframe').height($('#drawer-content').height());

        iFrameResize({ log: false, minHeight:Math.max(document.documentElement.clientHeight, window.innerHeight || 0)  }, '#theframe');
    }

    function GetOULabelfromUser(username)
    {
        var defaultOU = 'CG';
        var s1 = username.indexOf('/', 0);
        if(s1 == -1) return defaultOU;
        var s2 = username.indexOf(')', s1);
        if(s2 == -1) return defaultOU;

        return username.substring(s1+1, s2);
    }

    function GetNotificationListSetting(callback) 
    {
        $.ajax({
            type: "POST",
            async: true,
            url: "Notification/Notification.ashx",
            data: {
                Action: "listsetting",
                AzureToken: AzureAccessToken             
            },
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            complete: function (data) {
                callback(data.responseText);
            }
        });
    }

    function CheckAuth(callback) 
    {
        $.ajax({
            type: "POST",
            async: true,
            url: "auth.ashx",
            data: {
                Action: "login",
                Account: JSON.stringify(AzureAccount),
                AzureToken: AzureAccessToken             
            },
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            complete: function (data) {
                callback(data.responseText);
            }
        });
    }

    function GetFuncMenu(systemid, callback) 
    {
        $.ajax({
            type: "POST",
            async: true,
            url: "auth.ashx",
            data: {
                Action: "getfuncmenu",
                Token: AzureAccessToken,
                SystemID: systemid         
            },
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            complete: function (data) {
                callback(data.responseText);
            }
        });
    }

    function GetFavorList(callback)
    {
        $.ajax({
            type: "POST",
            async: true,
            url: "Favourite.ashx",
            data: {
                Action: "getall",
                Token: AzureAccessToken,
                User: AzureAccount.userName       
            },
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            error: function (request, error) {
                console.log(request.statusText);
                alert(request.statusText);
            },
            success: function (data) {
                favorList = data.FavorList;
                frequentList = data.FrequentList;
                callback(data);
            }
        }); 
    }
    
    function ToggleFavorStar(functionID) 
    {
        $.ajax({
            type: "POST",
            async: true,
            url: "Favourite.ashx",
            data: {
                Action: "toggle",
                Token: AzureAccessToken,
                User: AzureAccount.userName,
                FuncID: functionID         
            },
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            complete: function (data) {
                console.log('toggle favor');
            }
        }); 
    }

    function GetPendingApproval(functionID, para){
        
        var paras = para.split(';');

        var urlType = paras[0];
        var poType = paras.length > 1 ? paras[1] : "";

        $.ajax({
            type: "POST",
            async: true,
            url: "Approval/"+urlType,
            data: {
                Action: "pendingcount",
                Token: AzureAccessToken,
                User: AzureAccount.userName,
                FuncID: functionID,
                poType: poType
            },
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            error: function (request, error) {
                console.log(request.statusText);
            },
            success: function (data) {
                CompleteApprovalPendingCall(data);
            },
            complete: function () {
                PopNotificationNext();
            }
        }); 
    }

    function GetPendingNCenterCount() {
        $.ajax({
            type: "POST",
            async: true,
            url: "Notification/Notification.ashx",
            data: {
                Action: "getpendingcount",
                Token: AzureAccessToken,
                User: AzureAccount.userName
            },
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            error: function (request, error) {
                console.log(request.statusText);
            },
            success: function (data) {
                CompleteNCenterPendingCall(data);
            },
            complete: function () {
                PopNotificationNext();
            }
        });  
    }
}
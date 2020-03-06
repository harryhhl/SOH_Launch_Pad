'use strict';

Start();

function Start() 
{
    const urlParams = new URLSearchParams(window.location.search);

    var FuncID = urlParams.get('fid');
    var AccessToken = localStorage.getItem('SOH_Token');
    var UserName = localStorage.getItem('SOH_Username');

    $(document).ready(Begin);

    function Begin()
    {
        GetNotificationAll();
    }

    function InitReady()
    {
        kendo.fx($("#dvLoadingOverlay")).fade("out").play();
    }

    function GenerateWidget(id, para, name, status) 
    {
        var addWidgetContent = "";
        addWidgetContent += '<div class="widgetCard" data-id="'+id+'" data-uri="../Queue/ReportQueue.html?&fid=ee7df414-d7ba-47be-8332-c2e8d21af004&rptdname=Queue&lookup='+para+'">';
        addWidgetContent += '    <div class="widgetCardHeader">';
        addWidgetContent += '        <div class="widgetCardIcon"><span class="k-icon k-i-notification02"></span><div class="widgetNotify">';
        if(status == 1) {
            addWidgetContent += '<div><b>New</b></div>';
        }
        addWidgetContent += '        </div></div>';
        addWidgetContent += '        <div class="widgetCardText"><span>'+name+'</span></div>';
        addWidgetContent += '    </div>';
        addWidgetContent += '    <div class="widgetBanner"><div><span>See Details</span></div>';
        addWidgetContent += '    </div>';
        addWidgetContent += '</div>';

        return addWidgetContent;
    }

    function BuildContent(data)
    {
        for(var i = 0; i<data.length; i++) {
            var item = data[i];
            var widget = GenerateWidget(item.Id, item.Para, item.Title, item.Status);

            $($('#dvNotificationContent').find('.widgetContainer')).append(widget);
        }

        $('.widgetCardHeader').click(function(){
            var parentDv = $(this).parent();
            var uri = parentDv.attr("data-uri");
            var funcID = parentDv.attr("data-id");
            
            if(typeof uri !== 'undefined' && uri.length > 0) {
                location.href = uri;
            }

        });

        InitReady();
    }


    function GetNotificationAll() 
    {
        $.ajax({
            type: "POST",
            async: true,
            url: "Notification.ashx",
            data: {
                Action: "listcenter",
                Token: AccessToken,
                FuncID: FuncID,
                User: UserName      
            },
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            error: function (request, error) {
                console.log(request.statusText);
                alert(request.statusText);
            },
            success: function (data) {
                BuildContent(data);
                SetNotificationReadAll();
            }
        });
    }

    function SetNotificationReadAll() 
    {
        $.ajax({
            type: "POST",
            async: true,
            url: "Notification.ashx",
            data: {
                Action: "markreadall",
                Token: AccessToken,
                FuncID: FuncID,
                User: UserName      
            },
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            error: function (request, error) {
                console.log(request.statusText);
                alert(request.statusText);
            },
            success: function (data) {
            }
        });
    }
}
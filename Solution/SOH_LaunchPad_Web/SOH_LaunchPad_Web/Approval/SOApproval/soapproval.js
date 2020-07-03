'use strict';

Start();

function Start() 
{
    const urlParams = new URLSearchParams(window.location.search);
    var FuncDisplayName = decodeURIComponent(urlParams.get('fname'));
    var FuncID = urlParams.get('fid');
    var AccessToken = localStorage.getItem('SOH_Token');
    var UserName = localStorage.getItem('SOH_Username');

    var ActingApprover = "";

    var resultgridDataSource = null;
    var resultgrid = null;

    var kwPDFViewer = null;

    var selectedSO = null;
    var selectedDetailSID = null;

    var kdApproveDialog = null;

    $(document).ready(Begin);

    function Begin()
    {
        LoadThemeSetting();
        
        GetActingApprover(function() {
            GetPendingList();
        });
        InitOthers();
    }

    function ShowLoading(show) {
        if(show)
            kendo.fx($("#dvLoadingOverlay")).fade("in").play();
        else
            kendo.fx($("#dvLoadingOverlay")).fade("out").play();
    }

    function InitOthers()
    {
        $('#lbTitleName').empty();
        $('#lbTitleName').append("<h3>"+FuncDisplayName+"</h3>");

        $('.FavorStarBtn').click(function(){
            if($(this).children(":last").hasClass('k-i-star-outline')){
                $(this).children(":last").removeClass('k-i-star-outline');
                $(this).children(":last").addClass('k-i-star');
            }
            else {
                $(this).children(":last").removeClass('k-i-star');
                $(this).children(":last").addClass('k-i-star-outline');
            }

            ToggleFavorStar(FuncID);
        });

        GetFavorList(function(ret) {
            if(ret.FavorList.includes(FuncID))
            {
                $('.FavorStarBtn').children(":last").removeClass('k-i-star-outline');
                $('.FavorStarBtn').children(":last").addClass('k-i-star');
            }
        });

        var eventMethod = window.addEventListener? "addEventListener" : "attachEvent";
        var eventer = window[eventMethod];
        var messageEvent = eventMethod === "attachEvent"? "onmessage" : "message";
        eventer(messageEvent, function (e) {
            
            if (e.data.startsWith("[UpdateTheme]")) 
                LoadThemeSetting();

        });

        $('#btnDisplay').on( 'click', function(){
            ShowLoading(true);
            GetPendingList();
        });

        $('#btnApprove').on( 'click', function(){
            ShowLoading(true);
            Approve();
        });

        InitKendoPDFViewer();
    }

    function LoadThemeSetting()
    {
        var t = localStorage.getItem('SOH_MainTheme');
        if(t == null) return;
        UpdateThemeCSS(t);
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
                newelement.setAttribute("href", "../../styles/kgrid_"+newTheme+".css");  
                newelement.setAttribute(targetattr, targetattrval);           
                allsuspects[i].parentNode.replaceChild(newelement, allsuspects[i]);
            }
        }
    }


    function GetListResultProcess(result_data)
    {
        InitResultGrid(result_data);
        ShowLoading(false);
    }

    function InitResultGrid(result_data)
    {
        if(resultgrid != null) {
            resultgrid.data("kendoGrid").destroy();
            resultgrid.empty();
        }

        resultgridDataSource = new kendo.data.DataSource({
            data: {
                "items" : result_data
              },
            schema: {
                model: {
                    id: "VBELN",
                    fields: {
                        VBELN: { type: "string" },
                        SEASON: { type: "string" },
                        NAME1: { type: "string" },
                        STYLE_DESCRIPTION: { type: "string" }, 
                        STYLE_NO: { type: "string" },
                        TOTAL_QTY: { type: "number" }, 
                        SALES_AMT: { type: "number" }, 
                        CURRENCY: { type: "string" }, 
                        ZGP : { type: "number" }, 
                        CREATE_BY : { type: "string" }, 
                        CREATE_DATE: { type: "date" }
                    }
                },
                data: "items"
            },
        });

        resultgrid = $("#gridWA").kendoGrid({
            autoBind: false,
            height: 500,
            dataSource: resultgridDataSource,
            sortable: true,
            reorderable: true,
            groupable: false,
            resizable: true,
            filterable: false,
            columnMenu: false,
            change: DisplayGridonSelect,
            persistSelection: true,
            pageable: false,
            scrollable: true,
            columns: [
                    { selectable: true, width: "44px" },
                    { command: { text: "View Details", click: ShowSODetails }, title: " ", width: "120px" },                    
                    { field: "VBELN", title: "Sales Order", width: "120px" },
                    { field: "SEASON", title: "Season", width: "80px" },
                    { field: "NAME1", title: "Customer", width: "300px" },
                    { field: "STYLE_DESCRIPTION", title: "Style Description", width: "300px" },
                    { field: "STYLE_NO", title: "Style No", width: "240px" },
                    { field: "TOTAL_QTY", title: "Total Qty", width: "150px" },
                    { field: "SALES_AMT", title: "Sales Amt", width: "150px" },
                    { field: "CURRENCY", title: "Currency" , width: "120px"},
                    { field: "ZGP", title: "GP%" , width: "120px"},
                    { field: "CREATE_BY", title: "Create By" , width: "120px"},
                    { field: "CREATE_DATE", title: "Create Date", template: '#= kendo.toString(CREATE_DATE, "yyyy-MM-dd" ) #', width: "100px" }
            ]
        });     
        
        resultgridDataSource.read();
    }

    function ShowSODetails(e) 
    {
        ShowLoading(true);
        e.preventDefault();
        var dataItem = this.dataItem($(e.currentTarget).closest("tr"));
        GetDetail(dataItem.VBELN);
    }

    function DisplayGridonSelect(arg) 
    {
        selectedSO = this.selectedKeyNames().join(",");
        if(selectedSO.length < 1) {
            $('#btnApprove').attr('disabled', 'disabled');
        } else {
            $('#btnApprove').removeAttr('disabled');
        }

        //console.log("The selected product ids are: [" + this.selectedKeyNames().join(", ") + "]");
    }

    function ShowApproveResult(rst)
    {
        var contentHtml = '<span style="display: inline-block; min-width: 120px"><strong>SO</strong></span>' + 
                            '<span style="display: inline-block; min-width: 180px"><strong>Result</strong></span>' +
                            '<br><br>' ;
        for(var i=0; i<rst.length; i++) {
            contentHtml +=  '<span style="display: inline-block; min-width: 120px">'+rst[i].VBELN+'</span>' +
                            '<span style="display: inline-block; min-width: 180px">'+(rst[i].MESSAGE.length > 1 ? rst[i].MESSAGE : "OK") +'</span>' +
                            '<br>';
        }

        if(kdApproveDialog == null) {
            kdApproveDialog = $("#kdApproveRet").kendoDialog({
                width: "400px",
                buttonLayout: "normal",
                title: "Approve Result",
                closable: true,
                modal: true,
                content: contentHtml,
                actions: [
                    { text: 'OK', primary: true }
                ]
            });
        } else {
            kdApproveDialog.data("kendoDialog").content(contentHtml);
            kdApproveDialog.data("kendoDialog").open();
        }

        GetPendingList();
    }

    function InitActingApprover(result)
    {
        if(result == null || result.length <= 0)
            return;
        
        $("#dvApproverActing").show();

        var optionHtml = "";
        for(var i=0; i<result.length; i++) {
            optionHtml += '<option value="'+result[i]+'">'+result[i]+'</option>';
        }
        $("#opApproverActing").html(optionHtml);

        $("#ckbApproverActing").change(function() {
            if(this.checked) {
                $("#opApproverActing").removeAttr('disabled');
                ActingApprover = $("#opApproverActing").children("option:selected").val();
                ShowLoading(true);
                GetPendingList();
            } else {{
                $("#opApproverActing").attr('disabled', 'disabled');
                ActingApprover = "";
                ShowLoading(true);
                GetPendingList();
            }}     
        });

        $("#opApproverActing").change(function() {
            ActingApprover = $(this).children("option:selected").val();
            ShowLoading(true);
            GetPendingList();
        });
    }

    function InitKendoPDFViewer() 
    {
        kwPDFViewer = $("#kwPDFViewer").kendoWindow(
        {
            width: "1347px",
            height: "747px",
            title: "SO Detail",
            actions: ["Maximize", "Close"],
            resizable: true,
            modal: true,
            refresh: PDFViewerWindowOnRefresh,
            visible: false,
            position: {
                top: 10, // or "100px"
                left: 10
              }
        });
    }

    function PDFViewerWindowOpen(sid) 
    {    
        if (kwPDFViewer != null) 
        {
            selectedDetailSID = sid;

            kwPDFViewer.data("kendoWindow").refresh({
                url: "pdfviewer.html",
                type: "GET",
                data: { sid: sid }
            });

            kwPDFViewer.data("kendoWindow").open();
        }
    }

    function PDFViewerWindowOnRefresh()
    {
        //var pdfViewer = $("#pdfViewer").kendoPDFViewer({
        //    pdfjsProcessing: {
        //        file: {
        //            url: "getsodetail.ashx?sid="+selectedDetailSID,
        //            cMapUrl: '../../styles/pdfjs/cmaps/',
        //            cMapPacked: true
        //        }
        //    },              
        //    width: "100%",
        //    height: 700
        //}).data("kendoPDFViewer");

        $('#pdfViewer').empty();
        var content = '<embed src="' + "getsodetail.ashx?sid=" + selectedDetailSID + '" type="application/pdf" width="1300px" height="740px"/>';
        $('#pdfViewer').append(content);
    }

    function GetFavorList(callback)
    {
        $.ajax({
            type: "POST",
            async: true,
            url: "../../Favourite.ashx",
            data: {
                Action: "getall",
                Token: AccessToken,
                User: UserName      
            },
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            error: function (request, error) {
                console.log(request.statusText);
                alert(request.statusText);
            },
            success: function (data) {
                callback(data);
            }
        }); 
    }

    function ToggleFavorStar(functionID) 
    {
        $.ajax({
            type: "POST",
            async: true,
            url: "../../Favourite.ashx",
            data: {
                Action: "toggle",
                Token: AccessToken,
                User: UserName,
                FuncID: functionID         
            },
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            complete: function (data) {
                console.log('toggle favor');
                window.parent.postMessage("[UpdateFavor]Ready", "*");
            }
        }); 
    }

    function GetPendingList() 
    {
        $.ajax({
            type: "POST",
            async: true,
            url: "SOApproval.ashx",
            data: {
                Action: "list",
                Token: AccessToken,
                User: UserName,
                FuncID: FuncID,
                Approver: ActingApprover,
            },
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            error: function (request, error) {
                console.log(request.statusText + ";" + error);
                alert(request.statusText + ";" + error);
            },
            success: function (data) {
                GetListResultProcess(data);
            }
        });
    }

    function GetActingApprover(callback) 
    {
        $.ajax({
            type: "POST",
            async: true,
            url: "SOApproval.ashx",
            data: {
                Action: "getaappr",
                Token: AccessToken,
                User: UserName,
                FuncID: FuncID,
            },
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            error: function (request, error) {
                console.log(request.statusText + ";" + error);
                alert(request.statusText + ";" + error);
            },
            success: function (data) {
                InitActingApprover(data);
                callback();
            }
        });
    }

    function GetDetail(sono) 
    {
        var reportData = {};
        reportData.ReportName = "ZRSD058";
        reportData.Selection = [{"SelName":"ZVBELN","Kind":"S","Sign":"I","SelOption":"EQ","Low":sono,"High":""}];

        $.ajax({
            type: "POST",
            async: true,
            url: "SOApproval.ashx",
            data: {
                Action: "viewdetail",
                Token: AccessToken,
                User: UserName,
                FuncID: FuncID,
                SO: sono,
                Report: reportData.ReportName,
                Hidden: true,
                Data: JSON.stringify(reportData)
            },
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            error: function (request, error) {
                console.log(request.statusText + ";" + error);
                alert(request.statusText + ";" + error);
            },
            success: function (data) {
                //console.log(data);
                PDFViewerWindowOpen(data);
            },
            complete: function () {
                ShowLoading(false);
            }
        });
    }

    function Approve() 
    {
        $.ajax({
            type: "POST",
            async: true,
            url: "SOApproval.ashx",
            data: {
                Action: "approve",
                Token: AccessToken,
                User: UserName,
                FuncID: FuncID,
                Data: selectedSO,
                Approver: ActingApprover
            },
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            error: function (request, error) {
                console.log(request.statusText + ";" + error);
                alert(request.statusText + ";" + error);
            },
            success: function (data) {
                //console.log(data);
                ShowApproveResult(data);
            }
        });
    }

    
}
